// Cloudflare Pages Function: /api/restaurants
// Lee negocios de Firebase:
//   1. Colección 'negocios' (negocios dados de alta manualmente o sincronizados desde admin)
//   2. Colección 'users' (negocios autorizados que se registraron en el panel de admin)
// Combina ambas fuentes para el catálogo

const FIREBASE_PROJECT = "bot-mi-meracdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents`;
const FIREBASE_API_KEY = "AIzaSyAtKehXr1_yzMgI2IUFpGces2jjtlvTnns";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

/**
 * Extrae el valor de un campo Firestore REST
 */
function getFieldValue(fieldValue) {
  if (!fieldValue) return null;
  if (fieldValue.stringValue !== undefined) return fieldValue.stringValue;
  if (fieldValue.integerValue !== undefined) return parseInt(fieldValue.integerValue);
  if (fieldValue.doubleValue !== undefined) return parseFloat(fieldValue.doubleValue);
  if (fieldValue.booleanValue !== undefined) return fieldValue.booleanValue;
  return null;
}

/**
 * Convierte un documento de 'negocios' al formato de la app
 */
function negocioDocToCard(doc) {
  const f = doc.fields || {};
  const id = doc.name.split("/").pop();
  const activo = getFieldValue(f.activo);
  if (activo === false) return null; // excluir inactivos

  return {
    id,
    name:        getFieldValue(f.nombre)      || "",
    cuisine:     (getFieldValue(f.tipo)        || getFieldValue(f.categoria) || "general").toLowerCase(),
    description: getFieldValue(f.descripcion) || "",
    rating:      parseFloat(getFieldValue(f.calificacion) ?? 4.5),
    address:     getFieldValue(f.direccion)   || "",
    image:       getFieldValue(f.imagen)      || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    phoneNumber: getFieldValue(f.telefono)    || "",
    horario:     getFieldValue(f.horario)     || "",
  };
}

/**
 * Convierte un documento de 'users' al formato de la app
 * Solo incluye usuarios autorizados con nombre de negocio
 */
function userDocToCard(doc) {
  const f = doc.fields || {};
  const id = doc.name.split("/").pop();
  
  const isAuthorized = getFieldValue(f.isAuthorized);
  const businessName = getFieldValue(f.businessName);
  
  // Solo comercios autorizados y con nombre de negocio
  if (!isAuthorized || !businessName || businessName.trim() === "") return null;
  // Excluir al admin principal
  const email = getFieldValue(f.email) || "";
  if (email === "searmoco@gmail.com") return null;

  return {
    id:          `user_${id}`,
    name:        businessName,
    cuisine:     (getFieldValue(f.businessType) || getFieldValue(f.category) || "comercio").toLowerCase(),
    description: getFieldValue(f.description)  || `Negocio local de la colonia: ${businessName}`,
    rating:      4.5,
    address:     getFieldValue(f.location)     || getFieldValue(f.address) || "",
    image:       getFieldValue(f.logoUrl)      || getFieldValue(f.imagen)  || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    phoneNumber: getFieldValue(f.phone)        || "",
    horario:     getFieldValue(f.horario)      || "",
  };
}

export async function onRequestGet() {
  try {
    // Leer ambas colecciones en paralelo
    const [negociosRes, usersRes] = await Promise.allSettled([
      fetch(`${FIRESTORE_BASE}/negocios?key=${FIREBASE_API_KEY}`),
      fetch(`${FIRESTORE_BASE}/users?key=${FIREBASE_API_KEY}`)
    ]);

    const allNegocios = [];
    const seenNames = new Set(); // evitar duplicados si ya fue sincronizado

    // Procesar colección 'negocios'
    if (negociosRes.status === "fulfilled" && negociosRes.value.ok) {
      const data = await negociosRes.value.json();
      for (const doc of (data.documents || [])) {
        const card = negocioDocToCard(doc);
        if (card && card.name) {
          allNegocios.push(card);
          seenNames.add(card.name.toLowerCase().trim());
        }
      }
    }

    // Procesar colección 'users' (comercios autorizados que no estén ya en negocios)
    if (usersRes.status === "fulfilled" && usersRes.value.ok) {
      const data = await usersRes.value.json();
      for (const doc of (data.documents || [])) {
        const card = userDocToCard(doc);
        if (card && card.name) {
          const nameLower = card.name.toLowerCase().trim();
          // Solo agregar si no hay ya un negocio con ese nombre en la colección negocios
          if (!seenNames.has(nameLower)) {
            allNegocios.push(card);
            seenNames.add(nameLower);
          }
        }
      }
    }

    // Si no hay nada, devolver fallback mínimo
    if (allNegocios.length === 0) {
      return new Response(JSON.stringify([
        {
          id: "fallback_1",
          name: "Tacos El Güero",
          cuisine: "mexicana",
          description: "Los mejores tacos al pastor y de asada de la zona.",
          rating: 4.8,
          address: "Av. de la Juventud #123, Sector Centro",
          image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
          phoneNumber: "555-019-1234"
        }
      ]), { headers: corsHeaders() });
    }

    return new Response(JSON.stringify(allNegocios), { headers: corsHeaders() });

  } catch (err) {
    console.error("Error al leer negocios:", err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: corsHeaders()
    });
  }
}
