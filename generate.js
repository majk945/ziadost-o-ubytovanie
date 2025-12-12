const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');

// Definícia všetkých 20 minišpecifikácií
const minispecifikacie = [
  // P1 - Správa žiadostí
  {
    id: 'P1.1',
    nazov: 'Podanie žiadosti o ubytovanie',
    vstupneToky: ['ID študenta', 'Akademický rok', 'Typ izby', 'Lokalita (voliteľné)'],
    meneneTab: ['ziadost', 'hodnotenie', 'notifikacia'],
    scenar: 'Študent vyplní formulár žiadosti → Systém validuje údaje → Vypočítajú sa body podľa kritérií → Pridelí sa poradie → Vytvorí sa notifikácia',
    test: 'Vytvoriť žiadosť pre študenta ID=1, rok 2024/2025 → Over vytvorenie záznamu v DB → Over výpočet bodov → Over notifikáciu'
  },
  {
    id: 'P1.2',
    nazov: 'Zobrazenie stavu žiadosti a poradia',
    vstupneToky: ['ID žiadosti'],
    meneneTab: [],
    scenar: 'Študent zobrazí detail žiadosti → Systém načíta žiadosť s hodnoteniami → Zobrazí body, poradie, stav',
    test: 'Načítať žiadosť ID=1 → Over zobrazenie bodov → Over zobrazenie poradia → Over rozpis hodnotení'
  },
  {
    id: 'P1.3',
    nazov: 'Úprava žiadosti',
    vstupneToky: ['ID žiadosti', 'Typ izby', 'Lokalita'],
    meneneTab: ['ziadost', 'hodnotenie'],
    scenar: 'Študent zmení údaje žiadosti → Systém validuje zmeny → Prepočítajú sa body → Aktualizuje sa poradie',
    test: 'Upraviť žiadosť ID=1, zmeniť typ izby → Over aktualizáciu v DB → Over prepočet bodov'
  },
  {
    id: 'P1.4',
    nazov: 'Validácia žiadosti',
    vstupneToky: ['Dáta žiadosti'],
    meneneTab: ['ziadost'],
    scenar: 'Systém skontroluje povinné polia → Validuje formát údajov → Zmení stav žiadosti',
    test: 'Odoslať žiadosť s prázdnymi poľami → Over chybovú hlášku → Odoslať platnú žiadosť → Over úspech'
  },

  // P2 - Správa odvolaní
  {
    id: 'P2.1',
    nazov: 'Podanie odvolania',
    vstupneToky: ['ID žiadosti', 'Dôvod odvolania'],
    meneneTab: ['odvolanie', 'ziadost', 'notifikacia'],
    scenar: 'Študent podá odvolanie na zamietnutú žiadosť → Systém validuje dôvod (min. 50 znakov) → Vytvorí záznam → Zmení stav žiadosti',
    test: 'Vytvoriť odvolanie pre žiadosť ID=1 → Over vytvorenie záznamu → Over zmenu stavu žiadosti → Over notifikáciu'
  },
  {
    id: 'P2.2',
    nazov: 'Zobrazenie odvolaní',
    vstupneToky: ['ID študenta', 'Filter stavu'],
    meneneTab: [],
    scenar: 'Administrátor/študent zobrazí zoznam odvolaní → Systém načíta odvolania podľa filtra → Zobrazí detaily',
    test: 'Načítať odvolania študenta ID=1 → Over počet záznamov → Filtrovať podľa stavu "podane" → Over výsledky'
  },
  {
    id: 'P2.3',
    nazov: 'Vyhodnotenie odvolania',
    vstupneToky: ['ID odvolania', 'Rozhodnutie (schválené/zamietnuté)', 'Poznámka'],
    meneneTab: ['odvolanie', 'ziadost', 'notifikacia'],
    scenar: 'Administrátor vyhodnotí odvolanie → Systém aktualizuje stav odvolania → Zmení stav žiadosti podľa rozhodnutia → Vytvorí notifikáciu',
    test: 'Schváliť odvolanie ID=1 → Over zmenu stavu odvolania → Over zmenu stavu žiadosti → Over notifikáciu'
  },
  {
    id: 'P2.4',
    nazov: 'Validácia odvolania',
    vstupneToky: ['Dáta odvolania'],
    meneneTab: ['odvolanie'],
    scenar: 'Systém validuje dôvod odvolania (min. 50 znakov) → Kontroluje či je žiadosť zamietnutá',
    test: 'Podať odvolanie s krátkym dôvodom → Over chybu → Podať na neschválenú žiadosť → Over chybu'
  },

  // P3 - Hodnotenie žiadostí
  {
    id: 'P3.1',
    nazov: 'Správa kritérií hodnotenia',
    vstupneToky: ['Názov kritéria', 'Popis', 'Váha (%)', 'Stav'],
    meneneTab: ['kriterium_hodnotenia', 'hodnotenie'],
    scenar: 'Administrátor vytvorí/upraví kritérium → Systém validuje súčet váh (max 100%) → Pri zmene prepočíta všetky žiadosti',
    test: 'Vytvoriť kritérium s váhou 30% → Over validáciu súčtu váh → Zmeniť váhu → Over prepočet žiadostí'
  },
  {
    id: 'P3.2',
    nazov: 'Výpočet bodov podľa kritérií',
    vstupneToky: ['ID žiadosti', 'Dáta študenta'],
    meneneTab: ['hodnotenie', 'ziadost'],
    scenar: 'Systém vypočíta body pre každé kritérium → Váži body podľa váhy kritérií → Sčíta celkové body',
    test: 'Vytvoriť žiadosť → Over výpočet pre prospech (4.0-priemer)*25 → Over výpočet pre ročník → Over súčet'
  },
  {
    id: 'P3.3',
    nazov: 'Aktualizácia poradia',
    vstupneToky: ['Akademický rok'],
    meneneTab: ['ziadost'],
    scenar: 'Systém zoradí žiadosti podľa bodov zostupne → Pridelí poradové čísla',
    test: 'Vytvoriť 3 žiadosti s rôznymi bodmi → Over poradie (najviac bodov = 1) → Zmeniť body → Over prepočet'
  },

  // P4 - Administrácia
  {
    id: 'P4.1',
    nazov: 'Automatické vyhodnotenie žiadostí',
    vstupneToky: ['Akademický rok', 'Kapacita (počet miest)'],
    meneneTab: ['ziadost'],
    scenar: 'Administrátor spustí vyhodnotenie → Systém zoradí žiadosti podľa bodov → Prvých N žiadostí označí ako schválené',
    test: 'Vyhodnotiť pre kapacitu 2 → Over že top 2 žiadosti majú odporúčanie "schválená" → Over ostatné "zamietnutá"'
  },
  {
    id: 'P4.2',
    nazov: 'Manuálne schválenie výsledkov',
    vstupneToky: ['Zoznam rozhodnutí (ID žiadosti + rozhodnutie)'],
    meneneTab: ['ziadost', 'notifikacia'],
    scenar: 'Administrátor schváli výsledky → Systém aktualizuje stavy žiadostí → Vytvorí notifikácie pre všetkých študentov',
    test: 'Schváliť 2 žiadosti, zamietnuť 1 → Over zmenu stavov → Over vytvorenie 3 notifikácií'
  },
  {
    id: 'P4.3',
    nazov: 'Pridelenie miestností',
    vstupneToky: ['Akademický rok'],
    meneneTab: ['ziadost', 'miestnost', 'notifikacia'],
    scenar: 'Administrátor spustí pridelenie → Systém nájde schválené žiadosti → Pridelí voľné miestnosti podľa preferencií → Aktualizuje kapacity',
    test: 'Prideliť miestnosti pre 2 schválené žiadosti → Over pridelenie ID miestnosti → Over zníženie kapacity → Over notifikácie'
  },

  // P5 - Autentifikácia
  {
    id: 'P5.1',
    nazov: 'Overenie totožnosti študenta (SSO)',
    vstupneToky: ['Email študenta'],
    meneneTab: [],
    scenar: 'Študent zadá univerzitný email → Systém overí existenciu v databáze → Vráti údaje študenta',
    test: 'Prihlásiť sa emailom peter.novak@student.sk → Over úspešné prihlásenie → Skúsiť neexistujúci email → Over chybu'
  },
  {
    id: 'P5.2',
    nazov: 'Načítanie údajov študenta',
    vstupneToky: ['ID študenta'],
    meneneTab: [],
    scenar: 'Systém načíta profil študenta z databázy → Vráti všetky údaje',
    test: 'Načítať študenta ID=1 → Over meno, email, program, ročník, priemer'
  },
  {
    id: 'P5.3',
    nazov: 'Aktualizácia údajov študenta',
    vstupneToky: ['ID študenta', 'Študijný priemer', 'Vzdialenosť', 'Sociálna situácia'],
    meneneTab: ['student', 'hodnotenie'],
    scenar: 'Študent aktualizuje svoje údaje → Systém uloží zmeny → Prepočíta body všetkých žiadostí študenta',
    test: 'Zmeniť priemer študenta ID=1 z 2.0 na 1.5 → Over aktualizáciu → Over prepočet bodov žiadostí'
  },

  // P6 - Notifikácie
  {
    id: 'P6.1',
    nazov: 'Vytvorenie notifikácie',
    vstupneToky: ['ID študenta', 'Typ notifikácie', 'Predmet', 'Obsah'],
    meneneTab: ['notifikacia'],
    scenar: 'Systém vytvorí notifikáciu pri dôležitej udalosti → Uloží do databázy → Označí ako "odoslaná"',
    test: 'Vytvoriť notifikáciu pre študenta ID=1 → Over vytvorenie záznamu → Over typ a obsah'
  },
  {
    id: 'P6.2',
    nazov: 'Zobrazenie notifikácií študenta',
    vstupneToky: ['ID študenta'],
    meneneTab: [],
    scenar: 'Študent zobrazí svoje notifikácie → Systém načíta všetky notifikácie → Zobrazí chronologicky',
    test: 'Načítať notifikácie študenta ID=1 → Over počet → Over zoradenie podľa dátumu'
  },
  {
    id: 'P6.3',
    nazov: 'Aktualizácia stavu notifikácie',
    vstupneToky: ['ID notifikácie', 'Nový stav'],
    meneneTab: ['notifikacia'],
    scenar: 'Systém zmení stav notifikácie (odoslaná → doručená)',
    test: 'Zmeniť stav notifikácie ID=1 na "dorucena" → Over aktualizáciu v DB'
  }
];

