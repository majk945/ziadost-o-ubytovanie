import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ student, onLogout }) {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          🏠 OnlineIntrak.sk
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          {student ? (
            <>
              <ul className="navbar-nav me-auto">
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    📊 Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/ziadost/nova">
                    ➕ Nová žiadosť
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/moje-ziadosti">
                    📋 Moje žiadosti
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/notifikacie">
                    🔔 Notifikácie
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/admin">
                    👨‍💼 Admin Panel
                  </Link>
                </li>
              </ul>
              
              <div className="d-flex align-items-center">
                <span className="text-white me-3">
                  👤 {student.meno} {student.priezvisko}
                </span>
                <button 
                  className="btn btn-outline-light btn-sm" 
                  onClick={onLogout}
                >
                  🚪 Odhlásiť
                </button>
              </div>
            </>
          ) : (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link" to="/login">
                  🔐 Prihlásiť sa
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;