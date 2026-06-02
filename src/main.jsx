import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWrapper from './AppWrapper';
import { AuthProvider } from './components/AuthProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppWrapper />
    </AuthProvider>
  </React.StrictMode>
);
