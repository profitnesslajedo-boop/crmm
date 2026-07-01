# CRM GH - Netlify Final

Use esta versao para evitar abrir arquivo de function como texto.

## Estrutura obrigatoria na raiz do GitHub

```txt
public/index.html
netlify/functions/ai-status.mjs
netlify/functions/ai.mjs
netlify.toml
package.json
```

## Configuracao Netlify

```txt
Base directory: vazio
Build command: npm run build
Publish directory: public
Functions directory: netlify/functions
```

## OpenAI

Crie esta variavel:

```txt
OPENAI_API_KEY
```

## Teste correto

Use:

```txt
https://SEU-SITE.netlify.app/ai-status
```

Nao use:

```txt
https://SEU-SITE.netlify.app/netlify/functions/ai-status.js
```
