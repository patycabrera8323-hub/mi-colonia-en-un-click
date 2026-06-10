import React, { useState, useEffect } from 'react';
import { Search, Star, Phone, MapPin, RefreshCw, Compass } from 'lucide-react';
import { Restaurant } from '../types';

export default function ExploreTab() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'horarios' | 'productos' | 'envios'>('productos');
  const [productsForBusiness, setProductsForBusiness] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const getBusinessId = (id: string) => {
    if (id.startsWith('user_')) return id.replace('user_', '');
    if (id.startsWith('negocio_')) return id.replace('negocio_', '');
    return id;
  };

  const handleToggleDetails = async (restaurantId: string) => {
    if (expandedId === restaurantId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(restaurantId);
    setActiveSubTab('productos');
    setProductsForBusiness([]);
    setLoadingProducts(true);
    
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const restaurant = restaurants.find(r => r.id === restaurantId);
      const realBusinessId = restaurant?.syncFromUser || getBusinessId(restaurantId);
      const q = query(collection(db, 'products'), where('businessId', '==', realBusinessId));
      const snap = await getDocs(q);
      const prodsList: any[] = [];
      snap.forEach(d => {
        prodsList.push(d.data());
      });
      setProductsForBusiness(prodsList);
    } catch (err) {
      console.error("Error loading products for restaurant:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleTabChange = async (tab: 'horarios' | 'productos' | 'envios', restaurantId: string) => {
    setActiveSubTab(tab);
    if (tab === 'productos' && productsForBusiness.length === 0) {
      setLoadingProducts(true);
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        const restaurant = restaurants.find(r => r.id === restaurantId);
        const realBusinessId = restaurant?.syncFromUser || getBusinessId(restaurantId);
        const q = query(collection(db, 'products'), where('businessId', '==', realBusinessId));
        const snap = await getDocs(q);
        const prodsList: any[] = [];
        snap.forEach(d => {
          prodsList.push(d.data());
        });
        setProductsForBusiness(prodsList);
      } catch (err) {
        console.error("Error loading products for restaurant:", err);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

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
      .map((c: string) => ({
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
                  {res.horario && !expandedId && (
                    <p className="text-[10px] text-slate-500">🕐 {res.horario}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-1.5">
                    <div className="flex items-center gap-1.5 max-w-[50%]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                      <span className="truncate">{res.address}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleDetails(res.id)}
                        className="flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 text-cyan-400 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer"
                      >
                        {expandedId === res.id ? 'Ocultar' : 'Ver Detalles'}
                      </button>
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

                  {expandedId === res.id && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3 animate-fade-in text-left">
                      <div className="flex gap-1.5 border-b border-slate-800/40 pb-2 overflow-x-auto">
                        <button
                          onClick={() => handleTabChange('productos', res.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            activeSubTab === 'productos'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🛍️ Productos
                        </button>
                        <button
                          onClick={() => handleTabChange('horarios', res.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            activeSubTab === 'horarios'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🕐 Horarios
                        </button>
                        <button
                          onClick={() => handleTabChange('envios', res.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                            activeSubTab === 'envios'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🛵 Envíos
                        </button>
                      </div>

                      <div className="text-xs transition-all duration-150">
                        {activeSubTab === 'horarios' && (
                          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                            <p className="font-bold text-slate-300 mb-1 flex items-center gap-1">
                              <span>Horario de Atención</span>
                            </p>
                            <p className="text-slate-400 font-medium">
                              {res.horario || "Abierto - Consulte el horario exacto llamando al establecimiento."}
                            </p>
                          </div>
                        )}

                        {activeSubTab === 'productos' && (
                          <div className="space-y-2">
                            {loadingProducts ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-slate-500 italic">
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                                Cargando menú de productos...
                              </div>
                            ) : productsForBusiness.length > 0 ? (
                              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                                {productsForBusiness.map((p: any) => (
                                  <div key={p.id} className="flex items-center justify-between bg-slate-950/30 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      {p.image ? (
                                        <img src={p.image} alt={p.name} className="w-9 h-9 object-cover rounded-lg border border-slate-800" />
                                      ) : (
                                        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-500 font-bold border border-slate-700">SIN FOTO</div>
                                      )}
                                      <div className="min-w-0 text-left">
                                        <p className="font-bold text-slate-200 text-xs truncate">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 leading-none mt-1">Categoría: {p.category || 'General'}</p>
                                      </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                      <p className="font-bold text-cyan-400 text-xs">${parseFloat(p.price).toFixed(2)}</p>
                                      <p className={`text-[9px] mt-0.5 font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {p.stock > 0 ? `Stock: ${p.stock}` : 'Agotado'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800 text-center text-slate-550 italic">
                                Este negocio aún no cuenta con productos en su menú digital.
                              </div>
                            )}
                          </div>
                        )}

                        {activeSubTab === 'envios' && (
                          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 space-y-1.5">
                            <p className="font-bold text-slate-300 flex items-center gap-1">
                              <span>🛵 Envíos a Domicilio</span>
                            </p>
                            <p className="text-emerald-400 font-extrabold text-[11px] tracking-wide uppercase">
                              ✓ ¡Sí hay envíos!
                            </p>
                            <p className="text-slate-400 leading-relaxed text-[11px] pt-1 border-t border-slate-800/20">
                              Este establecimiento cuenta con entregas locales en toda la colonia. 
                              Puedes hacer tu pedido directamente conversando con **Gigi** en la pestaña de chat o llamando por teléfono al negocio.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
