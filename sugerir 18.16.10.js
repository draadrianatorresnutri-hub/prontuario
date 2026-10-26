// Netlify Function: recebe o contexto clínico e devolve a sugestão da IA.
// A chave fica na variável de ambiente ANTHROPIC_API_KEY (nunca no HTML).
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Método não permitido' };
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { statusCode: 500, body: 'Chave não configurada' };
  let prompt = '';
  try { prompt = String(JSON.parse(event.body || '{}').prompt || '').slice(0, 6000); }
  catch (e) { return { statusCode: 400, body: 'Requisição inválida' }; }
  if (!prompt) return { statusCode: 400, body: 'Sem conteúdo' };
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 900,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) return { statusCode: 502, body: 'Falha na API' };
    const j = await r.json();
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) };
  } catch (e) { return { statusCode: 502, body: 'Erro ao chamar a API' }; }
};
