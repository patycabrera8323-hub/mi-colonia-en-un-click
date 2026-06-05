import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header as required
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: GEMINI_API_KEY || "dummy-key-to-prevent-crash",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Seed restaurants data for tools and browse features
const RESTAURANT_DATA = [
  {
    id: "rest_1",
    name: "Tacos El Güero",
    cuisine: "mexicana",
    description: "Los mejores tacos al pastor y de asada de la zona, servidos con cebollitas asadas y salsas caseras picantes.",
    rating: 4.8,
    address: "Av. de la Juventud #123, Sector Centro",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
    phoneNumber: "555-019-1234"
  },
  {
    id: "rest_2",
    name: "La Piazza Bella",
    cuisine: "italiana",
    description: "Deliciosas pizzas elaboradas en horno de piedra y pastas frescas con recetas italianas tradicionales.",
    rating: 4.6,
    address: "Calle Los Pinos #456, Sector Norte",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
    phoneNumber: "555-019-5678"
  },
  {
    id: "rest_3",
    name: "Burger & Co. Craft",
    cuisine: "hamburguesas",
    description: "Hamburguesas de carne de res artesanal premium, papas sazonadas y aderezos de la casa.",
    rating: 4.7,
    address: "Bulevar Margaritas #789, Sector Sur",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    phoneNumber: "555-019-9012"
  },
  {
    id: "rest_4",
    name: "Cafetería La Selva",
    cuisine: "cafeteria",
    description: "Café orgánico cosechado a mano, repostería fina, desayunos tradicionales y un espacio pet-friendly.",
    rating: 4.5,
    address: "Av. Lázaro Cárdenas #321, Sector Centro",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80",
    phoneNumber: "555-019-3344"
  },
  {
    id: "rest_5",
    name: "Sabor de Asia",
    cuisine: "asiatica",
    description: "Especialidades de sushi, ramen tradicional y arroz frito salteado en wok al momento.",
    rating: 4.4,
    address: "Calle de las Palmas #202, Sector Este",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80",
    phoneNumber: "555-019-5566"
  }
];

// Seed trash schedule parameters for garbage status queries
// (Removed legacy neighborhood schedules)

// --- API Endpoints ---

// Explicit API route for listing local restaurants directory in the UI
app.get("/api/restaurants", (req, res) => {
  res.json(RESTAURANT_DATA);
});

