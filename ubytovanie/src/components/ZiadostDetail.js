import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ziadostApi, hodnoteniaApi } from '../services/api';

function ZiadostDetail({ student }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ziadost, setZiadost] = useState(null);
  const [hodnotenia, setHodnotenia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      // P1.2 - Zobrazenie stavu žiadosti
      const ziadostRes = await ziadostApi.getZiadost(id);
      setZiadost(ziadostRes.data.ziadost);

      // Načítaj hodnotenia (detailný rozpis bodov)
      const hodnoteniaRes = await hodnoteniaApi.getHodnotenia(id);
      setHodnotenia(hodnoteniaRes.data);

    } catch (err) {
      console.error('Chyba pri načítaní žiadosti:', err);
      setError('Nepodarilo sa načítať žiadosť.');
    } finally {
      setLoading(false);
    }
  };

  const getStavBadge = (stav) => {
    const badges = {
      'nova': 'badge bg-secondary',
      'v_spracovani': 'badge bg-info',
      'vyhodnotena': 'badge bg-warning text-dark',
      'schvalena': 'badge bg-success',
      'zamietnuta': 'badge bg-danger',
      'na_odvolanie': 'badge bg-warning text-dark',
      'pridelena': 'badge bg-success',
      'zrusena': 'badge bg-secondary',
    };
    return badges[stav] || 'badge bg-secondary';
  };

  const getStavText = (stav) => {
    const texts = {
      'nova': 'Nová',
      'v_spracovani': 'V spracovaní',
      'vyhodnotena': 'Vyhodnotená',
      'schvalena': 'Schválená',
      'zamietnuta': 'Zamietnutá',
      'na_odvolanie': 'Na odvolanie',
      'pridelena': 'Pridelená',
      'zrusena': 'Zrušená',
    };
    return texts[stav] || stav;
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

  if (error || !ziadost) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <h4>Chyba</h4>
          <p>{error || 'Žiadosť nebola nájdená.'}</p>
          <Link to="/dashboard" className="btn btn-primary">
            ← Späť na Dashboard
          </Link>
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
          <li className="breadcrumb-item active">
            Detail žiadosti #{ziadost.id_ziadosti}
          </li>
        </ol>
      </nav>

      {/* Hlavička */}
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">
              📄 Detail žiadosti #{ziadost.id_ziadosti}
            </h4>
            <span className={getStavBadge(ziadost.aktualny_stav)}>
              {getStavText(ziadost.aktualny_stav)}
            </span>
          </div>
        </div>

        <div className="card-body">
          <div className="row">
            {/* Ľavá strana - Základné info */}
            <div className="col-md-6">
              <h5 className="mb-3">📋 Základné informácie</h5>
              
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th width="40%">ID žiadosti</th>
                    <td>{ziadost.id_ziadosti}</td>
                  </tr>
                  <tr>
                    <th>Študent</th>
                    <td>{ziadost.meno} {ziadost.priezvisko}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{ziadost.email}</td>
                  </tr>
                  <tr>
                    <th>Akademický rok</th>
                    <td><strong>{ziadost.akademicky_rok}</strong></td>
                  </tr>
                  <tr>
                    <th>Dátum podania</th>
                    <td>
                      {new Date(ziadost.datum_podania).toLocaleString('sk-SK')}
                    </td>
                  </tr>
                  <tr>
                    <th>Typ izby</th>
                    <td className="text-capitalize">{ziadost.typ_izby}</td>
                  </tr>
                  <tr>
                    <th>Lokalita</th>
                    <td>{ziadost.lokalita || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pravá strana - Hodnotenie */}
            <div className="col-md-6">
              <h5 className="mb-3">🏆 Hodnotenie a poradie</h5>
              
              <div className="card bg-light mb-3">
                <div className="card-body text-center">
                  <h6 className="text-muted">Celkový počet bodov</h6>
                  <h1 className="display-4 text-primary mb-0">
                    {ziadost.celkovy_pocet_bodov ? Number(ziadost.celkovy_pocet_bodov).toFixed(2) : '0.00'}
                  </h1>
                </div>
              </div>

              <div className="card bg-light">
                <div className="card-body text-center">
                  <h6 className="text-muted">Poradové číslo</h6>
                  <h1 className="display-4 text-success mb-0">
                    #{ziadost.poradove_cislo || '—'}
                  </h1>
                </div>
              </div>
            </div>
          </div>

          {/* Pridelená miestnosť */}
          {ziadost.cislo_izby && (
            <div className="alert alert-success mt-3">
              <h5 className="alert-heading">✅ Pridelené ubytovanie</h5>
              <p className="mb-0">
                <strong>Internát:</strong> {ziadost.nazov_internatu}<br />
                <strong>Izba:</strong> {ziadost.cislo_izby}<br />
                <strong>Dátum pridelenia:</strong> {new Date(ziadost.datum_pridelenia).toLocaleDateString('sk-SK')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailný rozpis bodov */}
      {hodnotenia.length > 0 && (
        <div className="card shadow mb-4">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">📊 Detailný rozpis bodov</h5>
          </div>
          <div className="card-body">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Kritérium</th>
                  <th>Popis</th>
                  <th className="text-end">Body</th>
                  <th className="text-end">Váha</th>
                  <th className="text-end">Vážené body</th>
                </tr>
              </thead>
              <tbody>
                {hodnotenia.map((h, index) => {
                  const vazeneBody = (h.bodova_hodnota * h.vaha_percent / 100).toFixed(2);
                  return (
                    <tr key={index}>
                      <td><strong>{h.nazov}</strong></td>
                      <td><small className="text-muted">{h.popis}</small></td>
                      <td className="text-end">{h.bodova_hodnota.toFixed(2)}</td>
                      <td className="text-end">{h.vaha_percent}%</td>
                      <td className="text-end">
                        <strong className="text-primary">{vazeneBody}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="table-active">
                  <td colSpan="4" className="text-end"><strong>CELKOM:</strong></td>
                  <td className="text-end">
                    <strong className="text-primary fs-5">
                      {ziadost.celkovy_pocet_bodov ? Number(ziadost.celkovy_pocet_bodov).toFixed(2) : '0.00'}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="alert alert-info mt-3">
              <small>
                <strong>ℹ️ Poznámka:</strong> Vážené body = (Body × Váha) / 100. 
                Celkový počet bodov je súčet všetkých vážených bodov.
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Akcie */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <h5 className="mb-3">⚡ Akcie</h5>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/dashboard" className="btn btn-secondary">
              ← Späť na Dashboard
            </Link>

            {(ziadost.aktualny_stav === 'nova' || ziadost.aktualny_stav === 'v_spracovani') && (
              <Link 
                to={`/ziadost/${ziadost.id_ziadosti}/upravit`}
                className="btn btn-warning"
              >
                ✏️ Upraviť žiadosť
              </Link>
            )}

            {ziadost.aktualny_stav === 'zamietnuta' && (
              <Link 
                to={`/odvolanie/nove/${ziadost.id_ziadosti}`}
                className="btn btn-danger"
              >
                📢 Podať odvolanie
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="alert alert-light border">
        <h6 className="alert-heading">📖 Čo znamená stav žiadosti?</h6>
        <ul className="mb-0">
          <li><strong>Nová:</strong> Žiadosť bola vytvorená, čaká na spracovanie</li>
          <li><strong>V spracovaní:</strong> Žiadosť sa validuje a počítajú sa body</li>
          <li><strong>Vyhodnotená:</strong> Body boli vypočítané, čaká sa na rozhodnutie</li>
          <li><strong>Schválená:</strong> Žiadosť bola schválená, čaká sa na pridelenie miestnosti</li>
          <li><strong>Zamietnutá:</strong> Žiadosť bola zamietnutá, môžete podať odvolanie</li>
          <li><strong>Pridelená:</strong> Bola vám pridelená miestnosť na internáte</li>
        </ul>
      </div>
    </div>
  );
}

export default ZiadostDetail;