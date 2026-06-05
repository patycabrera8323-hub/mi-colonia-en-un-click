// Cloudflare Pages Function: /api/restaurants
// Se despliega automáticamente con Cloudflare Pages

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

export async function onRequestGet() {
  return new Response(JSON.stringify(RESTAURANT_DATA), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
