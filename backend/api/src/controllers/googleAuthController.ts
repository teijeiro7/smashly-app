import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabase, getSupabaseAdmin } from '../config/supabase';
import logger from '../config/logger';
import { ApiResponse } from '../types/common';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class GoogleAuthController {
  private static async verifyGoogleToken(token: string) {
    try {
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
        logger.info('Token is not an ID token, trying as access token');
      }

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

  private static generateNicknameFromEmail(email: string): string {
    return email.split('@')[0];
  }

  static async handleGoogleAuth(req: Request, res: Response): Promise<void> {
    try {
      logger.info('[GoogleAuth] Received request');
      const { idToken, accessToken } = req.body;
      const token = idToken || accessToken;
      
      logger.info('[GoogleAuth] Token present:', !!token, 'Token length:', token?.length);

      if (!token) {
        logger.error('[GoogleAuth] No token provided');
        res.status(400).json({
          success: false,
          error: 'Token required',
          message: 'Google ID token or access token is required',
          timestamp: new Date().toISOString(),
        } as ApiResponse);
        return;
      }

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

      const admin = getSupabaseAdmin();
      let session = null;
      let userId = '';

      const isJwtToken = token.split('.').length === 3;

      if (isJwtToken) {
        try {
          const { data, error } = await admin.auth.signInWithIdToken({
            provider: 'google',
            token: token,
          });

          if (!error && data.user) {
            userId = data.user.id;
            session = data.session;
          }
        } catch (e) {
          logger.info('signInWithIdToken failed, falling back to manual flow:', e);
        }
      }

      if (!userId) {
        logger.info('Using manual user creation for access token flow');

        const { data: userList, error: listError } = await admin.auth.admin.listUsers();

        if (listError) {
          logger.error('Error listing users with admin API:', listError);
        }

        const existingUser = userList?.users?.find(
          (u: any) => u.email === googleUser.email
        );

        if (existingUser) {
          userId = existingUser.id;
          logger.info('Found existing user:', userId);
        } else {
          const { data: newUser, error: createError } = await admin.auth.admin.createUser({
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

        // Generate session directly via admin createSession (simpler and more reliable)
        logger.info('[GoogleAuth] Creating session via admin createSession...');
        const { data: sessionData, error: sessionError } = 
          await admin.auth.admin.createSession(userId);

        if (sessionError) {
          logger.error('[GoogleAuth] createSession failed:', sessionError);
        } else if (sessionData?.session) {
          session = sessionData.session;
          logger.info('[GoogleAuth] Session created via createSession');
        } else {
          logger.warn('[GoogleAuth] No session returned from createSession');
        }
      }

      // Check if user already has a profile (determine if new user)
      const { data: existingProfile } = await admin
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      const isNewUser = !existingProfile;

      if (isNewUser) {
        logger.info('Creating new user profile for Google OAuth user:', userId);

        const suggestedNickname = GoogleAuthController.generateNicknameFromEmail(googleUser.email);

        const { error: profileError } = await admin.from('user_profiles').insert({
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

        await admin.auth.admin.updateUserById(userId, {
          user_metadata: {
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
      const { data: profile } = await admin
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

      logger.info('[GoogleAuth] Sending success response:', { 
        userId, 
        hasSession: !!session, 
        isNewUser 
      });

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
