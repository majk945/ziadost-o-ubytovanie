const express = require('express');
const router = express.Router();
const db = require('../config/database');

// P2.1 - Podanie odvolania
router.post('/', async (req, res) => {
  try {
    const { id_ziadosti, dovod, id_administratora } = req.body;

    // Validácia
    if (!id_ziadosti || !dovod) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['id_ziadosti', 'dovod']
      });
    }

    // Kontrola či žiadosť existuje a je zamietnutá
    const [ziadost] = await db.query(
      'SELECT * FROM ziadost WHERE id_ziadosti = ?',
      [id_ziadosti]
    );

    if (ziadost.length === 0) {
      return res.status(404).json({ error: 'Žiadosť nenájdená' });
    }

    // Vytvorenie odvolania
    const [result] = await db.query(`
      INSERT INTO odvolanie (id_ziadosti, id_administratora, dovod, aktualny_stav)
      VALUES (?, ?, ?, 'podane')
    `, [id_ziadosti, id_administratora || 1, dovod]);

    const id_odvolania = result.insertId;

    // P2.4 - Validácia odvolania
    await validateOdvolanie(id_odvolania);

    // Aktualizácia stavu žiadosti
    await db.query(
      'UPDATE ziadost SET aktualny_stav = "na_odvolanie" WHERE id_ziadosti = ?',
      [id_ziadosti]
    );

    // Notifikácia
    const id_studenta = ziadost[0].id_studenta;
    await createNotification(id_studenta, 'podanie_odvolania',
      'Potvrdenie podania odvolania',
      `Vaše odvolanie č. ${id_odvolania} bolo úspešne podané.`);

    res.status(201).json({
      success: true,
      message: 'Odvolanie bolo úspešne podané',
      id_odvolania: id_odvolania
    });

  } catch (error) {
    console.error('Chyba pri vytváraní odvolania:', error);
    res.status(500).json({ 
      error: 'Chyba pri vytváraní odvolania',
      details: error.message 
    });
  }
});

// P2.2 - Zobrazenie odvolania
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [odvolania] = await db.query(`
      SELECT 
        o.*,
        z.id_studenta,
        z.akademicky_rok,
        s.meno,
        s.priezvisko,
        s.email,
        a.meno as admin_meno,
        a.priezvisko as admin_priezvisko
      FROM odvolanie o
      JOIN ziadost z ON o.id_ziadosti = z.id_ziadosti
      JOIN student s ON z.id_studenta = s.id_studenta
      LEFT JOIN administrator a ON o.id_administratora = a.id_administratora
      WHERE o.id_odvolania = ?
    `, [id]);

    if (odvolania.length === 0) {
      return res.status(404).json({ error: 'Odvolanie nenájdené' });
    }

    res.json(odvolania[0]);

  } catch (error) {
    console.error('Chyba pri načítaní odvolania:', error);
    res.status(500).json({ 
      error: 'Chyba pri načítaní odvolania',
      details: error.message 
    });
  }
});

// P2.2 - Zobrazenie všetkých odvolaní študenta
router.get('/student/:id_studenta', async (req, res) => {
  try {
    const { id_studenta } = req.params;

    const [odvolania] = await db.query(`
      SELECT o.*, z.akademicky_rok
      FROM odvolanie o
      JOIN ziadost z ON o.id_ziadosti = z.id_ziadosti
      WHERE z.id_studenta = ?
      ORDER BY o.datum_podania DESC
    `, [id_studenta]);

    res.json(odvolania);

  } catch (error) {
    console.error('Chyba pri načítaní odvolaní:', error);
    res.status(500).json({ 
      error: 'Chyba pri načítaní odvolaní',
      details: error.message 
    });
  }
});

