import type { MemberRole } from '@flatflow/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        fullName?: string;
      };
      membership?: {
        flatId: string;
        userId: string;
        role: MemberRole;
      };
    }
  }
}

export {};
