'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCcw, MapPin, Calendar, Image, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';

interface Report {
  id: string;
  eventType: string;
  description: string;
  location: { lat: number; lng: number };
  photoUrl: string;
  status: string;
  createdAt: Timestamp;
  fileName?: string;
}

export default function MyReports() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Listen to authentication state changes
  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      setUser(user);
      if (!user) {
        setReports([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReports = () => {
    if (!user) {
      console.log('No user available for fetching reports');
      return;
    }

    console.log('Fetching reports for user:', user.uid);
    setRefreshing(true);
    
    const reportsRef = collection(db, 'reports');
    // Simplified query - just filter by userId for now
    const q = query(
      reportsRef,
      where('userId', '==', user.uid)
    );

    console.log('Setting up Firestore listener...');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Firestore snapshot received, docs count:', snapshot.size);
      const reportsData: Report[] = [];
      snapshot.forEach((doc) => {
        console.log('Report doc:', doc.id, doc.data());
        reportsData.push({
          id: doc.id,
          ...doc.data()
        } as Report);
      });
      
      // Sort by createdAt in JavaScript instead of Firestore
      reportsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      console.log('Total reports loaded:', reportsData.length);
      setReports(reportsData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error('Error fetching reports:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    if (user) {
      console.log('User available, fetching reports...');
      const unsubscribe = fetchReports();
      return unsubscribe;
    } else {
      console.log('No user, skipping report fetch');
    }
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case 'under_review':
      case 'reviewing':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'new':
      default:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Unknown date';
    try {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatLocation = (location: { lat: number; lng: number }) => {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Reports</CardTitle>
            <CardDescription>Please sign in to view your reports.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Reports</CardTitle>
            <CardDescription>Loading your submitted reports...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
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
              <CardTitle className="text-lg sm:text-xl">My Reports</CardTitle>
              <CardDescription className="text-sm">
                Track the status of all your submitted coastal hazard reports.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchReports}
              disabled={refreshing}
              className="self-start sm:self-auto"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
              <p className="text-gray-500 mb-4">
                You haven&apos;t submitted any coastal hazard reports yet.
              </p>
              <p className="text-sm text-gray-400">
                Use the floating red button to report your first incident!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-blue-500 h-fit overflow-hidden">
                  {report.photoUrl && (
                    <div className="relative">
                      <img 
                        src={report.photoUrl} 
                        alt="Report evidence"
                        className="w-full h-48 sm:h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onClick={() => window.open(report.photoUrl, '_blank')}
                      />
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        {getStatusBadge(report.status)}
                      </div>
                    </div>
                  )}
                  <CardContent className="p-3 sm:p-4">
                    <div className={`flex justify-between items-start ${report.photoUrl ? 'mb-2' : 'mb-3'}`}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base sm:text-lg capitalize mb-1 truncate">
                          <TranslatedText text={report.eventType?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Unknown Event'} />
                        </h3>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{formatDate(report.createdAt)}</span>
                        </div>
                      </div>
                      {!report.photoUrl && (
                        <div className="ml-2 flex-shrink-0">
                          {getStatusBadge(report.status)}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 mb-3 leading-relaxed text-xs sm:text-sm line-clamp-3">
                      {report.description}
                    </p>
                    
                    <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{formatLocation(report.location)}</span>
                      </div>
                      
                      {report.photoUrl && (
                        <div className="flex items-center">
                          <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <a 
                            href={report.photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline truncate"
                          >
                            View Full Size
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {reports.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                <span><strong>Approved:</strong> Report verified and added to the official database</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-blue-600" />
                <span><strong>Pending/Under Review:</strong> Report is being evaluated by officials</span>
              </div>
              <div className="flex items-center">
                <XCircle className="w-4 h-4 mr-1 text-red-600" />
                <span><strong>Rejected:</strong> Report did not meet verification criteria</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
