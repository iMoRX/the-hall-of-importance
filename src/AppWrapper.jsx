import React from 'react';
import App from './App';
import Auth from './components/Auth';
import { useAuth } from './components/AuthProvider';

export default function AppWrapper() {
  const { session } = useAuth();

  if (!session) {
    return <Auth />;
  }

  return <App />;
}