// Funkcia na vytvorenie tabuľky pre minišpecifikáciu
function createMinispecTable(minispec) {
  // Štýl buniek
  const headerCellOptions = {
    shading: { fill: "D9D9D9" },
    margins: { top: 100, bottom: 100, left: 100, right: 100 }
  };

  const cellOptions = {
    margins: { top: 100, bottom: 100, left: 100, right: 100 }
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
    },
    rows: [
      // Riadok 1: Názov minišpecifikácie
      new TableRow({
        children: [
          new TableCell({
            ...headerCellOptions,
            width: { size: 25, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Položka", bold: true })] 
            })]
          }),
          new TableCell({
            ...headerCellOptions,
            width: { size: 75, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Obsah", bold: true })] 
            })]
          })
        ]
      }),

      // Riadok 2: Názov minišpecifikácie
      new TableRow({
        children: [
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Názov minišpecifikácie", bold: true })] 
            })]
          }),
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: `${minispec.id} - ${minispec.nazov}` })] 
            })]
          })
        ]
      }),

      // Riadok 3: Vstupné dátové toky
      new TableRow({
        children: [
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Vstupné dátové toky do implementácie", bold: true })] 
            })]
          }),
          new TableCell({
            ...cellOptions,
            children: minispec.vstupneToky.map(tok => 
              new Paragraph({ children: [new TextRun({ text: tok })] })
            )
          })
        ]
      }),

      // Riadok 4: Menené tabuľky
      new TableRow({
        children: [
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Menené tabuľky", bold: true })] 
            })]
          }),
          new TableCell({
            ...cellOptions,
            children: minispec.meneneTab.length > 0 
              ? minispec.meneneTab.map(tab => 
                  new Paragraph({ children: [new TextRun({ text: tab })] })
                )
              : [new Paragraph({ children: [new TextRun({ text: "—" })] })]
          })
        ]
      }),

      // Riadok 5: Používateľský scenár
      new TableRow({
        children: [
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Používateľský scenár", bold: true })] 
            })]
          }),
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: minispec.scenar })] 
            })]
          })
        ]
      }),

      // Riadok 6: Testovací prípad
      new TableRow({
        children: [
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: "Testovací prípad", bold: true })] 
            })]
          }),
          new TableCell({
            ...cellOptions,
            children: [new Paragraph({ 
              children: [new TextRun({ text: minispec.test })] 
            })]
          })
        ]
      })
    ]
  });
}

