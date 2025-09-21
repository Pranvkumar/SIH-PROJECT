'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, MessageCircle, RefreshCw, MapPin, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Translated as TranslatedText } from '@/hooks/use-translated-text';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import OfficialSocialMediaFeed from '@/components/official-social-media-feed-new';

interface CommunityReport {
  id: string;
  eventType: string;
  description: string;
  location: { lat: number; lng: number };
  photoUrl?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: any;
  approvedAt: any;
  userName: string;
  userEmail: string;
  userId: string;
}

export default function CommunityFeed() {
    const [activeTab, setActiveTab] = useState('reports');
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
    const [isLoadingReports, setIsLoadingReports] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedImageAlt, setSelectedImageAlt] = useState<string>('');

    // Authentication listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Community Feed: Auth state changed:', user ? `User: ${user.uid}` : 'No user');
            setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    // Fetch community reports (approved reports from other users)
    useEffect(() => {
        console.log('Community Feed: useEffect triggered, currentUser:', currentUser?.uid);
        
        if (!currentUser) {
            console.log('Community Feed: No current user, clearing reports');
            setCommunityReports([]);
            setIsLoadingReports(false);
            return;
        }

        console.log('Community Feed: Setting up Firestore listener...');
        const fetchCommunityReports = () => {
            const reportsRef = collection(db, 'reports');
            
            // Let's first get ALL reports to see what's in the database
            const allReportsQuery = query(reportsRef);
            
            const unsubscribe = onSnapshot(allReportsQuery, (snapshot) => {
                console.log('Community Feed Debug: Total documents in reports collection:', snapshot.size);
                
                const allReports: any[] = [];
                const approvedReports: CommunityReport[] = [];
                
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    allReports.push({
                        id: doc.id,
                        status: data.status,
                        userId: data.userId,
                        eventType: data.eventType,
                        hasPhoto: !!data.photoUrl
                    });
                    
                    console.log('Community Feed Debug: Document data:', {
                        id: doc.id,
                        status: data.status,
                        userId: data.userId,
                        currentUserId: currentUser.uid,
                        hasLocation: !!data.location,
                        photoUrl: data.photoUrl,
                        eventType: data.eventType
                    });
                    
                    // Check if this is an approved report from another user
                    if (data.status === 'approved' && data.userId !== currentUser.uid && data.location && data.location.lat && data.location.lng) {
                        approvedReports.push({
                            id: doc.id,
                            eventType: data.eventType || 'other',
                            description: data.description || '',
                            location: data.location,
                            photoUrl: data.photoUrl,
                            severity: data.severity || 'medium', // Keep fallback for legacy reports
                            createdAt: data.createdAt,
                            approvedAt: data.approvedAt || data.updatedAt,
                            userName: data.userName || 'Anonymous User',
                            userEmail: data.userEmail || '',
                            userId: data.userId || ''
                        });
                    }
                });
                
                console.log('Community Feed Debug: All reports:', allReports);
                console.log('Community Feed Debug: Approved reports from others:', approvedReports.length);
                setCommunityReports(approvedReports);
                setIsLoadingReports(false);
            });

            return () => unsubscribe();
        };

        return fetchCommunityReports();
    }, [currentUser]);

    const handleRefresh = async () => {
        setLoading(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLoading(false);
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'Recently';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatLocation = (location: { lat: number; lng: number }) => {
        return `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`;
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

    const handleImageClick = (imageUrl: string, reportType: string) => {
        setSelectedImage(imageUrl);
        setSelectedImageAlt(`${reportType} report evidence`);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
        setSelectedImageAlt('');
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg sm:text-xl">
                                <TranslatedText text="Community Feed" />
                            </CardTitle>
                            <CardDescription className="text-sm">
                                <TranslatedText text="Stay updated with latest reports and social media activity about coastal hazards in your area." />
                            </CardDescription>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleRefresh}
                            disabled={loading}
                            className="flex items-center gap-2 self-start sm:self-auto"
                        >
                            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-xs sm:text-sm">
                                <TranslatedText text="Refresh" />
                            </span>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-9">
                            <TabsTrigger value="reports" className="text-xs sm:text-sm">
                                <TranslatedText text="Citizen Reports" />
                            </TabsTrigger>
                            <TabsTrigger value="social" className="text-xs sm:text-sm">
                                <TranslatedText text="Social Media" />
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="reports" className="space-y-4 mt-4 sm:mt-6">
                            {isLoadingReports ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className="p-4 border rounded-lg">
                                            <Skeleton className="h-4 w-3/4 mb-2" />
                                            <Skeleton className="h-3 w-1/2 mb-2" />
                                            <Skeleton className="h-3 w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : communityReports.length === 0 ? (
                                <div className="text-center py-8 sm:py-12">
                                    <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-4" />
                                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                                        <TranslatedText text="No Community Reports Yet" />
                                    </h3>
                                    <p className="text-gray-600 text-sm sm:text-base px-4">
                                        <TranslatedText text="Approved reports from other community members will appear here." />
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {communityReports.map((report) => (
                                        <Card key={report.id} className="border-l-4 border-l-blue-500">
                                            <CardContent className="p-4">
                                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Report Photo */}
                                    {report.photoUrl && (
                                        <div className="sm:w-32 sm:flex-shrink-0">
                                            <img 
                                                src={report.photoUrl} 
                                                alt="Report evidence"
                                                className="w-full h-24 sm:h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => handleImageClick(report.photoUrl!, report.eventType)}
                                            />
                                        </div>
                                    )}                                                    {/* Report Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                                                            <div className="flex-1">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                                    <h3 className="font-semibold text-base capitalize">
                                                                        <TranslatedText text={report.eventType?.replace(/-/g, ' ').replace(/_/g, ' ') || 'Unknown Event'} />
                                                                    </h3>
                                                                    {getSeverityBadge(report.severity)}
                                                                </div>
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                                                                    <div className="flex items-center">
                                                                        <User className="w-4 h-4 mr-1" />
                                                                        <span>{report.userName}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <Calendar className="w-4 h-4 mr-1" />
                                                                        <span>{formatDate(report.approvedAt)}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <MapPin className="w-4 h-4 mr-1" />
                                                                        <span>{formatLocation(report.location)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-gray-700 text-sm leading-relaxed">
                                                            {report.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        
                        <TabsContent value="social" className="space-y-4 mt-4 sm:mt-6">
                            <OfficialSocialMediaFeed />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Image Enlargement Modal */}
            <Dialog open={!!selectedImage} onOpenChange={closeImageModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>
                            <TranslatedText text="Report Evidence" />
                        </DialogTitle>
                    </DialogHeader>
                    <div className="px-6 pb-6">
                        {selectedImage && (
                            <div className="relative">
                                <img
                                    src={selectedImage}
                                    alt={selectedImageAlt}
                                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
