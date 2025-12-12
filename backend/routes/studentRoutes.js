const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Získanie všetkých študentov
router.get('/', async (req, res) => {
  try {
    const [students] = await db.query('SELECT * FROM student ORDER BY priezvisko, meno');
    res.json(students);
  } catch (error) {
    console.error('Chyba pri načítaní študentov:', error);
    res.status(500).json({ error: 'Chyba pri načítaní študentov', details: error.message });
  }
});

// Získanie jedného študenta
router.get('/:id', async (req, res) => {
  try {
    const [students] = await db.query('SELECT * FROM student WHERE id_studenta = ?', [req.params.id]);
    
    if (students.length === 0) {
      return res.status(404).json({ error: 'Študent nenájdený' });
    }
    
    res.json(students[0]);
  } catch (error) {
    console.error('Chyba pri načítaní študenta:', error);
    res.status(500).json({ error: 'Chyba pri načítaní študenta', details: error.message });
  }
});

// P5.1, P5.2 - Overenie identity a načítanie údajov (simulované SSO)
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email je povinný' });
    }

    const [students] = await db.query('SELECT * FROM student WHERE email = ?', [email]);

    if (students.length === 0) {
      return res.status(404).json({ error: 'Študent s týmto emailom nebol nájdený' });
    }

    res.json({
      success: true,
      student: students[0],
      message: 'Prihlásenie úspešné'
    });

  } catch (error) {
    console.error('Chyba pri prihlásení:', error);
    res.status(500).json({ error: 'Chyba pri prihlásení', details: error.message });
  }
});

// P5.3 - Aktualizácia údajov študenta
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const values = [];

    // Zoznam povolených polí na aktualizáciu
    const allowedFields = ['studijny_priemer', 'vzdialenost_v_km', 'socialna_situacia', 
                           'prijem_rodiny', 'pocet_clenov_domacnosti', 'zdravotne_znevyhodnenie'];

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
      `UPDATE student SET ${updateFields.join(', ')} WHERE id_studenta = ?`,
      values
    );

    res.json({ success: true, message: 'Údaje študenta boli aktualizované' });

  } catch (error) {
    console.error('Chyba pri aktualizácii študenta:', error);
    res.status(500).json({ error: 'Chyba pri aktualizácii', details: error.message });
  }
});

module.exports = router;
