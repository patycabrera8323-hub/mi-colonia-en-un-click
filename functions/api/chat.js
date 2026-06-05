// Cloudflare Pages Function: /api/chat
// Gigi - Asistente Virtual de Mi Colonia en un Click

const RESTAURANT_DATA = [
  { id: "rest_1", name: "Tacos El Güero", cuisine: "mexicana", description: "Los mejores tacos al pastor y de asada de la zona.", rating: 4.8, address: "Av. de la Juventud #123, Sector Centro", phoneNumber: "555-019-1234" },
  { id: "rest_2", name: "La Piazza Bella", cuisine: "italiana", description: "Pizzas en horno de piedra y pastas frescas.", rating: 4.6, address: "Calle Los Pinos #456, Sector Norte", phoneNumber: "555-019-5678" },
  { id: "rest_3", name: "Burger & Co. Craft", cuisine: "hamburguesas", description: "Hamburguesas artesanal premium con papas sazonadas.", rating: 4.7, address: "Bulevar Margaritas #789, Sector Sur", phoneNumber: "555-019-9012" },
  { id: "rest_4", name: "Cafetería La Selva", cuisine: "cafeteria", description: "Café orgánico, repostería fina y desayunos tradicionales.", rating: 4.5, address: "Av. Lázaro Cárdenas #321, Sector Centro", phoneNumber: "555-019-3344" },
  { id: "rest_5", name: "Sabor de Asia", cuisine: "asiatica", description: "Sushi, ramen y arroz frito en wok al momento.", rating: 4.4, address: "Calle de las Palmas #202, Sector Este", phoneNumber: "555-019-5566" }
];

const SYSTEM_PROMPT = `Eres Gigi, la asistente virtual alegre y empática de "Mi Colonia en un Click".
Ayudas a los vecinos con información de restaurantes, reservaciones, reportes y negocios locales.
Responde SIEMPRE con un tono muy alegre, empático y amigable con acento mexicano.
Usa expresiones como: "¡Hola, vecino!", "¡Claro que sí!", "¡qué gusto saludarte!", "órale", "¡Con mucho gusto!", "¡Híjole!", "¡Ándale!".
NUNCA uses groserías ni palabras altisonantes. Mantén lenguaje respetuoso y servicial.

Restaurantes disponibles en la colonia:
${RESTAURANT_DATA.map(r => `- ${r.name} (${r.cuisine}): ${r.description} | ${r.address} | Tel: ${r.phoneNumber} | Rating: ${r.rating}/5`).join('\n')}

Cuando alguien pregunte por restaurantes, recomiéndales opciones de la lista anterior.
Cuando quieran hacer una reserva, pide: nombre del restaurante, número de personas, fecha y hora.
Cuando confirmes una reserva, genera un número de confirmación aleatorio de 5 dígitos.`;

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
          text: "⚠️ Hola vecino, hay un pequeño problemita técnico: falta configurar la clave de la IA en el servidor. Avísale al administrador por favor.",
          mcpLogs: [{ type: "error", message: "❌ GEMINI_API_KEY no está configurada en Cloudflare.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { message, history } = body;

    const mcpLogs = [
      { type: "info", message: "🔌 [Gigi] Conectando con el asistente vecinal...", timestamp: Date.now() }
    ];

    // Build conversation contents for Gemini
    const contents = [];

    if (history && Array.isArray(history)) {
      for (const h of history.slice(-8)) { // last 8 messages for context
        if (h.text && h.text.trim()) {
          contents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Call Gemini REST API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
      }
    };

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    if (!geminiResp.ok) {
      const errorBody = await geminiResp.text();
      console.error("Gemini API error:", geminiResp.status, errorBody);
      return new Response(
        JSON.stringify({
          text: `⚠️ ¡Ay, vecino! Hubo un problemita con el servidor de IA (Error ${geminiResp.status}). Intenta de nuevo en un momento.`,
          mcpLogs: [{ type: "error", message: `❌ Gemini API error ${geminiResp.status}: ${errorBody.slice(0, 200)}`, timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const geminiData = await geminiResp.json();

    // Extract text response
    const responseText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      const blockReason = geminiData?.candidates?.[0]?.finishReason || geminiData?.promptFeedback?.blockReason || "unknown";
      return new Response(
        JSON.stringify({
          text: "¡Hola vecino! No pude generar una respuesta en este momento. ¿Puedes intentarlo de nuevo? 😊",
          mcpLogs: [{ type: "warn", message: `⚠️ Gemini no devolvió texto. Razón: ${blockReason}`, timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    // Detect if this is a booking confirmation in the text
    let detectedBooking = null;
    const lowerText = responseText.toLowerCase();
    if ((lowerText.includes("reserva") || lowerText.includes("reservación")) &&
        (lowerText.includes("confirm") || lowerText.includes("lista") || lowerText.includes("guardada") || lowerText.includes("anotada"))) {
      // Extract booking details from the message context if possible
      detectedBooking = null; // Optional: parse from text in the future
    }

    mcpLogs.push({
      type: "info",
      message: `✅ [Gigi] Respuesta generada (${responseText.length} caracteres).`,
      timestamp: Date.now()
    });

    return new Response(
      JSON.stringify({ text: responseText, mcpLogs, booking: detectedBooking }),
      { status: 200, headers: corsHeaders() }
    );

  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({
        text: "¡Uy, vecino! Algo salió mal de nuestro lado. Por favor intenta de nuevo en un momento. 🙏",
        mcpLogs: [{ type: "error", message: `❌ Error interno: ${err.message}`, timestamp: Date.now() }],
        booking: null
      }),
      { status: 200, headers: corsHeaders() }
    );
  }
}
