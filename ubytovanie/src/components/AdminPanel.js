import React, { useState, useEffect } from 'react';
import { adminApi, ziadostApi } from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('prehled');
  const [ziadosti, setZiadosti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pre automatické vyhodnotenie (P4.1)
  const [vyhodnotData, setVyhodnotData] = useState({
    akademicky_rok: '2024/2025',
    kapacita: 50,
  });
  const [navrhVysledkov, setNavrhVysledkov] = useState([]);

  // Pre manuálne schválenie (P4.2)
  const [selectedZiadosti, setSelectedZiadosti] = useState([]);

  // Pre pridelenie miestností (P4.3)
  const [pridelitData, setPridelitData] = useState({
    akademicky_rok: '2024/2025',
  });

  useEffect(() => {
    loadZiadosti();
  }, []);

  const loadZiadosti = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getZiadosti('2024/2025', null);
      setZiadosti(response.data);
    } catch (err) {
      console.error('Chyba pri načítaní žiadostí:', err);
      setError('Nepodarilo sa načítať žiadosti.');
    } finally {
      setLoading(false);
    }
  };

  // P4.1 - Automatické vyhodnotenie
  const handleAutomatickeVyhodnotenie = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await adminApi.vyhodnotit(vyhodnotData);

      if (response.data.success) {
        setNavrhVysledkov(response.data.navrhVysledkov);
        setSuccess(`Vyhodnotenie dokončené: ${response.data.statistics.schvalene} schválených, ${response.data.statistics.zamietnute} zamietnutých`);
        setActiveTab('vysledky');
      }
    } catch (err) {
      console.error('Chyba pri vyhodnotení:', err);
      setError(err.response?.data?.error || 'Nepodarilo sa vyhodnotiť žiadosti.');
    } finally {
      setLoading(false);
    }
  };

  // P4.2 - Manuálne schválenie
  const handleManualneSchvalenie = async () => {
    if (navrhVysledkov.length === 0) {
      setError('Najprv spustite automatické vyhodnotenie.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const vysledky = navrhVysledkov.map(v => ({
        id_ziadosti: v.id_ziadosti,
        rozhodnutie: v.odporucanie,
        poznamka: `Automaticky vyhodnotené - ${v.bodova_hodnota.toFixed(2)} bodov, poradie ${v.poradie}`
      }));

      const response = await adminApi.schvalit({ 
        vysledky,
        id_administratora: 1 
      });

      if (response.data.success) {
        setSuccess(`Výsledky schválené: ${response.data.statistics.schvalene} schválených, ${response.data.statistics.zamietnute} zamietnutých`);
        setNavrhVysledkov([]);
        loadZiadosti();
      }
    } catch (err) {
      console.error('Chyba pri schvaľovaní:', err);
      setError(err.response?.data?.error || 'Nepodarilo sa schváliť výsledky.');
    } finally {
      setLoading(false);
    }
  };

  // P4.3 - Pridelenie miestností
  const handlePridelitMiestnosti = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await adminApi.pridelitMiestnosti(pridelitData);

      if (response.data.success) {
        setSuccess(`Pridelenie dokončené: ${response.data.statistics.pridelene} pridelených, ${response.data.statistics.nepridelene} nepridelených`);
        loadZiadosti();
      }
    } catch (err) {
      console.error('Chyba pri prideľovaní:', err);
      setError(err.response?.data?.error || 'Nepodarilo sa prideliť miestnosti.');
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
      'pridelena': 'badge bg-success',
    };
    return badges[stav] || 'badge bg-secondary';
  };

  return (
    <div className="container-fluid mt-4">
      <h2 className="mb-4">👨‍💼 Administrátorský panel</h2>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'prehled' ? 'active' : ''}`}
            onClick={() => setActiveTab('prehled')}
          >
            📊 Prehľad žiadostí
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'vyhodnotenie' ? 'active' : ''}`}
            onClick={() => setActiveTab('vyhodnotenie')}
          >
            ⚙️ P4.1 - Automatické vyhodnotenie
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'vysledky' ? 'active' : ''}`}
            onClick={() => setActiveTab('vysledky')}
            disabled={navrhVysledkov.length === 0}
          >
            ✅ P4.2 - Schválenie výsledkov
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'pridelenie' ? 'active' : ''}`}
            onClick={() => setActiveTab('pridelenie')}
          >
            🏠 P4.3 - Pridelenie miestností
          </button>
        </li>
      </ul>

      {/* Tab: Prehľad žiadostí */}
      {activeTab === 'prehled' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">📊 Prehľad všetkých žiadostí</h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Študent</th>
                        <th>Akademický rok</th>
                        <th>Body</th>
                        <th>Poradie</th>
                        <th>Stav</th>
                        <th>Dátum podania</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ziadosti.map(z => (
                        <tr key={z.id_ziadosti}>
                          <td>{z.id_ziadosti}</td>
                          <td>{z.meno} {z.priezvisko}</td>
                          <td>{z.akademicky_rok}</td>
                          <td><strong>{z.celkovy_pocet_bodov ? Number(z.celkovy_pocet_bodov).toFixed(2) : '0.00'}</strong></td>
                          <td>#{z.poradove_cislo || '—'}</td>
                          <td>
                            <span className={getStavBadge(z.aktualny_stav)}>
                              {z.aktualny_stav}
                            </span>
                          </td>
                          <td>{new Date(z.datum_podania).toLocaleDateString('sk-SK')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Štatistiky */}
                <div className="row mt-4">
                  <div className="col-md-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h3>{ziadosti.length}</h3>
                        <p className="mb-0">Celkom žiadostí</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-info text-white">
                      <div className="card-body text-center">
                        <h3>{ziadosti.filter(z => z.aktualny_stav === 'v_spracovani').length}</h3>
                        <p className="mb-0">V spracovaní</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h3>{ziadosti.filter(z => z.aktualny_stav === 'schvalena' || z.aktualny_stav === 'pridelena').length}</h3>
                        <p className="mb-0">Schválené</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card bg-danger text-white">
                      <div className="card-body text-center">
                        <h3>{ziadosti.filter(z => z.aktualny_stav === 'zamietnuta').length}</h3>
                        <p className="mb-0">Zamietnuté</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: P4.1 - Automatické vyhodnotenie */}
      {activeTab === 'vyhodnotenie' && (
        <div className="card">
          <div className="card-header bg-warning">
            <h5 className="mb-0">⚙️ P4.1 - Automatické vyhodnotenie žiadostí</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <h6 className="alert-heading">ℹ️ Ako funguje automatické vyhodnotenie?</h6>
              <ol className="mb-0">
                <li>Systém zoradí žiadosti podľa bodov (od najvyšších)</li>
                <li>Prvých N žiadostí (podľa kapacity) dostane odporúčanie "schválená"</li>
                <li>Ostatné žiadosti dostanú odporúčanie "zamietnutá"</li>
                <li>Administrátor môže výsledky skontrolovať a schváliť</li>
              </ol>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">Akademický rok</label>
                <select 
                  className="form-select"
                  value={vyhodnotData.akademicky_rok}
                  onChange={(e) => setVyhodnotData({...vyhodnotData, akademicky_rok: e.target.value})}
                >
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Kapacita (počet miest)</label>
                <input 
                  type="number"
                  className="form-control"
                  value={vyhodnotData.kapacita}
                  onChange={(e) => setVyhodnotData({...vyhodnotData, kapacita: parseInt(e.target.value)})}
                  min="1"
                />
              </div>
            </div>

            <button 
              className="btn btn-warning btn-lg"
              onClick={handleAutomatickeVyhodnotenie}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Vyhodnocujem...
                </>
              ) : (
                '⚙️ Spustiť automatické vyhodnotenie'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab: P4.2 - Výsledky a schválenie */}
      {activeTab === 'vysledky' && (
        <div className="card">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">✅ P4.2 - Manuálne schválenie výsledkov</h5>
          </div>
          <div className="card-body">
            {navrhVysledkov.length === 0 ? (
              <div className="alert alert-warning">
                Najprv spustite automatické vyhodnotenie.
              </div>
            ) : (
              <>
                <div className="alert alert-info">
                  <strong>Návrh výsledkov:</strong> {navrhVysledkov.filter(v => v.odporucanie === 'schvalena').length} schválených, 
                  {' '}{navrhVysledkov.filter(v => v.odporucanie === 'zamietnuta').length} zamietnutých
                </div>

                <div className="table-responsive mb-4">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Poradie</th>
                        <th>ID žiadosti</th>
                        <th>ID študenta</th>
                        <th>Body</th>
                        <th>Odporúčanie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {navrhVysledkov.map((vysledok, index) => (
                        <tr key={index} className={vysledok.odporucanie === 'schvalena' ? 'table-success' : 'table-danger'}>
                          <td><strong>#{vysledok.poradie}</strong></td>
                          <td>{vysledok.id_ziadosti}</td>
                          <td>{vysledok.id_studenta}</td>
                          <td>{vysledok.bodova_hodnota.toFixed(2)}</td>
                          <td>
                            <span className={`badge ${vysledok.odporucanie === 'schvalena' ? 'bg-success' : 'bg-danger'}`}>
                              {vysledok.odporucanie}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  className="btn btn-success btn-lg"
                  onClick={handleManualneSchvalenie}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Schvaľujem...
                    </>
                  ) : (
                    '✅ Schváliť výsledky a informovať študentov'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: P4.3 - Pridelenie miestností */}
      {activeTab === 'pridelenie' && (
        <div className="card">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">🏠 P4.3 - Pridelenie miestností</h5>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <h6 className="alert-heading">ℹ️ Ako funguje pridelenie miestností?</h6>
              <ol className="mb-0">
                <li>Systém nájde všetky schválené žiadosti</li>
                <li>Pre každú žiadosť hľadá vhodnú voľnú miestnosť</li>
                <li>Prioritne sa prihliada na preferencie študenta (lokalita, typ izby)</li>
                <li>Po pridelení sa aktualizuje kapacita miestností</li>
                <li>Študenti dostanú notifikáciu o pridelení</li>
              </ol>
            </div>

            <div className="row mb-4">
              <div className="col-md-6">
                <label className="form-label">Akademický rok</label>
                <select 
                  className="form-select"
                  value={pridelitData.akademicky_rok}
                  onChange={(e) => setPridelitData({...pridelitData, akademicky_rok: e.target.value})}
                >
                  <option value="2024/2025">2024/2025</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>
            </div>

            <div className="alert alert-warning">
              <strong>⚠️ Pozor:</strong> Prideliť miestnosti možno len schváleným žiadostiam. 
              Pred spustením sa uistite, že ste schválili výsledky (P4.2).
            </div>

            <button 
              className="btn btn-primary btn-lg"
              onClick={handlePridelitMiestnosti}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Prideľujem miestnosti...
                </>
              ) : (
                '🏠 Prideliť miestnosti schváleným žiadostiam'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;