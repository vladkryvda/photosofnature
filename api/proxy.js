// api/proxy.js
// Це твій бекенд. Vercel автоматично перетворює цей файл на сервер.
// Він приймає запит з фронтенду, додає секретний ключ, питає у ШІ і повертає відповідь.

export default async function handler(req, res) {
  // Дозволяємо запити тільки методом POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Тільки POST запити' });
  }

  const { message, model } = req.body;

  if (!message || !model) {
    return res.status(400).json({ error: 'Немає message або model' });
  }

  try {
    let reply = '';

    // ───────────────────────────────
    // CLAUDE (Anthropic)
    // ───────────────────────────────
    if (model === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.CLAUDE_KEY,       // ключ з Vercel Environment Variables
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: message }],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Claude API error');
      reply = data.content[0].text;
    }

    // ───────────────────────────────
    // GEMINI (Google)
    // ───────────────────────────────
    else if (model === 'gemini') {
      const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Gemini API error');
      reply = data.candidates[0].content.parts[0].text;
    }

    // ───────────────────────────────
    // GROK (xAI)
    // ───────────────────────────────
    else if (model === 'grok') {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROK_KEY}`,  // ключ з Vercel Environment Variables
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-3',
          messages: [{ role: 'user', content: message }],
          max_tokens: 1024,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Grok API error');
      reply = data.choices[0].message.content;
    }

    else {
      return res.status(400).json({ error: 'Невідома модель: ' + model });
    }

    // Повертаємо відповідь на фронтенд
    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
