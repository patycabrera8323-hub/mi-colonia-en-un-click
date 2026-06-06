// Cloudflare Pages Function: /api/chat
// Gigi - Asistente Virtual de Mi Colonia en un Click
// USANDO GROQ API - Gratuito, 14,400 req/día, ultra rápido

const SYSTEM_PROMPT = `Eres Gigi, asistente de "Mi Colonia en un Click". Responde SIEMPRE en español mexicano, alegre y breve (máximo 3 oraciones). Usa: "¡Hola vecino!", "¡Órale!", "¡Ándale!".

Restaurantes disponibles:
1. Tacos El Güero (mexicana) ⭐4.8 | Av. Juventud #123 | Tel:555-019-1234
2. La Piazza Bella (italiana) ⭐4.6 | Calle Los Pinos #456 | Tel:555-019-5678
3. Burger & Co. Craft (hamburguesas) ⭐4.7 | Blvd. Margaritas #789 | Tel:555-019-9012
4. Cafetería La Selva (café) ⭐4.5 | Av. Lázaro Cárdenas #321 | Tel:555-019-3344
5. Sabor de Asia (asiática) ⭐4.4 | Calle Palmas #202 | Tel:555-019-5566

Para reservas pide: restaurante, personas, fecha y hora. Genera código 5 dígitos al confirmar.`;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const GROQ_API_KEY = env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          text: "⚠️ Hola vecino, falta configurar la clave de Groq IA. Avísale al administrador.",
          mcpLogs: [{ type: "error", message: "❌ GROQ_API_KEY no configurada en Cloudflare.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { message, history } = body;

    // Construir historial de mensajes en formato OpenAI/Groq
    const messages = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Solo últimos 4 mensajes para ahorrar tokens
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-4)) {
        if (h.text && h.text.trim()) {
          messages.push({
            role: h.sender === "user" ? "user" : "assistant",
            content: h.text
          });
        }
      }
    }

    // Agregar mensaje actual del usuario
    messages.push({ role: "user", content: message });

    // Llamar a Groq API (compatible con formato OpenAI)
    const groqResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",  // Ultra rápido y gratuito
        messages,
        max_tokens: 350,
        temperature: 0.7,
        stream: false
      })
    });

    if (!groqResp.ok) {
      const errorBody = await groqResp.text();
      let errorDetail = errorBody;
      try {
        const errJson = JSON.parse(errorBody);
        if (errJson?.error?.message) errorDetail = errJson.error.message;
      } catch(_) {}

      // Cuota excedida
      if (groqResp.status === 429) {
        return new Response(
          JSON.stringify({
            text: "😅 ¡Híjole vecino! Gigi necesita un descansito rapidito. ¡Intenta en unos segundos! 🙏",
            mcpLogs: [{ type: "warn", message: "⚠️ Rate limit de Groq (429). Espera un momento.", timestamp: Date.now() }],
            booking: null
          }),
          { status: 200, headers: corsHeaders() }
        );
      }

      return new Response(
        JSON.stringify({
          text: `⚠️ ¡Ay vecino! Error ${groqResp.status} con la IA. Intenta de nuevo.`,
          mcpLogs: [{ type: "error", message: `❌ Groq API error ${groqResp.status}: ${errorDetail}`, timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const groqData = await groqResp.json();
    const responseText = groqData?.choices?.[0]?.message?.content;

    if (!responseText) {
      return new Response(
        JSON.stringify({
          text: "¡Hola vecino! No pude responder ahora. ¿Repites tu pregunta? 😊",
          mcpLogs: [{ type: "warn", message: "⚠️ Groq no devolvió respuesta.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({
        text: responseText,
        mcpLogs: [{ type: "info", message: `✅ Respuesta de Groq (${responseText.length} chars).`, timestamp: Date.now() }],
        booking: null
      }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        text: "¡Uy vecino! Algo salió mal. Intenta de nuevo en un momento. 🙏",
        mcpLogs: [{ type: "error", message: `❌ Error interno: ${err.message}`, timestamp: Date.now() }],
        booking: null
      }),
      { status: 200, headers: corsHeaders() }
    );
  }
}
