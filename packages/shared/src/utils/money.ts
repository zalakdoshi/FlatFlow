/**
 * Currency utilities for FlatFlow
 * Store all monetary amounts as integer paise (1 INR = 100 paise)
 */

export function paiseToCurrency(paise: number): number {
  return paise / 100;
}

export function currencyToPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function formatPaise(paise: number, currency: string = 'INR'): string {
  const amount = paise / 100;
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculates equal splits of totalPaise across participant user IDs,
 * distributing remainder paise so sum(splits) === totalPaise exactly.
 */
export function calculateEqualSplits(
  totalPaise: number,
  participantUserIds: string[]
): Array<{ userId: string; sharePaise: number }> {
  if (participantUserIds.length === 0) return [];
  const count = participantUserIds.length;
  const baseShare = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  return participantUserIds.map((userId, index) => ({
    userId,
    // Distribute remainder paise to first few participants
    sharePaise: baseShare + (index < remainder ? 1 : 0),
  }));
}

/**
 * Calculates percentage splits ensuring rounding error is distributed
 * so sum(splits) === totalPaise exactly.
 */
export function calculatePercentageSplits(
  totalPaise: number,
  participants: Array<{ userId: string; percentage: number }>
): Array<{ userId: string; sharePaise: number }> {
  if (participants.length === 0) return [];

  let allocated = 0;
  const result = participants.map((p, index) => {
    if (index === participants.length - 1) {
      // Last participant absorbs any rounding difference
      return { userId: p.userId, sharePaise: totalPaise - allocated };
    }
    const share = Math.round((totalPaise * p.percentage) / 100);
    allocated += share;
    return { userId: p.userId, sharePaise: share };
  });

  return result;
}

/**
 * Validates that sum of splits exactly matches the total amount in paise.
 */
export function validateSplitReconciliation(
  totalPaise: number,
  splits: Array<{ sharePaise: number }>
): { valid: boolean; differencePaise: number } {
  const sum = splits.reduce((acc, curr) => acc + curr.sharePaise, 0);
  return {
    valid: sum === totalPaise,
    differencePaise: totalPaise - sum,
  };
}
