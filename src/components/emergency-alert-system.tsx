'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, MapPin, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  location: { lat: number; lng: number };
  radius: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issuedBy: string;
  issuedAt: any;
  expiresAt: any;
  status: 'active' | 'expired';
  alertType: string;
  affectedArea?: string;
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

interface EmergencyAlertSystemProps {
  userRole?: string;
  onMapView?: (alertLocation: { lat: number; lng: number; radius: number }) => void;
}

export default function EmergencyAlertSystem({ userRole, onMapView }: EmergencyAlertSystemProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Get user's current location
  useEffect(() => {
    if (!currentUser) return;

    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            console.log('Location access denied or unavailable:', error);
            // Try to get location from localStorage if previously stored
            const savedLocation = localStorage.getItem('userLocation');
            if (savedLocation) {
              setUserLocation(JSON.parse(savedLocation));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      }
    };

    getCurrentLocation();
  }, [currentUser]);

  // Listen for emergency alerts
  useEffect(() => {
    if (!currentUser || !userLocation) {
      console.log('Emergency Alert System: Missing requirements', {
        currentUser: !!currentUser,
        userLocation: !!userLocation
      });
      return;
    }

    console.log('Emergency Alert System: Setting up listener', {
      userEmail: currentUser.email,
      userLocation: userLocation
    });

    const alertsRef = collection(db, 'emergencyAlerts');
    const q = query(
      alertsRef,
      where('active', '==', true),
      orderBy('issuedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log('Emergency Alert System: Received snapshot', {
          size: snapshot.size,
          empty: snapshot.empty
        });
        
        const alerts: EmergencyAlert[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Emergency Alert System: Processing alert', { id: doc.id, data });
          
          const alert: EmergencyAlert = {
            id: doc.id,
            title: data.title || 'Emergency Alert',
          message: data.message || '',
          location: data.location || { lat: 0, lng: 0 },
          radius: data.radius || 15, // Default 15km radius
          severity: data.severity || 'MEDIUM',
          issuedBy: data.issuedBy || 'Emergency Services',
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          status: data.status || 'active',
          alertType: data.alertType || 'GENERAL',
          affectedArea: data.affectedArea
        };

        // Check if user is within the alert radius
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          alert.location.lat,
          alert.location.lng
        );

        if (distance <= alert.radius) {
          alerts.push(alert);
        }
      });

      setActiveAlerts(alerts);
    }, (error) => {
      console.error('Error fetching emergency alerts:', error);
    });

    return () => unsubscribe();
  }, [currentUser, userLocation]);

  const dismissAlert = async (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    
    // Optionally log dismissal to database
    try {
      if (currentUser) {
        await updateDoc(doc(db, 'emergencyAlerts', alertId), {
          [`dismissedBy.${currentUser.uid}`]: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error logging alert dismissal:', error);
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-600',
          border: 'border-red-700',
          text: 'text-white',
          pulse: 'animate-pulse',
          glow: 'shadow-2xl shadow-red-500/50'
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-500',
          border: 'border-orange-600',
          text: 'text-white',
          pulse: 'animate-pulse',
          glow: 'shadow-xl shadow-orange-500/40'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-500',
          border: 'border-yellow-600',
          text: 'text-black',
          pulse: '',
          glow: 'shadow-lg shadow-yellow-500/30'
        };
      default:
        return {
          bg: 'bg-blue-500',
          border: 'border-blue-600',
          text: 'text-white',
          pulse: '',
          glow: 'shadow-lg shadow-blue-500/30'
        };
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const openLocationInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Filter out dismissed alerts
  const visibleAlerts = activeAlerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (!currentUser || visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[200] w-full max-w-2xl px-4">
      {visibleAlerts.map((alert) => {
        const styles = getSeverityStyles(alert.severity);
        const distance = userLocation ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          alert.location.lat,
          alert.location.lng
        ) : 0;

        return (
          <Card
            key={alert.id}
            className={`
              mb-3 border-4 ${styles.border} ${styles.bg} ${styles.text} 
              ${styles.pulse} ${styles.glow} backdrop-blur-sm
              transform transition-all duration-500 hover:scale-105
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-6 h-6 animate-bounce" />
                    <Badge className={`${alert.severity === 'CRITICAL' ? 'bg-white text-red-600' : 'bg-black/20 text-white'}`}>
                      <TranslatedText text={alert.severity} />
                    </Badge>
                    <Badge className="bg-black/20 text-white">
                      <MapPin className="w-3 h-3 mr-1" />
                      {distance.toFixed(1)}km away
                    </Badge>
                  </div>

                  {/* Title and Message */}
                  <h3 className="text-lg font-bold mb-2">
                    <TranslatedText text={alert.title} />
                  </h3>
                  <p className="text-sm mb-3 leading-relaxed">
                    <TranslatedText text={alert.message} />
                  </p>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-xs opacity-90">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(alert.issuedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span><TranslatedText text="Issued by" /> {alert.issuedBy}</span>
                    </div>
                    {alert.affectedArea && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span><TranslatedText text={alert.affectedArea} /></span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (onMapView) {
                          onMapView({
                            lat: alert.location.lat,
                            lng: alert.location.lng,
                            radius: alert.radius
                          });
                        } else {
                          openLocationInMaps(alert.location.lat, alert.location.lng);
                        }
                      }}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      <TranslatedText text="View Map" />
                    </Button>
                  </div>
                </div>

                {/* Dismiss Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => dismissAlert(alert.id)}
                  className="text-white hover:bg-white/20 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