// P2.2 - Zobrazenie všetkých odvolaní (pre administrátora)
router.get('/', async (req, res) => {
  try {
    const { stav } = req.query;

    let query = `
      SELECT 
        o.*,
        z.id_studenta,
        z.akademicky_rok,
        s.meno,
        s.priezvisko,
        s.email
      FROM odvolanie o
      JOIN ziadost z ON o.id_ziadosti = z.id_ziadosti
      JOIN student s ON z.id_studenta = s.id_studenta
    `;

    const params = [];

    if (stav) {
      query += ' WHERE o.aktualny_stav = ?';
      params.push(stav);
    }

    query += ' ORDER BY o.datum_podania DESC';

    const [odvolania] = await db.query(query, params);
    res.json(odvolania);

  } catch (error) {
    console.error('Chyba pri načítaní odvolaní:', error);
    res.status(500).json({ 
      error: 'Chyba pri načítaní odvolaní',
      details: error.message 
    });
  }
});

// P2.3 - Vyhodnotenie odvolania
router.put('/:id/vyhodnotit', async (req, res) => {
  try {
    const { id } = req.params;
    const { rozhodnutie, odovodnenie, id_administratora } = req.body;

    // Validácia
    if (!rozhodnutie || !odovodnenie) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['rozhodnutie', 'odovodnenie']
      });
    }

    // Kontrola či odvolanie existuje
    const [odvolanie] = await db.query(`
      SELECT o.*, z.id_studenta
      FROM odvolanie o
      JOIN ziadost z ON o.id_ziadosti = z.id_ziadosti
      WHERE o.id_odvolania = ?
    `, [id]);

    if (odvolanie.length === 0) {
      return res.status(404).json({ error: 'Odvolanie nenájdené' });
    }

    const data = odvolanie[0];

    // Určenie nového stavu
    const novyStav = rozhodnutie === 'schvalene' ? 'schvalene' : 'zamietnute';

    // Aktualizácia odvolania
    await db.query(`
      UPDATE odvolanie 
      SET aktualny_stav = ?, 
          rozhodnutie = ?, 
          odovodnenie = ?,
          datum_rozhodnutia = NOW(),
          id_administratora = ?
      WHERE id_odvolania = ?
    `, [novyStav, rozhodnutie, odovodnenie, id_administratora || 1, id]);

    // Ak je odvolanie schválené, aktualizuj žiadosť
    if (rozhodnutie === 'schvalene') {
      await db.query(
        'UPDATE ziadost SET aktualny_stav = "schvalena" WHERE id_ziadosti = ?',
        [data.id_ziadosti]
      );
    } else {
      await db.query(
        'UPDATE ziadost SET aktualny_stav = "zamietnuta" WHERE id_ziadosti = ?',
        [data.id_ziadosti]
      );
    }

    // Notifikácia študentovi
    await createNotification(data.id_studenta, 'vyhodnotenie_odvolania',
      'Výsledok odvolania',
      `Vaše odvolanie č. ${id} bolo ${rozhodnutie === 'schvalene' ? 'schválené' : 'zamietnuté'}. Odôvodnenie: ${odovodnenie}`);

    res.json({
      success: true,
      message: 'Odvolanie bolo úspešne vyhodnotené'
    });

  } catch (error) {
    console.error('Chyba pri vyhodnotení odvolania:', error);
    res.status(500).json({ 
      error: 'Chyba pri vyhodnotení odvolania',
      details: error.message 
    });
  }
});

// P2.4 - Validácia odvolania
async function validateOdvolanie(id_odvolania) {
  try {
    const [odvolanie] = await db.query(
      'SELECT * FROM odvolanie WHERE id_odvolania = ?',
      [id_odvolania]
    );

    if (odvolanie.length === 0) {
      throw new Error('Odvolanie nenájdené');
    }

    const data = odvolanie[0];
    let isValid = true;
    const errors = [];

    // Kontrola povinných polí
    if (!data.dovod || data.dovod.trim() === '') {
      errors.push('Chýba dôvod odvolania');
      isValid = false;
    }

    // Aktualizácia stavu validácie
    const newState = isValid ? 'v_spracovani' : 'podane';
    await db.query(
      'UPDATE odvolanie SET aktualny_stav = ? WHERE id_odvolania = ?',
      [newState, id_odvolania]
    );

    return { isValid, errors };

  } catch (error) {
    console.error('Chyba pri validácii odvolania:', error);
    throw error;
  }
}

// Helper funkcia pre notifikácie
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
