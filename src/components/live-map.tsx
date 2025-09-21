'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Translated, useTranslatedText } from '@/hooks/use-translated-text';

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

interface LiveMapProps {
  alertLocation?: { lat: number; lng: number; radius: number } | null;
}

export default function LiveMap({ alertLocation }: LiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const approvedMarkersRef = useRef<any>(null);
  const alertMarkerRef = useRef<any>(null);
  const alertCircleRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [approvedReports, setApprovedReports] = useState<ApprovedReport[]>([]);
  const [showApprovedReports, setShowApprovedReports] = useState(true);

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
      });

      return () => unsubscribe();
    };

    return fetchApprovedReports();
  }, []);

  // Get user's current location
  useEffect(() => {
    const getUserLocation = () => {
      setIsLoading(true);
      
      if (!navigator.geolocation) {
        setLocationError('Geolocation is not supported by this browser.');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationError(null);
          setIsLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          let errorMessage = 'Unable to get your location.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          setLocationError(errorMessage);
          // Fall back to default location (Dubai coastal area)
          setUserLocation({ lat: 25.2048, lng: 55.2708 });
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    };

    getUserLocation();
  }, []);

  // Initialize map
  useEffect(() => {
    const initMap = async () => {
      if (typeof window !== 'undefined' && mapRef.current && !mapInstance.current && userLocation) {
        try {
          // Import Leaflet dynamically
          const L = (await import('leaflet')).default;
          
          // Fix for default markers
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          });

          // Initialize map centered on user's location
          mapInstance.current = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstance.current);

          // Add a marker for user's current location
          const userIcon = L.divIcon({
            html: '<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            className: 'custom-user-marker'
          });

          L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(mapInstance.current)
            .bindPopup('📍 Your Current Location')
            .openPopup();

          // Initialize layer for approved reports
          approvedMarkersRef.current = L.layerGroup().addTo(mapInstance.current);
        } catch (error) {
          console.error('Error initializing map:', error);
        }
      }
    };

    if (userLocation) {
      initMap();
    }

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [userLocation]);

  // Handle alert location display
  useEffect(() => {
    if (!mapInstance.current || !window.L) return;

    // Clear existing alert markers and circles
    if (alertMarkerRef.current) {
      alertMarkerRef.current.remove();
      alertMarkerRef.current = null;
    }
    if (alertCircleRef.current) {
      alertCircleRef.current.remove();
      alertCircleRef.current = null;
    }

    if (alertLocation) {
      // Create red alert marker icon
      const alertIcon = window.L.divIcon({
        html: `
          <div style="
            background-color: #DC2626; 
            width: 24px; 
            height: 24px; 
            border-radius: 50%; 
            border: 4px solid white; 
            box-shadow: 0 4px 8px rgba(220, 38, 38, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            animation: pulse 2s infinite;
          ">!</div>
          <style>
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.2); }
              100% { transform: scale(1); }
            }
          </style>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: 'custom-alert-marker'
      });

      // Add alert marker
      alertMarkerRef.current = window.L.marker([alertLocation.lat, alertLocation.lng], { icon: alertIcon })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="font-weight: bold; color: #DC2626;">
            🚨 Emergency Alert Location<br>
            <small>Radius: ${(alertLocation.radius / 1000).toFixed(1)}km</small>
          </div>
        `)
        .openPopup();

      // Add radius circle
      alertCircleRef.current = window.L.circle([alertLocation.lat, alertLocation.lng], {
        color: '#DC2626',
        fillColor: '#FCA5A5',
        fillOpacity: 0.2,
        radius: alertLocation.radius,
        weight: 3,
        dashArray: '10, 10'
      }).addTo(mapInstance.current);

      // Center map on alert location
      mapInstance.current.setView([alertLocation.lat, alertLocation.lng], 13);
    }
  }, [alertLocation]);

  // Update approved reports markers
  useEffect(() => {
    if (!mapInstance.current || !approvedMarkersRef.current) return;

    const L = window.L;
    if (!L) return;

    // Clear existing approved markers
    approvedMarkersRef.current.clearLayers();

    if (!showApprovedReports || approvedReports.length === 0) return;

    // Add markers for approved reports
    approvedReports.forEach(report => {
      const icon = createEventTypeIcon(report.eventType, report.severity);
      const marker = L.marker([report.location.lat, report.location.lng], { icon })
        .bindPopup(createPopupContent(report));
      
      approvedMarkersRef.current.addLayer(marker);
    });
  }, [approvedReports, showApprovedReports]);

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
          width: 28px; 
          height: 28px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        ">${icon}</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
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
      <div style="min-width: 200px; max-width: 280px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="font-size: 18px;">${getEventIcon(report.eventType)}</span>
          <h3 style="margin: 0; font-weight: bold; color: #1F2937; font-size: 15px;">
            ${formatEventType(report.eventType)}
          </h3>
        </div>
        
        <p style="margin: 0 0 10px 0; font-size: 13px; color: #4B5563; line-height: 1.4;">
          ${report.description}
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 6px;">
          <div style="display: flex; justify-content: space-between;">
            <strong>Status:</strong> 
            <span style="color: #059669; font-weight: bold;">APPROVED ✓</span>
          </div>
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              <Translated text="Live Map" />
            </CardTitle>
            <CardDescription className="text-sm">
              <Translated text="Getting your location..." />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 md:h-96 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center px-4">
                <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-blue-500 mb-4 animate-spin" />
                <p className="text-gray-600 mb-2 text-sm sm:text-base">
                  <Translated text="Locating you on the map..." />
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  <Translated text="This may take a few seconds" />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">
                <Translated text="Live Map" />
              </CardTitle>
              <CardDescription className="text-sm">
                {locationError ? (
                  <span className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">
                      <Translated text={locationError} /> <Translated text="Showing default location." />
                    </span>
                  </span>
                ) : (
                  <>
                    <Translated text="Real-time view of coastal hazard reports in your area." />
                    {' '}{approvedReports.length} <Translated text="approved reports shown." />
                  </>
                )}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApprovedReports(!showApprovedReports)}
              className="self-start sm:self-auto"
            >
              {showApprovedReports ? (
                <>
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">
                    <Translated text="Hide Reports" />
                  </span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">
                    <Translated text="Show Reports" />
                  </span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef} 
            className="w-full h-64 sm:h-80 md:h-96 rounded-lg border"
            style={{ minHeight: '256px' }}
          />
          {userLocation && (
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
                <span className="text-blue-800 break-all sm:break-normal">
                  Map centered on your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              </div>
              {showApprovedReports && approvedReports.length > 0 && (
                <div className="mt-2 text-xs text-blue-700">
                  📍 {approvedReports.length} approved coastal hazard reports are shown as colored markers
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
