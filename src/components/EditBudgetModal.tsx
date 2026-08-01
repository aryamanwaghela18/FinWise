import { useState, useEffect } from 'react';
import { Check, Wallet, PiggyBank } from 'lucide-react';
import { Modal } from './Modal';

export function EditBudgetModal({
  open,
  onClose,
  currency,
  initialBudget,
  initialSavingsGoal,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  currency: string;
  initialBudget: number;
  initialSavingsGoal: number;
  onSave: (budget: number, savingsGoal: number) => void;
}) {
  const [budget, setBudget] = useState(String(initialBudget));
  const [savingsGoal, setSavingsGoal] = useState(String(initialSavingsGoal));

  // Sync inputs whenever the modal is (re)opened with fresh values.
  useEffect(() => {
    if (open) {
      setBudget(String(initialBudget));
      setSavingsGoal(String(initialSavingsGoal));
    }
  }, [open, initialBudget, initialSavingsGoal]);

  const budgetNum = parseFloat(budget);
  const savingsNum = parseFloat(savingsGoal);
  const validBudget = Number.isFinite(budgetNum) && budgetNum >= 0;
  const validSavings = Number.isFinite(savingsNum) && savingsNum >= 0;
  const canSave = validBudget && validSavings && savingsNum <= budgetNum;

  const handleSave = () => {
    if (!canSave) return;
    onSave(budgetNum, savingsNum);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Budget & Savings">
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
            <Wallet className="w-3.5 h-3.5 text-primary-400" />
            Monthly Spendable Budget ({currency})
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-success-400" />
            Monthly Savings Target ({currency})
          </label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={savingsGoal}
            onChange={(e) => setSavingsGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSave();
              }
            }}
            placeholder="0"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
          />
        </div>

        {validBudget && validSavings && savingsNum > budgetNum && (
          <p className="text-xs text-warning-300">Savings target can&apos;t be larger than your monthly budget.</p>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-semibold rounded-xl px-5 py-3 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </Modal>
  );
}
