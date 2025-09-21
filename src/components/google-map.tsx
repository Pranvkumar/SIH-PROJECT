'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
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

export default function GoogleMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
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
        
        console.log('Fetched approved reports:', reports.length);
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

  // Load Google Maps script
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
        script.async = true;
        script.defer = true;
        
        window.initMap = () => {
          resolve();
        };
        
        document.head.appendChild(script);
      });
    };

    if (userLocation) {
      loadGoogleMaps().then(() => {
        initMap();
      }).catch((error) => {
        console.error('Error loading Google Maps:', error);
        setLocationError('Failed to load Google Maps. Falling back to OpenStreetMap.');
      });
    }
  }, [userLocation]);

  const initMap = () => {
    if (!mapRef.current || !userLocation || !window.google) return;

    try {
      // Initialize Google Map
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 13,
        mapTypeId: 'hybrid', // Use hybrid view for better coastal visibility
        styles: [
          {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{ color: '#193341' }]
          },
          {
            featureType: 'landscape',
            elementType: 'geometry',
            stylers: [{ color: '#2c5282' }]
          }
        ]
      });

      // Add user location marker
      new window.google.maps.Marker({
        position: { lat: userLocation.lat, lng: userLocation.lng },
        map: mapInstance.current,
        title: 'Your Current Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3
        }
      });

      // Add sample marker for testing
      const sampleLat = userLocation.lat + 0.01;
      const sampleLng = userLocation.lng + 0.01;
      
      new window.google.maps.Marker({
        position: { lat: sampleLat, lng: sampleLng },
        map: mapInstance.current,
        title: 'Sample Report Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#EF4444',
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

    } catch (error) {
      console.error('Error initializing Google Map:', error);
    }
  };

  // Update approved reports markers
  useEffect(() => {
    if (!mapInstance.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (!showApprovedReports || approvedReports.length === 0) return;

    // Add markers for approved reports
    approvedReports.forEach(report => {
      const marker = new window.google.maps.Marker({
        position: { lat: report.location.lat, lng: report.location.lng },
        map: mapInstance.current,
        title: `${formatEventType(report.eventType)} - ${report.severity}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: getSeverityScale(report.severity),
          fillColor: getSeverityColor(report.severity),
          fillOpacity: 0.8,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: createPopupContent(report)
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstance.current, marker);
      });

      markersRef.current.push(marker);
    });
  }, [approvedReports, showApprovedReports]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#DC2626'; // red-600
      case 'high': return '#EA580C';     // orange-600
      case 'medium': return '#D97706';   // amber-600
      case 'low': return '#16A34A';      // green-600
      default: return '#6B7280';         // gray-500
    }
  };

  const getSeverityScale = (severity: string): number => {
    switch (severity) {
      case 'critical': return 15;
      case 'high': return 12;
      case 'medium': return 10;
      case 'low': return 8;
      default: return 10;
    }
  };

  const formatEventType = (eventType: string): string => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const createPopupContent = (report: ApprovedReport): string => {
    const approvedDate = report.approvedAt?.toDate ? 
      report.approvedAt.toDate().toLocaleDateString() : 
      new Date(report.approvedAt).toLocaleDateString();

    const createdDate = report.createdAt?.toDate ? 
      report.createdAt.toDate().toLocaleDateString() : 
      new Date(report.createdAt).toLocaleDateString();
      
    return `
      <div style="min-width: 200px; max-width: 280px; font-family: Arial, sans-serif;">
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Live Map (Google Maps)</CardTitle>
            <CardDescription className="text-sm">Getting your location...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80 md:h-96 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center px-4">
                <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-blue-500 mb-4 animate-spin" />
                <p className="text-gray-600 mb-2 text-sm sm:text-base">Locating you on the map...</p>
                <p className="text-xs sm:text-sm text-gray-500">This may take a few seconds</p>
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
              <CardTitle className="text-lg sm:text-xl">Live Map (Google Maps)</CardTitle>
              <CardDescription className="text-sm">
                {locationError ? (
                  <span className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">
                      {locationError} Showing default location.
                    </span>
                  </span>
                ) : (
                  <>
                    Real-time view of coastal hazard reports in your area.
                    {' '}{approvedReports.length} approved reports available.
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
                  <span className="text-xs sm:text-sm">Hide Reports</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  <span className="text-xs sm:text-sm">Show Reports</span>
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
              {approvedReports.length === 0 && (
                <div className="mt-2 text-xs text-orange-700">
                  ⚠️ No approved reports found. Try creating and approving some test reports.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
