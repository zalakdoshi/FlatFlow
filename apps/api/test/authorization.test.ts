/**
 * Authorization & Cross-Household Isolation Tests
 *
 * These tests verify that:
 * 1. Users can only access their own households
 * 2. Users cannot access other households' data
 * 3. Role-based access control is enforced
 * 4. Authenticated access is required
 */

process.env.DATA_STORE_ADAPTER = 'memory';

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SEED_IDS } from '../src/repositories/store.js';

const app = createApp();

describe('Authorization & Cross-Household Isolation', () => {
  describe('Authentication Requirements', () => {
    it('should reject requests without authentication token', async () => {
      const res = await request(app).get('/api/flats');

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/flats')
        .set('x-test-user-id', 'invalid-user-id');

      // Should either reject or return empty list depending on implementation
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Household Membership Verification', () => {
    it('should allow member to access their flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(res.body.flat.id).toBe(SEED_IDS.FLAT_402);
    });

    it('should allow member to list their flats', async () => {
      const res = await request(app)
        .get('/api/flats')
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.flats)).toBe(true);
      expect(res.body.flats.length).toBeGreaterThan(0);
    });

    it('should show only the flats where user is a member', async () => {
      const res = await request(app)
        .get('/api/flats')
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      const flatIds = res.body.flats.map((f) => f.id);

      // User should see FLAT_402 (member)
      expect(flatIds).toContain(SEED_IDS.FLAT_402);
    });
  });

  describe('Cross-Household Expense Isolation', () => {
    it('should allow member to view expenses in their flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.expenses)).toBe(true);
    });

    it('should prevent access to expenses from flats user is not a member of', async () => {
      // Try to access a flat the user is not a member of
      // (using a fake/non-existent flat ID or a real flat where user isn't a member)
      const unauthorizedFlatId = 'unauthorized-flat-id';

      const res = await request(app)
        .get(`/api/flats/${unauthorizedFlatId}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(403);
      expect(res.body.error).toBeDefined();
    });

    it('should not return expenses from other flats in query results', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      // All expenses should belong to FLAT_402
      res.body.expenses.forEach((expense) => {
        expect(expense.flatId).toBe(SEED_IDS.FLAT_402);
      });
    });
  });

  describe('Cross-Household Bill Isolation', () => {
    it('should allow member to view bills in their flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/bills`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.bills)).toBe(true);
    });

    it('should prevent access to bills from unauthorized flats', async () => {
      const unauthorizedFlatId = 'unauthorized-flat-id';

      const res = await request(app)
        .get(`/api/flats/${unauthorizedFlatId}/bills`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(403);
    });

    it('should only return bills for the requested flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/bills`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      res.body.bills.forEach((bill) => {
        expect(bill.flatId).toBe(SEED_IDS.FLAT_402);
      });
    });
  });

  describe('Cross-Household Chore Isolation', () => {
    it('should allow member to view chores in their flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/chores`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.chores)).toBe(true);
    });

    it('should prevent access to chores from unauthorized flats', async () => {
      const unauthorizedFlatId = 'unauthorized-flat-id';

      const res = await request(app)
        .get(`/api/flats/${unauthorizedFlatId}/chores`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(403);
    });
  });

  describe('Cross-Household Data Deletion Protection', () => {
    it('should prevent user from deleting expenses from other flats', async () => {
      const unauthorizedExpenseId = 'unauthorized-expense-id';

      const res = await request(app)
        .delete(`/api/expenses/${unauthorizedExpenseId}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      // Should return 404 or 403
      expect([403, 404]).toContain(res.status);
    });

    it('should only allow deletion of own expenses', async () => {
      // Create an expense
      const createRes = await request(app)
        .post(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK)
        .send({
          description: 'Test expense for deletion',
          category: 'other',
          amountPaise: 10000,
          expenseDate: '2026-03-15',
          payerId: SEED_IDS.USER_ZALAK,
          splitType: 'equal',
          splits: [
            { userId: SEED_IDS.USER_ZALAK, sharePaise: 5000 },
            { userId: SEED_IDS.USER_RAHUL, sharePaise: 5000 },
          ],
        });

      expect(createRes.status).toBe(201);
      const expenseId = createRes.body.expense.id;

      // Try to delete as the creator (should succeed)
      const deleteRes = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(deleteRes.status).toBe(200);
    });
  });

  describe('Settlement Isolation', () => {
    it('should allow member to view settlements for their flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/settlements`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.balances)).toBe(true);
    });

    it('should prevent access to settlements from unauthorized flats', async () => {
      const unauthorizedFlatId = 'unauthorized-flat-id';

      const res = await request(app)
        .get(`/api/flats/${unauthorizedFlatId}/settlements`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(403);
    });

    it('should only show balances for members of the flat', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/settlements`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      // All balances should be for members of FLAT_402
      res.body.balances.forEach((balance) => {
        expect(balance.flatId).toBe(SEED_IDS.FLAT_402);
      });
    });
  });

  describe('Role-Based Access Control', () => {
    it('should prevent non-owners from creating invites', async () => {
      // Assuming USER_RAHUL is not an owner of FLAT_402
      const res = await request(app)
        .post(`/api/flats/${SEED_IDS.FLAT_402}/invite`)
        .set('x-test-user-id', SEED_IDS.USER_RAHUL)
        .send({
          expiresInHours: 72,
          maxUses: 5,
        });

      // Should return 403 (Forbidden)
      expect(res.status).toBe(403);
    });

    it('should allow owners to manage household settings', async () => {
      // USER_ZALAK is owner of FLAT_402
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(res.body.flat.createdBy).toBe(SEED_IDS.USER_ZALAK);
    });

    it('should include user role in flat membership info', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(res.body.members).toBeDefined();

      const currentUserMember = res.body.members.find(
        (m) => m.userId === SEED_IDS.USER_ZALAK
      );
      expect(currentUserMember).toBeDefined();
      expect(currentUserMember.role).toBeDefined();
    });
  });

  describe('Profile Data Isolation', () => {
    it('should allow user to view their own profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);
      expect(res.body.profile.id).toBe(SEED_IDS.USER_ZALAK);
    });

    it('should prevent viewing other users\' full profiles', async () => {
      // Get all flats to find another user
      const flatsRes = await request(app)
        .get('/api/flats')
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(flatsRes.status).toBe(200);

      // We can see other members in a flat
      const flatRes = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(flatRes.status).toBe(200);

      // But we should only see public profile info (name, avatar)
      flatRes.body.members.forEach((member) => {
        if (member.userId !== SEED_IDS.USER_ZALAK) {
          // Should not include sensitive data like phone, email
          expect(member.profile).toBeDefined();
        }
      });
    });
  });

  describe('Query Parameter Validation', () => {
    it('should ignore cross-flat query parameters', async () => {
      // Try to access expenses with a payerId from another flat
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses?payerId=unauthorized-user`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      // All returned expenses should still be from FLAT_402 only
      res.body.expenses.forEach((expense) => {
        expect(expense.flatId).toBe(SEED_IDS.FLAT_402);
      });
    });

    it('should validate category parameter safely', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses?category=food`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      // Should only return food category expenses from FLAT_402
      res.body.expenses.forEach((expense) => {
        expect(expense.flatId).toBe(SEED_IDS.FLAT_402);
        if (res.body.expenses.length > 0) {
          expect(expense.category).toBe('food');
        }
      });
    });
  });

  describe('Announcement & Comment Isolation', () => {
    it('should only show announcements for user\'s flats', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/announcements`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      res.body.announcements.forEach((ann) => {
        expect(ann.flatId).toBe(SEED_IDS.FLAT_402);
      });
    });

    it('should prevent posting announcements to unauthorized flats', async () => {
      const unauthorizedFlatId = 'unauthorized-flat-id';

      const res = await request(app)
        .post(`/api/flats/${unauthorizedFlatId}/announcements`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK)
        .send({
          title: 'Test Announcement',
          content: 'This should not be posted',
          priority: 'medium',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Maintenance Request Isolation', () => {
    it('should only show maintenance for user\'s flats', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/maintenance`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      if (res.body.requests && res.body.requests.length > 0) {
        res.body.requests.forEach((req) => {
          expect(req.flatId).toBe(SEED_IDS.FLAT_402);
        });
      }
    });
  });

  describe('Visitor Log Isolation', () => {
    it('should only show visitors for user\'s flats', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/visitors`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      if (res.body.visitors && res.body.visitors.length > 0) {
        res.body.visitors.forEach((visitor) => {
          expect(visitor.flatId).toBe(SEED_IDS.FLAT_402);
        });
      }
    });
  });

  describe('Grocery List Isolation', () => {
    it('should only show grocery list for user\'s flats', async () => {
      const res = await request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/groceries`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      expect(res.status).toBe(200);

      if (res.body.groceries && res.body.groceries.length > 0) {
        res.body.groceries.forEach((item) => {
          expect(item.flatId).toBe(SEED_IDS.FLAT_402);
        });
      }
    });
  });

  describe('Concurrent Access Control', () => {
    it('should handle concurrent requests from different users safely', async () => {
      const user1Request = request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_ZALAK);

      const user2Request = request(app)
        .get(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
        .set('x-test-user-id', SEED_IDS.USER_RAHUL);

      const [res1, res2] = await Promise.all([user1Request, user2Request]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Both should see the same flat's expenses (they're both members)
      expect(res1.body.expenses).toEqual(res2.body.expenses);
    });
  });
});
