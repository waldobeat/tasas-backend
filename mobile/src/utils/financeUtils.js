/**
 * Balance Rules (accrual accounting):
 * + Income        → adds to balance when recorded
 * - Expense       → subtracts from balance when recorded
 * - Debt installment → subtracts ONLY when status === 'paid'
 * + Receivable      → adds ONLY when status === 'collected'
 *
 * Pending values are shown as separate KPIs, not included in balance.
 */
export const buildLedger = (transactions) => {
    let balance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPaidDebt = 0;       // debt installments already paid
    let totalPendingDebt = 0;    // debt installments yet to pay
    let totalCollected = 0;      // receivables already collected
    let totalPending = 0;        // receivables not yet collected

    const expenseByCategory = {};

    for (const t of transactions) {
        if (!t) continue;
        const amt = parseFloat(t.amount) || 0;

        if (t.type === 'income') {
            totalIncome += amt;
            balance += amt;
        } else if (t.type === 'expense') {
            totalExpense += amt;
            balance -= amt;
            const cat = t.category || 'Otros';
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
        } else if (t.type === 'debt') {
            // Each paid installment reduces balance; pending ones are just a liability
            for (const inst of (t.installments || [])) {
                const iAmt = parseFloat(inst.amount) || 0;
                if (inst.status === 'paid') {
                    totalPaidDebt += iAmt;
                    balance -= iAmt;
                } else {
                    totalPendingDebt += iAmt;
                }
            }
        } else if (t.type === 'receivable') {
            // Only collected receivables count as income
            if (t.status === 'collected') {
                totalCollected += amt;
                balance += amt;
            } else {
                totalPending += amt;
            }
        }
    }

    return {
        balance,
        totalIncome,
        totalExpense,
        totalPaidDebt,
        totalPendingDebt,
        totalCollected,
        totalPending,
        expenseByCategory,
    };
};
