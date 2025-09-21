import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface RedditPost {
    id: string;
    text: string;
    created_at: string;
    author: {
        username: string;
        name: string;
        location: string;
    };
    location: {
        type: string;
        name: string;
    };
    sentiment: string;
    polarity: number;
    urgency: string;
    hazard_type: string;
    metrics: {
        upvotes: number;
        comments: number;
        score: number;
    };
    matched_keywords: string[];
}

const urgencyColors: Record<string, string> = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
};

const sentimentColors: Record<string, string> = {
    very_positive: 'bg-green-500',
    positive: 'bg-green-400',
    neutral: 'bg-gray-500',
    negative: 'bg-red-400',
    very_negative: 'bg-red-500'
};

export function RedditHazardFeed() {
    // All useState hooks must be at the top
    const [posts, setPosts] = useState<RedditPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<RedditPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        hazardType: 'all',
        urgency: 'all',
        sentiment: 'all',
        searchTerm: ''
    });
    const [sortBy, setSortBy] = useState<'time' | 'urgency' | 'sentiment' | 'engagement'>('time');
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const REFRESH_INTERVAL = 2 * 60 * 1000; // 2 minutes

    const clearFilters = () => {
        setFilters({
            hazardType: 'all',
            urgency: 'all',
            sentiment: 'all',
            searchTerm: ''
        });
        setSortBy('time');
    };

    if (loading) {
        return (
            <div className="h-[600px] overflow-auto">
                <div className="space-y-4 p-4">
                    <div className="flex flex-col gap-4 mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="text-center">
                                        <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
                                        <div className="h-5 bg-gray-300 rounded w-1/3 mx-auto" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-10 bg-gray-200 rounded w-[180px]" />
                                ))}
                            </div>
                        </div>
                    </div>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4 space-y-3">
                            <div className="flex justify-between">
                                <div className="h-6 bg-gray-200 rounded w-1/4" />
                                <div className="h-6 bg-gray-200 rounded w-1/4" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-5 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-100 rounded w-1/2" />
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-2 bg-gray-200 rounded w-full" />
                            <div className="flex gap-4">
                                <div className="h-4 bg-gray-200 rounded w-16" />
                                <div className="h-4 bg-gray-200 rounded w-16" />
                                <div className="h-4 bg-gray-200 rounded w-16" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    useEffect(() => {
        let isSubscribed = true;

        const fetchPosts = async () => {
            try {
                setIsRefreshing(true);
                const response = await fetch('/api/reddit-hazards');
                if (!response.ok) {
                    throw new Error('Failed to fetch Reddit posts');
                }
                const data = await response.json();
                if (isSubscribed) {
                    setPosts(data.data);
                    setLastUpdate(new Date());
                }
            } catch (err) {
                if (isSubscribed) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch data');
                }
            } finally {
                if (isSubscribed) {
                    setIsRefreshing(false);
                    setLoading(false);
                }
            }
        };

        fetchPosts();
        const interval = setInterval(fetchPosts, REFRESH_INTERVAL);
        
        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, []);

    // Filtering and sorting effect
    useEffect(() => {
        // Define sort functions
        const sortFunctions = {
            time: (a: RedditPost, b: RedditPost) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            urgency: (a: RedditPost, b: RedditPost) => {
                const urgencyOrder = { high: 3, medium: 2, low: 1 };
                return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
            },
            sentiment: (a: RedditPost, b: RedditPost) => {
                const sentimentOrder = { very_positive: 5, positive: 4, neutral: 3, negative: 2, very_negative: 1 };
                return sentimentOrder[b.sentiment as keyof typeof sentimentOrder] - sentimentOrder[a.sentiment as keyof typeof sentimentOrder];
            },
            engagement: (a: RedditPost, b: RedditPost) => 
                b.metrics.score - a.metrics.score
        };

        // Sort posts
        const sorted = [...posts].sort(sortFunctions[sortBy]);

        // Apply filters
        const filtered = sorted.filter(post => {
            const hazardMatch = filters.hazardType === 'all' || post.hazard_type === filters.hazardType;
            const urgencyMatch = filters.urgency === 'all' || post.urgency === filters.urgency;
            const sentimentMatch = filters.sentiment === 'all' || post.sentiment === filters.sentiment;
            const searchMatch = !filters.searchTerm || 
                post.text.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                (post.matched_keywords && post.matched_keywords.some(k => 
                    k.toLowerCase().includes(filters.searchTerm.toLowerCase())
                ));
            return hazardMatch && urgencyMatch && sentimentMatch && searchMatch;
        });

        setFilteredPosts(filtered);
    }, [posts, filters, sortBy]);

    return (
        <div className="h-[600px] overflow-auto">
            <div className="space-y-4 p-2 sm:p-4">
                <div className="flex flex-col gap-4 mb-6 bg-gray-50 p-3 sm:p-4 rounded-lg sticky top-0 z-10 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2 mb-2 sm:mb-0">
                            <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-sm text-gray-600">
                                {isRefreshing ? 'Refreshing...' : `Last update: ${lastUpdate.toLocaleTimeString()}`}
                            </span>
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                            Updates: {REFRESH_INTERVAL / 1000 / 60}min
                        </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 border-b pb-2">
                        <div className="bg-red-50 rounded-lg p-2 text-center">
                            <div className="text-xs sm:text-sm text-red-600">High Urgency</div>
                            <div className="text-base sm:text-lg font-semibold text-red-700">
                                {filteredPosts.filter(p => p.urgency === 'high').length}
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <div className="text-xs sm:text-sm text-blue-600">Total Posts</div>
                            <div className="text-base sm:text-lg font-semibold text-blue-700">
                                {filteredPosts.length}
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <div className="text-xs sm:text-sm text-amber-600">Critical Score</div>
                            <div className="text-base sm:text-lg font-semibold text-amber-700">
                                {Math.round(filteredPosts.reduce((acc, post) => {
                                    const urgencyScore = post.urgency === 'high' ? 1 : post.urgency === 'medium' ? 0.5 : 0;
                                    const sentimentScore = post.sentiment.includes('negative') ? 1 : 0;
                                    return acc + (urgencyScore + sentimentScore) / 2;
                                }, 0) * 10)}%
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2 text-center">
                            <div className="text-xs sm:text-sm text-green-600">Last 24h</div>
                            <div className="text-base sm:text-lg font-semibold text-green-700">
                                {filteredPosts.filter(p => {
                                    const postDate = new Date(p.created_at);
                                    const now = new Date();
                                    const hoursDiff = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60);
                                    return hoursDiff <= 24;
                                }).length}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
                            <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Search posts..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pr-10"
                                />
                                {filters.searchTerm && (
                                    <button
                                        onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 whitespace-nowrap"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v4a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                                Reset
                            </button>
                        </div>
                        <Select
                            value={filters.hazardType}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, hazardType: value }))}>
                            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                                <SelectValue placeholder="Select hazard type" />
                            </SelectTrigger>
                            <SelectContent className="text-xs sm:text-sm">
                                <SelectItem value="all">All Hazards</SelectItem>
                                <SelectItem value="tsunami">Tsunami</SelectItem>
                                <SelectItem value="storms">Storms</SelectItem>
                                <SelectItem value="flooding">Flooding</SelectItem>
                                <SelectItem value="erosion">Erosion</SelectItem>
                                <SelectItem value="pollution">Pollution</SelectItem>
                                <SelectItem value="currents">Currents</SelectItem>
                                <SelectItem value="climate">Climate</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.urgency}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, urgency: value }))}>
                            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                                <SelectValue placeholder="Select urgency" />
                            </SelectTrigger>
                            <SelectContent className="text-xs sm:text-sm">
                                <SelectItem value="all">All Urgencies</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.sentiment}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, sentiment: value }))}>
                            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                                <SelectValue placeholder="Select sentiment" />
                            </SelectTrigger>
                            <SelectContent className="text-xs sm:text-sm">
                                <SelectItem value="all">All Sentiments</SelectItem>
                                <SelectItem value="very_positive">Very Positive</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="very_negative">Very Negative</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={sortBy}
                            onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                            <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm h-9 sm:h-10">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent className="text-xs sm:text-sm">
                                <SelectItem value="time">Sort by Time</SelectItem>
                                <SelectItem value="urgency">Sort by Urgency</SelectItem>
                                <SelectItem value="sentiment">Sort by Sentiment</SelectItem>
                                <SelectItem value="engagement">Sort by Engagement</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {filteredPosts.map((post) => (
                    <Card key={post.id} className="p-3 sm:p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                            <Badge variant="outline" className={`${urgencyColors[post.urgency]} text-xs sm:text-sm`}>
                                {post.urgency.toUpperCase()} URGENCY
                            </Badge>
                            <Badge variant="outline" className={`${sentimentColors[post.sentiment]} text-xs sm:text-sm`}>
                                {post.sentiment}
                            </Badge>
                        </div>

                        <div>
                            <h3 className="font-semibold text-sm sm:text-base line-clamp-2">{post.text.split('\n')[0]}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-3">
                                {post.text.split('\n').slice(1).join('\n')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{post.hazard_type}</Badge>
                            <span className="text-xs sm:text-sm text-gray-500">
                                Posted in {post.location.name}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                                <span>Sentiment Score</span>
                                <span>{(post.polarity * 100).toFixed(1)}%</span>
                            </div>
                            <Progress
                                value={(post.polarity + 1) * 50}
                                className="h-1.5 sm:h-2"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center justify-center p-1.5 rounded-md bg-gray-50">
                                <span>👍 {post.metrics.upvotes}</span>
                            </div>
                            <div className="flex items-center justify-center p-1.5 rounded-md bg-gray-50">
                                <span>💬 {post.metrics.comments}</span>
                            </div>
                            <div className="flex items-center justify-center p-1.5 rounded-md bg-gray-50">
                                <span>📊 {post.metrics.score}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {post.matched_keywords.map((keyword, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5">
                                    {keyword}
                                </Badge>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
