'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { isWithinLastDays } from '@/lib/location-utils';
import { 
  RefreshCcw, 
  MapPin, 
  Calendar, 
  Image, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  ThumbsDown,
  User,
  Phone,
  Mail
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  doc, 
  updateDoc,
  where,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Report {
  id: string;
  userId: string;
  eventType: string;
  description: string;
  location: { lat: number; lng: number };
  photoUrl: string;
  status: string;
  createdAt: Timestamp;
  fileName?: string;
  // User info (to be populated)
  userEmail?: string;
  userName?: string;
}

export default function OfficialDashboard() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setReports([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchReports = () => {
    if (!user) return;

    setRefreshing(true);
    
    const reportsRef = collection(db, 'reports');
    const q = query(
      reportsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reportsData: Report[] = [];
      
      // Process each report and fetch user info
      for (const docSnapshot of snapshot.docs) {
        const reportData = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as Report;

        // Fetch user info for each report
        try {
          if (reportData.userId) {
            const userDocRef = doc(db, 'users', reportData.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              reportData.userName = userData.name;
              reportData.userEmail = userData.email;
            }
          } else {
            console.warn('Report has no userId:', reportData.id);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }

        reportsData.push(reportData);
      }
      
      setReports(reportsData);
      
      // Filter to show only reports from the last 2 days on main dashboard
      const recentReports = reportsData.filter(report => {
        if (!report.createdAt) return false;
        const reportDate = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt.seconds * 1000);
        return isWithinLastDays(reportDate, 2);
      });
      
      setFilteredReports(recentReports);
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
      const unsubscribe = fetchReports();
      return unsubscribe;
    }
  }, [user]);

  // Filter reports based on search and status (only recent reports)
  useEffect(() => {
    // Start with reports from the last 2 days
    const recentReports = reports.filter(report => {
      if (!report.createdAt) return false;
      const reportDate = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt.seconds * 1000);
      return isWithinLastDays(reportDate, 2);
    });

    let filtered = recentReports;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.eventType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter]);

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

  const handleStatusUpdate = async (reportId: string, newStatus: string) => {
    try {
      if (!reportId || !reportId.trim()) {
        console.error('No report ID provided for status update');
        return;
      }
      
      console.log('Updating report:', reportId, 'to status:', newStatus); // Debug log
      
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: user?.uid
      });

      toast({
        title: "Status Updated",
        description: `Report has been ${newStatus}.`,
      });

      setSelectedReport(null);
      setActionType(null);
      
      console.log('Status update successful'); // Debug log
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update report status. Please try again.",
      });
    }
  };

  const getStatusCounts = () => {
    // Calculate counts from recent reports only (last 2 days)
    const recentReports = reports.filter(report => {
      if (!report.createdAt) return false;
      const reportDate = report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt.seconds * 1000);
      return isWithinLastDays(reportDate, 2);
    });

    const counts = {
      total: recentReports.length,
      pending: recentReports.filter(r => r.status === 'new').length,
      reviewing: recentReports.filter(r => r.status === 'under_review' || r.status === 'reviewing').length,
      approved: recentReports.filter(r => r.status === 'approved').length,
      rejected: recentReports.filter(r => r.status === 'rejected').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (!user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Official Command Center</CardTitle>
            <CardDescription>Please sign in to access the official dashboard.</CardDescription>
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
            <CardTitle>Official Command Center</CardTitle>
            <CardDescription>Loading reports...</CardDescription>
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
      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.reviewing}</div>
            <p className="text-xs text-muted-foreground">Reviewing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.approved}</div>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Official Command Center</CardTitle>
              <CardDescription className="text-sm">
                Recent reports from the last 2 days. View all historical reports in "All Reports" section.
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
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports, users, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="new">Pending Review</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
              <p className="text-gray-500 mb-4">
                {reports.length === 0 
                  ? "No coastal hazard reports have been submitted yet."
                  : "No reports match your current filters."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg capitalize">
                            <TranslatedText text={report.eventType?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Unknown Event'} />
                          </h3>
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="truncate">{report.userName || 'Unknown User'}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="truncate">{report.userEmail || 'No email'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-3 leading-relaxed text-sm sm:text-base">
                      {report.description}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        <span className="truncate">{formatLocation(report.location)}</span>
                      </div>
                      
                      {report.photoUrl && (
                        <div className="flex items-center">
                          <Image className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <a 
                            href={report.photoUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            View Evidence Photo
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Photo Preview */}
                    {report.photoUrl && (
                      <div className="mb-4">
                        <img 
                          src={report.photoUrl} 
                          alt="Report evidence"
                          className="w-full max-w-md h-32 sm:h-48 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          loading="lazy"
                          onClick={() => window.open(report.photoUrl, '_blank')}
                        />
                      </div>
                    )}

                    {/* Action Buttons */}
                    {report.status === 'new' && (
                      <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 text-xs sm:text-sm"
                          onClick={() => handleStatusUpdate(report.id, 'under_review')}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Mark as Reviewing
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50 text-xs sm:text-sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionType('approve');
                          }}
                        >
                          <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs sm:text-sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionType('reject');
                          }}
                        >
                          <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {report.status === 'under_review' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionType('approve');
                          }}
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            setSelectedReport(report);
                            setActionType('reject');
                          }}
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedReport && !!actionType} onOpenChange={() => {
        setSelectedReport(null);
        setActionType(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'approve' ? 'Approve Report' : 'Reject Report'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} this coastal hazard report?
              {actionType === 'approve' && ' This will mark it as verified and add it to the official database.'}
              {actionType === 'reject' && ' This action will mark the report as invalid.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedReport && actionType) {
                  const status = actionType === 'approve' ? 'approved' : 'rejected';
                  handleStatusUpdate(selectedReport.id, status);
                }
              }}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {actionType === 'approve' ? 'Approve Report' : 'Reject Report'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
