const KEYS = {
  gemini: process.env.GEMINI_API_KEY || '',
  claude: process.env.CLAUDE_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
};

exports.handler = async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json({});
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const input = JSON.parse(event.body || '{}');

    if (input.action === 'transcribe') {
      if (!KEYS.openai) throw new Error('OPENAI_API_KEY nao configurada na Netlify');
      const transcript = await transcribeAudio(input.audioData || '', input.audioMime || 'audio/webm');
      return json({ transcript });
    }

    const provider = input.provider || '';
    if (!['gemini', 'claude', 'openai'].includes(provider)) {
      throw new Error('Provider invalido. Use gemini, claude ou openai.');
    }
    if (!KEYS[provider]) {
      throw new Error(`${provider.toUpperCase()}_API_KEY nao configurada na Netlify`);
    }

    let reply = '';
    if (provider === 'gemini') reply = await callGemini(input);
    if (provider === 'claude') reply = await callClaude(input);
    if (provider === 'openai') reply = await callOpenAI(input);

    return json({ reply });
  } catch (error) {
    return json({ error: error.message || 'Erro na IA' }, 500);
  }
};

async function callGemini(input) {
  const model = input.model || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${KEYS.gemini}`;

  let system = '';
  const contents = [];
  for (const msg of input.messages || []) {
    if (msg.role === 'system') {
      system = msg.content || '';
      continue;
    }
    const parts = [];
    if (msg.image) parts.push({ inlineData: { mimeType: msg.image.mimeType, data: msg.image.data } });
    if (msg.audio) parts.push({ inlineData: { mimeType: msg.audio.mimeType, data: msg.audio.data } });
    parts.push({ text: msg.content || '' });
    contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts });
  }

  const body = {
    contents,
    generationConfig: {
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxTokens ?? 2048,
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  const data = await postJson(url, body);
  if (data.error) throw new Error(data.error.message || 'Erro Gemini');
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callClaude(input) {
  const model = input.model || 'claude-sonnet-4-5-20250929';
  let system = '';
  const messages = [];

  for (const msg of input.messages || []) {
    if (msg.role === 'system') {
      system = msg.content || '';
      continue;
    }
    const content = [];
    if (msg.image) {
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: msg.image.mimeType,
          data: msg.image.data,
        },
      });
    }
    content.push({ type: 'text', text: msg.content || '' });
    messages.push({ role: msg.role, content });
  }

  const body = {
    model,
    messages,
    max_tokens: input.maxTokens ?? 2048,
    temperature: input.temperature ?? 0.7,
  };
  if (system) body.system = system;

  const data = await postJson('https://api.anthropic.com/v1/messages', body, {
    'x-api-key': KEYS.claude,
    'anthropic-version': '2023-06-01',
  });
  if (data.error) throw new Error(data.error.message || 'Erro Claude');
  return data.content?.[0]?.text || '';
}

async function callOpenAI(input) {
  const model = input.model || 'gpt-4o-mini';
  const messages = (input.messages || []).map((msg) => {
    if (!msg.image) return { role: msg.role, content: msg.content || '' };
    return {
      role: msg.role,
      content: [
        { type: 'text', text: msg.content || '' },
        { type: 'image_url', image_url: { url: `data:${msg.image.mimeType};base64,${msg.image.data}` } },
      ],
    };
  });

  const data = await postJson('https://api.openai.com/v1/chat/completions', {
    model,
    messages,
    max_tokens: input.maxTokens ?? 2048,
    temperature: input.temperature ?? 0.7,
  }, {
    Authorization: `Bearer ${KEYS.openai}`,
  });
  if (data.error) throw new Error(data.error.message || 'Erro OpenAI');
  return data.choices?.[0]?.message?.content || '';
}

async function transcribeAudio(base64Audio, mimeType) {
  const audioBuffer = Buffer.from(base64Audio, 'base64');
  const ext = (mimeType.split('/')[1] || 'webm').split(';')[0];
  const body = new FormData();
  body.append('file', new Blob([audioBuffer], { type: mimeType }), `audio.${ext}`);
  body.append('model', 'whisper-1');
  body.append('language', 'pt');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEYS.openai}` },
    body,
  });
  const data = await response.json();
  if (!response.ok || data.error) throw new Error(data.error?.message || 'Erro Whisper');
  return data.text || '';
}

async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Erro HTTP');
  return data;
}

function json(body, statusCode = 200) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
