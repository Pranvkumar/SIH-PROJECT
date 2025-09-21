'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, X, MapPin, User, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: any;
  read: boolean;
  emergencyData?: any;
  location?: { lat: number; lng: number };
  locationError?: string;
}

interface NotificationSystemProps {
  userRole: string | null;
}

export default function NotificationSystem({ userRole }: NotificationSystemProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch notifications for analysts and officials
  useEffect(() => {
    console.log('🔔 NotificationSystem useEffect triggered');
    console.log('Current user:', currentUser?.email);
    console.log('User role:', userRole);
    
    if (!currentUser || !userRole || !['analyst', 'official'].includes(userRole)) {
      console.log('❌ Conditions not met for notifications:', {
        hasUser: !!currentUser,
        role: userRole,
        isValidRole: userRole && ['analyst', 'official'].includes(userRole)
      });
      return;
    }

    console.log('✅ Setting up notification listener for role:', userRole);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('targetRoles', 'array-contains', userRole),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('📨 Notification snapshot received, docs:', snapshot.docs.length);
      const fetchedNotifications: Notification[] = [];
      let unreadCounter = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('📋 Notification doc:', doc.id, data);
        const notification: Notification = {
          id: doc.id,
          type: data.type || 'GENERAL',
          title: data.title || 'Notification',
          message: data.message || '',
          priority: data.priority || 'MEDIUM',
          timestamp: data.timestamp,
          read: data.read || false,
          emergencyData: data.emergencyData,
          location: data.location,
          locationError: data.locationError
        };

        fetchedNotifications.push(notification);
        if (!notification.read) unreadCounter++;
      });

      console.log('🔢 Setting notifications:', fetchedNotifications.length, 'unread:', unreadCounter);
      setNotifications(fetchedNotifications);
      setUnreadCount(unreadCounter);
    }, (error) => {
      console.log('❌ Notification query error:', error.message);
      console.log('Error code:', error.code);
      // Gracefully handle the index building error
      if (error.code === 'failed-precondition') {
        console.log('🔄 Firestore index is still building. Notifications will load once complete.');
        // Set empty notifications for now
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Unexpected notification query error:', error);
      }
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  const markAsRead = async (notificationId: string) => {
    try {
      if (!notificationId || !notificationId.trim()) {
        console.error('No notification ID provided for mark as read');
        return;
      }
      
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const openNotificationDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openLocationInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const clearOldNotifications = async () => {
    if (!currentUser || !userRole) return;
    
    setIsClearing(true);
    try {
      // Calculate date 5 days ago
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fiveDaysAgoTimestamp = Timestamp.fromDate(fiveDaysAgo);
      
      // Query all notifications for this user role first (to avoid composite index requirement)
      const notificationsRef = collection(db, 'notifications');
      const userNotificationsQuery = query(
        notificationsRef,
        where('targetRoles', 'array-contains', userRole)
      );
      
      const querySnapshot = await getDocs(userNotificationsQuery);
      
      // Filter old notifications on client side
      const oldNotificationDocs = querySnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.timestamp && data.timestamp.toDate() < fiveDaysAgo;
      });
      
      // Delete old notifications
      const deletePromises = oldNotificationDocs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      const clearedCount = oldNotificationDocs.length;
      console.log(`✅ Cleared ${clearedCount} old notifications`);
      
      // Show success toast
      if (clearedCount > 0) {
        toast({
          title: "Notifications Cleared",
          description: `Successfully cleared ${clearedCount} notifications older than 5 days.`,
          variant: "default",
        });
      } else {
        toast({
          title: "No Old Notifications",
          description: "No notifications older than 5 days found to clear.",
          variant: "default",
        });
      }
      
    } catch (error) {
      console.error('❌ Error clearing old notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear old notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (!userRole || !['analyst', 'official'].includes(userRole)) {
    console.log('🚫 NotificationSystem not rendering - invalid role:', userRole);
    return null;
  }

  console.log('🎯 NotificationSystem rendering with:', {
    userRole,
    currentUser: currentUser?.email,
    notificationsCount: notifications.length,
    unreadCount
  });

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNotifications(true)}
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-600 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notifications Panel */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <TranslatedText text="Notifications" />
              {unreadCount > 0 && (
                <Badge className="bg-red-600 text-white">
                  {unreadCount} <TranslatedText text="new" />
                </Badge>
              )}
              <div className="ml-auto">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearOldNotifications}
                        disabled={isClearing}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {isClearing ? (
                          <TranslatedText text="Clearing..." />
                        ) : (
                          <TranslatedText text="Clear Old" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p><TranslatedText text="Clear notifications older than 5 days" /></p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[60vh] space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  <TranslatedText text="No notifications yet" />
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  } ${notification.priority === 'CRITICAL' ? 'border-l-4 border-l-red-500 bg-red-50/50' : ''}`}
                  onClick={() => openNotificationDetails(notification)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {notification.type === 'SOS_EMERGENCY' ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Bell className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm truncate">
                            {notification.title}
                          </h3>
                          <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(notification.timestamp)}
                          </div>
                          
                          {notification.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <TranslatedText text="Location available" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Details Modal */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedNotification && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedNotification.type === 'SOS_EMERGENCY' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Bell className="h-5 w-5 text-blue-600" />
                  )}
                  {selectedNotification.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority}
                  </Badge>
                  <div className="text-sm text-gray-600">
                    {formatTimestamp(selectedNotification.timestamp)}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>

                {selectedNotification.emergencyData && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">
                      <TranslatedText text="Emergency Details" />
                    </h4>
                    
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {selectedNotification.emergencyData.userName}
                        </span>
                        <span className="text-gray-600">
                          ({selectedNotification.emergencyData.userEmail})
                        </span>
                      </div>
                      
                      {selectedNotification.location ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>
                            {selectedNotification.location.lat.toFixed(4)}, {selectedNotification.location.lng.toFixed(4)}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openLocationInMaps(selectedNotification.location!.lat, selectedNotification.location!.lng)}
                            className="ml-auto"
                          >
                            <TranslatedText text="Open in Maps" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600">
                          <MapPin className="h-4 w-4" />
                          <span><TranslatedText text="Location unavailable" /></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
