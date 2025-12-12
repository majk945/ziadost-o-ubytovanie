const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Získanie všetkých administrátorov
router.get('/', async (req, res) => {
  try {
    const [admins] = await db.query('SELECT id_administratora, meno, priezvisko, email, opravnenia FROM administrator');
    res.json(admins);
  } catch (error) {
    console.error('Chyba pri načítaní administrátorov:', error);
    res.status(500).json({ error: 'Chyba pri načítaní administrátorov', details: error.message });
  }
});

// P4.1 - Automatické vyhodnotenie žiadostí
router.post('/vyhodnotit', async (req, res) => {
  try {
    const { akademicky_rok, kapacita } = req.body;

    if (!akademicky_rok || !kapacita) {
      return res.status(400).json({ 
        error: 'Chýbajúce povinné údaje',
        required: ['akademicky_rok', 'kapacita']
      });
    }

    // Získanie všetkých žiadostí v spracovaní pre daný akademický rok
    const [ziadosti] = await db.query(`
      SELECT id_ziadosti, id_studenta, celkovy_pocet_bodov, poradove_cislo
      FROM ziadost
      WHERE akademicky_rok = ? 
        AND aktualny_stav = 'v_spracovani'
      ORDER BY celkovy_pocet_bodov DESC, datum_podania ASC
    `, [akademicky_rok]);

    if (ziadosti.length === 0) {
      return res.status(404).json({ error: 'Žiadne žiadosti na vyhodnotenie' });
    }

    const navrhVysledkov = [];
    let schvaleneCount = 0;
    let zamietnute Count = 0;

    // P4.1 - Automatické vyhodnotenie podľa poradia a kapacity
    for (let i = 0; i < ziadosti.length; i++) {
      const ziadost = ziadosti[i];
      let odporucanie;
      
      if (i < kapacita) {
        odporucanie = 'schvalena';
        schvaleneCount++;
      } else {
        odporucanie = 'zamietnuta';
        zamietnuteCount++;
      }

      navrhVysledkov.push({
        id_ziadosti: ziadost.id_ziadosti,
        id_studenta: ziadost.id_studenta,
        bodova_hodnota: ziadost.celkovy_pocet_bodov,
        poradie: i + 1,
        odporucanie: odporucanie
      });
    }

    res.json({
      success: true,
      message: 'Automatické vyhodnotenie dokončené',
      statistics: {
        total: ziadosti.length,
        schvalene: schvaleneCount,
        zamietnute: zamietnuteCount,
        kapacita: kapacita
      },
      navrhVysledkov: navrhVysledkov
    });

  } catch (error) {
    console.error('Chyba pri automatickom vyhodnotení:', error);
    res.status(500).json({ error: 'Chyba pri vyhodnotení', details: error.message });
  }
});

// P4.2 - Manuálne schválenie výsledkov
router.post('/schvalit', async (req, res) => {
  try {
    const { vysledky, id_administratora } = req.body;

    if (!vysledky || !Array.isArray(vysledky)) {
      return res.status(400).json({ error: 'Neplatné údaje. Vysledky musia byť pole.' });
    }

    let schvaleneCount = 0;
    let zamietnuteCount = 0;

    // Aktualizácia stavov žiadostí
    for (const vysledok of vysledky) {
      const { id_ziadosti, rozhodnutie, poznamka } = vysledok;

      if (!id_ziadosti || !rozhodnutie) {
        continue;
      }

      await db.query(
        'UPDATE ziadost SET aktualny_stav = ?, stav = ? WHERE id_ziadosti = ?',
        [rozhodnutie, poznamka || null, id_ziadosti]
      );

      // Získanie študenta pre notifikáciu
      const [ziadost] = await db.query(
        'SELECT id_studenta FROM ziadost WHERE id_ziadosti = ?',
        [id_ziadosti]
      );

      if (ziadost.length > 0) {
        const id_studenta = ziadost[0].id_studenta;

        // Vytvorenie notifikácie
        const obsah = rozhodnutie === 'schvalena' 
          ? 'Gratulujeme! Vaša žiadosť o ubytovanie bola schválená.'
          : 'Bohužiaľ, vaša žiadosť o ubytovanie bola zamietnutá. Môžete podať odvolanie.';

        await db.query(`
          INSERT INTO notifikacia 
          (id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia, stav)
          VALUES (?, ?, ?, ?, 'email', 'dorucena')
        `, [
          id_studenta,
          rozhodnutie === 'schvalena' ? 'schvalenie_ziadosti' : 'zamietnutie_ziadosti',
          'Výsledok žiadosti o ubytovanie',
          obsah
        ]);

        if (rozhodnutie === 'schvalena') {
          schvaleneCount++;
        } else {
          zamietnuteCount++;
        }
      }
    }

    res.json({
      success: true,
      message: 'Výsledky boli schválené a študenti boli informovaní',
      statistics: {
        schvalene: schvaleneCount,
        zamietnute: zamietnuteCount
      }
    });

  } catch (error) {
    console.error('Chyba pri schvaľovaní výsledkov:', error);
    res.status(500).json({ error: 'Chyba pri schvaľovaní', details: error.message });
  }
});

