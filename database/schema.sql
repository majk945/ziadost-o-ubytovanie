-- Vytvorenie databázy
CREATE DATABASE IF NOT EXISTS ubytovanie_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ubytovanie_db;

-- 1. Tabuľka Student (D1)
CREATE TABLE IF NOT EXISTS student (
    id_studenta INT(10) AUTO_INCREMENT PRIMARY KEY,
    meno VARCHAR(50) NOT NULL,
    priezvisko VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    kod_programu VARCHAR(20) NOT NULL,
    nazov_programu VARCHAR(100) NOT NULL,
    rocnik ENUM('1', '2', '3', '4', '5') NOT NULL,
    datum_registracie DATETIME DEFAULT CURRENT_TIMESTAMP,
    studijny_priemer DECIMAL(3,2) CHECK (studijny_priemer BETWEEN 1.0 AND 4.0),
    vzdialenost_v_km INT(4) CHECK (vzdialenost_v_km >= 0),
    socialna_situacia ENUM('standardna', 'znizeny_prijem', 'sirota', 'detsky_domov', 'invalidny_rodic', 'ine') DEFAULT 'standardna',
    prijem_rodiny DECIMAL(10,2) CHECK (prijem_rodiny >= 0),
    pocet_clenov_domacnosti INT(2) CHECK (pocet_clenov_domacnosti > 0),
    zdravotne_znevyhodnenie BOOLEAN DEFAULT FALSE,
    INDEX idx_email (email),
    INDEX idx_rocnik (rocnik)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabuľka Internat (D8)
CREATE TABLE IF NOT EXISTS internat (
    id_internatu INT(10) AUTO_INCREMENT PRIMARY KEY,
    nazov VARCHAR(100) NOT NULL,
    adresa VARCHAR(200),
    celkova_kapacita INT(5) NOT NULL,
    volna_kapacita INT(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabuľka Miestnost (D6)
CREATE TABLE IF NOT EXISTS miestnost (
    id_miestnosti INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_internatu INT(10) NOT NULL,
    cislo_izby VARCHAR(10) NOT NULL,
    poschodie INT(2),
    celkova_kapacita INT(1) NOT NULL,
    volna_kapacita INT(1) NOT NULL,
    pocet_obsadenych_miest INT(1) DEFAULT 0,
    FOREIGN KEY (id_internatu) REFERENCES internat(id_internatu) ON DELETE CASCADE,
    INDEX idx_internat (id_internatu),
    UNIQUE KEY unique_miestnost (id_internatu, cislo_izby)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabuľka Notifikacia (D7)
CREATE TABLE IF NOT EXISTS notifikacia (
    id_notifikacie INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_studenta INT(10) NOT NULL,
    typ_notifikacie VARCHAR(50) NOT NULL,
    predmet VARCHAR(200) NOT NULL,
    obsah TEXT NOT NULL,
    datum_odoslania DATETIME DEFAULT CURRENT_TIMESTAMP,
    sposob_dorucenia ENUM('email', 'sms', 'system') DEFAULT 'email',
    stav ENUM('odoslana', 'dorucena', 'chyba') DEFAULT 'odoslana',
    FOREIGN KEY (id_studenta) REFERENCES student(id_studenta) ON DELETE CASCADE,
    INDEX idx_student (id_studenta),
    INDEX idx_datum (datum_odoslania)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabuľka Administrator (D8)
CREATE TABLE IF NOT EXISTS administrator (
    id_administratora INT(10) AUTO_INCREMENT PRIMARY KEY,
    meno VARCHAR(50) NOT NULL,
    priezvisko VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    heslo VARCHAR(255) NOT NULL,
    opravnenia VARCHAR(100) NOT NULL,
    datum_vytvorenia DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabuľka Ziadost (D2)
CREATE TABLE IF NOT EXISTS ziadost (
    id_ziadosti INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_studenta INT(10) NOT NULL,
    datum_podania DATETIME DEFAULT CURRENT_TIMESTAMP,
    akademicky_rok VARCHAR(9) NOT NULL,
    typ_izby ENUM('jednolozkova', 'dvojlozkova', 'trojlozkova', 'stvorlozkova') DEFAULT 'dvojlozkova',
    lokalita VARCHAR(100),
    aktualny_stav ENUM('nova', 'v_spracovani', 'vyhodnotena', 'schvalena', 'zamietnuta', 'na_odvolanie', 'pridelena', 'zrusena', 'expirovana') DEFAULT 'nova',
    celkovy_pocet_bodov DECIMAL(6,2) DEFAULT 0,
    poradove_cislo INT(10),
    id_miestnosti INT(10) DEFAULT NULL,
    datum_pridelenia DATETIME DEFAULT NULL,
    stav VARCHAR(50),
    FOREIGN KEY (id_studenta) REFERENCES student(id_studenta) ON DELETE CASCADE,
    FOREIGN KEY (id_miestnosti) REFERENCES miestnost(id_miestnosti) ON DELETE SET NULL,
    INDEX idx_stav (aktualny_stav),
    INDEX idx_rok (akademicky_rok),
    INDEX idx_poradie (poradove_cislo),
    UNIQUE KEY unique_student_rok (id_studenta, akademicky_rok)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tabuľka Odvolanie (D3)
CREATE TABLE IF NOT EXISTS odvolanie (
    id_odvolania INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_ziadosti INT(10) NOT NULL,
    id_administratora INT(10) NOT NULL,
    dovod TEXT NOT NULL,
    datum_podania DATETIME DEFAULT CURRENT_TIMESTAMP,
    aktualny_stav ENUM('podane', 'v_spracovani', 'schvalene', 'zamietnute') DEFAULT 'podane',
    rozhodnutie TEXT,
    odovodnenie TEXT,
    datum_rozhodnutia DATETIME DEFAULT NULL,
    FOREIGN KEY (id_ziadosti) REFERENCES ziadost(id_ziadosti) ON DELETE CASCADE,
    FOREIGN KEY (id_administratora) REFERENCES administrator(id_administratora) ON DELETE CASCADE,
    INDEX idx_ziadost (id_ziadosti),
    INDEX idx_admin (id_administratora),
    INDEX idx_stav (aktualny_stav)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Tabuľka Priloha (D9)
CREATE TABLE IF NOT EXISTS priloha (
    id_prilohy INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_ziadosti INT(10) NOT NULL,
    id_odvolania_nullable INT(10) DEFAULT NULL,
    nazov_suboru VARCHAR(255) NOT NULL,
    typ_suboru VARCHAR(50) NOT NULL,
    velkost_suboru BIGINT NOT NULL,
    datum_nahratia DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ziadosti) REFERENCES ziadost(id_ziadosti) ON DELETE CASCADE,
    FOREIGN KEY (id_odvolania_nullable) REFERENCES odvolanie(id_odvolania) ON DELETE CASCADE,
    INDEX idx_ziadost (id_ziadosti),
    INDEX idx_odvolanie (id_odvolania_nullable)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tabuľka Kriterium_hodnotenia (D5)
CREATE TABLE IF NOT EXISTS kriterium_hodnotenia (
    id_kriterium INT(10) AUTO_INCREMENT PRIMARY KEY,
    id_administratora INT(10) NOT NULL,
    nazov VARCHAR(100) NOT NULL,
    popis TEXT,
    bodova_hodnota DECIMAL(5,2) NOT NULL,
    vaha_percent DECIMAL(5,2) NOT NULL,
    typ_kriteria VARCHAR(50) NOT NULL,
    vzorec TEXT,
    stav ENUM('aktivne', 'neaktivne') DEFAULT 'aktivne',
    datum_vytvorenia DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_administratora) REFERENCES administrator(id_administratora) ON DELETE CASCADE,
    INDEX idx_admin (id_administratora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Tabuľka Hodnotenie (D4)
CREATE TABLE IF NOT EXISTS hodnotenie (
    id_ziadosti INT(10) NOT NULL,
    id_kriterium INT(10) NOT NULL,
    bodova_hodnota DECIMAL(5,2) NOT NULL,
    datum_vyhodnotenia DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_ziadosti, id_kriterium),
    FOREIGN KEY (id_ziadosti) REFERENCES ziadost(id_ziadosti) ON DELETE CASCADE,
    FOREIGN KEY (id_kriterium) REFERENCES kriterium_hodnotenia(id_kriterium) ON DELETE CASCADE,
    INDEX idx_ziadost (id_ziadosti),
    INDEX idx_kriterium (id_kriterium)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
