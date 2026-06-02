import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let errorResult = null;
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      errorResult = error;
      if (!error) {
        alert('Check your email for the confirmation link!');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      errorResult = error;
    }

    if (errorResult) {
      setError(errorResult.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <div className="auth-logo">H</div>
          <h1 className="auth-title">The Hall of Importance</h1>
          <p className="auth-subtitle">
            {isSignUp ? 'Create a new account' : 'Log in to your vault'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="field">
            <label className="field__label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label className="field__label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary auth-submit"
            disabled={loading}
            style={{ width: '100%', marginTop: 'var(--space-2)' }}
          >
            {loading ? 'Processing…' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="auth-footer">
          <button
            className="btn btn--ghost"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}