// P4.3 - Pridelenie miestností
router.post('/pridelit-miestnosti', async (req, res) => {
  try {
    const { akademicky_rok } = req.body;

    if (!akademicky_rok) {
      return res.status(400).json({ error: 'Akademický rok je povinný' });
    }

    // Získanie schválených žiadostí
    const [schvaleneZiadosti] = await db.query(`
      SELECT id_ziadosti, id_studenta, typ_izby, lokalita
      FROM ziadost
      WHERE akademicky_rok = ? AND aktualny_stav = 'schvalena'
      ORDER BY poradove_cislo ASC
    `, [akademicky_rok]);

    if (schvaleneZiadosti.length === 0) {
      return res.status(404).json({ error: 'Žiadne schválené žiadosti na pridelenie' });
    }

    let prideleneCount = 0;
    let neprideleneCount = 0;

    for (const ziadost of schvaleneZiadosti) {
      // Hľadanie voľnej miestnosti
      let query = `
        SELECT m.id_miestnosti
        FROM miestnost m
        JOIN internat i ON m.id_internatu = i.id_internatu
        WHERE m.volna_kapacita > 0
      `;

      const params = [];

      // Filtre podľa preferencií
      if (ziadost.lokalita) {
        query += ' AND i.nazov = ?';
        params.push(ziadost.lokalita);
      }

      query += ' ORDER BY m.volna_kapacita DESC LIMIT 1';

      const [volneMiestnosti] = await db.query(query, params);

      if (volneMiestnosti.length > 0) {
        const id_miestnosti = volneMiestnosti[0].id_miestnosti;

        // Pridelenie miestnosti
        await db.query(`
          UPDATE ziadost 
          SET id_miestnosti = ?, 
              aktualny_stav = 'pridelena',
              datum_pridelenia = NOW()
          WHERE id_ziadosti = ?
        `, [id_miestnosti, ziadost.id_ziadosti]);

        // Aktualizácia kapacity miestnosti
        await db.query(`
          UPDATE miestnost 
          SET volna_kapacita = volna_kapacita - 1,
              pocet_obsadenych_miest = pocet_obsadenych_miest + 1
          WHERE id_miestnosti = ?
        `, [id_miestnosti]);

        // Aktualizácia kapacity internátu
        await db.query(`
          UPDATE internat i
          JOIN miestnost m ON i.id_internatu = m.id_internatu
          SET i.volna_kapacita = i.volna_kapacita - 1
          WHERE m.id_miestnosti = ?
        `, [id_miestnosti]);

        // Notifikácia
        await db.query(`
          INSERT INTO notifikacia 
          (id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia, stav)
          VALUES (?, 'pridelenie_miestnosti', 'Pridelenie ubytovania', 
                  'Bola vám pridelená miestnosť na internáte.', 'email', 'dorucena')
        `, [ziadost.id_studenta]);

        prideleneCount++;
      } else {
        neprideleneCount++;
      }
    }

    res.json({
      success: true,
      message: 'Prideľovanie miestností dokončené',
      statistics: {
        total: schvaleneZiadosti.length,
        pridelene: prideleneCount,
        nepridelene: neprideleneCount
      }
    });

  } catch (error) {
    console.error('Chyba pri prideľovaní miestností:', error);
    res.status(500).json({ error: 'Chyba pri prideľovaní', details: error.message });
  }
});

// Získanie prehľadu všetkých žiadostí (pre administrátora)
router.get('/ziadosti', async (req, res) => {
  try {
    const { akademicky_rok, stav } = req.query;

    let query = `
      SELECT 
        z.*,
        s.meno,
        s.priezvisko,
        s.email,
        s.rocnik,
        m.cislo_izby,
        i.nazov as nazov_internatu
      FROM ziadost z
      JOIN student s ON z.id_studenta = s.id_studenta
      LEFT JOIN miestnost m ON z.id_miestnosti = m.id_miestnosti
      LEFT JOIN internat i ON m.id_internatu = i.id_internatu
      WHERE 1=1
    `;

    const params = [];

    if (akademicky_rok) {
      query += ' AND z.akademicky_rok = ?';
      params.push(akademicky_rok);
    }

    if (stav) {
      query += ' AND z.aktualny_stav = ?';
      params.push(stav);
    }

    query += ' ORDER BY z.poradove_cislo ASC, z.datum_podania DESC';

    const [ziadosti] = await db.query(query, params);
    res.json(ziadosti);

  } catch (error) {
    console.error('Chyba pri načítaní žiadostí:', error);
    res.status(500).json({ error: 'Chyba pri načítaní žiadostí', details: error.message });
  }
});

module.exports = router;
