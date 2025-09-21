'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCcw, 
  Search,
  Filter,
  TrendingUp,
  MessageSquare,
  Users,
  AlertTriangle,
  BarChart3,
  Eye,
  Share2,
  MapPin,
  Clock,
  Heart,
  Repeat2,
  ExternalLink
} from 'lucide-react';

interface SocialMediaPost {
  id: string;
  text: string;
  created_at: string;
  author: {
    username: string;
    name: string;
    location: string;
  };
  location?: {
    type: string;
    name: string;
  };
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  polarity: number;
  urgency: 'high' | 'medium' | 'low';
  hazard_type: string;
  metrics: {
    retweet_count?: number;
    like_count?: number;
    reply_count?: number;
    upvotes?: number;
    comments?: number;
    score?: number;
  };
  processed_at: string;
  source: string;
  url?: string;
}

interface Analytics {
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
  last_updated: string;
}

export default function OfficialSocialMediaFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState<SocialMediaPost[]>([]);

  // Fetch existing social media data
  const fetchSocialMediaData = async () => {
    try {
      const response = await fetch('/api/social-media/data');
      const result = await response.json();
      
      console.log('Social media API response:', result);
      
      if (result.success && result.data) {
        // Ensure posts is always an array
        const postsArray = Array.isArray(result.data.posts) ? result.data.posts : [];
        console.log('Posts received:', postsArray.length, postsArray);
        setPosts(postsArray);
        setAnalytics(result.data.analytics || null);
      } else {
        console.log('No data received, setting empty arrays');
        // Set default empty values if no data
        setPosts([]);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error fetching social media data:', error);
      // Set default empty values on error
      setPosts([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  // Test API connectivity
  const testAPI = async () => {
    try {
      console.log('Testing API connectivity...');
      
      // Test the test-data endpoint directly
      const testResponse = await fetch('/api/social-media/test-data');
      const testResult = await testResponse.json();
      console.log('Test API response:', testResult);
      
      if (testResult.success && testResult.data && testResult.data.posts) {
        setPosts(testResult.data.posts);
        setAnalytics(testResult.data.analytics);
        console.log('Manually loaded test data:', testResult.data.posts.length, 'posts');
      }
    } catch (error) {
      console.error('API test failed:', error);
    }
  };
  // Monitor social media with Python service
  const startMonitoring = async () => {
    setMonitoring(true);
    try {
      const keywords = [
        'cyclone india', 'mumbai flooding', 'chennai floods', 'kerala monsoon',
        'odisha cyclone', 'west bengal storm', 'gujarat coast', 'goa beaches',
        'bay of bengal', 'arabian sea', 'monsoon warning', 'coastal erosion india',
        'tsunami warning india', 'storm surge india', 'imd weather', 'india meteorological'
      ];

      const response = await fetch('/api/social-media/monitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keywords }),
      });

      const result = await response.json();
      console.log('Monitor API response:', result);
      
      if (result.success) {
        if (result.tweets && Array.isArray(result.tweets)) {
          setPosts(result.tweets);
        }
        if (result.analytics) {
          setAnalytics(result.analytics);
        }
        // Also refresh the regular data after monitoring
        await fetchSocialMediaData();
      } else {
        console.error('Monitoring failed:', result.message);
      }
    } catch (error) {
      console.error('Error during monitoring:', error);
    } finally {
      setMonitoring(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSocialMediaData();
    setRefreshing(false);
  };

  // Filter posts based on search and platform
  useEffect(() => {
    // Ensure posts is an array before filtering
    let filtered = Array.isArray(posts) ? [...posts] : [];

    if (platformFilter !== 'all') {
      filtered = filtered.filter(post => post?.source === platformFilter);
    }

    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(post =>
        (post?.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post?.author?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post?.hazard_type || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, platformFilter]);

  useEffect(() => {
    fetchSocialMediaData();
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'Negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const formatHazardType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                FREE Social Media Monitoring
                <Badge className="bg-green-100 text-green-800 text-xs">$0 Cost</Badge>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {posts ? posts.length : 0} Posts
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                Monitor Indian coastal areas: Reddit communities (r/mumbai, r/chennai, r/kerala), Indian news sources, and weather alerts - completely FREE!
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={testAPI}
                className="self-start sm:self-auto"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <span className="text-xs sm:text-sm">Test API</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={refreshing || loading}
                className="self-start sm:self-auto"
              >
                <RefreshCcw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs sm:text-sm">Refresh</span>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={startMonitoring}
                disabled={monitoring}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {monitoring ? (
                  <>
                    <RefreshCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">Monitoring...</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Start Monitor</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {analytics?.total_mentions || 0}
                </div>
                <p className="text-xs text-muted-foreground">Total Mentions</p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {analytics?.urgency_breakdown?.high || 0}
                </div>
                <p className="text-xs text-muted-foreground">High Urgency</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {Math.round(analytics?.engagement_stats?.total_engagement || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Engagement</p>
              </div>
              <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">
                  {analytics?.sentiment_breakdown ? 
                    Math.round((analytics.sentiment_breakdown.negative / analytics.total_mentions) * 100) || 0 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Negative Sentiment</p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  placeholder="Search social media posts and mentions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-7 sm:pl-8 text-sm h-9 sm:h-10"
                />
              </div>
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-sm">
                <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="reddit">Reddit Communities</SelectItem>
                <SelectItem value="news">News RSS Feeds</SelectItem>
                <SelectItem value="government">Government Alerts</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            Recent Social Media Activity
            <ExternalLink className="w-4 h-4 text-blue-500" />
          </CardTitle>
          <CardDescription className="text-sm">
            Posts and mentions related to Indian coastal hazards from social media monitoring. Click any post to view the original source.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCcw className="h-8 w-8 mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Loading social media data...</p>
            </div>
          ) : (filteredPosts && filteredPosts.length === 0) ? (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Social Media Posts Found</h3>
              <p className="text-gray-500 mb-4 text-sm sm:text-base px-4">
                {(posts && posts.length === 0) 
                  ? 'Click "Start Monitor" to begin collecting social media data about coastal hazards.'
                  : 'No posts match your current search criteria.'
                }
              </p>
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Debug Info: Posts array length: {posts ? posts.length : 'undefined'}, 
                  Filtered posts: {filteredPosts ? filteredPosts.length : 'undefined'},
                  Loading: {loading ? 'true' : 'false'}
                </p>
              </div>
              {(posts && posts.length === 0) && (
                <Button onClick={startMonitoring} disabled={monitoring}>
                  <Eye className="w-4 h-4 mr-2" />
                  Start Monitoring
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(filteredPosts || []).map((post) => (
                <Card 
                  key={post.id} 
                  className="border-l-4 border-l-blue-500 hover:shadow-lg hover:border-l-blue-600 transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    if (post.url) {
                      window.open(post.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && post.url) {
                      e.preventDefault();
                      window.open(post.url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  tabIndex={post.url ? 0 : -1}
                  role={post.url ? "button" : undefined}
                  aria-label={post.url ? `Open post: ${post.text.substring(0, 100)}...` : undefined}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge className={getSentimentColor(post.sentiment)}>
                            {post.sentiment}
                          </Badge>
                          <Badge className={getUrgencyColor(post.urgency)}>
                            {post.urgency} urgency
                          </Badge>
                          <Badge variant="outline">
                            {formatHazardType(post.hazard_type)}
                          </Badge>
                          {post.url && (
                            <Badge variant="outline" className="text-blue-600 hover:text-blue-800">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Click to view
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-3 text-sm sm:text-base leading-relaxed group-hover:text-gray-900 transition-colors">
                          {post.text}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            <span>@{post.author.username}</span>
                          </div>
                          {post.location && (
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">{post.location.name}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-500">
                          <div className="flex items-center">
                            <Heart className="w-3 h-3 mr-1" />
                            <span>{post.metrics.like_count || post.metrics.upvotes || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <Repeat2 className="w-3 h-3 mr-1" />
                            <span>{post.metrics.retweet_count || post.metrics.score || 0}</span>
                          </div>
                          <div className="flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            <span>{post.metrics.reply_count || post.metrics.comments || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Summary */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Analytics Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium mb-2">Sentiment Breakdown</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Positive:</span>
                    <span className="text-green-600">{analytics.sentiment_breakdown.positive}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Negative:</span>
                    <span className="text-red-600">{analytics.sentiment_breakdown.negative}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Neutral:</span>
                    <span className="text-gray-600">{analytics.sentiment_breakdown.neutral}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Top Hazard Types</h4>
                <div className="space-y-1 text-sm">
                  {Object.entries(analytics.hazard_types)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 3)
                    .map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="capitalize">{formatHazardType(type)}:</span>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Engagement Stats</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Avg. Likes:</span>
                    <span>{Math.round(analytics.engagement_stats.avg_likes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Retweets:</span>
                    <span>{Math.round(analytics.engagement_stats.avg_retweets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Engagement:</span>
                    <span>{Math.round(analytics.engagement_stats.total_engagement)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {analytics.last_updated && (
              <p className="text-xs text-gray-500 mt-4">
                Last updated: {new Date(analytics.last_updated).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
