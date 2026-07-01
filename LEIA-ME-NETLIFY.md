# CRM GH - Netlify

Use esta versao para publicar na Netlify com IA segura.

## Estrutura

- `public/index.html`: site publico.
- `netlify/functions/ai.js`: funcao segura de IA.
- `netlify/functions/ai-status.js`: verifica quais providers estao configurados.
- `netlify.toml`: configura `public` como pasta publicada e `netlify/functions` como pasta de funcoes.

## Variaveis de ambiente

Configure uma ou mais variaveis no painel da Netlify:

```txt
GEMINI_API_KEY
CLAUDE_API_KEY
OPENAI_API_KEY
```

Depois de configurar, faca um novo deploy.

## URL correta de teste

Use:

```txt
https://SEU-SITE.netlify.app/.netlify/functions/ai-status
```

Nao use:

```txt
https://SEU-SITE.netlify.app/netlify/functions/ai-status.js
```

Esse segundo caminho e arquivo-fonte, nao a funcao executada.
