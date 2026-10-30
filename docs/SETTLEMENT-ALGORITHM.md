# Settlement Algorithm Documentation

## Overview

FlatFlow's settlement algorithm calculates who owes whom based on shared expenses. It ensures fair distribution of payments and provides multiple settlement strategies.

---

## Core Concept

When a roommate pays for a shared expense, the algorithm tracks how much each participant owes the payer. The algorithm then calculates net balances to minimize the number of settlements needed.

---

## Settlement Strategies

### 1. Equal Split (Default)

Each participant owes an equal share of the expense.

**Example:**
```
Expense: Groceries - ₹300
Payer: Alice
Participants: Alice, Bob, Charlie

Per-person share: ₹300 ÷ 3 = ₹100

Result:
- Alice: Paid ₹300, owes ₹0
- Bob: Owes Alice ₹100
- Charlie: Owes Alice ₹100
```

**Formula:**
```
sharePaise = totalAmountPaise / numberOfParticipants
```

### 2. Proportional Split

Each participant owes based on their proportional share.

**Example:**
```
Expense: House Party Supplies - ₹600
Payer: Alice
Shares:
  - Alice: 30%
  - Bob: 50%
  - Charlie: 20%

Result:
- Alice: Paid ₹600, owes ₹0
- Bob: Owes Alice ₹300 (50% of ₹600)
- Charlie: Owes Alice ₹120 (20% of ₹600)
```

**Formula:**
```
sharePaise = (totalAmountPaise * percentageShare) / 100
```

### 3. Item-Wise Split

Each expense item is split among specific participants.

**Example:**
```
Expense: Groceries - ₹600
Items:
  - Rice (₹400) - Split among Alice, Bob
  - Oil (₹200) - Split among Bob, Charlie

Result:
- Alice: Owes Bob ₹200
- Bob: Paid ₹600, receives from Alice ₹200, owes Charlie ₹100, net owes Alice ₹100
- Charlie: Owes Bob ₹100
```

---

## Balance Calculation

### Step 1: Calculate Individual Balances

For each household member, sum all their expenses and splits:

```javascript
const calculateBalance = (userId, expenses, splits) => {
  let balance = 0;

  // Add amounts user paid (positive)
  expenses
    .filter(e => e.payerId === userId)
    .forEach(e => {
      balance += e.amountPaise;
    });

  // Subtract amounts user owes (negative)
  splits
    .filter(s => s.userId === userId && !s.settled)
    .forEach(s => {
      balance -= s.sharePaise;
    });

  return balance;
};
```

### Step 2: Identify Debtors and Creditors

```
Balances:
- Alice: +₹400 (positive = owed money)
- Bob: -₹250 (negative = owes money)
- Charlie: -₹150 (negative = owes money)
```

### Step 3: Calculate Settlements

Pair debtors with creditors to minimize transactions:

**Algorithm:**
1. Sort by absolute balance (largest first)
2. Match highest debtor with highest creditor
3. Create settlement for the smaller amount
4. Repeat until all balances are zero

---

## Settlement Algorithm Example

**Scenario:**
```
Household: 3-room flat
Members: Alice, Bob, Charlie

Expense History:
1. Alice paid ₹300 for groceries (split equally among 3)
   - Alice: paid ₹300, share ₹100, net +₹200
   - Bob: share ₹100, net -₹100
   - Charlie: share ₹100, net -₹100

2. Bob paid ₹600 for rent (split equally among 3)
   - Bob: paid ₹600, share ₹200, net +₹400
   - Alice: share ₹200, net -₹200
   - Charlie: share ₹200, net -₹200

3. Charlie paid ₹150 for utilities (split equally among 3)
   - Charlie: paid ₹150, share ₹50, net +₹100
   - Alice: share ₹50, net -₹50
   - Bob: share ₹50, net -₹50
```

**Step 1: Calculate Net Balances**
```
Alice: +₹200 - ₹200 - ₹50 = -₹50 (owes ₹50)
Bob: +₹400 - ₹100 - ₹50 = +₹250 (owed ₹250)
Charlie: +₹100 - ₹100 - ₹200 = -₹200 (owes ₹200)
```

**Step 2: Identify Positions**
```
Owed (Creditors): Bob +₹250
Owes (Debtors): Charlie -₹200, Alice -₹50
```

**Step 3: Calculate Minimal Settlements**
```
Iteration 1:
- Creditor: Bob (+₹250)
- Debtor: Charlie (-₹200)
- Settlement: Charlie pays Bob ₹200
- Remaining: Bob (+₹50), Charlie (0)

Iteration 2:
- Creditor: Bob (+₹50)
- Debtor: Alice (-₹50)
- Settlement: Alice pays Bob ₹50
- Remaining: All balanced

Final Settlements:
1. Charlie pays Bob ₹200
2. Alice pays Bob ₹50
```

---

## Implementation Details

### Database Schema

**Expenses Table:**
```javascript
{
  id: UUID,
  flatId: UUID,
  payerId: UUID,
  amountPaise: Number,
  category: String,
  // ... other fields
}
```

