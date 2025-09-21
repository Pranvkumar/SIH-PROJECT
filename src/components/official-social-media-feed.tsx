'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Share2
} from 'lucide-react';

export default function OfficialSocialMediaFeed() {
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Social Media Monitoring</CardTitle>
              <CardDescription className="text-sm">
                Monitor social media platforms for coastal hazard reports and public sentiment.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="self-start sm:self-auto"
            >
              <RefreshCcw className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm">Refresh</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">--</div>
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
                <div className="text-lg sm:text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Potential Reports</p>
              </div>
              <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg sm:text-2xl font-bold">--</div>
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
                <div className="text-lg sm:text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Sentiment Score</p>
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
                <SelectValue placeholder="Filter by platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="reddit">Reddit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Content */}
      <div className="grid gap-4 sm:gap-6">
        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Trending Coastal Hazard Topics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 sm:py-8">
              <TrendingUp className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">No trending topics available yet.</p>
              <p className="text-xs sm:text-sm text-gray-400 px-4">Hashtags and keywords will appear here when social media monitoring is active.</p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Social Media Activity</CardTitle>
            <CardDescription className="text-sm">Posts and mentions related to coastal hazards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Social Media Integration Coming Soon</h3>
              <p className="text-gray-500 mb-4 text-sm sm:text-base px-4">
                This section will display real-time social media posts and mentions related to coastal hazards.
              </p>
              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                <p>📱 <strong>Planned Features:</strong></p>
                <ul className="space-y-1 text-left max-w-md mx-auto px-4">
                  <li>• Real-time Twitter/X monitoring for hazard keywords</li>
                  <li>• Facebook and Instagram post analysis</li>
                  <li>• Sentiment analysis of public reports</li>
                  <li>• Automated flagging of urgent posts</li>
                  <li>• Geographic clustering of social reports</li>
                  <li>• Integration with official reporting system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Platform Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">Platform analytics will appear here.</p>
              <p className="text-sm text-gray-400">
                Connect social media APIs to see real-time analytics from Twitter/X, Facebook, Instagram, and other platforms.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">Monitor Keywords</span>
              </Button>
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
                <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">Flag Urgent Posts</span>
              </Button>
              <Button variant="outline" className="h-auto p-3 sm:p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="w-4 h-4 sm:w-6 sm:h-6" />
                <span className="text-xs sm:text-sm">Generate Report</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
