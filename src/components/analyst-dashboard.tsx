'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCcw, 
  MapPin, 
  Calendar, 
  Image, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Siren,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, updateDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { calculateDistance, isWithinLastDays, getCurrentLocation } from '@/lib/location-utils';

interface ApprovedReport {
  id: string;
  eventType: string;
  description: string;
  location: { lat: number; lng: number };
  photoUrl?: string;
  createdAt: any;
  approvedAt: any;
  userName?: string;
  userEmail?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  alertIssued?: boolean;
  alertIssuedAt?: any;
  alertIssuedBy?: string;
}

interface AlertData {
  reportId: string;
  alertType: 'warning' | 'evacuation' | 'advisory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  radius: number; // in km
  location: { lat: number; lng: number };
  issuedBy: string;
  issuedAt: any;
}

export default function AnalystDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<ApprovedReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ApprovedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [alertFilter, setAlertFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ApprovedReport | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [isSeverityEditOpen, setIsSeverityEditOpen] = useState(false);
  const [editingSeverityFor, setEditingSeverityFor] = useState<string | null>(null);
  const [newSeverity, setNewSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [alertForm, setAlertForm] = useState({
    alertType: 'warning' as 'warning' | 'evacuation' | 'advisory',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    message: '',
    radius: 15
  });
  const [issuingAlert, setIssuingAlert] = useState(false);

  // Authentication and location
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);
      
      // Get user location for analysts
      if (user) {
        try {
          const location = await getCurrentLocation();
          setUserLocation(location);
          // Save location to localStorage for future use
          localStorage.setItem('userLocation', JSON.stringify(location));
        } catch (error) {
          console.error('Error getting user location:', error);
          // Try to use saved location
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              setUserLocation(JSON.parse(savedLocation));
            } catch (e) {
              console.error('Error parsing saved location:', e);
            }
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch approved reports with photos
  useEffect(() => {
    if (!currentUser) return;

      const fetchReports = () => {
        const reportsRef = collection(db, 'reports');
        const q = query(
          reportsRef,
          where('status', '==', 'approved')
        );      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedReports: ApprovedReport[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Analyst Dashboard: Processing report:', doc.id, data);
          
          // Only include reports that have photos and valid data
          if (doc.id && data && data.photoUrl && data.location) {
            fetchedReports.push({
              id: doc.id,
              eventType: data.eventType || 'unknown',
              description: data.description || '',
              location: data.location || { lat: 0, lng: 0 },
              photoUrl: data.photoUrl,
              createdAt: data.createdAt,
              approvedAt: data.approvedAt || data.updatedAt,
              userName: data.userName || 'Unknown User',
              userEmail: data.userEmail || 'No email',
              severity: data.severity || 'medium',
              alertIssued: data.alertIssued || false,
              alertIssuedAt: data.alertIssuedAt,
              alertIssuedBy: data.alertIssuedBy
            });
          } else {
            console.warn('Analyst Dashboard: Skipping invalid report:', doc.id, data);
          }
        });
        
        // Sort reports by approvedAt date (newest first) on the client side
        fetchedReports.sort((a, b) => {
          const dateA = a.approvedAt?.toDate ? a.approvedAt.toDate() : new Date(a.approvedAt);
          const dateB = b.approvedAt?.toDate ? b.approvedAt.toDate() : new Date(b.approvedAt);
          return dateB.getTime() - dateA.getTime();
        });
        
        setReports(fetchedReports);
      });

      return () => unsubscribe();
    };

    return fetchReports();
  }, [currentUser]);

  // Filter reports with location (100km radius) and time (last 2 days) constraints
  useEffect(() => {
    let filtered = reports;

    // Apply location filter for analysts (100km radius)
    if (userLocation) {
      filtered = filtered.filter(report => {
        if (!report.location) return false;
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          report.location.lat,
          report.location.lng
        );
        return distance <= 100; // 100km radius
      });
    }

    // Apply time filter (last 2 days)
    filtered = filtered.filter(report => {
      if (!report.approvedAt) return false;
      const reportDate = report.approvedAt.toDate ? report.approvedAt.toDate() : new Date(report.approvedAt.seconds * 1000);
      return isWithinLastDays(reportDate, 2);
    });

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(report => report.severity === severityFilter);
    }

    // Apply alert filter
    if (alertFilter === 'issued') {
      filtered = filtered.filter(report => report.alertIssued);
    } else if (alertFilter === 'not-issued') {
      filtered = filtered.filter(report => !report.alertIssued);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, severityFilter, alertFilter, userLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatLocation = (location: { lat: number; lng: number }) => {
    return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-green-100 text-green-800 border-green-200'
    };
    
    return (
      <Badge variant="outline" className={colors[severity as keyof typeof colors] || colors.medium}>
        <TranslatedText text={severity.charAt(0).toUpperCase() + severity.slice(1)} />
      </Badge>
    );
  };

  const openAlertDialog = (report: ApprovedReport) => {
    if (!report?.id || !report?.location) {
      console.error('Invalid report data for alert dialog');
      return;
    }
    
    setSelectedReport(report);
    setAlertForm({
      alertType: 'warning',
      severity: report.severity || 'medium',
      message: `Alert: ${report.eventType} reported at ${formatLocation(report.location)}. Please exercise caution in the area.`,
      radius: 15
    });
    setIsAlertDialogOpen(true);
  };

  const issueAlert = async () => {
    if (!selectedReport || !currentUser) return;

    setIssuingAlert(true);
    try {
      // Create alert document
      const alertData: AlertData = {
        reportId: selectedReport.id,
        alertType: alertForm.alertType,
        severity: alertForm.severity,
        message: alertForm.message,
        radius: alertForm.radius,
        location: selectedReport.location,
        issuedBy: currentUser.email || 'Unknown Analyst',
        issuedAt: Timestamp.now()
      };

      await addDoc(collection(db, 'alerts'), alertData);

      // Create emergency alert for location-based notifications (15km radius)
      const emergencyAlertData = {
        id: `emergency_${Date.now()}`,
        title: `${alertForm.alertType} Alert`,
        message: alertForm.message,
        severity: alertForm.severity,
        location: selectedReport.location,
        radius: Math.max(alertForm.radius, 15000), // At least 15km or user-specified radius
        issuedBy: currentUser.email || 'Unknown Analyst',
        issuedAt: Timestamp.now(),
        active: true,
        dismissedBy: [] // Array to track which users have dismissed this alert
      };

      await addDoc(collection(db, 'emergencyAlerts'), emergencyAlertData);

      // Update report to mark alert as issued
      if (selectedReport?.id) {
        await updateDoc(doc(db, 'reports', selectedReport.id), {
          alertIssued: true,
          alertIssuedAt: Timestamp.now(),
          alertIssuedBy: currentUser.email
        });
      }

      setIsAlertDialogOpen(false);
      setSelectedReport(null);
    } catch (error) {
      console.error('Error issuing alert:', error);
    } finally {
      setIssuingAlert(false);
    }
  };

  const openSeverityEdit = (report: ApprovedReport) => {
    if (!report?.id) {
      console.error('Invalid report data for severity edit');
      return;
    }
    
    setEditingSeverityFor(report.id);
    setNewSeverity(report.severity || 'medium');
    setIsSeverityEditOpen(true);
  };

  const updateSeverity = async () => {
    if (!editingSeverityFor || !editingSeverityFor.trim()) {
      console.error('No report ID provided for severity update');
      return;
    }

    try {
      await updateDoc(doc(db, 'reports', editingSeverityFor), {
        severity: newSeverity,
        severityUpdatedAt: Timestamp.now(),
        severityUpdatedBy: currentUser?.email || 'Unknown Analyst'
      });

      setIsSeverityEditOpen(false);
      setEditingSeverityFor(null);
    } catch (error) {
      console.error('Error updating severity:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">
              <TranslatedText text="Analyst Dashboard" />
            </CardTitle>
            <CardDescription>
              <TranslatedText text="Please sign in to access the analyst dashboard." />
            </CardDescription>
          </CardHeader>
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
                <TranslatedText text="Analyst Dashboard" />
              </CardTitle>
              <CardDescription className="text-sm">
                <TranslatedText text="Review recent approved reports within 100km radius (last 2 days). View all reports in 'All Reports' section." />
                {userLocation && (
                  <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location-based filtering active ({userLocation.lat.toFixed(3)}, {userLocation.lng.toFixed(3)})
                  </div>
                )}
                {!userLocation && (
                  <div className="mt-2 text-xs text-orange-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location access needed for radius filtering
                  </div>
                )}
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="self-start sm:self-auto"
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <TranslatedText text="Refresh" />
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
                  placeholder="Search reports, descriptions, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={alertFilter} onValueChange={setAlertFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Siren className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Alert Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reports</SelectItem>
                <SelectItem value="issued">Alert Issued</SelectItem>
                <SelectItem value="not-issued">No Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                <TranslatedText text="No Reports Found" />
              </h3>
              <p className="text-gray-500 mb-4">
                {reports.length === 0 
                  ? <TranslatedText text="No approved reports with photos available yet." />
                  : <TranslatedText text="No reports match your current filters." />
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Report Photo */}
                      {report.photoUrl && (
                        <div className="lg:w-48 lg:flex-shrink-0">
                          <img 
                            src={report.photoUrl} 
                            alt="Report evidence"
                            className="w-full h-32 lg:h-40 object-cover rounded-lg border"
                          />
                        </div>
                      )}
                      
                      {/* Report Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <h3 className="font-semibold text-lg capitalize">
                                <TranslatedText text={report.eventType?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Unknown Event'} />
                              </h3>
                              <div className="flex items-center gap-2">
                                {getSeverityBadge(report.severity || 'medium')}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSeverityEdit(report)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <TranslatedText text="Edit" />
                                </Button>
                              </div>
                              {report.alertIssued && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <Siren className="w-3 h-3 mr-1" />
                                  <TranslatedText text="Alert Issued" />
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-2">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span><TranslatedText text="Approved:" /> {formatDate(report.approvedAt)}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>{formatLocation(report.location)}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                <span>{report.userName}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {report.description}
                        </p>
                        
                        {report.alertIssued ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              <TranslatedText text="Alert issued on" /> {formatDate(report.alertIssuedAt)} 
                              {report.alertIssuedBy && ` by ${report.alertIssuedBy}`}
                            </span>
                          </div>
                        ) : (
                          <Button 
                            onClick={() => openAlertDialog(report)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Siren className="w-4 h-4 mr-2" />
                            <TranslatedText text="Issue Alert" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <TranslatedText text="Issue Alert" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedText text="Issue an alert to people within the specified radius of this incident." />
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">
                <TranslatedText text="Alert Type" />
              </label>
              <Select value={alertForm.alertType} onValueChange={(value: 'warning' | 'evacuation' | 'advisory') => 
                setAlertForm(prev => ({ ...prev, alertType: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                  <SelectItem value="evacuation">Evacuation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                <TranslatedText text="Severity" />
              </label>
              <Select value={alertForm.severity} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                setAlertForm(prev => ({ ...prev, severity: value }))
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                <TranslatedText text="Alert Message" />
              </label>
              <Textarea
                value={alertForm.message}
                onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Enter alert message for affected residents..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">
                <TranslatedText text="Alert Radius (km)" />
              </label>
              <Input
                type="number"
                value={alertForm.radius}
                onChange={(e) => setAlertForm(prev => ({ ...prev, radius: Number(e.target.value) }))}
                min="1"
                max="50"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAlertDialogOpen(false)}
              disabled={issuingAlert}
            >
              <TranslatedText text="Cancel" />
            </Button>
            <Button 
              onClick={issueAlert}
              disabled={issuingAlert || !alertForm.message.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {issuingAlert ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  <TranslatedText text="Issuing..." />
                </>
              ) : (
                <>
                  <Siren className="w-4 h-4 mr-2" />
                  <TranslatedText text="Issue Alert" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Severity Edit Dialog */}
      <Dialog open={isSeverityEditOpen} onOpenChange={setIsSeverityEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <TranslatedText text="Edit Severity Level" />
            </DialogTitle>
            <DialogDescription>
              <TranslatedText text="Adjust the severity level based on your analysis of the coastal hazard." />
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                <TranslatedText text="Severity Level" />
              </label>
              <Select value={newSeverity} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setNewSeverity(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <TranslatedText text="Low" />
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <TranslatedText text="Medium" />
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <TranslatedText text="High" />
                    </div>
                  </SelectItem>
                  <SelectItem value="critical">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <TranslatedText text="Critical" />
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <div className="space-y-1">
                <div><strong><TranslatedText text="Critical" />:</strong> <TranslatedText text="Tsunami, Storm Surge - Immediate danger" /></div>
                <div><strong><TranslatedText text="High" />:</strong> <TranslatedText text="Coastal Flooding, High Waves - Urgent attention" /></div>
                <div><strong><TranslatedText text="Medium" />:</strong> <TranslatedText text="High Tide, Unusual Tides - Monitoring required" /></div>
                <div><strong><TranslatedText text="Low" />:</strong> <TranslatedText text="Minor incidents - Informational" /></div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSeverityEditOpen(false)}>
              <TranslatedText text="Cancel" />
            </Button>
            <Button onClick={updateSeverity} className="bg-blue-600 hover:bg-blue-700">
              <TranslatedText text="Update Severity" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
