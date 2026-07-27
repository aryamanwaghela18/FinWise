import { useMemo, useState } from 'react';
import { Trophy, Lock, Zap } from 'lucide-react';
import type { AppData } from '../types';
import { calcLevel } from '../analysis';

export function Achievements({ data }: { data: AppData }) {
  const level = calcLevel(data.xp);
  const [showDetail, setShowDetail] = useState<string | null>(null);

  const unlocked = data.achievements.filter((a) => a.unlocked);
  const locked = data.achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Achievements</h1>
        <p className="text-sm text-slate-400">{unlocked.length} of {data.achievements.length} unlocked</p>
      </div>

      {/* XP / Level card */}
      <div className="glass rounded-2xl p-5 bg-gradient-to-br from-primary-500/10 to-accent-500/10">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0">
            <Zap className="w-8 h-8 text-white" />
            <span className="absolute -bottom-1 -right-1 bg-white text-primary-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {level.level}
            </span>
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-white text-lg">Level {level.level} — {level.title}</h3>
            <p className="text-xs text-slate-400 mb-2">{data.xp} XP {level.level < 5 ? `· ${level.nextLevelXp - data.xp} XP to next level` : '· Max level!'}</p>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500" style={{ width: `${level.progress * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Level ladder */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {[
            { lv: 1, t: 'Beginner', min: 0 },
            { lv: 2, t: 'Planner', min: 100 },
            { lv: 3, t: 'Saver', min: 300 },
            { lv: 4, t: 'Investor', min: 700 },
            { lv: 5, t: 'Finance Master', min: 1500 },
          ].map((l) => (
            <div key={l.lv} className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${data.xp >= l.min ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                {l.lv}
              </div>
              <span className={`text-[10px] text-center ${data.xp >= l.min ? 'text-white' : 'text-slate-500'}`}>{l.t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2 px-1">Unlocked</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {unlocked.map((a) => (
              <button key={a.id} onClick={() => setShowDetail(a.id)} className="glass rounded-2xl p-4 text-center hover:scale-105 transition-transform">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-warning-500 to-accent-500 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-white">{a.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2 px-1">Locked</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {locked.map((a) => (
              <div key={a.id} className="glass rounded-2xl p-4 text-center opacity-60">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                  <Lock className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-300">{a.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {showDetail && (() => {
        const a = data.achievements.find((x) => x.id === showDetail);
        if (!a) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="glass relative rounded-2xl p-6 max-w-xs w-full text-center animate-scale-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-warning-500 to-accent-500 flex items-center justify-center mb-3">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-display font-bold text-white text-lg">{a.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{a.description}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
