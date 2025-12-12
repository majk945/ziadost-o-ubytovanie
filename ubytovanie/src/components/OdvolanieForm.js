import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ziadostApi, odvolanieApi } from '../services/api';

function OdvolanieForm({ student }) {
  const { id_ziadosti } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ziadost, setZiadost] = useState(null);

  const [formData, setFormData] = useState({
    dovod: '',
  });

  useEffect(() => {
    loadZiadost();
  }, [id_ziadosti]);

  const loadZiadost = async () => {
    try {
      const response = await ziadostApi.getZiadost(id_ziadosti);
      const data = response.data.ziadost;
      
      // Kontrola či je žiadosť zamietnutá
      if (data.aktualny_stav !== 'zamietnuta') {
        setError('Odvolanie možno podať len na zamietnutú žiadosť.');
      }
      
      setZiadost(data);
    } catch (err) {
      console.error('Chyba pri načítaní žiadosti:', err);
      setError('Nepodarilo sa načítať žiadosť.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // P2.1 - Podanie odvolania
      const data = {
        id_ziadosti: parseInt(id_ziadosti),
        dovod: formData.dovod,
        id_administratora: 1, // Default admin
      };

      const response = await odvolanieApi.createOdvolanie(data);

      if (response.data.success) {
        setSuccess(true);
        const idOdvolania = response.data.id_odvolania;

        // Presmerovanie po 2 sekundách
        setTimeout(() => {
          navigate(`/odvolanie/${idOdvolania}`);
        }, 2000);
      }

    } catch (err) {
      console.error('Chyba pri vytváraní odvolania:', err);
      setError(
        err.response?.data?.error || 
        'Nepodarilo sa podať odvolanie. Skúste to znova.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Načítavam...</span>
        </div>
      </div>
    );
  }

  if (error && !ziadost) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Chyba</h4>
          <p>{error}</p>
          <Link to="/dashboard" className="btn btn-primary">
            ← Späť na Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (ziadost && ziadost.aktualny_stav !== 'zamietnuta') {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>⚠️ Nie je možné podať odvolanie</h4>
          <p>Odvolanie možno podať len na zamietnutú žiadosť.</p>
          <p>Aktuálny stav žiadosti: <strong>{ziadost.aktualny_stav}</strong></p>
          <Link to={`/ziadost/${id_ziadosti}`} className="btn btn-primary">
            ← Späť na žiadosť
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success">
          <h4 className="alert-heading">✅ Odvolanie bolo úspešne podané!</h4>
          <p>Vaše odvolanie bolo prijaté a bude spracované administrátorom.</p>
          <hr />
          <p className="mb-0">
            <div className="spinner-border spinner-border-sm me-2"></div>
            Presmerovávame vás na detail odvolania...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/dashboard">Dashboard</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to={`/ziadost/${id_ziadosti}`}>Žiadosť #{id_ziadosti}</Link>
          </li>
          <li className="breadcrumb-item active">Podať odvolanie</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-header bg-danger text-white">
              <h4 className="mb-0">📢 Podanie odvolania</h4>
            </div>

            <div className="card-body">
              {/* Info o žiadosti */}
              <div className="alert alert-danger">
                <h6 className="alert-heading">❌ Zamietnutá žiadosť</h6>
                <p className="mb-1">
                  <strong>ID žiadosti:</strong> {ziadost.id_ziadosti}
                </p>
                <p className="mb-1">
                  <strong>Akademický rok:</strong> {ziadost.akademicky_rok}
                </p>
                <p className="mb-0">
                  <strong>Body:</strong> {ziadost.celkovy_pocet_bodov ? Number(ziadost.celkovy_pocet_bodov).toFixed(2) : '0.00'}
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Dôvod odvolania */}
                <div className="mb-3">
                  <label htmlFor="dovod" className="form-label">
                    Dôvod odvolania <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="dovod"
                    name="dovod"
                    rows="8"
                    value={formData.dovod}
                    onChange={handleChange}
                    placeholder="Uveďte dôvod, prečo sa odvolávate proti zamietnutiu žiadosti..."
                    required
                  />
                  <div className="form-text">
                    Popíšte podrobne dôvody vášho odvolania. Min. 50 znakov.
                  </div>
                </div>

                {/* Návod */}
                <div className="alert alert-info">
                  <h6 className="alert-heading">💡 Ako napísať dobré odvolanie?</h6>
                  <ul className="mb-0">
                    <li>Uveďte konkrétne dôvody nesúhlasu so zamietnutím</li>
                    <li>Ak máte nové informácie alebo dokumenty, uveďte to</li>
                    <li>Popíšte vašu situáciu objektívne a vecne</li>
                    <li>Odôvodnite prečo si myslíte, že žiadosť mala byť schválená</li>
                  </ul>
                </div>

                {/* Upozornenie */}
                <div className="alert alert-warning">
                  <h6 className="alert-heading">⚠️ Dôležité informácie</h6>
                  <ul className="mb-0">
                    <li>Odvolanie bude posúdené administrátorom</li>
                    <li>Proces môže trvať 5-10 pracovných dní</li>
                    <li>O výsledku budete informovaný emailom</li>
                    <li>Rozhodnutie o odvolaní je konečné</li>
                  </ul>
                </div>

                {/* Tlačidlá */}
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={submitting || formData.dovod.length < 50}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Podávam odvolanie...
                      </>
                    ) : (
                      '📢 Podať odvolanie'
                    )}
                  </button>

                  <Link 
                    to={`/ziadost/${id_ziadosti}`}
                    className="btn btn-secondary"
                  >
                    ❌ Zrušiť
                  </Link>
                </div>

                {formData.dovod.length > 0 && formData.dovod.length < 50 && (
                  <small className="text-muted d-block mt-2">
                    Ešte {50 - formData.dovod.length} znakov do minima
                  </small>
                )}
              </form>
            </div>
          </div>

          {/* Info o procese */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">📋 Proces odvolania (P2.x)</h6>
            </div>
            <div className="card-body">
              <ol className="mb-0">
                <li><strong>P2.1:</strong> Podanie odvolania (teraz)</li>
                <li><strong>P2.4:</strong> Validácia odvolania</li>
                <li><strong>P2.2:</strong> Administrátor zobrazí odvolanie</li>
                <li><strong>P2.3:</strong> Administrátor vyhodnotí odvolanie</li>
                <li><strong>P6.1, P6.2:</strong> Dostanete notifikáciu o výsledku</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OdvolanieForm;