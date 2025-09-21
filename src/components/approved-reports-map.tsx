'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle, Eye, Filter, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

declare global {
  interface Window {
    L: any;
  }
}

interface ApprovedReport {
  id: string;
  location: { lat: number; lng: number };
  eventType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: any;
  approvedAt: any;
  reporterName?: string;
}

export default function ApprovedReportsMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [approvedReports, setApprovedReports] = useState<ApprovedReport[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');

  // Fetch approved reports from Firebase
  useEffect(() => {
    const fetchApprovedReports = () => {
      const reportsRef = collection(db, 'reports');
      const q = query(
        reportsRef,
        where('status', '==', 'approved')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const reports: ApprovedReport[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.location && data.location.lat && data.location.lng) {
            reports.push({
              id: doc.id,
              location: data.location,
              eventType: data.eventType || 'other',
              description: data.description || '',
              severity: data.severity || 'medium',
              createdAt: data.createdAt,
              approvedAt: data.approvedAt || data.updatedAt,
              reporterName: data.reporterName || 'Anonymous'
            });
          }
        });
        
        setApprovedReports(reports);
        setIsLoading(false);
      });

      return () => unsubscribe();
    };

    return fetchApprovedReports();
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (typeof window !== 'undefined' && mapRef.current && !mapInstance.current) {
        try {
          const L = (await import('leaflet')).default;
          
          // Fix for default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          // Initialize map - default to Dubai coastal area
          mapInstance.current = L.map(mapRef.current).setView([25.2048, 55.2708], 11);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstance.current);

          // Initialize markers layer
          markersLayerRef.current = L.layerGroup().addTo(mapInstance.current);
          
          setMapLoaded(true);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    if (!mapLoaded) {
      initMap();
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapLoaded(false);
      }
    };
  }, [mapLoaded]);

  // Get unique event types for filter
  const eventTypes = Array.from(new Set(approvedReports.map(r => r.eventType)));

  // Filter reports based on time and event type
  const filteredReports = approvedReports.filter(report => {
    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const reportTime = report.approvedAt?.toDate ? report.approvedAt.toDate() : new Date(report.approvedAt);
      const timeDiff = now.getTime() - reportTime.getTime();
      
      const timeThresholds = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      if (timeDiff > timeThresholds[timeFilter]) {
        return false;
      }
    }
    
    // Event type filter
    if (eventFilter !== 'all' && report.eventType !== eventFilter) {
      return false;
    }
    
    return true;
  });

  // Update map with filtered reports
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    const L = window.L;
    if (!L) return;

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (filteredReports.length === 0) return;

    // Add markers for each approved report
    filteredReports.forEach(report => {
      const icon = createEventTypeIcon(report.eventType, report.severity);
      const marker = L.marker([report.location.lat, report.location.lng], { icon })
        .bindPopup(createPopupContent(report));
      
      markersLayerRef.current.addLayer(marker);
    });

    // Fit map to show all reports if there are any
    if (filteredReports.length > 0) {
      const group = new L.featureGroup(markersLayerRef.current.getLayers());
      if (group.getBounds().isValid()) {
        mapInstance.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }, [filteredReports, mapLoaded]);

  const createEventTypeIcon = (eventType: string, severity: string) => {
    const eventIcons = {
      'coastal_flooding': '🌊',
      'storm_surge': '⛈️', 
      'high_tide': '🌕',
      'beach_erosion': '🏖️',
      'oil_spill': '🛢️',
      'marine_pollution': '🚫',
      'infrastructure_damage': '🏗️',
      'wildlife_impact': '🐟',
      'other': '⚠️'
    };

    const severityColors = {
      critical: '#DC2626', // red-600
      high: '#EA580C',     // orange-600
      medium: '#D97706',   // amber-600
      low: '#16A34A'       // green-600
    };
    
    const icon = eventIcons[eventType as keyof typeof eventIcons] || eventIcons.other;
    const color = severityColors[severity as keyof typeof severityColors] || severityColors.medium;
    
    return window.L.divIcon({
      html: `
        <div style="
          background-color: ${color}; 
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        ">${icon}</div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      className: 'custom-event-marker'
    });
  };

  const createPopupContent = (report: ApprovedReport): string => {
    const approvedDate = report.approvedAt?.toDate ? 
      report.approvedAt.toDate().toLocaleDateString() : 
      new Date(report.approvedAt).toLocaleDateString();

    const createdDate = report.createdAt?.toDate ? 
      report.createdAt.toDate().toLocaleDateString() : 
      new Date(report.createdAt).toLocaleDateString();
      
    return `
      <div style="min-width: 220px; max-width: 300px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 20px;">${getEventIcon(report.eventType)}</span>
          <h3 style="margin: 0; font-weight: bold; color: #1F2937; font-size: 16px;">
            ${formatEventType(report.eventType)}
          </h3>
        </div>
        
        <p style="margin: 0 0 12px 0; font-size: 14px; color: #4B5563; line-height: 1.4;">
          ${report.description}
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Severity:</strong> 
            <span style="color: ${getSeverityColor(report.severity)}; font-weight: bold;">
              ${report.severity.toUpperCase()}
            </span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Reported:</strong> 
            <span>${createdDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Approved:</strong> 
            <span>${approvedDate}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <strong>Reporter:</strong> 
            <span>${report.reporterName}</span>
          </div>
          <div style="font-size: 11px; color: #9CA3AF; margin-top: 4px;">
            📍 ${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}
          </div>
        </div>
      </div>
    `;
  };

  const getEventIcon = (eventType: string): string => {
    const eventIcons = {
      'coastal_flooding': '🌊',
      'storm_surge': '⛈️', 
      'high_tide': '🌕',
      'beach_erosion': '🏖️',
      'oil_spill': '🛢️',
      'marine_pollution': '🚫',
      'infrastructure_damage': '🏗️',
      'wildlife_impact': '🐟',
      'other': '⚠️'
    };
    return eventIcons[eventType as keyof typeof eventIcons] || eventIcons.other;
  };

  const formatEventType = (eventType: string): string => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#16A34A';
      default: return '#6B7280';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Approved Reports Map
          </CardTitle>
          <CardDescription>Loading approved coastal hazard reports...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 md:h-96 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto text-blue-500 mb-4 animate-spin" />
              <p className="text-gray-600">Loading map data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Approved Reports Map
              </CardTitle>
              <CardDescription>
                Showing {filteredReports.length} approved coastal hazard reports
              </CardDescription>
            </div>
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                <SelectTrigger className="w-full sm:w-32">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={eventFilter} onValueChange={(value: any) => setEventFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {eventTypes.map(eventType => (
                    <SelectItem key={eventType} value={eventType}>
                      {formatEventType(eventType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-80 md:h-96 rounded-lg border"
            style={{ minHeight: '256px' }}
          />
          
          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Severity Levels</h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <span>Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-600"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                <span>Critical</span>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex flex-wrap gap-4">
              <span>📍 {filteredReports.length} approved reports shown</span>
              <span>🎯 Click markers for details</span>
              <span>📅 Filter: {timeFilter === 'all' ? 'All time' : timeFilter}</span>
              <span>🏷️ Type: {eventFilter === 'all' ? 'All events' : formatEventType(eventFilter)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
