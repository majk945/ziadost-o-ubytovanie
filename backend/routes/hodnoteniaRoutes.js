const express = require('express');
const router = express.Router();
const db = require('../config/database');

// P3.1 - Získanie všetkých kritérií
router.get('/kriteria', async (req, res) => {
  try {
    const { stav } = req.query;
    
    let query = 'SELECT * FROM kriterium_hodnotenia';
    const params = [];
    
    if (stav) {
      query += ' WHERE stav = ?';
      params.push(stav);
    }
    
    query += ' ORDER BY datum_vytvorenia DESC';
    
    const [kriteria] = await db.query(query, params);
    res.json(kriteria);
  } catch (error) {
    console.error('Chyba pri načítaní kritérií:', error);
    res.status(500).json({ error: 'Chyba pri načítaní kritérií', details: error.message });
  }
});

// P3.1 - Vytvorenie nového kritéria
router.post('/kriteria', async (req, res) => {
  try {
    const { 
      id_administratora, 
      nazov, 
      popis, 
      bodova_hodnota, 
      vaha_percent, 
      typ_kriteria,
      vzorec,
      stav 
    } = req.body;

    // Validácia
    if (!nazov || !bodova_hodnota || !vaha_percent || !typ_kriteria) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['nazov', 'bodova_hodnota', 'vaha_percent', 'typ_kriteria']
      });
    }

    // Kontrola či súčet váh neprekročí 100%
    const [existingKriteria] = await db.query(
      'SELECT SUM(vaha_percent) as total FROM kriterium_hodnotenia WHERE stav = "aktivne"'
    );
    
    const currentTotal = existingKriteria[0].total || 0;
    if (currentTotal + parseFloat(vaha_percent) > 100) {
      return res.status(400).json({ 
        error: 'Súčet váh kritérií presahuje 100%',
        current_total: currentTotal,
        new_weight: vaha_percent
      });
    }

    // Vytvorenie kritéria
    const [result] = await db.query(`
      INSERT INTO kriterium_hodnotenia 
      (id_administratora, nazov, popis, bodova_hodnota, vaha_percent, typ_kriteria, vzorec, stav)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id_administratora || 1, nazov, popis, bodova_hodnota, vaha_percent, typ_kriteria, vzorec, stav || 'aktivne']);

    res.status(201).json({
      success: true,
      message: 'Kritérium bolo úspešne vytvorené',
      id_kriterium: result.insertId
    });

  } catch (error) {
    console.error('Chyba pri vytváraní kritéria:', error);
    res.status(500).json({ error: 'Chyba pri vytváraní kritéria', details: error.message });
  }
});

// P3.1 - Aktualizácia kritéria
router.put('/kriteria/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];

    const allowedFields = ['nazov', 'popis', 'bodova_hodnota', 'vaha_percent', 'typ_kriteria', 'vzorec', 'stav'];

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        values.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Žiadne údaje na aktualizáciu' });
    }

    values.push(id);
    await db.query(
      `UPDATE kriterium_hodnotenia SET ${updateFields.join(', ')} WHERE id_kriterium = ?`,
      values
    );

    // Ak sa zmenili váhy, prepočítaj všetky žiadosti
    if (updates.vaha_percent !== undefined || updates.stav !== undefined) {
      await recalculateAllRequests();
    }

    res.json({ success: true, message: 'Kritérium bolo aktualizované' });

  } catch (error) {
    console.error('Chyba pri aktualizácii kritéria:', error);
    res.status(500).json({ error: 'Chyba pri aktualizácii kritéria', details: error.message });
  }
});

// P3.1 - Aktivácia/Deaktivácia kritéria
router.patch('/kriteria/:id/stav', async (req, res) => {
  try {
    const { id } = req.params;
    const { stav } = req.body;

    if (!stav || !['aktivne', 'neaktivne'].includes(stav)) {
      return res.status(400).json({ error: 'Neplatný stav. Povolené hodnoty: aktivne, neaktivne' });
    }

    await db.query(
      'UPDATE kriterium_hodnotenia SET stav = ? WHERE id_kriterium = ?',
      [stav, id]
    );

    // Prepočítaj všetky žiadosti
    await recalculateAllRequests();

    res.json({ success: true, message: `Kritérium bolo ${stav === 'aktivne' ? 'aktivované' : 'deaktivované'}` });

  } catch (error) {
    console.error('Chyba pri zmene stavu kritéria:', error);
    res.status(500).json({ error: 'Chyba pri zmene stavu', details: error.message });
  }
});

// P3.2 - Získanie hodnotení pre žiadosť
router.get('/:id_ziadosti', async (req, res) => {
  try {
    const { id_ziadosti } = req.params;

    const [hodnotenia] = await db.query(`
      SELECT 
        h.*,
        k.nazov,
        k.popis,
        k.vaha_percent
      FROM hodnotenie h
      JOIN kriterium_hodnotenia k ON h.id_kriterium = k.id_kriterium
      WHERE h.id_ziadosti = ?
    `, [id_ziadosti]);

    res.json(hodnotenia);

  } catch (error) {
    console.error('Chyba pri načítaní hodnotení:', error);
    res.status(500).json({ error: 'Chyba pri načítaní hodnotení', details: error.message });
  }
});

// P3.2, P3.3 - Manuálny prepočet bodov pre žiadosť
router.post('/:id_ziadosti/prepocitaj', async (req, res) => {
  try {
    const { id_ziadosti } = req.params;

    await calculatePoints(id_ziadosti);
    await updateRankings();

    res.json({ 
      success: true, 
      message: 'Body a poradie boli prepočítané' 
    });

  } catch (error) {
    console.error('Chyba pri prepočte bodov:', error);
    res.status(500).json({ error: 'Chyba pri prepočte', details: error.message });
  }
});

// Helper funkcie

async function recalculateAllRequests() {
  try {
    const [ziadosti] = await db.query(
      'SELECT id_ziadosti FROM ziadost WHERE aktualny_stav IN ("v_spracovani", "vyhodnotena")'
    );

    for (const ziadost of ziadosti) {
      await calculatePoints(ziadost.id_ziadosti);
    }

    await updateRankings();

  } catch (error) {
    console.error('Chyba pri prepočte všetkých žiadostí:', error);
    throw error;
  }
}

async function calculatePoints(id_ziadosti) {
  try {
    const [data] = await db.query(`
      SELECT z.*, s.*
      FROM ziadost z
      JOIN student s ON z.id_studenta = s.id_studenta
      WHERE z.id_ziadosti = ?
    `, [id_ziadosti]);

    if (data.length === 0) return;

    const student = data[0];
    const [kriteria] = await db.query(
      'SELECT * FROM kriterium_hodnotenia WHERE stav = "aktivne"'
    );

    let totalPoints = 0;

    for (const kriterium of kriteria) {
      let points = 0;

      if (kriterium.nazov === 'Akademický prospech' && student.studijny_priemer) {
        points = Math.max(0, (4.0 - student.studijny_priemer) * 25);
      } else if (kriterium.nazov === 'Ročník štúdia') {
        const rocnikMap = { '1': 20, '2': 40, '3': 60, '4': 80, '5': 100 };
        points = rocnikMap[student.rocnik] || 0;
      } else if (kriterium.nazov === 'Sociálne zázemie') {
        if (student.vzdialenost_v_km > 100) points += 40;
        else if (student.vzdialenost_v_km > 50) points += 25;
        else if (student.vzdialenost_v_km > 20) points += 10;

        if (student.pocet_clenov_domacnosti > 0) {
          const prijemNaOsobu = student.prijem_rodiny / student.pocet_clenov_domacnosti;
          if (prijemNaOsobu <= 250) points += 50;
          else if (prijemNaOsobu <= 400) points += 35;
          else if (prijemNaOsobu <= 600) points += 15;
        }
      } else if (kriterium.nazov === 'Zdravotný stav') {
        if (student.zdravotne_znevyhodnenie) points = 100;
      }

      await db.query(`
        INSERT INTO hodnotenie (id_ziadosti, id_kriterium, bodova_hodnota)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE bodova_hodnota = ?
      `, [id_ziadosti, kriterium.id_kriterium, points, points]);

      totalPoints += (points * kriterium.vaha_percent / 100);
    }

    await db.query(
      'UPDATE ziadost SET celkovy_pocet_bodov = ? WHERE id_ziadosti = ?',
      [totalPoints, id_ziadosti]
    );

    return totalPoints;

  } catch (error) {
    console.error('Chyba pri výpočte bodov:', error);
    throw error;
  }
}

async function updateRankings() {
  try {
    const [ziadosti] = await db.query(`
      SELECT id_ziadosti 
      FROM ziadost 
      WHERE aktualny_stav IN ('v_spracovani', 'vyhodnotena')
      ORDER BY celkovy_pocet_bodov DESC, datum_podania ASC
    `);

    for (let i = 0; i < ziadosti.length; i++) {
      await db.query(
        'UPDATE ziadost SET poradove_cislo = ? WHERE id_ziadosti = ?',
        [i + 1, ziadosti[i].id_ziadosti]
      );
    }

  } catch (error) {
    console.error('Chyba pri aktualizácii poradia:', error);
    throw error;
  }
}

module.exports = router;
