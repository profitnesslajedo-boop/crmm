export default async () => {
  const providers = {
    gemini: Boolean(Netlify.env.get('GEMINI_API_KEY')),
    claude: Boolean(Netlify.env.get('CLAUDE_API_KEY')),
    openai: Boolean(Netlify.env.get('OPENAI_API_KEY')),
  };

  return Response.json({
    available: Object.values(providers).some(Boolean),
    providers,
  }, {
    headers: { 'Cache-Control': 'no-store' },
  });
};

export const config = {
  path: '/ai-status',
};
