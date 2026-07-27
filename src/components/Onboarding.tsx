import { useState } from 'react';
import { Wallet, ArrowRight, Check } from 'lucide-react';
import type { Profile } from '../types';
import { CURRENCIES, FINANCIAL_GOALS } from '../types';

export function Onboarding({ onComplete }: { onComplete: (p: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    college: '',
    monthlyPocketMoney: '',
    monthlyIncome: '',
    monthlySavingsGoal: '',
    currency: '₹',
    financialGoal: 'Save for Laptop',
  });
  const [error, setError] = useState('');

  const steps = ['name', 'college', 'money', 'goal', 'currency', 'review'];
  const totalSteps = 6;

  const next = () => {
    setError('');
    if (step === 0 && !form.name.trim()) return setError('Please enter your name');
    if (step === 1 && !form.college.trim()) return setError('Please enter your college');
    if (step === 2) {
      if (!form.monthlyPocketMoney || Number(form.monthlyPocketMoney) < 0) return setError('Enter a valid pocket money');
      if (!form.monthlyIncome || Number(form.monthlyIncome) < 0) return setError('Enter a valid monthly income');
      if (!form.monthlySavingsGoal || Number(form.monthlySavingsGoal) < 0) return setError('Enter a savings goal');
    }
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const back = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const finish = () => {
    const profile: Profile = {
      name: form.name.trim(),
      college: form.college.trim(),
      monthlyPocketMoney: Number(form.monthlyPocketMoney) || 0,
      monthlyIncome: Number(form.monthlyIncome) || 0,
      monthlySavingsGoal: Number(form.monthlySavingsGoal) || 0,
      currency: form.currency,
      financialGoal: form.financialGoal,
      createdAt: Date.now(),
    };
    onComplete(profile);
  };

  return (
    <div className="app-bg min-h-screen flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white">FinWise AI</h1>
            <p className="text-xs text-slate-400">Student Finance Coach</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-primary-500' : 'w-4 bg-white/10'}`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="min-h-[180px]">
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Welcome to FinWise</h2>
              <p className="text-slate-400 text-sm mb-6">Let's set up your financial profile. What should we call you?</p>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          )}
          {step === 1 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Where do you study?</h2>
              <p className="text-slate-400 text-sm mb-6">Your college helps us personalize insights.</p>
              <input
                autoFocus
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && next()}
                placeholder="College / University name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          )}
          {step === 2 && (
            <div className="animate-fade-in space-y-4">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Your monthly money</h2>
              <p className="text-slate-400 text-sm mb-2">All amounts in {form.currency}.</p>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Pocket Money</label>
                <input type="number" min="0" autoFocus value={form.monthlyPocketMoney}
                  onChange={(e) => setForm({ ...form, monthlyPocketMoney: e.target.value })}
                  placeholder="5000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Income (part-time, etc.)</label>
                <input type="number" min="0" value={form.monthlyIncome}
                  onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
                  placeholder="2000"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Monthly Savings Goal</label>
                <input type="number" min="0" value={form.monthlySavingsGoal}
                  onChange={(e) => setForm({ ...form, monthlySavingsGoal: e.target.value })}
                  placeholder="1500"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Your financial goal</h2>
              <p className="text-slate-400 text-sm mb-6">What are you saving up for?</p>
              <div className="grid grid-cols-2 gap-2">
                {FINANCIAL_GOALS.map((g) => (
                  <button key={g} onClick={() => setForm({ ...form, financialGoal: g })}
                    className={`px-3 py-3 rounded-xl text-sm font-medium transition-all ${form.financialGoal === g ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-white mb-2">Pick your currency</h2>
              <p className="text-slate-400 text-sm mb-6">Used across the entire app.</p>
              <div className="grid grid-cols-3 gap-2">
                {CURRENCIES.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, currency: c })}
                    className={`px-3 py-4 rounded-xl text-xl font-bold transition-all ${form.currency === c ? 'bg-primary-500 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-display font-bold text-white mb-4">Review & confirm</h2>
              <div className="space-y-2 text-sm">
                {[
                  ['Name', form.name],
                  ['College', form.college],
                  ['Pocket Money', `${form.currency}${form.monthlyPocketMoney}`],
                  ['Monthly Income', `${form.currency}${form.monthlyIncome}`],
                  ['Savings Goal', `${form.currency}${form.monthlySavingsGoal}`],
                  ['Financial Goal', form.financialGoal],
                  ['Currency', form.currency],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-error-400 text-sm mt-4">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          {step > 0 && (
            <button onClick={back} className="px-5 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors font-medium">
              Back
            </button>
          )}
          {step < totalSteps - 1 ? (
            <button onClick={next} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={finish} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-success-500 to-primary-500 text-white font-semibold hover:opacity-90 transition-opacity">
              Start using FinWise <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
