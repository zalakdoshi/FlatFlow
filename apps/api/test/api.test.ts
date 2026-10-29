process.env.DATA_STORE_ADAPTER = 'memory';

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { SEED_IDS } from '../src/repositories/store.js';

const app = createApp();

describe('FlatFlow API Integration Tests', () => {
  it('GET /api/health - returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.app).toBe('FlatFlow API');
  });

  it('GET /api/flats - returns user flat list', async () => {
    const res = await request(app)
      .get('/api/flats')
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.flats)).toBe(true);
    expect(res.body.flats.length).toBeGreaterThan(0);
    expect(res.body.flats[0].name).toBe('Skyline Dome Residency 402');
  });

  it('GET /api/flats/:id/dashboard - returns comprehensive dashboard metrics', async () => {
    const res = await request(app)
      .get(`/api/flats/${SEED_IDS.FLAT_402}/dashboard`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(res.body.flat.name).toBe('Skyline Dome Residency 402');
    expect(typeof res.body.monthlyTotalSpendingPaise).toBe('number');
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(Array.isArray(res.body.suggestedSettlements)).toBe(true);
    expect(Array.isArray(res.body.categorySpending)).toBe(true);
  });

  it('POST /api/flats/:id/expenses - creates expense with reconciled splits', async () => {
    const newExpensePayload = {
      description: 'Filter Coffee Powder & Snacks',
      category: 'groceries',
      amountPaise: 40000, // ₹400
      expenseDate: '2026-03-15',
      payerId: SEED_IDS.USER_ZALAK,
      splitType: 'equal',
      splits: [
        { userId: SEED_IDS.USER_ZALAK, sharePaise: 10000 },
        { userId: SEED_IDS.USER_RAHUL, sharePaise: 10000 },
        { userId: SEED_IDS.USER_ANANYA, sharePaise: 10000 },
        { userId: SEED_IDS.USER_VIKRAM, sharePaise: 10000 },
      ],
    };

    const res = await request(app)
      .post(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK)
      .send(newExpensePayload);

    expect(res.status).toBe(201);
    expect(res.body.expense.description).toBe('Filter Coffee Powder & Snacks');
    expect(res.body.expense.amountPaise).toBe(40000);
    expect(res.body.expense.splits.length).toBe(4);
  });

  it('POST /api/flats/:id/expenses - rejects unreconciled splits (sum != total)', async () => {
    const invalidPayload = {
      description: 'Unbalanced expense',
      category: 'other',
      amountPaise: 50000, // ₹500
      expenseDate: '2026-03-15',
      payerId: SEED_IDS.USER_ZALAK,
      splitType: 'equal',
      splits: [
        { userId: SEED_IDS.USER_ZALAK, sharePaise: 10000 },
        { userId: SEED_IDS.USER_RAHUL, sharePaise: 10000 }, // sum is 20000 != 50000!
      ],
    };

    const res = await request(app)
      .post(`/api/flats/${SEED_IDS.FLAT_402}/expenses`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK)
      .send(invalidPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation Error');
  });

  it('GET /api/flats/:id/settlements - computes balances & optimizer suggestions', async () => {
    const res = await request(app)
      .get(`/api/flats/${SEED_IDS.FLAT_402}/settlements`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.balances)).toBe(true);
    expect(Array.isArray(res.body.suggestedSettlements)).toBe(true);
  });

  it('POST /api/chores/:id/complete - completes chore with timestamp', async () => {
    const res = await request(app)
      .post('/api/chores/chore-1/complete')
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(res.body.chore.status).toBe('completed');
    expect(res.body.chore.completedAt).toBeDefined();
  });

  it('POST /api/flats/:id/chores/rotate - auto-rotates chore assignment', async () => {
    const res = await request(app)
      .post(`/api/flats/${SEED_IDS.FLAT_402}/chores/rotate`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK)
      .send({ choreId: 'chore-2' });

    expect(res.status).toBe(200);
    expect(res.body.chore.assignedTo).toBeDefined();
  });

  it('PATCH /api/grocery-items/:id - toggles purchase state', async () => {
    const res = await request(app)
      .patch('/api/grocery-items/g-1')
      .set('x-test-user-id', SEED_IDS.USER_ZALAK)
      .send({ isPurchased: true });

    expect(res.status).toBe(200);
    expect(res.body.item.isPurchased).toBe(true);
  });

  it('POST /api/visitors/:id/checkin - records guest arrival', async () => {
    const res = await request(app)
      .patch('/api/visitors/vis-1/checkin')
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(res.body.visitor.checkedInAt).toBeDefined();
  });

  it('POST /api/flats/:id/announcements - publishes announcement', async () => {
    const res = await request(app)
      .post(`/api/flats/${SEED_IDS.FLAT_402}/announcements`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK)
      .send({
        title: 'Water filter technician arriving tomorrow',
        content: 'Please allow technician entry around 3 PM.',
        isPinned: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.announcement.title).toBe('Water filter technician arriving tomorrow');
  });

  it('GET /api/flats/:id/events - returns calendar events', async () => {
    const res = await request(app)
      .get(`/api/flats/${SEED_IDS.FLAT_402}/events`)
      .set('x-test-user-id', SEED_IDS.USER_ZALAK);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });
});
