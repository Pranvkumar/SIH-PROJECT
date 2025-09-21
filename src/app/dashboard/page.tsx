
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RedditHazardFeed } from '@/components/reddit-hazard-feed';
import { ShieldAlert, LayoutDashboard, LogOut, Map, Megaphone, ShieldAlert as ShieldAlertIcon, BarChart2, MessageSquare, FileText } from 'lucide-react';
import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import FloatingReportButton from '@/components/floating-report-button';
import SOSEmergencyButton from '@/components/sos-emergency-button-new';
import NotificationSystem from '@/components/notification-system';
import EmergencyAlertSystem from '@/components/emergency-alert-system';
import CommunityFeed from '@/components/community-feed';
import LiveMap from '@/components/live-map';
import MyReports from '@/components/my-reports';
import OfficialDashboard from '@/components/official-dashboard';
import OfficialSocialMediaFeed from '@/components/official-social-media-feed-new';
import SocialMediaManagement from '@/components/social-media-management';
import AnalystDashboard from '@/components/analyst-dashboard';
import AllReports from '@/components/all-reports';
import { LanguageSelector } from '@/components/language-selector';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


interface UserData {
  name: string;
  role: string;
}

function Dashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [alertLocation, setAlertLocation] = useState<{ lat: number; lng: number; radius: number } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      if (user) {
        setCurrentUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        } else {
          // Handle case where user exists in Auth but not Firestore
          console.error("User data not found in Firestore.");
          // You might want to sign them out or redirect
        }
      } else {
        // No user is signed in - only redirect if we're not already redirecting
        console.log('No user detected, redirecting to login...');
        setCurrentUser(null);
        setUserData(null);
        // Use replace instead of push to prevent back button issues
        router.replace('/');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      console.log('Logging out user...');
      await auth.signOut();
      console.log('User signed out successfully');
      // Clear local state immediately
      setCurrentUser(null);
      setUserData(null);
      setLoading(false);
      // Force redirect to home page
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
      // Still redirect even if there's an error
      router.replace('/');
    }
  };

  const handleAlertMapView = (location: { lat: number; lng: number; radius: number }) => {
    setAlertLocation(location);
    setActiveView('map');
  };
  
  const CitizenDashboard = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <CommunityFeed />
    </div>
  );

  const LiveMapView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <LiveMap alertLocation={alertLocation} />
    </div>
  );

  const MyReportsView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <MyReports />
    </div>
  );

  const OfficialDashboardView = () => (
     <div className="p-4 sm:p-6 lg:p-8">
        <OfficialDashboard />
    </div>
  );

  const CitizenSocialMediaView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          <TranslatedText text="Social Media Updates" />
        </h1>
        <p className="text-gray-600">
          <TranslatedText text="Stay informed with real-time social media updates about coastal hazards and emergencies in your area." />
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            <TranslatedText text="Official Updates" />
          </h2>
          <OfficialSocialMediaFeed />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">
            <TranslatedText text="Reddit Ocean Hazard Alerts" />
          </h2>
          <div className="bg-white rounded-lg shadow">
            <RedditHazardFeed />
          </div>
        </div>
      </div>
    </div>
  );

  const OfficialSocialMediaView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
        <SocialMediaManagement />
    </div>
  );



  const AnalystDashboardView = () => (
     <div className="p-4 sm:p-6 lg:p-8">
        <AnalystDashboard />
    </div>
  );

  const AllReportsView = () => (
    <div className="p-4 sm:p-6 lg:p-8">
      <AllReports />
    </div>
  );

  const AuthStatusCheck = () => (
     <div className="p-4 sm:p-6 lg:p-8 pt-0">
        <Card>
            <CardHeader>
                <CardTitle>
                    <TranslatedText text="Authentication Status" />
                </CardTitle>
                <CardDescription>
                    <TranslatedText text="This box checks the live Firebase Auth state and user data from Firestore." />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    <p className="font-semibold">
                        <TranslatedText text="Live Auth Status:" />
                    </p>
                    {loading ? (
                        <p><TranslatedText text="Checking..." /></p>
                    ) : currentUser ? (
                        <p className="font-bold text-green-600">
                            <TranslatedText text="Logged In" />
                        </p>
                    ) : (
                        <p className="font-bold text-red-600">
                            <TranslatedText text="Not Logged In" />
                        </p>
                    )}

                    <p className="font-semibold">
                        <TranslatedText text="Live User Email:" />
                    </p>
                     {loading ? (
                        <p><TranslatedText text="Checking..." /></p>
                    ) : (
                        <p className="break-all">{currentUser?.email || 'N/A'}</p>
                     )}
                    
                     <p className="font-semibold">
                        <TranslatedText text="Name from DB:" />
                     </p>
                     <p className="break-words">{userData?.name || <TranslatedText text="Loading..." />}</p>

                     <p className="font-semibold">
                        <TranslatedText text="Role from DB:" />
                     </p>
                     <p>
                        <TranslatedText text={userData?.role || 'Loading...'} />
                     </p>
                </div>
            </CardContent>
        </Card>
    </div>
  )


  const renderRoleSpecificContent = () => {
    if (loading) return <p className="p-8">Loading dashboard...</p>;
    
    // Handle view switching
    if (activeView === 'map') {
      return <LiveMapView />;
    }
    
    if (activeView === 'reports') {
      return <MyReportsView />;
    }

    if (activeView === 'all-reports') {
      return <AllReportsView />;
    }

    if (activeView === 'social-media') {
      // Different social media views based on role
      if (userData?.role === 'citizen') {
        return <CitizenSocialMediaView />;
      } else {
        return <OfficialSocialMediaView />;
      }
    }
    
    switch (userData?.role) {
      case 'citizen':
        return <CitizenDashboard />;
      case 'official':
        return <OfficialDashboardView />;
      case 'analyst':
        return <AnalystDashboardView />;
      default:
        return (
          <div className="p-8">
            <p>Role not found or invalid. Please sign in again.</p>
          </div>
        );
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      {
        href: '#',
        icon: LayoutDashboard,
        label: 'Dashboard',
        view: 'dashboard'
      },
      {
        href: '#',
        icon: Map,
        label: 'Live Map',
        view: 'map'
      }
    ];
    
    const role = userData?.role;

    if (role === 'citizen') {
      return [
        ...baseItems,
        {
          href: '#',
          icon: MessageSquare,
          label: 'Social Media',
          view: 'social-media'
        },
        {
          href: '#',
          icon: Megaphone,
          label: 'My Reports',
          view: 'reports'
        }
      ]
    }

    if (role === 'official') {
      return [
        ...baseItems,
        {
          href: '#',
          icon: ShieldAlertIcon,
          label: 'Recent Reports',
          view: 'reports'
        },
        {
          href: '#',
          icon: FileText,
          label: 'All Reports',
          view: 'all-reports'
        },
        {
          href: '#',
          icon: MessageSquare,
          label: 'Social Media',
          view: 'social-media'
        }
      ]
    }
     if (role === 'analyst') {
      return [
        ...baseItems,
        {
          href: '#',
          icon: BarChart2,
          label: 'Analytics',
          view: 'analytics'
        },
        {
          href: '#',
          icon: FileText,
          label: 'All Reports',
          view: 'all-reports'
        }
      ]
    }
    return baseItems;

  }
  
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <p>Loading...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <ShieldAlert className="w-8 h-8 text-primary" />
            <span className="text-lg font-semibold">CORSAIR</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {getMenuItems().map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton 
                  onClick={() => setActiveView(item.view || 'dashboard')}
                  isActive={
                    (item.view === 'dashboard' && activeView === 'dashboard') ||
                    (item.view === activeView)
                  }>
                  <item.icon/>
                  <TranslatedText text={item.label} />
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout}>
                <LogOut />
                <TranslatedText text="Logout" />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex flex-col sm:flex-row h-16 sm:h-20 items-center justify-between border-b bg-gradient-to-r from-slate-50 to-blue-50 px-3 sm:px-6 shadow-sm">
          {/* Left side with sidebar trigger and welcome message */}
          <div className="flex items-center gap-3 sm:w-auto w-full justify-between sm:justify-start">
            <SidebarTrigger className="lg:hidden" />
            {/* Welcome Message - moved to left side with bigger size */}
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl lg:text-3xl font-playfair font-medium text-slate-600">
                <TranslatedText text="Welcome" />
              </span>
              <span className="text-2xl sm:text-3xl lg:text-4xl font-dancing font-bold text-blue-600">
                {userData?.name || 'User'}
              </span>
              <span className="text-xl sm:text-2xl lg:text-3xl font-playfair font-medium text-slate-600">!</span>
            </div>
          </div>

          {/* Right side content with notifications */}
          <div className="flex items-center gap-3 sm:w-auto w-full justify-end sm:justify-end">
            {/* Notifications moved back to right side */}
            {(userData?.role === 'analyst' || userData?.role === 'official') && (
              <NotificationSystem userRole={userData?.role} />
            )}
            <LanguageSelector variant="button" />
          </div>
        </header>
        {renderRoleSpecificContent()}
        <AuthStatusCheck />
        
        {/* Floating Report Button - only show for citizens */}
        {userData?.role === 'citizen' && <FloatingReportButton />}
        
        {/* SOS Emergency Button - only show for citizens */}
        {userData?.role === 'citizen' && <SOSEmergencyButton />}
        
        {/* Emergency Alert System - only show for citizens */}
        {userData?.role === 'citizen' && <EmergencyAlertSystem userRole={userData?.role} onMapView={handleAlertMapView} />}
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Dashboard />
        </Suspense>
    )
}
