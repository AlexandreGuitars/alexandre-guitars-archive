# Workshop Records — integração Pages CMS

Esta atualização conecta os arquivos `content/workshop/*.md` publicados no Pages CMS ao site público.

## Fluxo

Pages CMS → `content/workshop/*.md` → GitHub Actions → `assets/data/workshop-records.json` → `assets/js/workshop-records-cms.js` → páginas públicas.

## O que foi adicionado

- `tools/build-workshop-records-data.js`
- `.github/workflows/build-workshop-records-data.yml`
- `assets/data/workshop-records.json`
- `assets/js/workshop-records-cms.js`
- `records/workshop/index.html`

## O que foi substituído

- `series/workshop-records.html`

## Importante

O arquivo `content/workshop/ag-wr-002.md` continua sendo controlado pelo Pages CMS. Não é necessário substituir esse Markdown pelo HTML.

O registro deve estar com `status: published` para entrar no JSON público.

## No VS Code

1. Copie os arquivos desta pasta para a raiz do repositório `AlexandreGuitars/alexandre-guitars-archive`.
2. Não apague a pasta `content/workshop/` nem os arquivos do Pages CMS que já existem no seu repositório.
3. Faça commit e push.
4. No GitHub, abra Actions e confirme `Build Workshop Records data`.
5. Depois do workflow, confira `assets/data/workshop-records.json`.
6. Acesse `/series/workshop-records.html`.
7. O registro individual usa `/records/workshop/index.html?ref=AG-WR-002`.

## Novo registro

Depois disso, o fluxo normal será apenas:

Pages CMS → criar/editar `content/workshop/AG-WR-XXX.md` → `status: published` → salvar → GitHub Actions atualiza o JSON → publicação aparece automaticamente.
