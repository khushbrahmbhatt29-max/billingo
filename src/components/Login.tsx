import React, { useState, useEffect } from 'react';
import { Lock, LogIn, KeyRound } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if an admin password has been set before
    const savedPassword = localStorage.getItem('app_admin_password');
    if (!savedPassword) {
      setIsSetup(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSetup) {
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      localStorage.setItem('app_admin_password', password);
      setIsSetup(false);
      onSuccess();
    } else {
      const savedPassword = localStorage.getItem('app_admin_password');
      if (password === savedPassword) {
        onSuccess();
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-slate-800 p-8 flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
            {isSetup ? <KeyRound className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-center">Shree Brahmani Enterprise</h1>
          <p className="text-slate-400 mt-2 text-sm text-center">
            {isSetup ? 'Create an Admin Password to secure your billing application.' : 'Enter your Admin Password to access the billing dashboard.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {isSetup ? 'Set New Password' : 'Password'}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm text-lg tracking-widest"
              placeholder={isSetup ? 'Enter a strong password...' : 'Enter your password...'}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-md"
          >
            {isSetup ? (
              <>
                <span>Set Password & Continue</span>
                <KeyRound className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Login Securely</span>
                <LogIn className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <p className="text-xs text-slate-500">🔒 This application runs locally. Your data and password never leave this device.</p>
        </div>
      </div>
    </div>
  );
}
