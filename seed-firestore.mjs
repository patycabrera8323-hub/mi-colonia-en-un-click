/**
 * seed-firestore.mjs
 * Script para poblar las colecciones iniciales de Firestore
 * para "Mi Colonia en un Click".
 *
 * Uso:
 *   node seed-firestore.mjs
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// ── Configuración de Firebase (proyecto bot-mi-meracdo) ──────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAtKehXr1_yzMgI2IUFpGces2jjtlvTnns",
  authDomain: "bot-mi-meracdo.firebaseapp.com",
  projectId: "bot-mi-meracdo",
  storageBucket: "bot-mi-meracdo.firebasestorage.app",
  messagingSenderId: "546185138119",
  appId: "1:546185138119:web:c949138bafd737955113e2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── HELPERS ──────────────────────────────────────────────────────────────────
async function seed(collectionName, documents) {
  console.log(`\n🌱 Poblando colección: ${collectionName}`);
  for (const item of documents) {
    const { id, ...data } = item;
    const ref = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
    await setDoc(ref, { ...data, creadoEn: new Date().toISOString() });
    console.log(`  ✅ ${collectionName}/${ref.id}`);
  }
}

// ── 1. ADMINISTRADORES ────────────────────────────────────────────────────────
const admins = [
  {
    id: "admin_paty",
    nombre: "Paty Cabrera",
    email: "patycabrera8323@gmail.com",
    rol: "superadmin",
    activo: true,
    permisos: ["leer_todo", "escribir_todo", "eliminar_todo", "gestionar_usuarios"],
    foto: "",
  },
];

// ── 2. USUARIOS / VECINOS ─────────────────────────────────────────────────────
const usuarios = [
  {
    id: "vecino_demo_01",
    nombre: "Vecino Demo",
    email: "vecino@gmail.com",
    rol: "vecino",
    colonia: "Centro",
    telefono: "",
    activo: true,
  },
];

// ── 3. NEGOCIOS DE LA COLONIA ─────────────────────────────────────────────────
const negocios = [
  {
    id: "neg_001",
    nombre: "Tacos El Güero",
    categoria: "Restaurante",
    descripcion: "Los mejores tacos al pastor y de asada de la zona, con salsas caseras.",
    direccion: "Av. de la Juventud #123, Sector Centro",
    telefono: "555-019-1234",
    horario: "Lun–Dom 8:00 AM – 10:00 PM",
    imagen: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80",
    calificacion: 4.8,
    activo: true,
    tipo: "restaurante",
  },
  {
    id: "neg_002",
    nombre: "La Piazza Bella",
    categoria: "Restaurante",
    descripcion: "Pizzas en horno de piedra y pastas frescas de receta italiana.",
    direccion: "Calle Los Pinos #456, Sector Norte",
    telefono: "555-019-5678",
    horario: "Mar–Dom 1:00 PM – 11:00 PM",
    imagen: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&q=80",
    calificacion: 4.6,
    activo: true,
    tipo: "restaurante",
  },
  {
    id: "neg_003",
    nombre: "Burger & Co. Craft",
    categoria: "Restaurante",
    descripcion: "Hamburguesas de carne artesanal premium con papas sazonadas.",
    direccion: "Bulevar Margaritas #789, Sector Sur",
    telefono: "555-019-9012",
    horario: "Lun–Dom 12:00 PM – 11:00 PM",
    imagen: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    calificacion: 4.7,
    activo: true,
    tipo: "restaurante",
  },
  {
    id: "neg_004",
    nombre: "Cafetería La Selva",
    categoria: "Cafetería",
    descripcion: "Café orgánico, repostería fina, desayunos tradicionales y espacio pet-friendly.",
    direccion: "Av. Lázaro Cárdenas #321, Sector Centro",
    telefono: "555-019-3344",
    horario: "Lun–Sáb 7:00 AM – 9:00 PM",
    imagen: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80",
    calificacion: 4.5,
    activo: true,
    tipo: "cafeteria",
  },
  {
    id: "neg_005",
    nombre: "Sabor de Asia",
    categoria: "Restaurante",
    descripcion: "Sushi, ramen tradicional y arroz frito en wok al momento.",
    direccion: "Calle de las Palmas #202, Sector Este",
    telefono: "555-019-5566",
    horario: "Mar–Dom 1:00 PM – 10:30 PM",
    imagen: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&q=80",
    calificacion: 4.4,
    activo: true,
    tipo: "restaurante",
  },
  {
    id: "neg_006",
    nombre: "Farmacia San José",
    categoria: "Farmacia",
    descripcion: "Medicamentos, vitaminas y productos de higiene personal con servicio de urgencias.",
    direccion: "Calle Juárez #10, Sector Centro",
    telefono: "555-019-7788",
    horario: "Lun–Dom 8:00 AM – 10:00 PM",
    imagen: "",
    calificacion: 4.2,
    activo: true,
    tipo: "farmacia",
  },
  {
    id: "neg_007",
    nombre: "Papelería y Copias Martínez",
    categoria: "Papelería",
    descripcion: "Copias, impresiones, papelería escolar y útiles de oficina.",
    direccion: "Av. Revolución #55, Sector Centro",
    telefono: "555-019-9900",
    horario: "Lun–Sáb 9:00 AM – 7:00 PM",
    imagen: "",
    calificacion: 4.0,
    activo: true,
    tipo: "servicios",
  },
];

// ── 4. PRODUCTOS / MENÚ ───────────────────────────────────────────────────────
const productos = [
  {
    id: "prod_001",
    negocioId: "neg_001",
    negocioNombre: "Tacos El Güero",
    nombre: "Taco al Pastor",
    descripcion: "Taco de carne de cerdo marinada al pastor con piña, cilantro y cebolla.",
    precio: 25.00,
    categoria: "Tacos",
    imagen: "",
    disponible: true,
  },
  {
    id: "prod_002",
    negocioId: "neg_001",
    negocioNombre: "Tacos El Güero",
    nombre: "Taco de Asada",
    descripcion: "Taco de carne de res asada con guacamole y pico de gallo.",
    precio: 28.00,
    categoria: "Tacos",
    imagen: "",
    disponible: true,
  },
  {
    id: "prod_003",
    negocioId: "neg_002",
    negocioNombre: "La Piazza Bella",
    nombre: "Pizza Margherita",
    descripcion: "Pizza con salsa de tomate, mozzarella fresca y albahaca.",
    precio: 180.00,
    categoria: "Pizzas",
    imagen: "",
    disponible: true,
  },
  {
    id: "prod_004",
    negocioId: "neg_003",
    negocioNombre: "Burger & Co. Craft",
    nombre: "Burger Clásica",
    descripcion: "Hamburguesa de 200g de carne de res con lechuga, tomate y papas.",
    precio: 145.00,
    categoria: "Hamburguesas",
    imagen: "",
    disponible: true,
  },
  {
    id: "prod_005",
    negocioId: "neg_004",
    negocioNombre: "Cafetería La Selva",
    nombre: "Café Americano",
    descripcion: "Café negro orgánico de grano selecto.",
    precio: 45.00,
    categoria: "Bebidas",
    imagen: "",
    disponible: true,
  },
  {
    id: "prod_006",
    negocioId: "neg_005",
    negocioNombre: "Sabor de Asia",
    nombre: "Orden de Sushi (8 piezas)",
    descripcion: "Selección de 8 piezas de sushi mixto del chef.",
    precio: 160.00,
    categoria: "Sushi",
    imagen: "",
    disponible: true,
  },
];

// ── 5. CONFIGURACIÓN GENERAL DE LA COLONIA ────────────────────────────────────
const config = [
  {
    id: "configuracion_general",
    nombreColonia: "Mi Colonia en un Click",
    slogan: "Tu asistente vecinal inteligente",
    adminEmail: "patycabrera8323@gmail.com",
    horariosRecoleccionBasura: {
      lunes: "7:00 AM – 9:00 AM",
      miercoles: "7:00 AM – 9:00 AM",
      viernes: "7:00 AM – 9:00 AM",
    },
    contactoEmergencias: "555-000-9911",
    version: "1.0.0",
    activo: true,
  },
];

// ── EJECUCIÓN PRINCIPAL ───────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Iniciando carga de datos en Firestore (bot-mi-meracdo)...\n");
  try {
    await seed("administradores", admins);
    await seed("users", usuarios);
    await seed("negocios", negocios);
    await seed("restaurants", negocios.filter(n => n.tipo === "restaurante" || n.tipo === "cafeteria"));
    await seed("productos", productos);
    await seed("config", config);
    console.log("\n✅ ¡Todos los datos se cargaron exitosamente en Firestore!");
    console.log("   Revisa tu consola de Firebase en:");
    console.log("   https://console.firebase.google.com/project/bot-mi-meracdo/firestore");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Error al cargar datos:", err.message);
    process.exit(1);
  }
}

main();
