const express = require('express');
const router = express.Router();
const db = require('../config/database');

// P6.1, P6.2 - Získanie notifikácií študenta
router.get('/student/:id_studenta', async (req, res) => {
  try {
    const { id_studenta } = req.params;

    const [notifikacie] = await db.query(`
      SELECT * FROM notifikacia 
      WHERE id_studenta = ? 
      ORDER BY datum_odoslania DESC
    `, [id_studenta]);

    res.json(notifikacie);

  } catch (error) {
    console.error('Chyba pri načítaní notifikácií:', error);
    res.status(500).json({ error: 'Chyba pri načítaní notifikácií', details: error.message });
  }
});

// P6.1 - Vytvorenie notifikácie
router.post('/', async (req, res) => {
  try {
    const { 
      id_studenta, 
      typ_notifikacie, 
      predmet, 
      obsah,
      sposob_dorucenia 
    } = req.body;

    if (!id_studenta || !typ_notifikacie || !predmet || !obsah) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['id_studenta', 'typ_notifikacie', 'predmet', 'obsah']
      });
    }

    // P6.1 - Vytvorenie notifikácie
    const [result] = await db.query(`
      INSERT INTO notifikacia 
      (id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia, stav)
      VALUES (?, ?, ?, ?, ?, 'odoslana')
    `, [id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia || 'email']);

    const id_notifikacie = result.insertId;

    // P6.2 - Simulácia odoslania (v reálnej aplikácii by tu bol email service)
    // P6.3 - Spracovanie stavu
    setTimeout(async () => {
      try {
        await db.query(
          'UPDATE notifikacia SET stav = "dorucena" WHERE id_notifikacie = ?',
          [id_notifikacie]
        );
      } catch (error) {
        console.error('Chyba pri aktualizácii stavu notifikácie:', error);
      }
    }, 1000);

    res.status(201).json({
      success: true,
      message: 'Notifikácia bola vytvorená a odoslaná',
      id_notifikacie: id_notifikacie
    });

  } catch (error) {
    console.error('Chyba pri vytváraní notifikácie:', error);
    res.status(500).json({ error: 'Chyba pri vytváraní notifikácie', details: error.message });
  }
});

// P6.3 - Aktualizácia stavu notifikácie
router.patch('/:id/stav', async (req, res) => {
  try {
    const { id } = req.params;
    const { stav } = req.body;

    if (!stav || !['odoslana', 'dorucena', 'chyba'].includes(stav)) {
      return res.status(400).json({ 
        error: 'Neplatný stav',
        allowed: ['odoslana', 'dorucena', 'chyba']
      });
    }

    await db.query(
      'UPDATE notifikacia SET stav = ? WHERE id_notifikacie = ?',
      [stav, id]
    );

    res.json({ 
      success: true, 
      message: 'Stav notifikácie bol aktualizovaný' 
    });

  } catch (error) {
    console.error('Chyba pri aktualizácii stavu notifikácie:', error);
    res.status(500).json({ error: 'Chyba pri aktualizácii stavu', details: error.message });
  }
});

// Získanie všetkých notifikácií (pre administrátora)
router.get('/', async (req, res) => {
  try {
    const { stav } = req.query;

    let query = `
      SELECT 
        n.*,
        s.meno,
        s.priezvisko,
        s.email as student_email
      FROM notifikacia n
      JOIN student s ON n.id_studenta = s.id_studenta
    `;

    const params = [];

    if (stav) {
      query += ' WHERE n.stav = ?';
      params.push(stav);
    }

    query += ' ORDER BY n.datum_odoslania DESC';

    const [notifikacie] = await db.query(query, params);
    res.json(notifikacie);

  } catch (error) {
    console.error('Chyba pri načítaní notifikácií:', error);
    res.status(500).json({ error: 'Chyba pri načítaní notifikácií', details: error.message });
  }
});

module.exports = router;
