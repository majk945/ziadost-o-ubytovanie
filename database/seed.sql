USE ubytovanie_db;

-- Testovací administrátor
INSERT INTO administrator (meno, priezvisko, email, heslo, opravnenia) VALUES
('Ján', 'Horváth', 'admin@university.sk', '$2b$10$abcdefghijklmnopqrstuv', 'admin'),
('Mária', 'Nováková', 'maria.novakova@university.sk', '$2b$10$abcdefghijklmnopqrstuv', 'spravca');

-- Testovacie internáty
INSERT INTO internat (nazov, adresa, celkova_kapacita, volna_kapacita) VALUES
('Mladá garda', 'Mlynská dolina 1, Bratislava', 450, 120),
('Družba', 'Mlynská dolina 2, Bratislava', 380, 95),
('Ľudovít Štúr', 'Mlynská dolina 3, Bratislava', 320, 80);

-- Testovacie miestnosti
INSERT INTO miestnost (id_internatu, cislo_izby, poschodie, celkova_kapacita, volna_kapacita, pocet_obsadenych_miest) VALUES
(1, '101', 1, 2, 2, 0),
(1, '102', 1, 2, 1, 1),
(1, '201', 2, 3, 3, 0),
(2, '101', 1, 2, 0, 2),
(2, '102', 1, 2, 2, 0);

-- Testovacie kritériá hodnotenia
INSERT INTO kriterium_hodnotenia (id_administratora, nazov, popis, bodova_hodnota, vaha_percent, typ_kriteria, stav) VALUES
(1, 'Akademický prospech', 'Hodnotenie na základe študijného priemeru', 100, 50.00, 'automaticke', 'aktivne'),
(1, 'Ročník štúdia', 'Priorita podľa ročníka', 100, 20.00, 'automaticke', 'aktivne'),
(1, 'Sociálne zázemie', 'Hodnotenie sociálnej situácie', 110, 20.00, 'manualne', 'aktivne'),
(1, 'Zdravotný stav', 'Zdravotné znevýhodnenie', 100, 10.00, 'manualne', 'aktivne');

-- Testovacie študenti
INSERT INTO student (meno, priezvisko, email, kod_programu, nazov_programu, rocnik, studijny_priemer, vzdialenost_v_km, socialna_situacia, prijem_rodiny, pocet_clenov_domacnosti, zdravotne_znevyhodnenie) VALUES
('Peter', 'Novák', 'peter.novak@student.sk', 'INF', 'Informatika', '3', 1.50, 150, 'standardna', 1200.00, 4, FALSE),
('Jana', 'Kováčová', 'jana.kovacova@student.sk', 'MAT', 'Matematika', '2', 1.80, 80, 'znizeny_prijem', 450.00, 5, FALSE),
('Martin', 'Varga', 'martin.varga@student.sk', 'FYZ', 'Fyzika', '4', 1.30, 200, 'standardna', 1500.00, 3, TRUE),
('Lucia', 'Moravčíková', 'lucia.moravcikova@student.sk', 'INF', 'Informatika', '1', 2.20, 30, 'sirota', 200.00, 2, FALSE),
('Tomáš', 'Baláž', 'tomas.balaz@student.sk', 'CHE', 'Chémia', '5', 1.20, 120, 'standardna', 2000.00, 4, FALSE);

-- Testovacie žiadosti
INSERT INTO ziadost (id_studenta, akademicky_rok, typ_izby, lokalita, aktualny_stav, celkovy_pocet_bodov) VALUES
(1, '2024/2025', 'dvojlozkova', 'Mladá garda', 'v_spracovani', 75.50),
(2, '2024/2025', 'dvojlozkova', 'Družba', 'v_spracovani', 68.20),
(3, '2024/2025', 'jednolozkova', 'Mladá garda', 'v_spracovani', 88.70),
(4, '2024/2025', 'dvojlozkova', NULL, 'nova', 0),
(5, '2024/2025', 'dvojlozkova', 'Ľudovít Štúr', 'v_spracovani', 92.30);

-- Testovacie hodnotenia
INSERT INTO hodnotenie (id_ziadosti, id_kriterium, bodova_hodnota) VALUES
(1, 1, 80.00),
(1, 2, 60.00),
(1, 3, 15.00),
(1, 4, 0.00),
(2, 1, 65.00),
(2, 2, 40.00),
(2, 3, 50.00),
(2, 4, 0.00),
(3, 1, 90.00),
(3, 2, 80.00),
(3, 3, 15.00),
(3, 4, 30.00);

-- Testovacie notifikácie
INSERT INTO notifikacia (id_studenta, typ_notifikacie, predmet, obsah, sposob_dorucenia, stav) VALUES
(1, 'schvalenie_ziadosti', 'Potvrdenie prijatia žiadosti', 'Vaša žiadosť o ubytovanie bola úspešne prijatá.', 'email', 'dorucena'),
(2, 'zmena_stavu', 'Zmena stavu žiadosti', 'Stav vašej žiadosti sa zmenil na: V spracovaní', 'email', 'dorucena');
