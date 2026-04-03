export interface Settlement {
  from: string;  // user_id
  to: string;    // user_id
  amount: number;
}

/**
 * Minimum-transfer debt settlement algorithm.
 * Produces at most N-1 transactions for N people.
 */
export function computeSettlements(
  balances: Record<string, number>
): Settlement[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  for (const [id, net] of Object.entries(balances)) {
    if (net > 0.01) creditors.push({ id, amount: net });
    else if (net < -0.01) debtors.push({ id, amount: Math.abs(net) });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.amount, debtor.amount);

    settlements.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100,
    });

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) creditors.shift();
    if (debtor.amount < 0.01) debtors.shift();
  }

  return settlements;
}

/**
 * Compute per-member net balance from expenses and splits.
 * Positive = owed money. Negative = owes money.
 */
export function computeBalances(
  expenses: { id: string; paid_by: string; amount: number }[],
  splits: { expense_id: string; user_id: string; amount: number; is_settled: boolean }[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  for (const expense of expenses) {
    balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + expense.amount;
  }

  for (const split of splits) {
    if (!split.is_settled) {
      balances[split.user_id] = (balances[split.user_id] ?? 0) - split.amount;
    }
  }

  return balances;
}
