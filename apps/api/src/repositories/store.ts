import type {
  UserProfile,
  Flat,
  FlatMember,
  FlatInvite,
  Expense,
  ExpenseSplit,
  Settlement,
  Bill,
  BillShare,
  Chore,
  ChoreHistory,
  GroceryList,
  GroceryItem,
  MaintenanceRequest,
  MaintenanceComment,
  Visitor,
  Announcement,
  CalendarEvent,
  InAppNotification,
  ActivityLog,
  MemberRole,
} from '@flatflow/shared';

export interface DataStore {
  profiles: Map<string, UserProfile>;
  flats: Map<string, Flat>;
  flatMembers: Map<string, FlatMember>;
  flatInvites: Map<string, FlatInvite>;
  expenses: Map<string, Expense>;
  expenseSplits: Map<string, ExpenseSplit>;
  settlements: Map<string, Settlement>;
  bills: Map<string, Bill>;
  billShares: Map<string, BillShare>;
  chores: Map<string, Chore>;
  choreHistory: Map<string, ChoreHistory>;
  groceryLists: Map<string, GroceryList>;
  groceryItems: Map<string, GroceryItem>;
  maintenanceRequests: Map<string, MaintenanceRequest>;
  maintenanceComments: Map<string, MaintenanceComment>;
  visitors: Map<string, Visitor>;
  announcements: Map<string, Announcement>;
  announcementReads: Map<string, Set<string>>; // announcementId -> Set of userIds
  events: Map<string, CalendarEvent>;
  notifications: Map<string, InAppNotification>;
  activityLogs: ActivityLog[];
  flatRequests: Map<string, FlatCreationRequest>;
}

