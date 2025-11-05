import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Fix Leaflet default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SANTIAGO_CENTER = [8.0987, -80.9831];
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [systemStats, setSystemStats] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchStops();
    fetchRoutes();
    fetchSystemStats();
  }, []);

  // Fetch route details when selected
  useEffect(() => {
    if (selectedRoute) {
      fetchRouteDetails(selectedRoute);
    } else {
      setRouteDetails(null);
    }
  }, [selectedRoute]);

  const fetchStops = async () => {
    try {
      const response = await axios.get(`${API_BASE}/stops`);
      setStops(response.data);
    } catch (error) {
      console.error('Error fetching stops:', error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/routes`);
      setRoutes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching routes:', error);
      setLoading(false);
    }
  };

  const fetchRouteDetails = async (routeId) => {
    try {
      const response = await axios.get(`${API_BASE}/routes/${routeId}`);
      setRouteDetails(response.data);
    } catch (error) {
      console.error('Error fetching route details:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/analytics/system-overview`);
      setSystemStats(response.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  // Create custom marker icon
  const createCustomIcon = (color = '#3498db') => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  // Get route coordinates for polyline
  const getRouteCoordinates = (direction) => {
    if (!routeDetails) return [];
    const stops = direction === 'outbound'
      ? routeDetails.outboundStops
      : routeDetails.inboundStops;
    return stops
      .filter(stop => stop.latitude && stop.longitude)
      .map(stop => [stop.latitude, stop.longitude]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando sistema de buses...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">Sistema de Buses - Santiago de Veraguas</h1>
        <p className="text-sm text-blue-100">Rastreador de Rutas de Transporte</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b">
        <div className="flex space-x-4 p-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2 rounded ${activeTab === 'map' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            Mapa
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`px-4 py-2 rounded ${activeTab === 'routes' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            Rutas
          </button>
          <button
            onClick={() => setActiveTab('stops')}
            className={`px-4 py-2 rounded ${activeTab === 'stops' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            Paradas
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-50'}`}
          >
            Estadísticas
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r overflow-y-auto">
          {activeTab === 'map' && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Rutas Disponibles</h2>
              {routes.length === 0 ? (
                <p className="text-gray-500">No hay rutas registradas aún.</p>
              ) : (
                <div className="space-y-2">
                  {routes.map(route => (
                    <button
                      key={route.id}
                      onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                      className={`w-full text-left p-3 rounded border ${
                        selectedRoute === route.id 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: route.color }}
                        />
                        <div>
                          <div className="font-semibold">{route.code}</div>
                          <div className="text-sm text-gray-600">{route.name}</div>
                          <div className="text-xs text-gray-500">
                            {route.totalStops} paradas
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'routes' && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Lista de Rutas</h2>
              {routes.length === 0 ? (
                <p className="text-gray-500">No hay rutas registradas.</p>
              ) : (
                routes.map(route => (
                  <div key={route.id} className="mb-4 p-3 border rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: route.color }}
                      />
                      <h3 className="font-semibold">{route.code} - {route.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{route.description}</p>
                    <div className="text-sm">
                      <div>📍 Paradas: {route.totalStops}</div>
                      {route.farePrice && <div>💵 Tarifa: ${route.farePrice}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'stops' && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Paradas de Bus</h2>
              <div className="text-sm text-gray-600 mb-4">
                Total: {stops.length} paradas
              </div>
              {stops.map(stop => (
                <div key={stop.id} className="mb-3 p-3 border rounded">
                  <h3 className="font-semibold">{stop.name}</h3>
                  {stop.address && <p className="text-sm text-gray-600">{stop.address}</p>}
                  {stop.landmarks && <p className="text-xs text-gray-500 italic">{stop.landmarks}</p>}
                  <div className="text-sm mt-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {stop.routeCount} ruta{stop.routeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && systemStats && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Estadísticas del Sistema</h2>
              <div className="space-y-3">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-700">{systemStats.total_stops || 0}</div>
                  <div className="text-sm text-gray-600">Total de Paradas</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-700">{systemStats.total_routes || 0}</div>
                  <div className="text-sm text-gray-600">Rutas Activas</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-2xl font-bold text-blue-700">
                    {systemStats.avg_routes_per_stop || 0}
                  </div>
                  <div className="text-sm text-gray-600">Promedio Rutas por Parada</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Map Container */}
        <div className="flex-1">
          <MapContainer
            center={SANTIAGO_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Display all stops */}
            {stops.map(stop => stop.latitude && stop.longitude && (
              <Marker
                key={stop.id}
                position={[stop.latitude, stop.longitude]}
                icon={createCustomIcon(selectedRoute ? '#888' : '#3498db')}
              >
                <Popup>
                  <div>
                    <h3 className="font-semibold">{stop.name}</h3>
                    {stop.address && <p className="text-sm">{stop.address}</p>}
                    {stop.landmarks && <p className="text-xs text-gray-500 italic">{stop.landmarks}</p>}
                    <div className="mt-2 text-sm">
                      <strong>{stop.routeCount}</strong> ruta{stop.routeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Display selected route */}
            {routeDetails && (
              <>
                {/* Outbound route line */}
                {getRouteCoordinates('outbound').length > 0 && (
                  <Polyline
                    positions={getRouteCoordinates('outbound')}
                    color={routeDetails.color}
                    weight={4}
                    opacity={0.8}
                  />
                )}

                {/* Inbound route line (dashed) */}
                {getRouteCoordinates('inbound').length > 0 && (
                  <Polyline
                    positions={getRouteCoordinates('inbound')}
                    color={routeDetails.color}
                    weight={4}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                )}

                {/* Route stops with colored markers */}
                {routeDetails.outboundStops?.map(stop => stop.latitude && stop.longitude && (
                  <Marker
                    key={`out-${stop.id}`}
                    position={[stop.latitude, stop.longitude]}
                    icon={createCustomIcon(routeDetails.color)}
                  >
                    <Popup>
                      <div>
                        <div className="font-semibold">{stop.name}</div>
                        <div className="text-sm text-gray-600">
                          Parada #{stop.stopOrder} (Ida)
                        </div>
                        {stop.distanceFromPrevious > 0 && (
                          <div className="text-xs mt-1">
                            📏 {stop.distanceFromPrevious} km
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            )}
          </MapContainer>
        </div>
      </main>

      {/* Route Details Panel */}
      {routeDetails && (
        <div className="bg-white border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded"
                style={{ backgroundColor: routeDetails.color }}
              />
              <div>
                <h3 className="text-lg font-semibold">
                  {routeDetails.code} - {routeDetails.name}
                </h3>
                <p className="text-sm text-gray-600">{routeDetails.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRoute(null)}
              className="text-gray-500 hover:text-gray-700 px-3 py-1"
            >
              ✕ Cerrar
            </button>
          </div>
          
          <div className="flex gap-3 mt-3 text-sm">
            <div>
              <div className="text-gray-500">Paradas (Ida)</div>
              <div className="font-semibold">{routeDetails.outboundStops?.length || 0}</div>
            </div>
            <div>
              <div className="text-gray-500">Paradas (Regreso)</div>
              <div className="font-semibold">{routeDetails.inboundStops?.length || 0}</div>
            </div>
            <div>
              <div className="text-gray-500">Distancia Total</div>
              <div className="font-semibold">
                {(routeDetails.totalDistance?.outbound || 0).toFixed(2)} km
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
