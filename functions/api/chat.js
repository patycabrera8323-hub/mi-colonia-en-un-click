// Cloudflare Pages Function: /api/chat
// Gigi - Asistente Virtual de Mi Colonia en un Click
// SISTEMA DUAL: Groq (principal) + Gemini (respaldo automático)
// Los negocios se leen DINÁMICAMENTE desde Firebase Firestore

const FIREBASE_PROJECT = "bot-mi-meracdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;
const FIREBASE_API_KEY = "AIzaSyAtKehXr1_yzMgI2IUFpGces2jjtlvTnns";

// ─────────────────────────────────────────────
// Leer negocios activos desde Firebase
// ─────────────────────────────────────────────
async function fetchNegociosFromFirebase() {
  try {
    const res = await fetch(`${FIRESTORE_BASE}/negocios?key=${FIREBASE_API_KEY}`);
    if (!res.ok) return null;

    const data = await res.json();
    const docs = data.documents || [];

    return docs
      .map((doc) => {
        const f = doc.fields || {};
        const get = (field) => {
          const v = f[field];
          if (!v) return "";
          return v.stringValue ?? v.doubleValue ?? v.integerValue ?? v.booleanValue ?? "";
        };
        return {
          nombre:      get("nombre"),
          tipo:        get("tipo") || get("categoria"),
          descripcion: get("descripcion"),
          direccion:   get("direccion"),
          telefono:    get("telefono"),
          horario:     get("horario"),
          calificacion: parseFloat(f.calificacion?.doubleValue ?? f.calificacion?.integerValue ?? "4.5"),
          activo:      f.activo?.booleanValue !== false,
        };
      })
      .filter(n => n.nombre && n.activo);
  } catch (err) {
    console.warn("No se pudo leer negocios de Firebase:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────
// Construir el system prompt dinámico con negocios reales
// ─────────────────────────────────────────────
function buildSystemPrompt(negocios) {
  let negociosStr = "";

  if (negocios && negocios.length > 0) {
    negociosStr = negocios
      .map((n, i) => {
        const partes = [`${i + 1}. **${n.nombre}**`];
        if (n.tipo) partes.push(`(${n.tipo})`);
        if (n.calificacion) partes.push(`⭐${n.calificacion}`);
        if (n.direccion) partes.push(`| ${n.direccion}`);
        if (n.telefono) partes.push(`| Tel: ${n.telefono}`);
        if (n.horario) partes.push(`| ${n.horario}`);
        return partes.join(" ");
      })
      .join("\n");
  } else {
    // Fallback si Firebase no responde
    negociosStr = `1. Tacos El Güero (mexicana) ⭐4.8 | Av. Juventud #123 | Tel:555-019-1234
2. La Piazza Bella (italiana) ⭐4.6 | Calle Los Pinos #456 | Tel:555-019-5678
3. Burger & Co. Craft (hamburguesas) ⭐4.7 | Blvd. Margaritas #789 | Tel:555-019-9012
4. Cafetería La Selva (café) ⭐4.5 | Av. Lázaro Cárdenas #321 | Tel:555-019-3344
5. Sabor de Asia (asiática) ⭐4.4 | Calle Palmas #202 | Tel:555-019-5566`;
  }

  return `Eres Gigi, asistente de "Mi Colonia en un Click". Responde SIEMPRE en español mexicano, alegre y breve (máximo 3 oraciones). Usa: "¡Hola vecino!", "¡Órale!", "¡Ándale!".

Negocios disponibles en la colonia:
${negociosStr}

Para reservas pide: negocio, personas, fecha y hora. Genera código 5 dígitos al confirmar.`;
}

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

// ─────────────────────────────────────────────
// 🟢 PROVEEDOR 1: GROQ  (llama-3.1-8b-instant)
// ─────────────────────────────────────────────
async function callGroq(apiKey, messages) {
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens: 350,
      temperature: 0.7,
      stream: false
    })
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw { status: resp.status, message: `Groq error ${resp.status}: ${err}` };
  }

  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw { status: 500, message: "Groq no devolvió texto" };
  return text;
}

// ─────────────────────────────────────────────
// 🔵 PROVEEDOR 2: GEMINI  (gemini-2.0-flash-lite)
// ─────────────────────────────────────────────
async function callGemini(apiKey, messages, systemPrompt) {
  // Convertir formato OpenAI → formato Gemini
  const contents = [];
  let lastRole = null;

  for (const m of messages) {
    if (m.role === "system") continue;
    const role = m.role === "user" ? "user" : "model";
    if (role === lastRole && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += " " + m.content;
    } else {
      contents.push({ role, parts: [{ text: m.content }] });
      lastRole = role;
    }
  }

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 350 }
      })
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    throw { status: resp.status, message: `Gemini error ${resp.status}: ${err}` };
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw { status: 500, message: "Gemini no devolvió texto" };
  return text;
}

// ─────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const GROQ_API_KEY   = env.GROQ_API_KEY;
    const GEMINI_API_KEY = env.GEMINI_API_KEY;

    if (!GROQ_API_KEY && !GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          text: "⚠️ Hola vecino, falta configurar las claves de IA. Avísale al administrador.",
          mcpLogs: [{ type: "error", message: "❌ Sin API keys configuradas.", timestamp: Date.now() }],
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { message, history } = body;

    // 🔥 Leer negocios en tiempo real desde Firebase
    const negocios = await fetchNegociosFromFirebase();
    const SYSTEM_PROMPT = buildSystemPrompt(negocios);

    // Construir historial
    const messages = [{ role: "system", content: SYSTEM_PROMPT }];
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
    messages.push({ role: "user", content: message });

    let responseText = null;
    const logs = [];
    let providerUsed = "";

    // 🟢 Intentar con GROQ primero
    if (GROQ_API_KEY) {
      try {
        responseText = await callGroq(GROQ_API_KEY, messages);
        providerUsed = "Groq 🟢";
        logs.push({ type: "info", message: `✅ Groq OK. Negocios en BD: ${negocios ? negocios.length : "N/A"}`, timestamp: Date.now() });
      } catch (groqErr) {
        logs.push({ type: "warn", message: `⚠️ Groq falló: ${groqErr.message}. Cambiando a Gemini...`, timestamp: Date.now() });
        console.warn("Groq failed, trying Gemini:", groqErr.message);
      }
    }

    // 🔵 Si Groq falló, intentar con GEMINI como respaldo
    if (!responseText && GEMINI_API_KEY) {
      try {
        responseText = await callGemini(GEMINI_API_KEY, messages, SYSTEM_PROMPT);
        providerUsed = "Gemini 🔵";
        logs.push({ type: "info", message: "✅ Respuesta de Gemini (respaldo activado).", timestamp: Date.now() });
      } catch (geminiErr) {
        logs.push({ type: "error", message: `❌ Gemini también falló: ${geminiErr.message}`, timestamp: Date.now() });
        console.error("Both APIs failed:", geminiErr.message);
      }
    }

    // ❌ Ambos fallaron
    if (!responseText) {
      return new Response(
        JSON.stringify({
          text: "😅 ¡Híjole vecino! Gigi está muy ocupada en este momento. ¡Intenta en unos minutitos por favor! 🙏",
          mcpLogs: logs,
          booking: null
        }),
        { status: 200, headers: corsHeaders() }
      );
    }

    logs.push({ type: "info", message: `🤖 ${providerUsed} | ${responseText.length} chars | ${negocios ? negocios.length : 0} negocios en BD`, timestamp: Date.now() });

    return new Response(
      JSON.stringify({ text: responseText, mcpLogs: logs, booking: null }),
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
