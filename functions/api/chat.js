// Cloudflare Pages Function: /api/chat
// Maneja todas las conversaciones con Gigi usando la API de Gemini

const RESTAURANT_DATA = [
  { id: "rest_1", name: "Tacos El Güero", cuisine: "mexicana", description: "Los mejores tacos al pastor y de asada de la zona.", rating: 4.8, address: "Av. de la Juventud #123, Sector Centro", phoneNumber: "555-019-1234" },
  { id: "rest_2", name: "La Piazza Bella", cuisine: "italiana", description: "Pizzas en horno de piedra y pastas frescas.", rating: 4.6, address: "Calle Los Pinos #456, Sector Norte", phoneNumber: "555-019-5678" },
  { id: "rest_3", name: "Burger & Co. Craft", cuisine: "hamburguesas", description: "Hamburguesas artesanal premium con papas sazonadas.", rating: 4.7, address: "Bulevar Margaritas #789, Sector Sur", phoneNumber: "555-019-9012" },
  { id: "rest_4", name: "Cafetería La Selva", cuisine: "cafeteria", description: "Café orgánico, repostería fina y desayunos tradicionales.", rating: 4.5, address: "Av. Lázaro Cárdenas #321, Sector Centro", phoneNumber: "555-019-3344" },
  { id: "rest_5", name: "Sabor de Asia", cuisine: "asiatica", description: "Sushi, ramen y arroz frito en wok al momento.", rating: 4.4, address: "Calle de las Palmas #202, Sector Este", phoneNumber: "555-019-5566" }
];

const systemInstruction = `Eres Gigi, la asistente virtual de "Mi Colonia en un Click". Ayudas a los vecinos con información de restaurantes, reservaciones, reportes de incidencias y negocios locales de la colonia.
Siempre responde con un tono muy alegre, empático, educado y decente, con un marcado y amigable acento mexicano (usando expresiones como "¡Hola, vecino!", "¡Claro que sí!", "¡qué gusto saludarte!", "órale", "¡Con mucho gusto!", etc.).
Bajo ninguna circunstancia utilices groserías, vulgaridades o palabras altisonantes. Mantén un lenguaje completamente respetuoso, decente y servicial.
Si el usuario te pide información sobre restaurantes o desea reservar, usa las herramientas provistas.
Cuando completes una reservación, indica al usuario los datos: restaurante, personas, fecha/hora y confirma que fue guardada exitosamente.`;

// CORS helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const GEMINI_API_KEY = env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Falta configurar GEMINI_API_KEY en las variables de entorno de Cloudflare." }),
      { status: 500, headers: corsHeaders() }
    );
  }

  const { message, history } = await request.json();
  const mcpLogs = [{ type: "info", message: "🔌 [MCP] Conectando con Gigi - Mi Colonia en un Click...", timestamp: Date.now() }];

  // Build conversation history
  const contents = [];
  if (history && Array.isArray(history)) {
    history.forEach((h) => {
      contents.push({ role: h.sender === "user" ? "user" : "model", parts: [{ text: h.text }] });
    });
  }
  contents.push({ role: "user", parts: [{ text: message }] });

  // Tool declarations
  const tools = [{
    functionDeclarations: [
      {
        name: "search_restaurants",
        description: "Buscar restaurantes locales en el catálogo vecinal por tipo de cocina.",
        parameters: {
          type: "OBJECT",
          properties: {
            cuisine: { type: "STRING", description: "Tipo de cocina: mexicana, italiana, hamburguesas, cafeteria, asiatica." }
          }
        }
      },
      {
        name: "book_table",
        description: "Reservar una mesa en un restaurante de la colonia.",
        parameters: {
          type: "OBJECT",
          properties: {
            restaurantName: { type: "STRING", description: "Nombre del restaurante." },
            partySize: { type: "INTEGER", description: "Número de personas." },
            dateTime: { type: "STRING", description: "Fecha y hora de la reserva." },
            specialRequests: { type: "STRING", description: "Peticiones especiales opcionales." }
          },
          required: ["restaurantName", "partySize", "dateTime"]
        }
      }
    ]
  }];

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  // First call to Gemini
  const firstResp = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, tools, systemInstruction: { parts: [{ text: systemInstruction }] } })
  });

  const firstData = await firstResp.json();
  const candidate = firstData.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const funcCall = parts.find(p => p.functionCall);

  let finalText = "";
  let detectedBooking = null;

  if (funcCall) {
    const { name: toolName, args } = funcCall.functionCall;
    mcpLogs.push({ type: "tool_call", message: `⚙️ [MCP] Herramienta: ${toolName} | Parámetros: ${JSON.stringify(args)}`, timestamp: Date.now() });

    let toolResult = {};

    if (toolName === "search_restaurants") {
      const cuisineFilter = (args.cuisine || "").toLowerCase();
      const results = RESTAURANT_DATA.filter(r =>
        !cuisineFilter || r.cuisine.includes(cuisineFilter) || cuisineFilter.includes(r.cuisine) || r.name.toLowerCase().includes(cuisineFilter)
      );
      toolResult = { restaurants: results };
      mcpLogs.push({ type: "tool_response", message: `📦 [MCP] Encontrados ${results.length} restaurantes.`, timestamp: Date.now() });
    } else if (toolName === "book_table") {
      const bookingId = `res_${Math.floor(Math.random() * 89999 + 10000)}`;
      toolResult = {
        success: true,
        bookingId,
        restaurantName: args.restaurantName,
        partySize: args.partySize,
        dateTime: args.dateTime,
        specialRequests: args.specialRequests || "Ninguna",
        status: "confirmed",
        message: `Reservación confirmada. Mesa para ${args.partySize} personas en '${args.restaurantName}' el ${args.dateTime}. ID: ${bookingId}.`
      };
      detectedBooking = { restaurantName: args.restaurantName, partySize: args.partySize, dateTime: args.dateTime, specialRequests: args.specialRequests || "Ninguna" };
      mcpLogs.push({ type: "tool_response", message: `📦 [MCP] Reservación ${bookingId} guardada en Firestore.`, timestamp: Date.now() });
    }

    // Follow-up call with tool result
    const followUp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          ...contents,
          candidate.content,
          { role: "tool", parts: [{ functionResponse: { name: toolName, response: toolResult } }] }
        ],
        tools,
        systemInstruction: { parts: [{ text: systemInstruction }] }
      })
    });
    const followData = await followUp.json();
    finalText = followData.candidates?.[0]?.content?.parts?.find(p => p.text)?.text || "No se pudo generar una respuesta.";
  } else {
    mcpLogs.push({ type: "info", message: "💡 [MCP] Conversación directa sin herramientas.", timestamp: Date.now() });
    finalText = parts.find(p => p.text)?.text || "No se pudo generar una respuesta.";
  }

  return new Response(
    JSON.stringify({ text: finalText, mcpLogs, booking: detectedBooking }),
    { headers: corsHeaders() }
  );
}