// Vytvorenie dokumentu
const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Titulka
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({ 
            text: "Mapovanie minišpecifikácií", 
            bold: true, 
            size: 32 
          })
        ]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
        children: [
          new TextRun({ 
            text: "Aplikácia: Žiadosť o ubytovanie - OnlineIntrak.sk", 
            size: 24 
          })
        ]
      }),

      // Generovanie tabuľiek pre všetky minišpecifikácie
      ...minispecifikacie.flatMap((minispec, index) => [
        // Nadpis minišpecifikácie
        new Paragraph({
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ 
              text: `${minispec.id} - ${minispec.nazov}`, 
              bold: true, 
              size: 28 
            })
          ]
        }),

        // Tabuľka
        createMinispecTable(minispec),

        // Medzera na screenshot
        new Paragraph({
          spacing: { before: 200, after: 200 },
          children: [
            new TextRun({ 
              text: "[Sem vlož screenshot funkcionality]", 
              italics: true,
              color: "808080"
            })
          ]
        }),

        // Oddelovač medzi minišpecifikáciami
        ...(index < minispecifikacie.length - 1 ? [
          new Paragraph({
            spacing: { before: 400, after: 400 },
            children: [new TextRun({ text: "" })]
          })
        ] : [])
      ])
    ]
  }]
});

// Uloženie dokumentu
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("C:/Users/Majk/Desktop/Tabulky_Mapovani_Minispecifikacii.docx", buffer);
  console.log("✅ Dokument vytvorený: Tabulky_Mapovani_Minispecifikacii.docx");
}).catch(error => {
  console.error("❌ Chyba pri vytváraní dokumentu:", error);
});    