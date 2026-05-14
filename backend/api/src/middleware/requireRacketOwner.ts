import { Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { RequestWithUser } from '../types';
import logger from '../config/logger';

export async function requireRacketOwner(
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to perform this action',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (user.role?.toLowerCase() === 'admin') {
      next();
      return;
    }

    const racketId = parseInt(req.params.id);
    if (isNaN(racketId)) {
      res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Racket ID must be a number',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { data: racket, error: racketError } = await supabase
      .from('rackets')
      .select('id, store_id')
      .eq('id', racketId)
      .single();

    if (racketError || !racket) {
      res.status(404).json({
        success: false,
        error: 'Racket not found',
        message: `No racket found with ID ${racketId}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!racket.store_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'This racket has no owner store. Only admins can modify it.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('admin_user_id', user.id)
      .single();

    if (storeError || !store) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have a registered store.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (store.id !== racket.store_id) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only modify rackets belonging to your store.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info(`✅ Racket owner verified: user ${user.id} owns racket ${racketId} via store ${store.id}`);
    next();
  } catch (error: unknown) {
    logger.error('Error in requireRacketOwner middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'Error checking racket ownership',
      timestamp: new Date().toISOString(),
    });
  }
}