// MCP-Style Chat Endpoint with dynamic Tool Execution & Client-side Logging
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Falta configurar la clave GEMINI_API_KEY en los secretos del proyecto."
      });
    }

    const mcpLogs: { type: string; message: string; timestamp: number }[] = [];
    mcpLogs.push({
      type: "info",
      message: "🔌 [MCP] Conectando con el Servidor 'Colonia Bites Gastronomy Gateway v1.1'...",
      timestamp: Date.now()
    });

    // Translate chat history into Gemini contents format
    // Format: Array of { role: 'user' | 'model', parts: [{ text: '...' }] }
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Define function declarations for Local MCP Tools
    const searchRestaurantsTool = {
      name: "search_restaurants",
      description: "Buscar restaurantes locales en el catálogo vecinal por cocina (mexicana, italiana, hamburguesas, cafeteria, asiatica). El catalogo tiene excelentes opciones.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          cuisine: {
            type: Type.STRING,
            description: "El tipo de cocina que busca, por ejemplo: mexicana, italiana, hamburguesas, cafeteria o asiatica."
          }
        }
      }
    };

    const bookTableTool = {
      name: "book_table",
      description: "Reservar una mesa en un restaurante oficial de la colonia en la base de datos de reservas.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          restaurantName: {
            type: Type.STRING,
            description: "Nombre del restaurante donde el usuario desea reservar una mesa."
          },
          partySize: {
            type: Type.INTEGER,
            description: "Número de personas/comensales para la mesa de reserva."
          },
          dateTime: {
            type: Type.STRING,
            description: "Fecha y hora para la reservación (ej. 'Hoy a las 8:00 PM', 'Sábado a las 2:00 PM', o formato fecha 'AAAA-MM-DD HH:MM')."
          },
          specialRequests: {
            type: Type.STRING,
            description: "Peticiones especiales opcionales, como terraza, libre de gluten, silla de bebé, etc."
          }
        },
        required: ["restaurantName", "partySize", "dateTime"]
      }
    };

    const systemInstruction = `Eres un asistente virtual de gastronomía y reservaciones en restaurantes de 'Mi Colonia en un Click'. Usas información de las bases de datos locales para ayudar al usuario de forma rápida y amigable.
Siempre responde con un tono muy alegre, empático, educado y decente, con un marcado y amigable acento mexicano (usando expresiones como "¡Hola, vecino!", "¡Claro que sí!", "¡qué gusto saludarte!", "órale", etc.).
Bajo ninguna circunstancia utilices groserías, vulgaridades o palabras altisonantes. Mantén un lenguaje completamente respetuoso, decente y servicial.
Si el usuario te pide información sobre restaurantes o si desea reservar una mesa, DEBES usar obligatoriamente las herramientas provistas para consultar y registrar las operaciones correspondientes.
Cuando completes una reservación con 'book_table', asegúrate de indicarle al usuario los datos del restaurante, personas, fecha/hora y confirma que se ha guardado exitosamente. Si te preguntan por opciones de cocina o platillos, ofréceles los restaurantes que tenemos pregrabados en el catálogo.`;

    // Make initial generation request
    let response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        tools: [{
          functionDeclarations: [
            searchRestaurantsTool,
            bookTableTool
          ]
        }]
      }
    });

    let finalResponseText = "";
    let detectedBooking: any = null;

    // Check for tool invocations
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      const toolName = call.name;
      const args: any = call.args || {};

      mcpLogs.push({
        type: "tool_call",
        message: `⚙️ [MCP Tool Call] ejecutando herramienta local '${toolName}' con parámetros: ${JSON.stringify(args)}`,
        timestamp: Date.now()
      });

      let toolResult: any = {};

      if (toolName === "search_restaurants") {
        const cuisineFilter = args.cuisine ? args.cuisine.toLowerCase() : "";
        const results = RESTAURANT_DATA.filter(r => 
          !cuisineFilter || r.cuisine.toLowerCase().includes(cuisineFilter) || cuisineFilter.includes(r.cuisine.toLowerCase()) || r.name.toLowerCase().includes(cuisineFilter)
        );
        toolResult = { restaurants: results };
        mcpLogs.push({
          type: "tool_response",
          message: `📦 [MCP Tool Response] Éxito. Encontrados ${results.length} restaurantes para la búsqueda especificada.`,
          timestamp: Date.now()
        });
      } else if (toolName === "book_table") {
        const fakeId = `res_${Math.floor(Math.random() * 89999 + 10000)}`;
        toolResult = {
          success: true,
          bookingId: fakeId,
          restaurantName: args.restaurantName,
          partySize: args.partySize,
          dateTime: args.dateTime,
          specialRequests: args.specialRequests || "Ninguna",
          status: "pending",
          message: `Reservación confirmada exitosamente en la base de datos. Mesa para ${args.partySize} personas en el restaurante '${args.restaurantName}' para la fecha/hora: ${args.dateTime}. ID de Reservación: ${fakeId}.`
        };
        detectedBooking = {
          restaurantName: args.restaurantName,
          partySize: args.partySize,
          dateTime: args.dateTime,
          specialRequests: args.specialRequests || "Ninguna"
        };
        mcpLogs.push({
          type: "tool_response",
          message: `📦 [MCP Tool Response] Reservación con ID ${fakeId} sincronizada en la colección 'reports' de Cloud Firestore.`,
          timestamp: Date.now()
        });
      }

      // Re-generate content to incorporate tool outcomes
      const followUpResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...contents,
          response.candidates?.[0]?.content,
          {
            role: "tool",
            parts: [{
              functionResponse: {
                name: toolName,
                response: toolResult
              }
            }]
          }
        ],
        config: {
          systemInstruction,
          tools: [{
            functionDeclarations: [
              searchRestaurantsTool,
              bookTableTool
            ]
          }]
        }
      });

      finalResponseText = followUpResponse.text || "No se pudo generar una respuesta.";
    } else {
      mcpLogs.push({
        type: "info",
        message: "💡 [MCP Client] Conversando sin llamada directa a bases de datos locales.",
        timestamp: Date.now()
      });
      finalResponseText = response.text || "No se pudo generar una respuesta.";
    }

    res.json({
      text: finalResponseText,
      mcpLogs,
      booking: detectedBooking
    });

  } catch (error: any) {
    console.error("Error en chat API:", error);
    res.status(500).json({
      error: error.message || "Ocurrió un error inesperado al procesar la solicitud del bot."
    });
  }
});

// Configure Vite middleware in development
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running in development on http://localhost:${PORT}`);
    });
  });
} else {
  // Build Static Serving for deployment
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running in production on port ${PORT}`);
  });
}
