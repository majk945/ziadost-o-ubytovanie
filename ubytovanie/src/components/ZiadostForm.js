import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ziadostApi } from '../services/api';

function ZiadostForm({ student }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    akademicky_rok: '2024/2025',
    typ_izby: 'dvojlozkova',
    lokalita: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // P1.1 - Podanie žiadosti
      const data = {
        id_studenta: student.id_studenta,
        ...formData
      };

      const response = await ziadostApi.createZiadost(data);

      if (response.data.success) {
        setSuccess(true);
        const idZiadosti = response.data.id_ziadosti;

        // Presmerovanie na detail žiadosti po 2 sekundách
        setTimeout(() => {
          navigate(`/ziadost/${idZiadosti}`);
        }, 2000);
      }

    } catch (err) {
      console.error('Chyba pri vytváraní žiadosti:', err);
      setError(
        err.response?.data?.error || 
        'Nepodarilo sa vytvoriť žiadosť. Skúste to znova.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mt-5">
        <div className="alert alert-success" role="alert">
          <h4 className="alert-heading">✅ Žiadosť bola úspešne vytvorená!</h4>
          <p>Vaša žiadosť bola prijatá a automaticky sa spracúva.</p>
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
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">📝 Nová žiadosť o ubytovanie</h4>
            </div>

            <div className="card-body">
              {/* Informácie o študentovi */}
              <div className="alert alert-info">
                <h6 className="alert-heading">👤 Údaje študenta</h6>
                <p className="mb-1">
                  <strong>Meno:</strong> {student.meno} {student.priezvisko}
                </p>
                <p className="mb-1">
                  <strong>Email:</strong> {student.email}
                </p>
                <p className="mb-1">
                  <strong>Program:</strong> {student.nazov_programu}
                </p>
                <p className="mb-0">
                  <strong>Ročník:</strong> {student.rocnik}. ročník
                </p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Akademický rok */}
                <div className="mb-3">
                  <label htmlFor="akademicky_rok" className="form-label">
                    Akademický rok <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="akademicky_rok"
                    name="akademicky_rok"
                    value={formData.akademicky_rok}
                    onChange={handleChange}
                    required
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                  </select>
                  <div className="form-text">
                    Vyberte akademický rok, pre ktorý žiadate o ubytovanie
                  </div>
                </div>

                {/* Typ izby */}
                <div className="mb-3">
                  <label htmlFor="typ_izby" className="form-label">
                    Preferovaný typ izby <span className="text-danger">*</span>
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
                  <div className="form-text">
                    Vyberte typ izby podľa vašich preferencií
                  </div>
                </div>

                {/* Lokalita */}
                <div className="mb-3">
                  <label htmlFor="lokalita" className="form-label">
                    Preferovaný internát (voliteľné)
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
                  <div className="form-text">
                    Môžete si vybrať preferovaný internát, nie je to však zaručené
                  </div>
                </div>

                {/* Info box */}
                <div className="alert alert-warning">
                  <h6 className="alert-heading">⚠️ Dôležité informácie</h6>
                  <ul className="mb-0">
                    <li>Po odoslaní žiadosti sa automaticky vypočítajú vaše body</li>
                    <li>Body sa počítajú na základe prospechu, ročníka, vzdialenosti a sociálnej situácie</li>
                    <li>Žiadosť môžete upraviť pred ukončením lehoty</li>
                    <li>O výsledku budete informovaní emailom</li>
                  </ul>
                </div>

                {/* Tlačidlá */}
                <div className="d-flex gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Vytváram žiadosť...
                      </>
                    ) : (
                      '✅ Podať žiadosť'
                    )}
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    ❌ Zrušiť
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info o procese */}
          <div className="card mt-3">
            <div className="card-header">
              <h6 className="mb-0">📋 Čo sa deje po podaní žiadosti?</h6>
            </div>
            <div className="card-body">
              <ol>
                <li><strong>P1.1 - Podanie:</strong> Žiadosť sa uloží do systému</li>
                <li><strong>P1.4 - Validácia:</strong> Systém skontroluje správnosť údajov</li>
                <li><strong>P3.2 - Výpočet bodov:</strong> Automaticky sa vypočítajú body podľa kritérií</li>
                <li><strong>P3.3 - Poradie:</strong> Pridelí sa vám poradie medzi všetkými žiadateľmi</li>
                <li><strong>P6.1, P6.2 - Notifikácia:</strong> Dostanete email s potvrdením</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ZiadostForm;