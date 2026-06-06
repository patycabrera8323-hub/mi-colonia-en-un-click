// Cloudflare Pages Function: /api/restaurants
// Lee los negocios ACTIVOS directamente de Firebase Firestore
// Colección: 'negocios' (la misma donde el admin da de alta los negocios)

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
 * Convierte el formato de Firestore REST API al formato usado por la app
 */
function firestoreFieldToValue(fieldValue) {
  if (!fieldValue) return null;
  if (fieldValue.stringValue !== undefined) return fieldValue.stringValue;
  if (fieldValue.integerValue !== undefined) return parseInt(fieldValue.integerValue);
  if (fieldValue.doubleValue !== undefined) return parseFloat(fieldValue.doubleValue);
  if (fieldValue.booleanValue !== undefined) return fieldValue.booleanValue;
  if (fieldValue.nullValue !== undefined) return null;
  return null;
}

function firestoreDocToNegocio(doc) {
  const fields = doc.fields || {};
  const id = doc.name.split("/").pop(); // last segment = document ID
  
  return {
    id,
    name:        firestoreFieldToValue(fields.nombre)      || "",
    cuisine:     firestoreFieldToValue(fields.tipo)        || firestoreFieldToValue(fields.categoria) || "general",
    description: firestoreFieldToValue(fields.descripcion) || "",
    rating:      parseFloat(firestoreFieldToValue(fields.calificacion)) || 4.5,
    address:     firestoreFieldToValue(fields.direccion)   || "",
    image:       firestoreFieldToValue(fields.imagen)      || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    phoneNumber: firestoreFieldToValue(fields.telefono)    || "",
    horario:     firestoreFieldToValue(fields.horario)     || "",
    activo:      firestoreFieldToValue(fields.activo),
    categoria:   firestoreFieldToValue(fields.categoria)   || "",
  };
}

export async function onRequestGet(context) {
  try {
    // Lee de la colección 'negocios' - pública (allow read: if true)
    const url = `${FIRESTORE_BASE}/negocios?key=${FIREBASE_API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Firestore respondió con status ${res.status}`);
    }

    const data = await res.json();
    const docs = data.documents || [];

    // Convertir formato Firestore → formato de la app
    const negocios = docs
      .map(firestoreDocToNegocio)
      .filter(n => n.name && n.activo !== false); // Solo activos

    // Si Firebase no devuelve nada, usar fallback mínimo
    if (negocios.length === 0) {
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

    return new Response(JSON.stringify(negocios), { headers: corsHeaders() });

  } catch (err) {
    console.error("Error al leer negocios de Firebase:", err);
    // Devolver array vacío en caso de error para no romper la UI
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: corsHeaders()
    });
  }
}
