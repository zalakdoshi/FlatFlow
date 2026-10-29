import type { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken } from '../lib/supabase.js';
import { repositories } from '../repositories/index.js';
import { SEED_IDS } from '../repositories/store.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const testUserId = req.headers['x-test-user-id'] as string | undefined;

    // 1. Support automated test headers in non-production environments only
    if (testUserId && process.env.NODE_ENV !== 'production') {
      const profile = await repositories.profiles.getProfileById(testUserId);
      req.user = {
        id: testUserId,
        email: `${testUserId}@flatflow.local`,
        fullName: profile?.fullName ?? 'Test User',
      };
      return next();
    }

    // 2. Token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Check if it's a dev simulated token (disabled in production)
      if (token.startsWith('dev-token-') && process.env.NODE_ENV !== 'production') {
        const userId = token.replace('dev-token-', '');
        const profile =
          (await repositories.profiles.getProfileById(userId)) ||
          (await repositories.profiles.getProfileById(SEED_IDS.USER_ZALAK));

        const resolvedId = profile?.id ?? userId;
        const resolvedName = profile?.fullName ?? 'Development User';

        req.user = {
          id: resolvedId,
          email: `${resolvedName.toLowerCase().replace(/\s+/g, '')}@flatflow.app`,
          fullName: resolvedName,
        };
        return next();
      }

      // Supabase verified token
      const verified = await verifySupabaseToken(token);
      if (verified) {
        let profile = await repositories.profiles.getProfileById(verified.id);
        if (!profile) {
          const fullName =
            (verified.userMetadata?.full_name as string) ||
            (verified.userMetadata?.name as string) ||
            verified.email?.split('@')[0] ||
            'Roommate';

          profile = await repositories.profiles.upsertProfile({
            id: verified.id,
            fullName,
          });
        }

        req.user = {
          id: verified.id,
          email: verified.email,
          fullName: profile.fullName,
        };
        return next();
      }
    }

    // Development fallback when no token provided in local dev mode
    if (process.env.NODE_ENV !== 'production') {
      const defaultProfile = await repositories.profiles.getProfileById(SEED_IDS.USER_ZALAK);
      req.user = {
        id: defaultProfile?.id ?? SEED_IDS.USER_ZALAK,
        email: 'zalak@flatflow.app',
        fullName: defaultProfile?.fullName ?? 'Zalak',
      };
      return next();
    }

    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authentication token required',
    });
  } catch (error) {
    next(error);
  }
}

