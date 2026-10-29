import type { Chore, FlatMember } from '../types.js';

export interface ChoreFairnessScore {
  userId: string;
  userName: string;
  assignedCount: number;
  completedCount: number;
  completionRatePercent: number;
  fairnessRating: 'balanced' | 'above_average' | 'needs_pickup';
}

/**
 * Calculates chore fairness metrics for members of a flat.
 */
export function calculateChoreFairness(
  members: FlatMember[],
  chores: Chore[]
): ChoreFairnessScore[] {
  const memberStats = new Map<string, { assigned: number; completed: number; name: string }>();

  for (const m of members) {
    memberStats.set(m.userId, {
      assigned: 0,
      completed: 0,
      name: m.profile?.fullName ?? 'Roommate',
    });
  }

  for (const chore of chores) {
    if (chore.assignedTo && memberStats.has(chore.assignedTo)) {
      const stats = memberStats.get(chore.assignedTo)!;
      stats.assigned++;
      if (chore.status === 'completed') {
        stats.completed++;
      }
    }
  }

  const scores: ChoreFairnessScore[] = [];
  const entries = Array.from(memberStats.entries());
  const avgAssigned =
    entries.reduce((acc, [, s]) => acc + s.assigned, 0) / (entries.length || 1);

  for (const [userId, s] of entries) {
    const rate = s.assigned > 0 ? Math.round((s.completed / s.assigned) * 100) : 100;
    let rating: 'balanced' | 'above_average' | 'needs_pickup' = 'balanced';
    if (s.assigned > avgAssigned * 1.25) {
      rating = 'above_average';
    } else if (s.assigned < avgAssigned * 0.75 || rate < 50) {
      rating = 'needs_pickup';
    }

    scores.push({
      userId,
      userName: s.name,
      assignedCount: s.assigned,
      completedCount: s.completed,
      completionRatePercent: rate,
      fairnessRating: rating,
    });
  }

  return scores;
}

/**
 * Finds the best next assignee for chore rotation:
 * Picks the member with the lowest currently assigned/incomplete chore count.
 */
export function getNextChoreAssignee(
  eligibleMembers: FlatMember[],
  activeChores: Chore[]
): FlatMember | null {
  if (eligibleMembers.length === 0) return null;

  // Count active chores per member
  const countMap = new Map<string, number>();
  for (const m of eligibleMembers) {
    countMap.set(m.userId, 0);
  }

  for (const chore of activeChores) {
    if (chore.status !== 'completed' && chore.assignedTo && countMap.has(chore.assignedTo)) {
      countMap.set(chore.assignedTo, (countMap.get(chore.assignedTo) || 0) + 1);
    }
  }

  // Find member with minimum active chores
  let minCount = Infinity;
  let bestMember: FlatMember = eligibleMembers[0]!;

  for (const m of eligibleMembers) {
    const c = countMap.get(m.userId) ?? 0;
    if (c < minCount) {
      minCount = c;
      bestMember = m;
    }
  }

  return bestMember;
}