**Expense Splits Table:**
```javascript
{
  id: UUID,
  expenseId: UUID,
  userId: UUID,
  sharePaise: Number,  // Individual share
}
```

**Settlements Table:**
```javascript
{
  id: UUID,
  flatId: UUID,
  payerId: UUID,      // Person paying
  receiverId: UUID,   // Person receiving
  amountPaise: Number,
  status: 'pending' | 'completed',
  settledAt: Timestamp,
}
```

### Algorithm Implementation

**Calculate balance for a user:**
```javascript
async function calculateUserBalance(flatId, userId) {
  // Get all expenses where user is payer
  const paid = await db
    .select({ sum: sql`SUM(amount_paise)` })
    .from(expenses)
    .where(and(
      eq(expenses.flatId, flatId),
      eq(expenses.payerId, userId)
    ));

  // Get all expense splits for user
  const owed = await db
    .select({ sum: sql`SUM(share_paise)` })
    .from(expenseSplits)
    .where(eq(expenseSplits.userId, userId));

  const paidAmount = paid[0]?.sum || 0;
  const owedAmount = owed[0]?.sum || 0;

  return paidAmount - owedAmount;
}
```

**Get settlement suggestions:**
```javascript
async function getSettlements(flatId) {
  // Get all members
  const members = await db
    .select()
    .from(flatMembers)
    .where(eq(flatMembers.flatId, flatId));

  // Calculate balance for each member
  const balances = await Promise.all(
    members.map(async (m) => ({
      userId: m.userId,
      balance: await calculateUserBalance(flatId, m.userId),
    }))
  );

  // Separate creditors and debtors
  const creditors = balances.filter(b => b.balance > 0);
  const debtors = balances.filter(b => b.balance < 0);

  // Generate settlements
  const settlements = [];
  let c = 0, d = 0;

  while (c < creditors.length && d < debtors.length) {
    const creditor = creditors[c];
    const debtor = debtors[d];

    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    settlements.push({
      payerId: debtor.userId,
      receiverId: creditor.userId,
      amountPaise: amount,
    });

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance === 0) c++;
    if (debtor.balance === 0) d++;
  }

  return settlements;
}
```

---

## Money Format

### Paise Storage

All amounts are stored in **paise** (1/100 of the currency unit) to avoid floating-point precision issues:

```javascript
// ₹100.50 is stored as 10050 paise
const amountInPaise = Math.round(amountInRupees * 100);

// Convert back to rupees for display
const amountInRupees = amountInPaise / 100;
```

### Display Formatting

```javascript
const formatCurrency = (paise) => {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(rupees);
};

// Example: 10050 paise → "₹100.50"
```

---

## Edge Cases

### 1. Rounding in Splits

When splitting equally doesn't divide evenly:

```javascript
const totalAmountPaise = 100;  // ₹1.00
const participants = 3;

const baseShare = Math.floor(totalAmountPaise / participants);     // 33
const remainder = totalAmountPaise % participants;                  // 1

// First person gets the remainder
const shares = [
  baseShare + remainder,  // 34
  baseShare,              // 33
  baseShare,              // 33
];
// Total: 34 + 33 + 33 = 100 ✓
```

### 2. Deleting an Expense

When an expense is deleted, its splits are removed and balances recalculated:

```javascript
await db
  .delete(expenses)
  .where(eq(expenses.id, expenseId))
  // CASCADE automatically deletes splits
  .execute();

// Frontend recalculates all balances for the household
```

### 3. Partial Settlements

Some features (like monthly payments) support partial settlements:

```javascript
const recordPayment = async (flatId, payerId, receiverId, amountPaise) => {
  const settlement = await db
    .insert(settlements)
    .values({
      flatId,
      payerId,
      receiverId,
      amountPaise,
      status: 'completed',
      settledAt: new Date(),
    })
    .returning();

  return settlement;
};
```

---

## Testing the Algorithm

### Unit Tests

```javascript
describe('Settlement Algorithm', () => {
  test('should calculate equal splits correctly', () => {
    const result = calculateEqualSplits(30000, 3);
    expect(result).toEqual([10000, 10000, 10000]);
  });

  test('should handle rounding in unequal splits', () => {
    const result = calculateEqualSplits(100, 3);
    expect(result.reduce((a, b) => a + b)).toBe(100);
  });

  test('should calculate net balances correctly', () => {
    const balances = [
      { userId: 'alice', balance: 250 },
      { userId: 'bob', balance: -200 },
      { userId: 'charlie', balance: -50 },
    ];
    // Should generate settlements efficiently
  });
});
```

---

## Performance Considerations

1. **Lazy Calculation**: Balances are calculated on-demand, not pre-computed
2. **Indexing**: Database indexes on `flatId`, `payerId`, `userId` for fast queries
3. **Pagination**: Large expense lists use pagination to avoid timeouts
4. **Caching**: Frontend caches balance calculations with a short TTL

---

## Related Documentation

- [API Endpoints](API.md) - Settlement endpoints
- [Database Schema](DATABASE.md) - Tables used in settlement calculation
