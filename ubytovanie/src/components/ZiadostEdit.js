import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ziadostApi } from '../services/api';

function ZiadostEdit({ student }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ziadost, setZiadost] = useState(null);

  const [formData, setFormData] = useState({
    typ_izby: '',
    lokalita: '',
  });

  useEffect(() => {
    loadZiadost();
  }, [id]);

  const loadZiadost = async () => {
    try {
      const response = await ziadostApi.getZiadost(id);
      const data = response.data.ziadost;
      
      setZiadost(data);
      setFormData({
        typ_izby: data.typ_izby || '',
        lokalita: data.lokalita || '',
      });

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
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // P1.3 - Úprava žiadosti
      const response = await ziadostApi.updateZiadost(id, formData);

      if (response.data.success) {
        setSuccess(true);

        // Presmerovanie po 2 sekundách
        setTimeout(() => {
          navigate(`/ziadost/${id}`);
        }, 2000);
      }

    } catch (err) {
      console.error('Chyba pri úprave žiadosti:', err);
      setError(
        err.response?.data?.error || 
        'Nepodarilo sa upraviť žiadosť. Skúste to znova.'
      );
    } finally {
      setSaving(false);
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

  // Kontrola či je možné upravovať
  if (ziadost.aktualny_stav !== 'nova' && ziadost.aktualny_stav !== 'v_spracovani') {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">
          <h4>⚠️ Žiadosť už nie je možné upraviť</h4>
          <p>Žiadosť je v stave: <strong>{ziadost.aktualny_stav}</strong></p>
          <p>Upravovať je možné len žiadosti v stave "Nová" alebo "V spracovaní".</p>
          <Link to={`/ziadost/${id}`} className="btn btn-primary">
            ← Späť na detail žiadosti
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success">
          <h4 className="alert-heading">✅ Žiadosť bola úspešne upravená!</h4>
          <p>Zmeny boli uložené a body boli automaticky prepočítané.</p>
          <hr />
          <p className="mb-0">
            <div className="spinner-border spinner-border-sm me-2"></div>
            Presmerovávame vás na detail žiadosti...
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
            <Link to={`/ziadost/${id}`}>Žiadosť #{id}</Link>
          </li>
          <li className="breadcrumb-item active">Úprava</li>
        </ol>
      </nav>

      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-header bg-warning">
              <h4 className="mb-0">✏️ Úprava žiadosti #{id}</h4>
            </div>

            <div className="card-body">
              {/* Aktuálne údaje */}
              <div className="alert alert-info">
                <h6 className="alert-heading">📋 Aktuálne údaje žiadosti</h6>
                <p className="mb-1">
                  <strong>Akademický rok:</strong> {ziadost.akademicky_rok}
                </p>
                <p className="mb-1">
                  <strong>Stav:</strong> {ziadost.aktualny_stav}
                </p>
                <p className="mb-0">
                  <strong>Aktuálne body:</strong> {ziadost.celkovy_pocet_bodov ? Number(ziadost.celkovy_pocet_bodov).toFixed(2) : '0.00'}
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Typ izby */}
                <div className="mb-3">
                  <label htmlFor="typ_izby" className="form-label">
                    Typ izby <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="typ_izby"
                    name="typ_izby"
                    value={formData.typ_izby}
                    onChange={handleChange}
                    required
                  >
                    <option value="jednolozkova">Jednolôžková</option>
                    <option value="dvojlozkova">Dvojlôžková</option>
                    <option value="trojlozkova">Trojlôžková</option>
                    <option value="stvorlozkova">Štvorldôžková</option>
                  </select>
                </div>

                {/* Lokalita */}
                <div className="mb-3">
                  <label htmlFor="lokalita" className="form-label">
                    Preferovaný internát
                  </label>
                  <select
                    className="form-select"
                    id="lokalita"
                    name="lokalita"
                    value={formData.lokalita}
                    onChange={handleChange}
                  >
                    <option value="">-- Bez preferencie --</option>
                    <option value="Mladá garda">Mladá garda</option>
                    <option value="Družba">Družba</option>
                    <option value="Ľudovít Štúr">Ľudovít Štúr</option>
                  </select>
                </div>

                {/* Upozornenie */}
                <div className="alert alert-warning">
                  <h6 className="alert-heading">⚠️ Dôležité informácie</h6>
                  <ul className="mb-0">
                    <li>Po uložení zmien sa automaticky prepočítajú body</li>
                    <li>Zmeny v preferenciách neovplyvnia bodové hodnotenie</li>
                    <li>Akademický rok nie je možné zmeniť</li>
                  </ul>
                </div>

                {/* Tlačidlá */}
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-warning"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Ukladám zmeny...
                      </>
                    ) : (
                      '💾 Uložiť zmeny'
                    )}
                  </button>

                  <Link 
                    to={`/ziadost/${id}`}
                    className="btn btn-secondary"
                  >
                    ❌ Zrušiť
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Info o procese */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">🔄 Čo sa stane po uložení?</h6>
            </div>
            <div className="card-body">
              <ol className="mb-0">
                <li><strong>P1.3:</strong> Zmeny sa uložia do databázy</li>
                <li><strong>P1.4:</strong> Žiadosť sa znovu validuje</li>
                <li><strong>P3.2:</strong> Body sa prepočítajú (ak sa zmenili relevantné údaje)</li>
                <li><strong>P3.3:</strong> Aktualizuje sa poradie</li>
                <li><strong>P6.1, P6.2:</strong> Dostanete notifikáciu o zmene</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZiadostEdit;