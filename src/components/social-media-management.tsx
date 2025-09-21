'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OfficialSocialMediaFeed from '@/components/official-social-media-feed-new';
import SocialMediaAnalyticsDashboard from '@/components/social-media-analytics-dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Activity,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';

interface SocialMediaStats {
  activeMonitoring: boolean;
  lastUpdate: string;
  totalPosts: number;
  urgentAlerts: number;
  systemStatus: 'active' | 'inactive' | 'error';
}

export default function SocialMediaManagement() {
  const [stats, setStats] = useState<SocialMediaStats>({
    activeMonitoring: false,
    lastUpdate: new Date().toISOString(),
    totalPosts: 0,
    urgentAlerts: 0,
    systemStatus: 'inactive'
  });

  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    // Check system status
    checkSystemStatus();
    
    // Set up periodic status checks
    const interval = setInterval(checkSystemStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('/api/social-media/data');
      const data = await response.json();
      
      if (data.success) {
        setStats(prev => ({
          ...prev,
          activeMonitoring: true,
          totalPosts: data.data.count || 0,
          urgentAlerts: data.data.posts?.filter((post: any) => post.urgency === 'high').length || 0,
          systemStatus: 'active',
          lastUpdate: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('System status check failed:', error);
      setStats(prev => ({
        ...prev,
        systemStatus: 'error'
      }));
    }
  };

  const startMonitoring = async () => {
    try {
      const response = await fetch('/api/social-media/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: ['tsunami', 'flooding', 'storm surge', 'coastal erosion', 'hurricane'] 
        })
      });
      
      if (response.ok) {
        setStats(prev => ({ ...prev, activeMonitoring: true, systemStatus: 'active' }));
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4 text-green-600" />;
      case 'inactive': return <Clock className="h-4 w-4 text-gray-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                FREE Social Media Monitoring System
                <Badge className="bg-green-100 text-green-800 text-xs">100% FREE</Badge>
              </CardTitle>
              <CardDescription>
                Monitor multiple free data sources for coastal hazard detection - No API costs!
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.systemStatus)}
              <Badge className={getStatusColor(stats.systemStatus)}>
                {stats.systemStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600 bg-blue-50 p-2 rounded-lg" />
              <div>
                <p className="text-sm text-gray-600">Monitoring Status</p>
                <p className="font-semibold">
                  {stats.activeMonitoring ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-600 bg-green-50 p-2 rounded-lg" />
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="font-semibold">{stats.totalPosts}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-600 bg-red-50 p-2 rounded-lg" />
              <div>
                <p className="text-sm text-gray-600">Urgent Alerts</p>
                <p className="font-semibold">{stats.urgentAlerts}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-600 bg-purple-50 p-2 rounded-lg" />
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-xs">
                  {new Date(stats.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
          
          {!stats.activeMonitoring && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Social media monitoring is currently inactive. Start monitoring to collect real-time data about coastal hazards.
                  </p>
                </div>
                <Button onClick={startMonitoring} className="shrink-0">
                  <Activity className="h-4 w-4 mr-2" />
                  Start Monitoring
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Social Media Feed</span>
            <span className="sm:hidden">Feed</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Config</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-6">
          <OfficialSocialMediaFeed />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <SocialMediaAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Monitoring Configuration
              </CardTitle>
              <CardDescription>
                Configure social media monitoring parameters and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Current Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Monitored Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {['tsunami', 'flooding', 'storm surge', 'coastal erosion', 'hurricane'].map(keyword => (
                          <Badge key={keyword} variant="outline">{keyword}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Platforms</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Twitter/X</span>
                          <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Facebook</span>
                          <Badge variant="outline">Coming Soon</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Instagram</span>
                          <Badge variant="outline">Coming Soon</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">FREE Data Sources (No API Costs!)</h4>
                <p className="text-sm text-green-700 mb-3">
                  Our system uses completely free data sources - saving you $100+/month compared to Twitter API:
                </p>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs">✅</span>
                    <span><strong>Reddit API</strong> - Free access to r/weather, r/hurricanes, r/flooding</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs">✅</span>
                    <span><strong>News RSS Feeds</strong> - CNN, NPR, BBC, Weather.com (all free)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs">✅</span>
                    <span><strong>Government APIs</strong> - NOAA/NWS alerts, USGS data (always free)</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Quick Setup (2 minutes)</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Get started with FREE monitoring in minutes:
                </p>
                <div className="space-y-2 text-sm text-blue-700">
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs">1.</span>
                    <span>Run <code className="bg-blue-100 px-1 rounded">setup-free-monitoring.bat</code></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs">2.</span>
                    <span>Click "Start Monitor" below</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono bg-blue-100 px-2 py-1 rounded text-xs">3.</span>
                    <span>Watch real-time coastal hazard data appear!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
