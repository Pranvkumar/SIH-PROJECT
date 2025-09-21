'use client';

import { useState, useRef, useEffect } from 'react';
import { Phone, X, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { auth, db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface EmergencyContact {
  name: string;
  number: string;
  type: 'police' | 'coast_guard' | 'emergency' | 'hospital';
}

const emergencyContacts: EmergencyContact[] = [
  { name: 'Police Emergency', number: '100', type: 'police' },
  { name: 'Coast Guard', number: '1554', type: 'coast_guard' },
  { name: 'Disaster Management', number: '108', type: 'emergency' },
  { name: 'Medical Emergency', number: '102', type: 'hospital' },
];

export default function SOSEmergencyButton() {
  const [pressCount, setPressCount] = useState(0);
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressAnimationRef = useRef<NodeJS.Timeout | null>(null);

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handlePress = () => {
    // Visual feedback
    setIsPressed(true);
    if (pressAnimationRef.current) clearTimeout(pressAnimationRef.current);
    pressAnimationRef.current = setTimeout(() => setIsPressed(false), 200);

    const newCount = pressCount + 1;
    setPressCount(newCount);
    
    // Clear existing timers
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    if (newCount >= 5) {
      // Start 3-second countdown after 5 presses
      setCountdown(3);
      countdownTimerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            triggerEmergency();
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Reset counter after 3 seconds if not completed
      resetTimerRef.current = setTimeout(() => {
        setPressCount(0);
      }, 3000);
    }
  };

  const cancelEmergency = () => {
    setPressCount(0);
    setCountdown(0);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  };

  const triggerEmergency = async () => {
    setShowEmergencyDialog(true);
    setPressCount(0);
    setCountdown(0);

    // Get current location and log emergency
    if (currentUser) {
      setIsLocationLoading(true);
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });

        const emergencyData = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || 'Unknown User',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          timestamp: Timestamp.now(),
          type: 'SOS_EMERGENCY',
          status: 'active',
          accuracy: position.coords.accuracy,
          priority: 'CRITICAL',
          description: 'Emergency SOS activated by user (5-tap method)'
        };

        // Log emergency alert to database
        await addDoc(collection(db, 'emergencyAlerts'), emergencyData);

        // Send notification to analysts and officials
        await addDoc(collection(db, 'notifications'), {
          type: 'SOS_EMERGENCY',
          title: 'CRITICAL: Emergency SOS Activated',
          message: `Emergency SOS triggered by ${emergencyData.userName} (${emergencyData.userEmail}) at coordinates ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
          targetRoles: ['analyst', 'official'],
          priority: 'CRITICAL',
          timestamp: Timestamp.now(),
          read: false,
          emergencyData: emergencyData,
          location: emergencyData.location
        });

        console.log('Emergency alert and notifications sent successfully');
      } catch (error) {
        console.error('Error logging emergency:', error);
        
        // Log without location if geolocation fails
        const emergencyDataNoLocation = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          userName: currentUser.displayName || 'Unknown User',
          timestamp: Timestamp.now(),
          type: 'SOS_EMERGENCY',
          status: 'active',
          locationError: 'Unable to get location',
          priority: 'CRITICAL',
          description: 'Emergency SOS activated by user (5-tap method, location unavailable)'
        };

        await addDoc(collection(db, 'emergencyAlerts'), emergencyDataNoLocation);

        // Send notification even without location
        await addDoc(collection(db, 'notifications'), {
          type: 'SOS_EMERGENCY',
          title: 'CRITICAL: Emergency SOS Activated',
          message: `Emergency SOS triggered by ${emergencyDataNoLocation.userName} (${emergencyDataNoLocation.userEmail}) - Location unavailable`,
          targetRoles: ['analyst', 'official'],
          priority: 'CRITICAL',
          timestamp: Timestamp.now(),
          read: false,
          emergencyData: emergencyDataNoLocation,
          locationError: 'Unable to get location'
        });
      } finally {
        setIsLocationLoading(false);
      }
    }
  };

  const callEmergencyNumber = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (pressAnimationRef.current) clearTimeout(pressAnimationRef.current);
    };
  }, []);

  return (
    <>
      {/* Simple SOS Button */}
      <div 
        className="fixed bottom-6 left-6 sm:left-72 md:left-80 lg:left-72 xl:left-80 z-50" 
      >
        <div className="relative">
          {/* Main SOS Button */}
          <button
            onClick={handlePress}
            className={`
              relative w-16 h-16 rounded-full transition-all duration-200 ease-out
              ${countdown > 0 
                ? 'bg-red-500 animate-pulse shadow-2xl shadow-red-500/50 scale-110' 
                : isPressed 
                  ? 'bg-red-600 scale-95 shadow-xl' 
                  : 'bg-red-500 hover:bg-red-600 shadow-lg hover:shadow-xl hover:scale-105'
              }
              border-4 border-white text-white font-bold
              focus:outline-none focus:ring-4 focus:ring-red-300/50
            `}
            style={{
              filter: countdown > 0 ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))' : 'none',
            }}
          >
            {countdown > 0 ? (
              <span className="text-2xl font-bold animate-bounce">{countdown}</span>
            ) : (
              <span className="text-sm font-bold">SOS</span>
            )}
          </button>

          {/* Press Counter */}
          {pressCount > 0 && countdown === 0 && (
            <div className="absolute -top-14 left-1/2 transform -translate-x-1/2">
              <div className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          i < pressCount ? 'bg-red-400' : 'bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span>{pressCount}/5</span>
                </div>
                <div className="text-center mt-1 text-gray-300 text-xs">
                  <TranslatedText text="Tap 5 times for emergency" />
                </div>
              </div>
            </div>
          )}

          {/* Countdown Warning */}
          {countdown > 0 && (
            <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-64">
              <div className="bg-red-600/95 text-white text-sm px-4 py-3 rounded-lg backdrop-blur-sm border-2 border-red-300 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">
                      <TranslatedText text="Emergency Alert" />
                    </div>
                    <div className="text-xs opacity-90">
                      <TranslatedText text="Activating in" /> {countdown}s
                    </div>
                  </div>
                  <button
                    onClick={cancelEmergency}
                    className="bg-white/20 hover:bg-white/30 rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {pressCount === 0 && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-48">
              <div className="bg-gray-800/80 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm text-center">
                <TranslatedText text="Tap 5 times quickly for emergency" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Dialog */}
      <Dialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <TranslatedText text="Emergency Alert Activated" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedText text="Your emergency alert has been sent. Contact emergency services immediately." />
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {isLocationLoading && (
              <div className="text-center py-2">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                  <MapPin className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <TranslatedText text="Getting your location..." />
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">
                <TranslatedText text="Emergency Contacts" />
              </h3>
              <div className="grid gap-2">
                {emergencyContacts.map((contact, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="justify-start h-auto p-3 hover:bg-red-50 hover:border-red-200"
                    onClick={() => callEmergencyNumber(contact.number)}
                  >
                    <Phone className="w-4 h-4 mr-3 text-red-600" />
                    <div className="text-left">
                      <div className="font-medium">
                        <TranslatedText text={contact.name} />
                      </div>
                      <div className="text-sm text-gray-600">{contact.number}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <TranslatedText text="Your location and emergency alert have been logged. Emergency services may contact you shortly." />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
