import * as dotenv from 'dotenv';
import { getDb, schema } from './index.js';
import { eq } from 'drizzle-orm';

dotenv.config();

export const SEED_IDS = {
  USER_ZALAK: '11111111-1111-1111-1111-111111111111',
  USER_AARAV: '22222222-2222-2222-2222-222222222222',
  USER_TIRTH: '33333333-3333-3333-3333-333333333333',
  USER_PRISHA: '44444444-4444-4444-4444-444444444444',
  USER_TWISHA: '55555555-5555-5555-5555-555555555555',
  USER_VEDANT: '66666666-6666-6666-6666-666666666666',
  FLAT_402: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  GROCERY_LIST: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

export async function seedDatabase() {
  const db = getDb();
  if (!db) {
    throw new Error('Database is not configured. Please check DATABASE_URL in apps/api/.env');
  }

  console.log('🌱 Starting database seed with Zalak as Flat Owner...');

  // 1. Profiles
  const profilesData = [
    {
      id: SEED_IDS.USER_ZALAK,
      fullName: 'Zalak',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      phone: '+91 98201 11223',
    },
    {
      id: SEED_IDS.USER_AARAV,
      fullName: 'Aarav',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: '+91 98202 22334',
    },
    {
      id: SEED_IDS.USER_TIRTH,
      fullName: 'Tirth',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      phone: '+91 98203 33445',
    },
    {
      id: SEED_IDS.USER_PRISHA,
      fullName: 'Prisha',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      phone: '+91 98204 44556',
    },
    {
      id: SEED_IDS.USER_TWISHA,
      fullName: 'Twisha',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      phone: '+91 98205 55667',
    },
    {
      id: SEED_IDS.USER_VEDANT,
      fullName: 'Vedant',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      phone: '+91 98206 66778',
    },
  ];

  for (const p of profilesData) {
    const existing = await db.select().from(schema.profiles).where(eq(schema.profiles.id, p.id)).limit(1);
    if (existing.length === 0) {
      await db.insert(schema.profiles).values(p);
    }
  }
  console.log('  ✓ Profiles seeded (Zalak, Aarav, Tirth, Prisha, Twisha, Vedant)');

  // 2. Flat: Skyline Dome Residency 402
  const existingFlat = await db.select().from(schema.flats).where(eq(schema.flats.id, SEED_IDS.FLAT_402)).limit(1);
  if (existingFlat.length === 0) {
    await db.insert(schema.flats).values({
      id: SEED_IDS.FLAT_402,
      name: 'Skyline Dome Residency 402',
      addressLabel: 'Tower B, Dome Wing, Flat 402, Bengaluru',
      currency: 'INR',
      createdBy: SEED_IDS.USER_ZALAK,
    });
  }
  console.log('  ✓ Flat seeded (Skyline Dome Residency 402, Owner: Zalak)');

  // 3. Flat Memberships
  const membersData = [
    { userId: SEED_IDS.USER_ZALAK, role: 'owner' },
    { userId: SEED_IDS.USER_AARAV, role: 'admin' },
    { userId: SEED_IDS.USER_TIRTH, role: 'member' },
    { userId: SEED_IDS.USER_PRISHA, role: 'member' },
    { userId: SEED_IDS.USER_TWISHA, role: 'member' },
    { userId: SEED_IDS.USER_VEDANT, role: 'member' },
  ];

  for (const m of membersData) {
    const existingMember = await db
      .select()
      .from(schema.flatMembers)
      .where(eq(schema.flatMembers.userId, m.userId))
      .limit(1);
    if (existingMember.length === 0) {
      await db.insert(schema.flatMembers).values({
        flatId: SEED_IDS.FLAT_402,
        userId: m.userId,
        role: m.role,
        status: 'active',
      });
    }
  }
  console.log('  ✓ Memberships seeded (Zalak as Owner, Aarav as Admin, Roommates as Members)');

  // 4. Sample Expenses
  const exp1Id = '11111111-2222-3333-4444-555555555551';
  const existingExp1 = await db.select().from(schema.expenses).where(eq(schema.expenses.id, exp1Id)).limit(1);
  if (existingExp1.length === 0) {
    await db.insert(schema.expenses).values({
      id: exp1Id,
      flatId: SEED_IDS.FLAT_402,
      payerId: SEED_IDS.USER_ZALAK,
      description: 'Weekly Fresh Organic Groceries & Fruits',
      category: 'groceries',
      amountPaise: 240000, // ₹2,400
      expenseDate: new Date().toISOString().slice(0, 10),
    });

    await db.insert(schema.expenseSplits).values([
      { expenseId: exp1Id, userId: SEED_IDS.USER_ZALAK, sharePaise: 60000 },
      { expenseId: exp1Id, userId: SEED_IDS.USER_AARAV, sharePaise: 60000 },
      { expenseId: exp1Id, userId: SEED_IDS.USER_TIRTH, sharePaise: 60000 },
      { expenseId: exp1Id, userId: SEED_IDS.USER_PRISHA, sharePaise: 60000 },
    ]);
  }

  const exp2Id = '11111111-2222-3333-4444-555555555552';
  const existingExp2 = await db.select().from(schema.expenses).where(eq(schema.expenses.id, exp2Id)).limit(1);
  if (existingExp2.length === 0) {
    await db.insert(schema.expenses).values({
      id: exp2Id,
      flatId: SEED_IDS.FLAT_402,
      payerId: SEED_IDS.USER_AARAV,
      description: 'Airtel Fiber 300Mbps High-Speed Wi-Fi',
      category: 'utilities',
      amountPaise: 120000, // ₹1,200
      expenseDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
    });

    await db.insert(schema.expenseSplits).values([
      { expenseId: exp2Id, userId: SEED_IDS.USER_ZALAK, sharePaise: 30000 },
      { expenseId: exp2Id, userId: SEED_IDS.USER_AARAV, sharePaise: 30000 },
      { expenseId: exp2Id, userId: SEED_IDS.USER_TIRTH, sharePaise: 30000 },
      { expenseId: exp2Id, userId: SEED_IDS.USER_PRISHA, sharePaise: 30000 },
    ]);
  }
  console.log('  ✓ Expenses & Splits seeded');

  // 5. Sample Bills
  const bill1Id = '22222222-3333-4444-5555-666666666661';
  const existingBill = await db.select().from(schema.bills).where(eq(schema.bills.id, bill1Id)).limit(1);
  if (existingBill.length === 0) {
    await db.insert(schema.bills).values({
      id: bill1Id,
      flatId: SEED_IDS.FLAT_402,
      title: 'Bescom Electricity Bill (March)',
      category: 'electricity',
      totalAmountPaise: 320000, // ₹3,200
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      billingPeriod: 'March 2026',
      status: 'pending',
      createdBy: SEED_IDS.USER_ZALAK,
    });

    await db.insert(schema.billShares).values([
      { billId: bill1Id, userId: SEED_IDS.USER_ZALAK, sharePaise: 80000, paidAmountPaise: 0, status: 'pending' },
      { billId: bill1Id, userId: SEED_IDS.USER_AARAV, sharePaise: 80000, paidAmountPaise: 0, status: 'pending' },
      { billId: bill1Id, userId: SEED_IDS.USER_TIRTH, sharePaise: 80000, paidAmountPaise: 0, status: 'pending' },
      { billId: bill1Id, userId: SEED_IDS.USER_PRISHA, sharePaise: 80000, paidAmountPaise: 0, status: 'pending' },
    ]);
  }
  console.log('  ✓ Bills & Shares seeded');

  // 6. Sample Chores
  const choresData = [
    {
      flatId: SEED_IDS.FLAT_402,
      title: 'Kitchen & Counter Deep Clean',
      description: 'Wipe countertops, clean stovetop, and wash sink',
      assignedTo: SEED_IDS.USER_AARAV,
      createdBy: SEED_IDS.USER_ZALAK,
      dueAt: new Date(Date.now() + 86400000),
      priority: 'high',
      status: 'pending',
      recurrenceRule: 'weekly',
    },
    {
      flatId: SEED_IDS.FLAT_402,
      title: 'Take Out Garbage & Segregate Recyclables',
      description: 'Separate wet and dry waste, take bins down to main gate',
      assignedTo: SEED_IDS.USER_TIRTH,
      createdBy: SEED_IDS.USER_ZALAK,
      dueAt: new Date(Date.now() + 2 * 86400000),
      priority: 'medium',
      status: 'pending',
      recurrenceRule: 'daily',
    },
    {
      flatId: SEED_IDS.FLAT_402,
      title: 'Living Room Vacuum & Dusting',
      description: 'Vacuum rug, dust entertainment unit and coffee table',
      assignedTo: SEED_IDS.USER_ZALAK,
      createdBy: SEED_IDS.USER_ZALAK,
      dueAt: new Date(Date.now() + 3 * 86400000),
      priority: 'medium',
      status: 'pending',
      recurrenceRule: 'weekly',
    },
  ];

  for (const c of choresData) {
    await db.insert(schema.chores).values(c);
  }
  console.log('  ✓ Chores seeded');

  // 7. Grocery List & Items
  const existingList = await db.select().from(schema.groceryLists).where(eq(schema.groceryLists.id, SEED_IDS.GROCERY_LIST)).limit(1);
  if (existingList.length === 0) {
    await db.insert(schema.groceryLists).values({
      id: SEED_IDS.GROCERY_LIST,
      flatId: SEED_IDS.FLAT_402,
      name: 'Shared Kitchen Essentials',
      createdBy: SEED_IDS.USER_ZALAK,
    });

    await db.insert(schema.groceryItems).values([
      {
        listId: SEED_IDS.GROCERY_LIST,
        name: 'Aashirvaad Shudh Chakki Atta (5kg)',
        quantity: 1,
        unit: 'pack',
        estimatedPricePaise: 32000,
        addedBy: SEED_IDS.USER_ZALAK,
        isPurchased: false,
      },
      {
        listId: SEED_IDS.GROCERY_LIST,
        name: 'Amul Taaza Homogenised Milk (1L)',
        quantity: 3,
        unit: 'cartons',
        estimatedPricePaise: 21000,
        addedBy: SEED_IDS.USER_AARAV,
        isPurchased: false,
      },
      {
        listId: SEED_IDS.GROCERY_LIST,
        name: 'Nandini Curd (500g)',
        quantity: 2,
        unit: 'pouches',
        estimatedPricePaise: 6000,
        addedBy: SEED_IDS.USER_TIRTH,
        isPurchased: true,
        purchasedAt: new Date(),
      },
    ]);
  }
  console.log('  ✓ Grocery List & Items seeded');

  // 8. Maintenance Request
  await db.insert(schema.maintenanceRequests).values({
    flatId: SEED_IDS.FLAT_402,
    title: 'Master Bathroom Geyser not heating properly',
    description: 'Takes 30+ minutes to heat water, suspected thermostat issue.',
    location: 'Master Bedroom Washroom',
    priority: 'high',
    status: 'open',
    reportedBy: SEED_IDS.USER_ZALAK,
  });
  console.log('  ✓ Maintenance Requests seeded');

  // 9. Announcement
  await db.insert(schema.announcements).values({
    flatId: SEED_IDS.FLAT_402,
    authorId: SEED_IDS.USER_ZALAK,
    title: 'Society Water Tank Cleaning on Wednesday 10 AM - 2 PM',
    content: 'Please store drinking water in advance. Society maintenance informed us water supply will be paused.',
    isPinned: true,
  });
  console.log('  ✓ Announcements seeded');

  // 10. Activity Log
  await db.insert(schema.activityLogs).values({
    flatId: SEED_IDS.FLAT_402,
    actorId: SEED_IDS.USER_ZALAK,
    action: 'created_flat',
    entityType: 'flat',
    entityId: SEED_IDS.FLAT_402,
    newValues: JSON.stringify({ name: 'Skyline Dome Residency 402' }),
  });
  console.log('  ✓ Activity Log seeded');

  console.log('🎉 Database successfully seeded for Zalak as Owner!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
