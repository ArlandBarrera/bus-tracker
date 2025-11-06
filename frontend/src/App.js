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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Cargando sistema de buses...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <button 
          className="menu-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <div className="header-content">
          <h1 className="header-title">Buses Santiago</h1>
          <p className="header-subtitle">Veraguas</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          onClick={() => { setActiveTab('map'); setSidebarOpen(true); }}
          className={`nav-tab ${activeTab === 'map' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>Mapa</span>
        </button>
        <button
          onClick={() => { setActiveTab('routes'); setSidebarOpen(true); }}
          className={`nav-tab ${activeTab === 'routes' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          <span>Rutas</span>
        </button>
        <button
          onClick={() => { setActiveTab('stops'); setSidebarOpen(true); }}
          className={`nav-tab ${activeTab === 'stops' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>Paradas</span>
        </button>
        <button
          onClick={() => { setActiveTab('analytics'); setSidebarOpen(true); }}
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <span>Stats</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">
              {activeTab === 'map' && 'Rutas Disponibles'}
              {activeTab === 'routes' && 'Lista de Rutas'}
              {activeTab === 'stops' && 'Paradas de Bus'}
              {activeTab === 'analytics' && 'Estadísticas'}
            </h2>
            <button 
              className="sidebar-close"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="sidebar-content">
            {activeTab === 'map' && (
              <>
                {routes.length === 0 ? (
                  <p className="empty-state">No hay rutas registradas aún.</p>
                ) : (
                  <div className="route-list">
                    {routes.map(route => (
                      <button
                        key={route.id}
                        onClick={() => {
                          setSelectedRoute(selectedRoute === route.id ? null : route.id);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`route-card ${selectedRoute === route.id ? 'selected' : ''}`}
                      >
                        <div className="route-color" style={{ backgroundColor: route.color }} />
                        <div className="route-info">
                          <div className="route-code">{route.code}</div>
                          <div className="route-name">{route.name}</div>
                          <div className="route-stops">{route.totalStops} paradas</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'routes' && (
              <>
                {routes.length === 0 ? (
                  <p className="empty-state">No hay rutas registradas.</p>
                ) : (
                  <div className="route-details-list">
                    {routes.map(route => (
                      <div key={route.id} className="route-detail-card">
                        <div className="route-header">
                          <div className="route-color" style={{ backgroundColor: route.color }} />
                          <h3 className="route-title">{route.code} - {route.name}</h3>
                        </div>
                        <p className="route-description">{route.description}</p>
                        <div className="route-meta">
                          <div className="meta-item">
                            <span className="meta-icon">📍</span>
                            <span>{route.totalStops} paradas</span>
                          </div>
                          {route.farePrice && (
                            <div className="meta-item">
                              <span className="meta-icon">💵</span>
                              <span>${route.farePrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'stops' && (
              <>
                <div className="stops-count">Total: {stops.length} paradas</div>
                <div className="stops-list">
                  {stops.map(stop => (
                    <div key={stop.id} className="stop-card">
                      <h3 className="stop-name">{stop.name}</h3>
                      {stop.address && <p className="stop-address">{stop.address}</p>}
                      {stop.landmarks && <p className="stop-landmarks">{stop.landmarks}</p>}
                      <div className="stop-badge">
                        {stop.routeCount} ruta{stop.routeCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'analytics' && systemStats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{systemStats.total_stops || 0}</div>
                  <div className="stat-label">Total de Paradas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{systemStats.total_routes || 0}</div>
                  <div className="stat-label">Rutas Activas</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{systemStats.avg_routes_per_stop || 0}</div>
                  <div className="stat-label">Promedio Rutas/Parada</div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Map Container */}
        <div className="map-container">
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
                  <div className="popup-content">
                    <h3 className="popup-title">{stop.name}</h3>
                    {stop.address && <p className="popup-address">{stop.address}</p>}
                    {stop.landmarks && <p className="popup-landmarks">{stop.landmarks}</p>}
                    <div className="popup-routes">
                      <strong>{stop.routeCount}</strong> ruta{stop.routeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Display selected route */}
            {routeDetails && (
              <>
                {getRouteCoordinates('outbound').length > 0 && (
                  <Polyline
                    positions={getRouteCoordinates('outbound')}
                    color={routeDetails.color}
                    weight={4}
                    opacity={0.8}
                  />
                )}

                {getRouteCoordinates('inbound').length > 0 && (
                  <Polyline
                    positions={getRouteCoordinates('inbound')}
                    color={routeDetails.color}
                    weight={4}
                    opacity={0.6}
                    dashArray="10, 10"
                  />
                )}

                {routeDetails.outboundStops?.map(stop => stop.latitude && stop.longitude && (
                  <Marker
                    key={`out-${stop.id}`}
                    position={[stop.latitude, stop.longitude]}
                    icon={createCustomIcon(routeDetails.color)}
                  >
                    <Popup>
                      <div className="popup-content">
                        <div className="popup-title">{stop.name}</div>
                        <div className="popup-order">Parada #{stop.stopOrder} (Ida)</div>
                        {stop.distanceFromPrevious > 0 && (
                          <div className="popup-distance">📏 {stop.distanceFromPrevious} km</div>
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
        <div className="route-details-panel">
          <div className="panel-header">
            <div className="panel-title-section">
              <div className="route-color-large" style={{ backgroundColor: routeDetails.color }} />
              <div>
                <h3 className="panel-route-title">
                  {routeDetails.code} - {routeDetails.name}
                </h3>
                <p className="panel-route-description">{routeDetails.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRoute(null)}
              className="panel-close"
            >
              ✕
            </button>
          </div>

          <div className="panel-stats">
            <div className="panel-stat">
              <div className="panel-stat-label">Ida</div>
              <div className="panel-stat-value">{routeDetails.outboundStops?.length || 0}</div>
            </div>
            <div className="panel-stat">
              <div className="panel-stat-label">Regreso</div>
              <div className="panel-stat-value">{routeDetails.inboundStops?.length || 0}</div>
            </div>
            <div className="panel-stat">
              <div className="panel-stat-label">Distancia</div>
              <div className="panel-stat-value">
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
