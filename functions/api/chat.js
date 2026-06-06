// Cloudflare Pages Function: /api/chat
// Gigi - Asistente Virtual de Mi Colonia en un Click
// OPTIMIZADO: mínimo uso de tokens

// System prompt compacto (ahorra ~60% tokens vs versión anterior)
const SYSTEM_PROMPT = `Eres Gigi, asistente de "Mi Colonia en un Click". Responde SIEMPRE en español mexicano, alegre y breve (máx 3 oraciones). Usa: "¡Hola vecino!", "¡Órale!", "¡Ándale!".

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
    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          text: "⚠️ Hola vecino, falta configurar la clave de IA. Avísale al administrador.",
          mcpLogs: [{ type: "error", message: "❌ GEMINI_API_KEY no configurada.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { message, history } = body;

    // Solo últimos 4 mensajes de historial (ahorra tokens)
    const contents = [];
    let lastRole = null;

    if (history && Array.isArray(history)) {
      for (const h of history.slice(-4)) {
        if (h.text && h.text.trim()) {
          const role = h.sender === "user" ? "user" : "model";
          if (role === lastRole && contents.length > 0) {
            contents[contents.length - 1].parts[0].text += " " + h.text;
          } else {
            contents.push({ role, parts: [{ text: h.text }] });
            lastRole = role;
          }
        }
      }
    }

    // Agregar mensaje actual
    if (lastRole === "user" && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += " " + message;
    } else {
      contents.push({ role: "user", parts: [{ text: message }] });
    }

    // Gemini 2.0 Flash Lite - menor cuota consumida
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 350,  // Reducido de 1024 → 350
          topP: 0.9
        }
      })
    });

    if (!geminiResp.ok) {
      const errorBody = await geminiResp.text();
      let errorDetail = errorBody;
      try {
        const errJson = JSON.parse(errorBody);
        if (errJson?.error?.message) errorDetail = errJson.error.message;
      } catch(_) {}

      if (geminiResp.status === 429) {
        return new Response(
          JSON.stringify({
            text: "😅 ¡Híjole vecino! Gigi necesita un descansito, se llenó de mensajes por hoy. ¡Intenta en unos minutitos! 🙏",
            mcpLogs: [{ type: "warn", message: "⚠️ Cuota Gemini excedida (429).", timestamp: Date.now() }],
            booking: null
          }),
          { status: 200, headers: corsHeaders() }
        );
      }

      return new Response(
        JSON.stringify({
          text: `⚠️ ¡Ay vecino! Error ${geminiResp.status} con la IA. Intenta de nuevo.`,
          mcpLogs: [{ type: "error", message: `❌ Gemini ${geminiResp.status}: ${errorDetail}`, timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const geminiData = await geminiResp.json();
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      return new Response(
        JSON.stringify({
          text: "¡Hola vecino! No pude responder ahora. ¿Repites tu pregunta? 😊",
          mcpLogs: [{ type: "warn", message: "⚠️ Gemini no devolvió texto.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    return new Response(
      JSON.stringify({
        text: responseText,
        mcpLogs: [{ type: "info", message: `✅ Respuesta generada (${responseText.length} chars).`, timestamp: Date.now() }],
        booking: null
      }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        text: "¡Uy vecino! Algo salió mal. Intenta de nuevo en un momento. 🙏",
        mcpLogs: [{ type: "error", message: `❌ Error: ${err.message}`, timestamp: Date.now() }],
        booking: null
      }),
      { status: 200, headers: corsHeaders() }
    );
  }
}
