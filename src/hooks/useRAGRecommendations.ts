import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RAGRecommendationService } from '../services/ragService';
import { VectorService } from '../services/vectorService';
import { FormData, Racket } from '../types/racket';

export const useRAGRecommendations = () => {
  const { user } = useAuth();
  const ragService = new RAGRecommendationService();
  const vectorService = new VectorService();

  // Track user interaction with rackets
  const trackUserInteraction = useCallback(async (
    racketId: number,
    interactionType: 'view' | 'compare' | 'recommend' | 'purchase_intent',
    additionalData?: {
      rating?: number;
      context?: any;
    }
  ) => {
    if (!user) return;

    try {
      await vectorService.storeUserInteraction({
        user_id: user.id,
        racket_id: racketId,
        interaction_type: interactionType,
        rating: additionalData?.rating,
        context: {
          user_profile: additionalData?.context?.userProfile,
          session_data: {
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            ...additionalData?.context
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking user interaction:', error);
    }
  }, [user, vectorService]);

  // Get enhanced recommendations using RAG
  const getEnhancedRecommendations = useCallback(async (
    formData: FormData,
    racketDatabase: Racket[]
  ) => {
    try {
      return await ragService.getEnhancedRecommendations(
        formData,
        racketDatabase,
        user?.id
      );
    } catch (error) {
      console.error('Error getting RAG recommendations:', error);
      throw error;
    }
  }, [ragService, user]);

  // Initialize user embeddings (call after login or profile update)
  const initializeUserEmbeddings = useCallback(async (userProfile: any) => {
    if (!user) return;

    try {
      const embedding = await vectorService.generateUserEmbedding(userProfile);
      // Store in database - implement this method in vectorService
      // await vectorService.storeUserEmbedding(user.id, embedding, userProfile);
    } catch (error) {
      console.error('Error initializing user embeddings:', error);
    }
  }, [user, vectorService]);

  // Update racket embeddings (admin function or scheduled job)
  const updateRacketEmbeddings = useCallback(async (rackets: Racket[]) => {
    try {
      for (const racket of rackets) {
        const embedding = await vectorService.generateRacketEmbedding(racket);
        // Store in database - implement this method in vectorService
        // await vectorService.storeRacketEmbedding(racket.id, embedding, racket);
      }
    } catch (error) {
      console.error('Error updating racket embeddings:', error);
    }
  }, [vectorService]);

  return {
    trackUserInteraction,
    getEnhancedRecommendations,
    initializeUserEmbeddings,
    updateRacketEmbeddings,
    isUserLoggedIn: !!user
  };
};
