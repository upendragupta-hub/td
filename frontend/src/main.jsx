import React from 'react';
import ReactDOM from 'react-dom/client';
import './config/axios';
import App from './App';
import './index.css';       

import { AuthProvider } from './context/AuthContext';
import { UserAuthProvider } from './context/UserAuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <UserAuthProvider>
        <App />
      </UserAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);
