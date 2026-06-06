import React, { useState, useEffect } from 'react';
import { Search, Star, Phone, MapPin, RefreshCw, Compass } from 'lucide-react';
import { Restaurant } from '../types';

export default function ExploreTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('todos');

  // Build categories dynamically from the actual data
  const cuisineEmojis: Record<string, string> = {
    mexicana: '🌮', italiana: '🍕', hamburguesas: '🍔', cafeteria: '☕',
    asiatica: '🥢', restaurante: '🍽️', farmacia: '💊', papeleria: '📋',
    panaderia: '🥐', carniceria: '🥩', verduras: '🥦', pizza: '🍕',
    mariscos: '🦞', tacos: '🌮', sushi: '🍣', cafe: '☕',
  };

  const categories = [
    { id: 'todos', label: 'Todos' },
    ...Array.from(new Set(restaurants.map(r => (r.cuisine ?? '').toLowerCase()).filter(Boolean)))
      .map(c => ({
        id: c,
        label: `${c.charAt(0).toUpperCase() + c.slice(1)}${cuisineEmojis[c] ? ' ' + cuisineEmojis[c] : ''}`
      }))
  ];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/restaurants');
      if (res.ok) {
        const data = await res.json();
        // Filter out any items without at least a name
        setRestaurants((data as Restaurant[]).filter((r) => r && r.name));
      }
    } catch (e) {
      console.error("Error fetching restaurants from backend:", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter((r) => {
    const query = searchQuery.toLowerCase();
    const name = (r.name ?? '').toLowerCase();
    const cuisine = (r.cuisine ?? '').toLowerCase();
    const description = (r.description ?? '').toLowerCase();

    const matchesSearch = name.includes(query) || 
                          cuisine.includes(query) ||
                          description.includes(query);
    
    const matchesCuisine = selectedCuisine === 'todos' || cuisine === selectedCuisine;
    
    return matchesSearch && matchesCuisine;
  });

  return (
    <div id="explore-tab-container" className="max-w-md mx-auto p-4 space-y-5 pb-24">
      {/* Title & subtitle */}
      <div id="explore-header" className="flex items-center justify-between">
        <div id="explore-title-block">
          <h2 id="explore-title text-xl" className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            Catálogo Vecinal
          </h2>
          <p className="text-xs text-slate-400">Restaurantes auténticos y recomendados por tus vecinos</p>
        </div>
        <button 
          id="btn-refresh-restaurants"
          onClick={fetchRestaurants} 
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Modern Search bar */}
      <div id="explore-search-box" className="relative group">
        <input
          type="text"
          id="explore-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="¿Qué se te antoja hoy? tacos, pizza..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none transition duration-200"
        />
        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition" />
      </div>

      {/* Pill filter categories */}
      <div id="explore-categories-scroll" className="flex gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`filter-chip-${cat.id}`}
            onClick={() => setSelectedCuisine(cat.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
              selectedCuisine === cat.id
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-md font-bold'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Restaurants list cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Consultando catálogo vecinal...</p>
        </div>
      ) : filteredRestaurants.length > 0 ? (
        <div id="explore-restaurants-list" className="space-y-4">
          {filteredRestaurants.map((res) => (
            <div
              key={res.id}
              id={`restaurant-card-${res.id}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition duration-300 group"
            >
              <div className="relative h-40 overflow-hidden bg-slate-950">
                <img
                  id={`restaurant-image-${res.id}`}
                  src={res.image}
                  alt={res.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-cyan-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-cyan-500/20">
                  {res.cuisine}
                </span>

                <span className="absolute bottom-3 right-3 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md text-amber-400 font-black text-xs px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {(res.rating ?? 0).toFixed(1)}
                </span>
              </div>

              <div className="p-4 space-y-2">
                <h3 id={`restaurant-name-${res.id}`} className="text-base font-bold text-slate-100">{res.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{res.description}</p>
                
                <div className="pt-2 space-y-1.5">
                  {(res as any).horario && (
                    <p className="text-[10px] text-slate-500">🕐 {(res as any).horario}</p>
                  )}
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-1.5">
                  <div className="flex items-center gap-1.5 max-w-[70%]">
                    <MapPin className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    <span className="truncate">{res.address}</span>
                  </div>

                  <a
                    id={`dial-${res.id}`}
                    href={`tel:${res.phoneNumber}`}
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700/80 hover:text-cyan-400 text-slate-300 px-3 py-1.5 rounded-lg font-semibold transition"
                  >
                    <Phone className="w-3 h-3 text-cyan-400" />
                    Llamar
                  </a>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-8 space-y-2 bg-slate-900/50 border border-slate-800/60 rounded-2xl">
          <p className="text-sm font-semibold text-slate-400">No encontramos restaurantes</p>
          <p className="text-xs text-slate-500 leading-relaxed">Prueba ingresando otro término de búsqueda o seleccionando una gastronomía diferente.</p>
        </div>
      )}
    </div>
  );
}
