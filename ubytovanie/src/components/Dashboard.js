import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ziadostApi, notifikaciaApi } from '../services/api';

function Dashboard({ student }) {
  const [ziadosti, setZiadosti] = useState([]);
  const [notifikacie, setNotifikacie] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [student]);

  const loadData = async () => {
    try {
      // Načítaj žiadosti študenta
      const ziadostiRes = await ziadostApi.getStudentZiadosti(student.id_studenta);
      setZiadosti(ziadostiRes.data);

      // Načítaj notifikácie
      const notifikacieRes = await notifikaciaApi.getStudentNotifikacie(student.id_studenta);
      setNotifikacie(notifikacieRes.data.slice(0, 5)); // Len posledných 5

    } catch (error) {
      console.error('Chyba pri načítaní dát:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStavBadge = (stav) => {
    const badges = {
      'nova': 'badge bg-secondary',
      'v_spracovani': 'badge bg-info',
      'vyhodnotena': 'badge bg-warning',
      'schvalena': 'badge bg-success',
      'zamietnuta': 'badge bg-danger',
      'na_odvolanie': 'badge bg-warning',
      'pridelena': 'badge bg-success',
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

  const aktualnaZiadost = ziadosti.find(z => 
    z.aktualny_stav !== 'zrusena' && z.aktualny_stav !== 'expirovana'
  );

  return (
    <div className="container mt-4">
      {/* Hlavička */}
      <div className="row mb-4">
        <div className="col">
          <h2>
            👋 Vitajte, {student.meno} {student.priezvisko}!
          </h2>
          <p className="text-muted">
            {student.nazov_programu}, {student.rocnik}. ročník
          </p>
        </div>
      </div>

      {/* Karty s informáciami */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5 className="card-title">📋 Žiadosti</h5>
              <h2 className="card-text">{ziadosti.length}</h2>
              <small>Celkový počet žiadostí</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-white bg-success">
            <div className="card-body">
              <h5 className="card-title">📊 Prospech</h5>
              <h2 className="card-text">{student.studijny_priemer || 'N/A'}</h2>
              <small>Študijný priemer</small>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <div className="card text-white bg-info">
            <div className="card-body">
              <h5 className="card-title">🔔 Notifikácie</h5>
              <h2 className="card-text">{notifikacie.length}</h2>
              <small>Nové správy</small>
            </div>
          </div>
        </div>
      </div>

      {/* Aktuálna žiadosť */}
      {aktualnaZiadost ? (
        <div className="card mb-4 shadow">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">✅ Aktuálna žiadosť</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <p><strong>ID žiadosti:</strong> {aktualnaZiadost.id_ziadosti}</p>
                <p><strong>Akademický rok:</strong> {aktualnaZiadost.akademicky_rok}</p>
                <p>
                  <strong>Stav:</strong>{' '}
                  <span className={getStavBadge(aktualnaZiadost.aktualny_stav)}>
                    {getStavText(aktualnaZiadost.aktualny_stav)}
                  </span>
                </p>
              </div>
              <div className="col-md-6">
                <p><strong>Celkové body:</strong> {aktualnaZiadost.celkovy_pocet_bodov ? Number(aktualnaZiadost.celkovy_pocet_bodov).toFixed(2) : '0.00'}</p>
                <p><strong>Poradie:</strong> {aktualnaZiadost.poradove_cislo || 'Nepriradené'}</p>
                <p><strong>Dátum podania:</strong> {new Date(aktualnaZiadost.datum_podania).toLocaleDateString('sk-SK')}</p>
              </div>
            </div>
            <hr />
            <div className="d-flex gap-2">
              <Link 
                to={`/ziadost/${aktualnaZiadost.id_ziadosti}`}
                className="btn btn-primary"
              >
                📄 Zobraziť detail
              </Link>
              {(aktualnaZiadost.aktualny_stav === 'nova' || aktualnaZiadost.aktualny_stav === 'v_spracovani') && (
                <Link 
                  to={`/ziadost/${aktualnaZiadost.id_ziadosti}/upravit`}
                  className="btn btn-warning"
                >
                  ✏️ Upraviť žiadosť
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="alert alert-warning" role="alert">
          <h5 className="alert-heading">⚠️ Nemáte aktívnu žiadosť</h5>
          <p>Momentálne nemáte podanú žiadosť o ubytovanie.</p>
          <hr />
          <Link to="/ziadost/nova" className="btn btn-primary">
            ➕ Podať novú žiadosť
          </Link>
        </div>
      )}

      {/* Posledné notifikácie */}
      {notifikacie.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">🔔 Najnovšie notifikácie</h5>
          </div>
          <div className="list-group list-group-flush">
            {notifikacie.map((notif) => (
              <div key={notif.id_notifikacie} className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">{notif.predmet}</h6>
                  <small>{new Date(notif.datum_odoslania).toLocaleDateString('sk-SK')}</small>
                </div>
                <p className="mb-1">{notif.obsah}</p>
                <small className="text-muted">
                  <span className={`badge ${notif.stav === 'dorucena' ? 'bg-success' : 'bg-warning'}`}>
                    {notif.stav}
                  </span>
                </small>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rýchle akcie */}
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">⚡ Rýchle akcie</h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2">
            <Link to="/ziadost/nova" className="btn btn-primary">
              ➕ Nová žiadosť
            </Link>
            <Link to="/moje-ziadosti" className="btn btn-outline-primary">
              📋 Moje žiadosti
            </Link>
            <Link to="/notifikacie" className="btn btn-outline-info">
              🔔 Všetky notifikácie
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;