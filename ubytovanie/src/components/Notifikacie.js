import React, { useState, useEffect } from 'react';
import { notifikaciaApi } from '../services/api';

function Notifikacie({ student }) {
  const [notifikacie, setNotifikacie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifikacie();
  }, [student]);

  const loadNotifikacie = async () => {
    try {
      // P6.2 - Zobrazenie notifikácií študenta
      const response = await notifikaciaApi.getStudentNotifikacie(student.id_studenta);
      setNotifikacie(response.data);
    } catch (err) {
      console.error('Chyba pri načítaní notifikácií:', err);
      setError('Nepodarilo sa načítať notifikácie.');
    } finally {
      setLoading(false);
    }
  };

  const getStavBadge = (stav) => {
    const badges = {
      'odoslana': 'badge bg-warning text-dark',
      'dorucena': 'badge bg-success',
      'chyba': 'badge bg-danger',
    };
    return badges[stav] || 'badge bg-secondary';
  };

  const getTypIcon = (typ) => {
    const icons = {
      'prijatie_ziadosti': '✅',
      'zmena_stavu': '🔄',
      'schvalenie_ziadosti': '🎉',
      'zamietnutie_ziadosti': '❌',
      'vyhodnotenie_odvolania': '⚖️',
      'pridelenie_miestnosti': '🏠',
      'podanie_odvolania': '📢',
    };
    return icons[typ] || '📧';
  };

  const filteredNotifikacie = filter === 'all' 
    ? notifikacie 
    : notifikacie.filter(n => n.stav === filter);

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Načítavam...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🔔 Notifikácie</h2>
        <button 
          className="btn btn-outline-primary btn-sm"
          onClick={loadNotifikacie}
        >
          🔄 Obnoviť
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              Všetky ({notifikacie.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'dorucena' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('dorucena')}
            >
              Doručené ({notifikacie.filter(n => n.stav === 'dorucena').length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'odoslana' ? 'btn-warning' : 'btn-outline-warning'}`}
              onClick={() => setFilter('odoslana')}
            >
              Odoslané ({notifikacie.filter(n => n.stav === 'odoslana').length})
            </button>
          </div>
        </div>
      </div>

      {filteredNotifikacie.length === 0 ? (
        <div className="alert alert-info">
          <h4 className="alert-heading">📭 Žiadne notifikácie</h4>
          <p className="mb-0">
            {filter === 'all' 
              ? 'Zatiaľ nemáte žiadne notifikácie.'
              : `Nemáte žiadne notifikácie so stavom "${filter}".`
            }
          </p>
        </div>
      ) : (
        <div className="list-group">
          {filteredNotifikacie.map((notif) => (
            <div 
              key={notif.id_notifikacie} 
              className="list-group-item list-group-item-action"
            >
              <div className="d-flex w-100 justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center mb-2">
                    <span className="fs-4 me-2">
                      {getTypIcon(notif.typ_notifikacie)}
                    </span>
                    <h5 className="mb-0">{notif.predmet}</h5>
                  </div>
                  
                  <p className="mb-2">{notif.obsah}</p>
                  
                  <div className="d-flex flex-wrap gap-2 align-items-center">
                    <small className="text-muted">
                      📅 {new Date(notif.datum_odoslania).toLocaleString('sk-SK')}
                    </small>
                    <span className="text-muted">•</span>
                    <small className="text-muted">
                      📧 {notif.sposob_dorucenia}
                    </small>
                    <span className={getStavBadge(notif.stav)}>
                      {notif.stav}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Štatistiky */}
      {notifikacie.length > 0 && (
        <div className="card mt-4">
          <div className="card-header">
            <h5 className="mb-0">📊 Prehľad notifikácií</h5>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-4">
                <h3>{notifikacie.length}</h3>
                <p className="text-muted">Celkom notifikácií</p>
              </div>
              <div className="col-md-4">
                <h3 className="text-success">
                  {notifikacie.filter(n => n.stav === 'dorucena').length}
                </h3>
                <p className="text-muted">Doručených</p>
              </div>
              <div className="col-md-4">
                <h3 className="text-warning">
                  {notifikacie.filter(n => n.stav === 'odoslana').length}
                </h3>
                <p className="text-muted">Odoslaných</p>
              </div>
            </div>

            {/* Rozdelenie podľa typu */}
            <hr />
            <h6 className="mb-3">Typy notifikácií:</h6>
            <div className="row">
              {Object.entries(
                notifikacie.reduce((acc, n) => {
                  acc[n.typ_notifikacie] = (acc[n.typ_notifikacie] || 0) + 1;
                  return acc;
                }, {})
              ).map(([typ, pocet]) => (
                <div key={typ} className="col-md-6 mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>
                      {getTypIcon(typ)} {typ.replace(/_/g, ' ')}
                    </span>
                    <span className="badge bg-primary">{pocet}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="alert alert-light border mt-4">
        <h6 className="alert-heading">📖 O notifikáciách</h6>
        <p className="mb-0">
          Notifikácie vás informujú o dôležitých udalostiach týkajúcich sa vašej žiadosti:
          prijatie žiadosti, zmena stavu, výsledok hodnotenia, pridelenie miestnosti a ďalšie.
          Notifikácie sa odosielajú automaticky na váš univerzitný email.
        </p>
      </div>
    </div>
  );
}

export default Notifikacie;