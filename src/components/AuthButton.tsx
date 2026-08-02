import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('[v0] Google sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setOpen(false);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[v0] Sign-out failed:', err);
    }
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-white/5 text-white ring-1 ring-white/10 hover:bg-white/10 transition-all disabled:opacity-60"
      >
        <GoogleIcon className="w-4 h-4" />
        <span>{loading ? 'Signing in…' : 'Sign in with Google'}</span>
      </button>
    );
  }

  const displayName = user.displayName ?? user.email ?? 'Account';
  const initial = (user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full ring-1 ring-white/10 hover:ring-white/20 transition-all p-0.5"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
            {initial}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl glass ring-1 ring-white/10 p-1.5 z-50 shadow-xl"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                {initial}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              {user.email && <p className="text-xs text-slate-400 truncate">{user.email}</p>}
            </div>
          </div>
          <div className="h-px bg-white/10 my-1" />
          <button
            onClick={handleSignOut}
            role="menuitem"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
