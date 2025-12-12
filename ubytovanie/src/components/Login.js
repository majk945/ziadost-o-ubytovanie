import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../services/api';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Testovacie účty
  const testAccounts = [
    'peter.novak@student.sk',
    'jana.kovacova@student.sk',
    'martin.varga@student.sk',
    'lucia.moravcikova@student.sk',
    'tomas.balaz@student.sk',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // P5.1 - Overenie totožnosti
      // P5.2 - Načítanie údajov
      const response = await studentApi.login(email);
      
      if (response.data.success) {
        const student = response.data.student;
        
        // Uloženie do localStorage
        localStorage.setItem('student', JSON.stringify(student));
        
        // Callback na App.js
        onLogin(student);
        
        // Presmerovanie na dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Chyba pri prihlásení:', err);
      setError(
        err.response?.data?.error || 
        'Nepodarilo sa prihlásiť. Skontrolujte email.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = (testEmail) => {
    setEmail(testEmail);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                🔐 Prihlásenie - OnlineIntrak.sk
              </h4>
            </div>
            
            <div className="card-body">
              <p className="text-muted">
                Prihláste sa pomocou univerzitného emailu (simulované SSO)
              </p>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Univerzitný email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="meno.priezvisko@student.sk"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Prihlasovanie...
                    </>
                  ) : (
                    '🔓 Prihlásiť sa'
                  )}
                </button>
              </form>

              <hr className="my-4" />

              <div className="text-center mb-2">
                <small className="text-muted">Testovacie účty:</small>
              </div>

              <div className="d-grid gap-2">
                {testAccounts.map((testEmail, index) => (
                  <button
                    key={index}
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => handleTestLogin(testEmail)}
                  >
                    👤 {testEmail}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="alert alert-info mt-3" role="alert">
            <strong>ℹ️ Info:</strong> Toto je simulované SSO prihlásenie. 
            V reálnej aplikácii by sa používal univerzitný autentifikačný systém.
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;