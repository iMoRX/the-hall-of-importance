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
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">The Hall of Importance</h1>
          <p className="auth-subtitle">
            {isSignUp ? 'Create a new account' : 'Log in to your vault'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="auth-form">
          {error && <div className="auth-error" style={{ color: 'var(--danger)', fontSize: 'var(--font-sm)' }}>{error}</div>}
          
          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
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
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing…' : (isSignUp ? 'Sign Up' : 'Sign In to The Hall')}
          </button>
        </form>

        <div className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
          >
            {isSignUp ? 'Log In' : 'Request Access'}
          </button>
        </div>
      </div>
    </div>
  );
}
