import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ClassProvider } from './contexts/ClassContext';
import { AppRoutes } from './routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClassProvider>
          <AppRoutes />
        </ClassProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
