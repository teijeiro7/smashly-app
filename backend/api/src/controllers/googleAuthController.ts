import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../config/supabase';
import logger from '../config/logger';
import { ApiResponse } from '../types/common';
import crypto from 'crypto';

// Helper function to get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Initialize Google OAuth2 Client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthController {
  /**
   * Verifies Google token (ID token or access token) and extracts user information
   */
  private static async verifyGoogleToken(token: string) {
    try {
      // First, try to verify as an ID token (JWT)
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (payload) {
          return {
            email: payload.email!,
            name: payload.name || '',
            picture: payload.picture || '',
            emailVerified: payload.email_verified || false,
            googleId: payload.sub,
          };
        }
      } catch (idTokenError) {
        // Not an ID token, try as access token
        logger.info('Token is not an ID token, trying as access token');
      }

      // If ID token verification failed, try using it as an access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userData = (await userInfoResponse.json()) as {
        email: string;
        name?: string;
        picture?: string;
        email_verified?: boolean;
        sub: string;
      };

      if (!userData.email) {
        throw new Error('No email in Google user data');
      }

      return {
        email: userData.email,
        name: userData.name || '',
        picture: userData.picture || '',
        emailVerified: userData.email_verified || false,
        googleId: userData.sub,
      };
    } catch (error) {
      logger.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }

  /**
   * Generates suggested nickname from email
   */
  private static generateNicknameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  /**
   * POST /api/auth/google
   * Handles Google OAuth authentication
   * Accepts both ID tokens (JWT) and access tokens
   */
  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken, accessToken } = req.body;
      const token = idToken || accessToken;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Token required',
          message: 'Google ID token or access token is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Verify the token with Google and get user info
      let googleUser;
      try {
        googleUser = await GoogleAuthController.verifyGoogleToken(token);
      } catch (verifyError) {
        logger.error('Token verification failed:', verifyError);
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Failed to verify Google token',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      if (!googleUser.email) {
        res.status(400).json({
          success: false,
          error: 'No email',
          message: 'Could not get email from Google account',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

      // Try to sign in with ID token first (for JWT tokens)
      let authData;
      let authError;
      let session = null;
      let userId = '';

      // Check if it's a JWT ID token (contains 3 parts separated by dots)
      const isJwtToken = token.split('.').length === 3;

      if (isJwtToken) {
        // Try Supabase signInWithIdToken for JWT tokens
        const result = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: token,
        });
        authData = result.data;
        authError = result.error;

        if (authData?.user) {
          userId = authData.user.id;
          session = authData.session;
        }
      }

      // If ID token flow failed or it's an access token, handle manually
      if (!userId) {
        logger.info('Using manual user creation for access token flow');

        // Check if user exists by email using admin API
        const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          logger.error('Error listing users with admin API:', listError);
        }

        // Find user by email
        const existingUser = userList?.users?.find(
          (u: any) => u.email === googleUser.email
        );

        if (existingUser) {
          userId = existingUser.id;
          logger.info('Found existing user:', userId);
        } else {
          // Create new user with admin API
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: googleUser.email,
            email_confirm: true,
            user_metadata: {
              full_name: googleUser.name,
              avatar_url: googleUser.picture,
              oauth_provider: 'google',
              google_id: googleUser.googleId,
            },
          });

          if (createError || !newUser?.user) {
            logger.error('Error creating user:', createError);
            res.status(500).json({
              success: false,
              error: 'User creation failed',
              message: getErrorMessage(createError),
              timestamp: new Date().toISOString(),
            } as ApiResponse);
            return;
          }

          userId = newUser.user.id;
          logger.info('Created new user:', userId);
        }

        // Create a session for the user using signInWithOtp or generate a custom session
        // Since we can't use signInWithPassword (no password for OAuth users),
        // we'll create a session using the admin API or return without session
        // and let the frontend handle authentication via cookies
        
        // Alternative: Use magic link to create a session
        const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
          email: googleUser.email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (otpError) {
          logger.error('Error creating OTP session:', otpError);
        }
      }

      // Check if user already has a profile (determine if new user)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      const isNewUser = !existingProfile;

      if (isNewUser) {
        logger.info('Creating new user profile for Google OAuth user:', userId);

        const suggestedNickname = GoogleAuthController.generateNicknameFromEmail(googleUser.email);

        // Create user profile
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: userId,
          email: googleUser.email,
          nickname: suggestedNickname,
          full_name: googleUser.name || null,
          avatar_url: googleUser.picture || null,
          role: 'player',
          oauth_provider: 'google',
        });

        if (profileError) {
          logger.error('Error creating user profile:', profileError);
        }

        // Update user metadata
        await supabase.auth.updateUser({
          data: {
            nickname: suggestedNickname,
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
            oauth_provider: 'google',
            google_id: googleUser.googleId,
          },
        });

        logger.info('New user profile created:', userId);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Set httpOnly auth cookies
      if (session?.access_token) {
        const isProd = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax' as const,
          path: '/',
        };
        res.cookie('access_token', session.access_token, {
          ...cookieOptions,
          maxAge: 60 * 60 * 1000,
        });
        if (session.refresh_token) {
          res.cookie('refresh_token', session.refresh_token, {
            ...cookieOptions,
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
        }
      }

      const suggestedNickname = GoogleAuthController.generateNicknameFromEmail(googleUser.email);

      res.status(200).json({
        success: true,
        data: {
          user: profile || {
            id: userId,
            email: googleUser.email,
            nickname: suggestedNickname,
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
          },
          session: session ? {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          } : null,
          isNewUser,
          suggestedNickname: isNewUser ? suggestedNickname : undefined,
        },
        message: isNewUser
          ? 'Usuario registrado exitosamente con Google'
          : 'Inicio de sesión exitoso con Google',
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    } catch (error: unknown) {
      logger.error('Error in Google OAuth:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      } as ApiResponse);
    }
  }
}
