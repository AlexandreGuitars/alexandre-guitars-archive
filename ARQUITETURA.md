# Arquitetura — Alexandre Guitars Archive V2.2

```text
archive-v2/
├── index.html
├── manifesto.html
├── assets/
│   ├── css/
│   │   └── archive.css
│   └── img/
│       └── alexandre-guitars-logo.png
├── series/
│   ├── workshop-records.html
│   ├── builders-notes.html
│   ├── golden-era.html
│   ├── material-stories.html
│   └── instrument-heritage.html
├── records/
│   ├── workshop/
│   ├── builders-notes/
│   │   ├── 001-jeff-beck.html
│   │   ├── 002-eric-gales.html
│   │   ├── 003-jaco-pastorius.html
│   │   └── 004-nuno-bettencourt.html
│   ├── golden-era/
│   ├── material-stories/
│   └── instrument-heritage/
└── media/
    ├── workshop/
    ├── builders-notes/
    ├── golden-era/
    ├── material-stories/
    └── instrument-heritage/
```

## Regras

1. Links devem ser relativos para funcionar no Live Server e no GitHub Pages.
2. CSS global fica em `assets/css/archive.css`.
3. Conteúdo real só entra em `records/` quando houver registro produzido/revisado.
4. Pastas de mídia são separadas por série e poderão receber subpastas por registro.
5. O CMS será implementado somente depois que o modelo editorial estiver estabilizado.

## V2.2-C — Workshop Records
- AG-WR-001: `records/workshop/001-fernandes-tanglewood.html`
- Fotos do caso: `media/workshop/`
- Registro estruturado em contexto, nota de construção, antes, oficina, depois e fechamento.
- A Fernandes japonesa é tratada como objeto de preservação; afirmações específicas de modelo, madeira ou fábrica não são feitas sem documentação adicional.
