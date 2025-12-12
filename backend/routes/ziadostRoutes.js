const express = require('express');
const router = express.Router();
const db = require('../config/database');

// P1.1 - Podanie žiadosti
router.post('/', async (req, res) => {
  try {
    const {
      id_studenta,
      akademicky_rok,
      typ_izby,
      lokalita
    } = req.body;

    // Validácia vstupných údajov
    if (!id_studenta || !akademicky_rok) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['id_studenta', 'akademicky_rok']
      });
    }

    // Kontrola či študent už nemá žiadosť pre tento akademický rok
    const [existingRequests] = await db.query(
      'SELECT * FROM ziadost WHERE id_studenta = ? AND akademicky_rok = ?',
      [id_studenta, akademicky_rok]
    );

    if (existingRequests.length > 0) {
      return res.status(409).json({ 
        error: 'Študent už má podanú žiadosť pre tento akademický rok' 
      });
    }

    // Vytvorenie novej žiadosti
    const [result] = await db.query(
      `INSERT INTO ziadost (id_studenta, akademicky_rok, typ_izby, lokalita, aktualny_stav) 
       VALUES (?, ?, ?, ?, 'nova')`,
      [id_studenta, akademicky_rok, typ_izby || 'dvojlozkova', lokalita]
    );

    const id_ziadosti = result.insertId;

    // Spustenie validácie (P1.4)
    await validateZiadost(id_ziadosti);

    // Výpočet bodov (P3.2)
    await calculatePoints(id_ziadosti);

    // Vytvorenie notifikácie (P6.1, P6.2)
    await createNotification(id_studenta, 'prijatie_ziadosti', 
      'Potvrdenie prijatia žiadosti', 
      `Vaša žiadosť č. ${id_ziadosti} bola úspešne vytvorená.`);

    res.status(201).json({
      success: true,
      message: 'Žiadosť bola úspešne vytvorená',
      id_ziadosti: id_ziadosti
    });

  } catch (error) {
    console.error('Chyba pri vytváraní žiadosti:', error);
    res.status(500).json({ 
      error: 'Chyba pri vytváraní žiadosti',
      details: error.message 
    });
  }
});

// P1.2 - Zobrazenie stavu žiadosti
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [ziadosti] = await db.query(`
      SELECT 
        z.*,
        s.meno,
        s.priezvisko,
        s.email,
        m.cislo_izby,
        i.nazov as nazov_internatu
      FROM ziadost z
      JOIN student s ON z.id_studenta = s.id_studenta
      LEFT JOIN miestnost m ON z.id_miestnosti = m.id_miestnosti
      LEFT JOIN internat i ON m.id_internatu = i.id_internatu
      WHERE z.id_ziadosti = ?
    `, [id]);

    if (ziadosti.length === 0) {
      return res.status(404).json({ error: 'Žiadosť nenájdená' });
    }

    // Získanie detailného rozpisu bodov
    const [hodnotenia] = await db.query(`
      SELECT 
        h.*,
        k.nazov,
        k.popis,
        k.vaha_percent
      FROM hodnotenie h
      JOIN kriterium_hodnotenia k ON h.id_kriterium = k.id_kriterium
      WHERE h.id_ziadosti = ?
    `, [id]);

    res.json({
      ziadost: ziadosti[0],
      hodnotenia: hodnotenia
    });

  } catch (error) {
    console.error('Chyba pri načítaní žiadosti:', error);
    res.status(500).json({ 
      error: 'Chyba pri načítaní žiadosti',
      details: error.message 
    });
  }
});

// P1.2 - Zobrazenie všetkých žiadostí študenta
router.get('/student/:id_studenta', async (req, res) => {
  try {
    const { id_studenta } = req.params;

    const [ziadosti] = await db.query(`
      SELECT * FROM ziadost 
      WHERE id_studenta = ? 
      ORDER BY datum_podania DESC
    `, [id_studenta]);

    res.json(ziadosti);

  } catch (error) {
    console.error('Chyba pri načítaní žiadostí:', error);
    res.status(500).json({ 
      error: 'Chyba pri načítaní žiadostí',
      details: error.message 
    });
  }
});

// P1.3 - Úprava žiadosti
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Kontrola či žiadosť existuje
    const [existing] = await db.query(
      'SELECT * FROM ziadost WHERE id_ziadosti = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Žiadosť nenájdená' });
    }

    // Kontrola či je žiadosť v správnom stave na úpravu
    if (existing[0].aktualny_stav !== 'nova' && existing[0].aktualny_stav !== 'v_spracovani') {
      return res.status(400).json({ 
        error: 'Žiadosť už nie je možné upraviť',
        current_state: existing[0].aktualny_stav
      });
    }

    // Aktualizácia žiadosti
    const updateFields = [];
    const values = [];

    if (updates.typ_izby) {
      updateFields.push('typ_izby = ?');
      values.push(updates.typ_izby);
    }
    if (updates.lokalita) {
      updateFields.push('lokalita = ?');
      values.push(updates.lokalita);
    }

    if (updateFields.length > 0) {
      values.push(id);
      await db.query(
        `UPDATE ziadost SET ${updateFields.join(', ')} WHERE id_ziadosti = ?`,
        values
      );
    }

    // Validácia aktualizovanej žiadosti (P1.4)
    await validateZiadost(id);

    // Prepočet bodov (P3.2)
    await calculatePoints(id);

    // Notifikácia o úprave (P6.1, P6.2)
    const id_studenta = existing[0].id_studenta;
    await createNotification(id_studenta, 'zmena_stavu', 
      'Žiadosť bola upravená', 
      `Vaša žiadosť č. ${id} bola úspešne upravená.`);

    res.json({
      success: true,
      message: 'Žiadosť bola úspešne upravená'
    });

  } catch (error) {
    console.error('Chyba pri úprave žiadosti:', error);
    res.status(500).json({ 
      error: 'Chyba pri úprave žiadosti',
      details: error.message 
    });
  }
});