export interface FlatCreationRequest {
  id: string;
  name: string;
  addressLabel: string | null;
  currency: string;
  requestedBy: string;
  requesterName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Fixed UUIDs for seeded data
export const SEED_IDS = {
  USER_ZALAK: '11111111-1111-1111-1111-111111111111',
  USER_AARAV: '22222222-2222-2222-2222-222222222222',
  USER_RIVA: '22222222-2222-2222-2222-222222222222', // backwards-compatible alias
  USER_TIRTH: '33333333-3333-3333-3333-333333333333',
  USER_PRISHA: '44444444-4444-4444-4444-444444444444',
  USER_TWISHA: '55555555-5555-5555-5555-555555555555',
  USER_VEDANT: '66666666-6666-6666-6666-666666666666',
  USER_RAHUL: '22222222-2222-2222-2222-222222222222',
  USER_ANANYA: '33333333-3333-3333-3333-333333333333',
  USER_VIKRAM: '44444444-4444-4444-4444-444444444444',
  FLAT_402: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  FLAT_DOME_TOWERS: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  GROCERY_LIST: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

function createInitialStore(): DataStore {
  const store: DataStore = {
    profiles: new Map(),
    flats: new Map(),
    flatMembers: new Map(),
    flatInvites: new Map(),
    expenses: new Map(),
    expenseSplits: new Map(),
    settlements: new Map(),
    bills: new Map(),
    billShares: new Map(),
    chores: new Map(),
    choreHistory: new Map(),
    groceryLists: new Map(),
    groceryItems: new Map(),
    maintenanceRequests: new Map(),
    maintenanceComments: new Map(),
    visitors: new Map(),
    announcements: new Map(),
    announcementReads: new Map(),
    events: new Map(),
    notifications: new Map(),
    activityLogs: [],
    flatRequests: new Map(),
  };

  // Seed a sample pending flat request submitted by a roommate
  const sampleRequestId = 'req-sample-504';
  store.flatRequests.set(sampleRequestId, {
    id: sampleRequestId,
    name: 'Emerald Dome Residency 504',
    addressLabel: 'Tower C, 5th Floor, Indiranagar',
    currency: 'INR',
    requestedBy: SEED_IDS.USER_TIRTH,
    requesterName: 'Tirth',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  });

  // Seed Profiles: Zalak (Owner & Admin), Aarav (Admin), Tirth (Member), Prisha, Twisha, Vedant
  const zalakProfile: UserProfile = {
    id: SEED_IDS.USER_ZALAK,
    fullName: 'Zalak',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    phone: '+91 98201 11223',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const aaravProfile: UserProfile = {
    id: SEED_IDS.USER_AARAV,
    fullName: 'Aarav',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+91 98202 22334',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tirthProfile: UserProfile = {
    id: SEED_IDS.USER_TIRTH,
    fullName: 'Tirth',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    phone: '+91 98203 33445',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const prishaProfile: UserProfile = {
    id: SEED_IDS.USER_PRISHA,
    fullName: 'Prisha',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    phone: '+91 98204 44556',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const twishaProfile: UserProfile = {
    id: SEED_IDS.USER_TWISHA,
    fullName: 'Twisha',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    phone: '+91 98205 55667',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const vedantProfile: UserProfile = {
    id: SEED_IDS.USER_VEDANT,
    fullName: 'Vedant',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    phone: '+91 98206 66778',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.profiles.set(zalakProfile.id, zalakProfile);
  store.profiles.set(aaravProfile.id, aaravProfile);
  store.profiles.set(tirthProfile.id, tirthProfile);
  store.profiles.set(prishaProfile.id, prishaProfile);
  store.profiles.set(twishaProfile.id, twishaProfile);
  store.profiles.set(vedantProfile.id, vedantProfile);

  // Seed Flats (Dome Flats & Residencies)
  const defaultFlat: Flat = {
    id: SEED_IDS.FLAT_402,
    name: 'Skyline Dome Residency 402',
    addressLabel: 'Tower B, Dome Wing, Flat 402, Bengaluru',
    currency: 'INR',
    createdBy: SEED_IDS.USER_ZALAK,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  };
  store.flats.set(defaultFlat.id, defaultFlat);

  const domeTowersFlat: Flat = {
    id: SEED_IDS.FLAT_DOME_TOWERS,
    name: 'The Dome Cyber Towers 1104',
    addressLabel: 'Dome Tower A, 11th Floor, Mumbai',
    currency: 'INR',
    createdBy: SEED_IDS.USER_AARAV,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  };
  store.flats.set(domeTowersFlat.id, domeTowersFlat);

  // Seed Memberships for Flat 402: Zalak (Owner & Admin), Aarav (Admin), Tirth (Member)
  const membersData: Array<{ userId: string; role: MemberRole; profile: UserProfile }> = [
    { userId: SEED_IDS.USER_ZALAK, role: 'owner', profile: zalakProfile },
    { userId: SEED_IDS.USER_AARAV, role: 'admin', profile: aaravProfile },
    { userId: SEED_IDS.USER_TIRTH, role: 'member', profile: tirthProfile },
    { userId: SEED_IDS.USER_PRISHA, role: 'member', profile: prishaProfile },
    { userId: SEED_IDS.USER_TWISHA, role: 'member', profile: twishaProfile },
    { userId: SEED_IDS.USER_VEDANT, role: 'member', profile: vedantProfile },
  ];

  for (const m of membersData) {
    const memberId = `member-${m.userId}`;
    store.flatMembers.set(memberId, {
      id: memberId,
      flatId: defaultFlat.id,
      userId: m.userId,
      role: m.role,
      status: 'active',
      joinedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      profile: m.profile,
    });
  }

  // Seed Flat Invite
  const invite: FlatInvite = {
    id: 'invite-1',
    flatId: defaultFlat.id,
    tokenHash: 'hash-402',
    code: 'DOME-402-SYNC',
    invitedBy: SEED_IDS.USER_AARAV,
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
    maxUses: 20,
    useCount: 5,
    createdAt: new Date().toISOString(),
  };
  store.flatInvites.set(invite.id, invite);

  // Seed Expenses
  const exp1Id = 'exp-1';
  const exp1: Expense = {
    id: exp1Id,
    flatId: defaultFlat.id,
    payerId: SEED_IDS.USER_AARAV,
    description: 'Weekly Fresh Organic Groceries & Fruits',
    category: 'groceries',
    amountPaise: 250000, // ₹2,500
    expenseDate: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
    receiptPath: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    payer: aaravProfile,
    splits: [
      { id: 's1-1', expenseId: exp1Id, userId: SEED_IDS.USER_AARAV, sharePaise: 50000, user: aaravProfile },
      { id: 's1-2', expenseId: exp1Id, userId: SEED_IDS.USER_TIRTH, sharePaise: 50000, user: tirthProfile },
      { id: 's1-3', expenseId: exp1Id, userId: SEED_IDS.USER_PRISHA, sharePaise: 50000, user: prishaProfile },
      { id: 's1-4', expenseId: exp1Id, userId: SEED_IDS.USER_TWISHA, sharePaise: 50000, user: twishaProfile },
      { id: 's1-5', expenseId: exp1Id, userId: SEED_IDS.USER_VEDANT, sharePaise: 50000, user: vedantProfile },
    ],
  };
  store.expenses.set(exp1.id, exp1);
  for (const s of exp1.splits) store.expenseSplits.set(s.id, s);

  const exp2Id = 'exp-2';
  const exp2: Expense = {
    id: exp2Id,
    flatId: defaultFlat.id,
    payerId: SEED_IDS.USER_TIRTH,
    description: 'Airtel Fiber 300Mbps High-Speed Wi-Fi',
    category: 'utilities',
    amountPaise: 150000, // ₹1,500
    expenseDate: new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10),
    receiptPath: null,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    payer: tirthProfile,
    splits: [
      { id: 's2-1', expenseId: exp2Id, userId: SEED_IDS.USER_AARAV, sharePaise: 30000, user: aaravProfile },
      { id: 's2-2', expenseId: exp2Id, userId: SEED_IDS.USER_TIRTH, sharePaise: 30000, user: tirthProfile },
      { id: 's2-3', expenseId: exp2Id, userId: SEED_IDS.USER_PRISHA, sharePaise: 30000, user: prishaProfile },
      { id: 's2-4', expenseId: exp2Id, userId: SEED_IDS.USER_TWISHA, sharePaise: 30000, user: twishaProfile },
      { id: 's2-5', expenseId: exp2Id, userId: SEED_IDS.USER_VEDANT, sharePaise: 30000, user: vedantProfile },
    ],
  };
  store.expenses.set(exp2.id, exp2);
  for (const s of exp2.splits) store.expenseSplits.set(s.id, s);

  // Seed Bills
  const bill1: Bill = {
    id: 'bill-1',
    flatId: defaultFlat.id,
    title: 'Bescom Dome Tower Electricity Bill (March)',
    category: 'electricity',
    totalAmountPaise: 350000, // ₹3,500
    dueDate: new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10),
    billingPeriod: 'March 2026',
    status: 'pending',
    createdBy: SEED_IDS.USER_AARAV,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    shares: [
      { id: 'bs1-1', billId: 'bill-1', userId: SEED_IDS.USER_AARAV, sharePaise: 70000, paidAmountPaise: 0, status: 'pending', user: aaravProfile },
      { id: 'bs1-2', billId: 'bill-1', userId: SEED_IDS.USER_TIRTH, sharePaise: 70000, paidAmountPaise: 0, status: 'pending', user: tirthProfile },
      { id: 'bs1-3', billId: 'bill-1', userId: SEED_IDS.USER_PRISHA, sharePaise: 70000, paidAmountPaise: 0, status: 'pending', user: prishaProfile },
      { id: 'bs1-4', billId: 'bill-1', userId: SEED_IDS.USER_TWISHA, sharePaise: 70000, paidAmountPaise: 0, status: 'pending', user: twishaProfile },
      { id: 'bs1-5', billId: 'bill-1', userId: SEED_IDS.USER_VEDANT, sharePaise: 70000, paidAmountPaise: 0, status: 'pending', user: vedantProfile },
    ],
  };
  store.bills.set(bill1.id, bill1);

  // Seed Chores
  const chore1: Chore = {
    id: 'chore-1',
    flatId: defaultFlat.id,
    title: 'Deep Clean Kitchen Counters & Modular Stove',
    description: 'Wipe all cooking surfaces, clean gas stove and sanitize microwave.',
    assignedTo: SEED_IDS.USER_AARAV,
    createdBy: SEED_IDS.USER_TIRTH,
    dueAt: new Date(Date.now() + 1 * 86400000).toISOString(),
    priority: 'high',
    status: 'pending',
    recurrenceRule: 'weekly',
    completedAt: null,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    assignee: aaravProfile,
  };

  const chore2: Chore = {
    id: 'chore-2',
    flatId: defaultFlat.id,
    title: 'Sort and Dispose Segregated Waste & Compost',
    description: 'Hand over dry recyclables and wet compost to society collectors.',
    assignedTo: SEED_IDS.USER_TIRTH,
    createdBy: SEED_IDS.USER_AARAV,
    dueAt: new Date(Date.now() + 12 * 3600000).toISOString(),
    priority: 'medium',
    status: 'pending',
    recurrenceRule: 'daily',
    completedAt: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    assignee: tirthProfile,
  };

  const chore3: Chore = {
    id: 'chore-3',
    flatId: defaultFlat.id,
    title: 'Living Room Mopping & Balcony Plants Watering',
    description: 'Vacuum the central rug and mop living room marble tiles.',
    assignedTo: SEED_IDS.USER_PRISHA,
    createdBy: SEED_IDS.USER_AARAV,
    dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
    priority: 'medium',
    status: 'pending',
    recurrenceRule: 'weekly',
    completedAt: null,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    assignee: prishaProfile,
  };

  store.chores.set(chore1.id, chore1);
  store.chores.set(chore2.id, chore2);
  store.chores.set(chore3.id, chore3);

  // Seed Grocery List & Items
  const groceryList: GroceryList = {
    id: SEED_IDS.GROCERY_LIST,
    flatId: defaultFlat.id,
    name: 'Dome 402 Shared Kitchen Essentials',
    createdBy: SEED_IDS.USER_AARAV,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  };
  store.groceryLists.set(groceryList.id, groceryList);

  const groceryItemsSeed: GroceryItem[] = [
    {
      id: 'g-1',
      listId: groceryList.id,
      name: 'Organic Almond Milk & Greek Yogurt',
      quantity: 2,
      unit: 'bottles',
      estimatedPricePaise: 28000,
      actualPricePaise: null,
      addedBy: SEED_IDS.USER_AARAV,
      assignedTo: SEED_IDS.USER_PRISHA,
      isPurchased: false,
      purchasedAt: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      addedByUser: aaravProfile,
      assignedUser: prishaProfile,
    },
    {
      id: 'g-2',
      listId: groceryList.id,
      name: 'Artisan Sourdough Bread & Amul Butter',
      quantity: 1,
      unit: 'pack',
      estimatedPricePaise: 19000,
      actualPricePaise: 18500,
      addedBy: SEED_IDS.USER_TIRTH,
      assignedTo: SEED_IDS.USER_TIRTH,
      isPurchased: true,
      purchasedAt: new Date(Date.now() - 20000000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      addedByUser: tirthProfile,
      assignedUser: tirthProfile,
    },
    {
      id: 'g-3',
      listId: groceryList.id,
      name: 'Ariel Matic Front Load Detergent (2L)',
      quantity: 1,
      unit: 'can',
      estimatedPricePaise: 44000,
      actualPricePaise: null,
      addedBy: SEED_IDS.USER_TWISHA,
      assignedTo: SEED_IDS.USER_VEDANT,
      isPurchased: false,
      purchasedAt: null,
      createdAt: new Date(Date.now() - 10000000).toISOString(),
      addedByUser: twishaProfile,
      assignedUser: vedantProfile,
    },
  ];
  for (const item of groceryItemsSeed) store.groceryItems.set(item.id, item);

  // Seed Maintenance Request
  const maint1: MaintenanceRequest = {
    id: 'maint-1',
    flatId: defaultFlat.id,
    title: 'Kitchen Sink Mixer Tap Low Pressure & Drip',
    description: 'The hot/cold mixer tap has low pressure and drips continuously when turned off.',
    location: 'Kitchen',
    priority: 'medium',
    status: 'in_progress',
    reportedBy: SEED_IDS.USER_AARAV,
    assignedTo: SEED_IDS.USER_TIRTH,
    imagePath: null,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    resolvedAt: null,
    reporter: aaravProfile,
    assignee: tirthProfile,
    comments: [
      {
        id: 'c-1',
        requestId: 'maint-1',
        userId: SEED_IDS.USER_TIRTH,
        comment: 'Called the dome society plumber, he will inspect tomorrow at 11 AM.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        user: tirthProfile,
      },
    ],
  };
  store.maintenanceRequests.set(maint1.id, maint1);

  // Seed Visitors
  const visitor1: Visitor = {
    id: 'vis-1',
    flatId: defaultFlat.id,
    visitorName: 'Rohan Mehta',
    hostId: SEED_IDS.USER_TIRTH,
    purpose: 'College capstone project discussion',
    expectedArrival: new Date(Date.now() + 7200000).toISOString(),
    expectedDeparture: new Date(Date.now() + 18000000).toISOString(),
    checkedInAt: null,
    checkedOutAt: null,
    notes: 'Will be in living room till 8 PM',
    createdAt: new Date().toISOString(),
    host: tirthProfile,
  };
  store.visitors.set(visitor1.id, visitor1);

  // Seed Announcements
  const ann1: Announcement = {
    id: 'ann-1',
    flatId: defaultFlat.id,
    authorId: SEED_IDS.USER_AARAV,
    title: 'Dome Towers Power Backup Maintenance This Saturday',
    content:
      'The building society management will conduct backup generator load testing this Saturday between 2:00 PM and 4:30 PM. Elevators and high-voltage outlets might have intermittent 5-minute outages.',
    isPinned: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    author: aaravProfile,
    readByCount: 4,
  };
  store.announcements.set(ann1.id, ann1);

  // Seed Activity Log
  store.activityLogs.push(
    {
      id: 'act-1',
      flatId: defaultFlat.id,
      actorId: SEED_IDS.USER_AARAV,
      action: 'created_expense',
      entityType: 'expense',
      entityId: exp1.id,
      previousValues: null,
      newValues: { amountPaise: 250000, description: exp1.description },
      createdAt: exp1.createdAt,
      actor: aaravProfile,
    },
    {
      id: 'act-2',
      flatId: defaultFlat.id,
      actorId: SEED_IDS.USER_TIRTH,
      action: 'purchased_grocery_item',
      entityType: 'grocery_item',
      entityId: 'g-2',
      previousValues: { isPurchased: false },
      newValues: { isPurchased: true },
      createdAt: new Date(Date.now() - 20000000).toISOString(),
      actor: tirthProfile,
    }
  );

  return store;
}

export const inMemoryStore = createInitialStore();
