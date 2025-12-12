import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout({ student, onLogout }) {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar student={student} onLogout={onLogout} />
      
      <main className="flex-grow-1">
        <Outlet />
      </main>

      <footer className="bg-light text-center text-muted py-3 mt-5">
        <div className="container">
          <p className="mb-0">
            © 2024 OnlineIntrak.sk | Aplikácia na správu žiadostí o ubytovanie
          </p>
          <small>
            Prototyp - Backend API na porte 5000 | React frontend na porte 3000
          </small>
        </div>
      </footer>
    </div>
  );
}

export default Layout;