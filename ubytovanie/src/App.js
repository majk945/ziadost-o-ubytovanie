import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ZiadostForm from './components/ZiadostForm';
import ZiadostDetail from './components/ZiadostDetail';
import ZiadostEdit from './components/ZiadostEdit';
import MojeZiadosti from './components/MojeZiadosti';
import Notifikacie from './components/Notifikacie';
import OdvolanieForm from './components/OdvolanieForm';
import AdminPanel from './components/AdminPanel';

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

function App() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Načítanie študenta z localStorage pri štarte
  useEffect(() => {
    const savedStudent = localStorage.getItem('student');
    if (savedStudent) {
      try {
        setStudent(JSON.parse(savedStudent));
      } catch (error) {
        console.error('Chyba pri načítaní študenta:', error);
        localStorage.removeItem('student');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (studentData) => {
    setStudent(studentData);
    localStorage.setItem('student', JSON.stringify(studentData));
  };

  const handleLogout = () => {
    setStudent(null);
    localStorage.removeItem('student');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Načítavam...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar student={student} onLogout={handleLogout} />
        
        <Routes>
          {/* Verejné routes */}
          <Route 
            path="/login" 
            element={
              student ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
            } 
          />

          {/* Chránené routes - vyžadujú prihlásenie */}
          <Route 
            path="/dashboard" 
            element={
              student ? <Dashboard student={student} /> : <Navigate to="/login" />
            } 
          />

          {/* Žiadosti */}
          <Route 
            path="/ziadost/nova" 
            element={
              student ? <ZiadostForm student={student} /> : <Navigate to="/login" />
            } 
          />

          <Route 
            path="/ziadost/:id" 
            element={
              student ? <ZiadostDetail student={student} /> : <Navigate to="/login" />
            } 
          />

          <Route 
            path="/ziadost/:id/upravit" 
            element={
              student ? <ZiadostEdit student={student} /> : <Navigate to="/login" />
            } 
          />

          <Route 
            path="/moje-ziadosti" 
            element={
              student ? <MojeZiadosti student={student} /> : <Navigate to="/login" />
            } 
          />

          {/* Notifikácie */}
          <Route 
            path="/notifikacie" 
            element={
              student ? <Notifikacie student={student} /> : <Navigate to="/login" />
            } 
          />

          {/* Odvolania */}
          <Route 
            path="/odvolanie/nove/:id_ziadosti" 
            element={
              student ? <OdvolanieForm student={student} /> : <Navigate to="/login" />
            } 
          />

          {/* Admin panel */}
          <Route 
            path="/admin" 
            element={<AdminPanel />}
          />

          {/* Redirects */}
          <Route 
            path="/" 
            element={
              student ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
            } 
          />

          {/* 404 */}
          <Route 
            path="*" 
            element={
              <div className="container mt-5">
                <div className="alert alert-warning">
                  <h4>404 - Stránka nenájdená</h4>
                  <p>Stránka, ktorú hľadáte, neexistuje.</p>
                </div>
              </div>
            } 
          />
        </Routes>

        {/* Footer */}
        <footer className="bg-light text-center text-muted py-3 mt-5">
          <div className="container">
            <p className="mb-0">
              © 2025 OnlineIntrak.sk | Aplikácia na správu žiadostí o ubytovanie
            </p>
            <small>
              Prototyp - Backend API na porte 5000 | React frontend na porte 3000
            </small>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;