// P1.4 - Validácia žiadosti
async function validateZiadost(id_ziadosti) {
  try {
    const [ziadost] = await db.query(`
      SELECT z.*, s.*
      FROM ziadost z
      JOIN student s ON z.id_studenta = s.id_studenta
      WHERE z.id_ziadosti = ?
    `, [id_ziadosti]);

    if (ziadost.length === 0) {
      throw new Error('Žiadosť nenájdená');
    }

    const data = ziadost[0];
    let isValid = true;
    const errors = [];

    // Kontrola povinných polí
    if (!data.akademicky_rok) {
      errors.push('Chýba akademický rok');
      isValid = false;
    }

    // Aktualizácia stavu validácie
    const newState = isValid ? 'v_spracovani' : 'nova';
    await db.query(
      'UPDATE ziadost SET aktualny_stav = ? WHERE id_ziadosti = ?',
      [newState, id_ziadosti]
    );

    return { isValid, errors };

  } catch (error) {
    console.error('Chyba pri validácii:', error);
    throw error;
  }
}

// P3.2 - Výpočet bodov (zjednodušená verzia)
async function calculatePoints(id_ziadosti) {
  try {
    // Získanie údajov žiadosti a študenta
    const [data] = await db.query(`
      SELECT z.*, s.*
      FROM ziadost z
      JOIN student s ON z.id_studenta = s.id_studenta
      WHERE z.id_ziadosti = ?
    `, [id_ziadosti]);

    if (data.length === 0) return;

    const student = data[0];
    
    // Získanie aktívnych kritérií
    const [kriteria] = await db.query(
      'SELECT * FROM kriterium_hodnotenia WHERE stav = "aktivne"'
    );

    let totalPoints = 0;

    for (const kriterium of kriteria) {
      let points = 0;

      // Výpočet bodov podľa kritéria
      if (kriterium.nazov === 'Akademický prospech' && student.studijny_priemer) {
        // Čím lepší priemer, tým viac bodov
        points = Math.max(0, (4.0 - student.studijny_priemer) * 25);
      } else if (kriterium.nazov === 'Ročník štúdia') {
        const rocnikMap = { '1': 20, '2': 40, '3': 60, '4': 80, '5': 100 };
        points = rocnikMap[student.rocnik] || 0;
      } else if (kriterium.nazov === 'Sociálne zázemie') {
        // Vzdialenosť
        if (student.vzdialenost_v_km > 100) points += 40;
        else if (student.vzdialenost_v_km > 50) points += 25;
        else if (student.vzdialenost_v_km > 20) points += 10;

        // Príjem
        const prijemNaOsobu = student.prijem_rodiny / student.pocet_clenov_domacnosti;
        if (prijemNaOsobu <= 250) points += 50;
        else if (prijemNaOsobu <= 400) points += 35;
        else if (prijemNaOsobu <= 600) points += 15;

      } else if (kriterium.nazov === 'Zdravotný stav') {
        if (student.zdravotne_znevyhodnenie) {
          points = 100;
        }
      }

      // Uloženie hodnotenia
      await db.query(`
        INSERT INTO hodnotenie (id_ziadosti, id_kriterium, bodova_hodnota)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE bodova_hodnota = ?
      `, [id_ziadosti, kriterium.id_kriterium, points, points]);

      // Vážený súčet
      totalPoints += (points * kriterium.vaha_percent / 100);
    }

    // Aktualizácia celkového počtu bodov
    await db.query(
      'UPDATE ziadost SET celkovy_pocet_bodov = ? WHERE id_ziadosti = ?',
      [totalPoints, id_ziadosti]
    );

    // P3.3 - Aktualizácia poradia
    await updateRankings();

    return totalPoints;

  } catch (error) {
    console.error('Chyba pri výpočte bodov:', error);
    throw error;
  }
}

// P3.3 - Aktualizácia poradia
async function updateRankings() {
  try {
    // Získanie všetkých žiadostí zoradených podľa bodov
    const [ziadosti] = await db.query(`
      SELECT id_ziadosti 
      FROM ziadost 
      WHERE aktualny_stav IN ('v_spracovani', 'vyhodnotena')
      ORDER BY celkovy_pocet_bodov DESC, datum_podania ASC
    `);

    // Aktualizácia poradia
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

// P6.1, P6.2 - Vytvorenie a odoslanie notifikácie
async function createNotification(id_studenta, typ, predmet, obsah) {
  try {
    await db.query(`
      INSERT INTO notifikacia (id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia, stav)
      VALUES (?, ?, ?, ?, 'email', 'dorucena')
    `, [id_studenta, typ, predmet, obsah]);
  } catch (error) {
    console.error('Chyba pri vytváraní notifikácie:', error);
  }
}

module.exports = router;
