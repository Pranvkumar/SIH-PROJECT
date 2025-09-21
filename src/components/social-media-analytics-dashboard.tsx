'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  MessageSquare,
  Users,
  Share2,
  Heart,
  Repeat2,
  MapPin,
  Calendar,
  Activity,
  BarChart3
} from 'lucide-react';

interface AnalyticsData {
  total_mentions: number;
  sentiment_breakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  urgency_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  hazard_types: Record<string, number>;
  engagement_stats: {
    avg_likes: number;
    avg_retweets: number;
    total_engagement: number;
  };
  trending_keywords: string[];
  location_hotspots: Array<{
    location: string;
    mentions: number;
    risk_level: 'high' | 'medium' | 'low';
  }>;
  time_trends: Array<{
    hour: number;
    mentions: number;
    sentiment_score: number;
  }>;
  last_updated: string;
}

export default function SocialMediaAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      // First try to get real data
      const response = await fetch('/api/social-media/data');
      const data = await response.json();
      
      if (data.success && data.data && data.data.analytics) {
        // Enhance with additional mock data for demonstration
        const enhancedAnalytics = {
          ...data.data.analytics,
          trending_keywords: data.data.analytics.trending_keywords || ['#CoastalFlooding', '#StormSurge', '#HighTide', '#BeachErosion', '#Hurricane'],
          location_hotspots: data.data.analytics.location_hotspots || [
            { location: 'Miami Beach, FL', mentions: 23, risk_level: 'high' as const },
            { location: 'Galveston, TX', mentions: 18, risk_level: 'medium' as const },
            { location: 'Santa Monica, CA', mentions: 12, risk_level: 'low' as const },
            { location: 'Outer Banks, NC', mentions: 15, risk_level: 'medium' as const }
          ],
          time_trends: data.data.analytics.time_trends || Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            mentions: Math.floor(Math.random() * 20) + 5,
            sentiment_score: (Math.random() - 0.5) * 2
          }))
        };
        setAnalytics(enhancedAnalytics);
      } else {
        // Set default analytics if no data available
        const defaultAnalytics = {
          total_mentions: 0,
          sentiment_breakdown: { positive: 0, negative: 0, neutral: 0 },
          urgency_breakdown: { high: 0, medium: 0, low: 0 },
          hazard_types: {},
          engagement_stats: { avg_likes: 0, avg_retweets: 0, total_engagement: 0 },
          trending_keywords: [],
          location_hotspots: [],
          time_trends: [],
          last_updated: new Date().toISOString()
        };
        setAnalytics(defaultAnalytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set default analytics on error
      const defaultAnalytics = {
        total_mentions: 0,
        sentiment_breakdown: { positive: 0, negative: 0, neutral: 0 },
        urgency_breakdown: { high: 0, medium: 0, low: 0 },
        hazard_types: {},
        engagement_stats: { avg_likes: 0, avg_retweets: 0, total_engagement: 0 },
        trending_keywords: [],
        location_hotspots: [],
        time_trends: [],
        last_updated: new Date().toISOString()
      };
      setAnalytics(defaultAnalytics);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment: 'positive' | 'negative' | 'neutral') => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskLevelColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-gray-500">No analytics data available</p>
          <Button onClick={fetchAnalytics} className="mt-4">
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Media Analytics</h2>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(analytics.last_updated).toLocaleString()}
          </p>
        </div>
        <Button 
          onClick={fetchAnalytics} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <Activity className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mentions</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_mentions}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Urgency</p>
                <p className="text-2xl font-bold text-red-600">{analytics.urgency_breakdown.high}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                <p className="text-2xl font-bold text-green-600">{analytics.engagement_stats.total_engagement}</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Retweets</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.engagement_stats.avg_retweets}</p>
              </div>
              <Repeat2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.sentiment_breakdown).map(([sentiment, count]) => (
                <div key={sentiment} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{sentiment}</span>
                  <div className="flex items-center gap-2">
                    <Badge className={getSentimentColor(sentiment as any)}>
                      {count}
                    </Badge>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          sentiment === 'positive' ? 'bg-green-500' :
                          sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        style={{ 
                          width: `${(count / analytics.total_mentions) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(analytics?.trending_keywords || []).map((keyword, index) => (
                <Badge key={index} variant="outline" className="text-blue-600 border-blue-200">
                  {keyword}
                </Badge>
              ))}
              {(!analytics?.trending_keywords || analytics.trending_keywords.length === 0) && (
                <p className="text-gray-500 text-sm">No trending keywords available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Hotspots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Hotspots
          </CardTitle>
          <CardDescription>
            Areas with highest social media activity related to coastal hazards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(analytics?.location_hotspots || []).map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{location?.location || 'Unknown Location'}</p>
                  <p className="text-sm text-gray-600">{location?.mentions || 0} mentions</p>
                </div>
                <Badge className={getRiskLevelColor(location?.risk_level || 'low')}>
                  {location?.risk_level || 'low'} risk
                </Badge>
              </div>
            ))}
            {(!analytics?.location_hotspots || analytics.location_hotspots.length === 0) && (
              <div className="col-span-full text-center py-4">
                <p className="text-gray-500 text-sm">No location data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hazard Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Hazard Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics?.hazard_types || {})
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([hazard, count]) => (
              <div key={hazard} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="capitalize font-medium">
                  {hazard.replace('_', ' ')}
                </span>
                <Badge variant="secondary">{count as number}</Badge>
              </div>
            ))}
            {(!analytics?.hazard_types || Object.keys(analytics.hazard_types).length === 0) && (
              <div className="col-span-full text-center py-4">
                <p className="text-gray-500 text-sm">No hazard type data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
