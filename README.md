# Padronização de Logos – Instituições Financeiras (BR)

Utilitário minimalista para **baixar** e **padronizar** logos de instituições financeiras brasileiras a partir de um arquivo JSON.

Gera logos consistentes para uso em apps e dashboards, mantendo **proporção**, **centralização** e **fundo transparente**.

---

## O que faz

- Lê `instituicoes-br.json`
- Baixa logos via `downloadUrl`
- Padroniza para:
  - PNG
  - 512×512
  - transparente
  - `contain` (sem distorção) + padding
- Salva em `./logos`
- Gera `instituicoes-br.padrao.json` com `localPath`
- Processa **apenas as logos que ainda não existem** (por padrão)

---

## Estrutura

├─ `instituicoes-br.json`

├─ `instituicoes-br.padrao.json`

├─ `padronizar-logos.mjs`

├─ `logos/`

└─ `package.json`

## Requisitos

Node.js 18+
npm

## Instalação

`npm install`

## Uso
```
node padronizar-logos.mjs
```

## Saídas:

./logos/<id>.png

instituicoes-br.padrao.json

## Reprocessar tudo (opcional)
No padronizar-logos.mjs, altere: 

```
const FORCE_REPROCESS = true;
```

## Formato do JSON (exemplo)
```
{
  "id": "brb",
  "name": "BRB",
  "category": "bank",
  "website": "https://www.brb.com.br",
  "logo": {
    "source": "wikimedia_commons",
    "filePage": "https://commons.wikimedia.org/wiki/File:BRB_Logo.png",
    "downloadUrl": "https://commons.wikimedia.org/wiki/Special:FilePath/BRB_Logo.png",
    "localPath": null
  }
}
```

## Observações
- Logos e marcas pertencem aos seus respectivos proprietários.
- Este projeto organiza e padroniza imagens para identificação visual.

```
::contentReference[oaicite:0]{index=0}
```
