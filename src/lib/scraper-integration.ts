import { spawn } from 'child_process';
import path from 'path';

export interface ScrapedTweet {
  username: string;
  handle: string;
  content: string;
  timestamp: string;
  retweets: number;
  likes: number;
  replies: number;
  tweet_id: string;
  matched_keywords: string[];
  sentiment_score: number;
  sentiment_label: string;
  confidence: number;
  hazard_category: string;
  source: string;
  location?: string;
  verified: boolean;
}

export interface SocialMediaPost {
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
}

export async function getDemoData(): Promise<{ posts: SocialMediaPost[], analytics: any }> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      path.join(process.cwd(), 'backend', 'scraper.py'),
      '--demo'
    ]);

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python Error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}`));
      }

      try {
        const scrapedData = JSON.parse(dataString);
        const posts = transformScrapedData(scrapedData.tweets);
        const analytics = generateAnalytics(posts);
        resolve({ posts, analytics });
      } catch (error) {
        reject(error);
      }
    });
  });
}

function transformScrapedData(tweets: ScrapedTweet[]): SocialMediaPost[] {
  return tweets.map(tweet => ({
    id: tweet.tweet_id,
    text: tweet.content,
    created_at: tweet.timestamp,
    author: {
      username: tweet.handle,
      name: tweet.username,
      location: tweet.location || 'Unknown'
    },
    location: tweet.location ? {
      type: 'twitter',
      name: tweet.location
    } : undefined,
    sentiment: tweet.sentiment_label.charAt(0).toUpperCase() + tweet.sentiment_label.slice(1) as 'Positive' | 'Negative' | 'Neutral',
    polarity: tweet.sentiment_score,
    urgency: determineUrgency(tweet),
    hazard_type: tweet.hazard_category,
    metrics: {
      retweet_count: tweet.retweets,
      like_count: tweet.likes,
      reply_count: tweet.replies
    },
    processed_at: new Date().toISOString(),
    source: 'twitter'
  }));
}

function determineUrgency(tweet: ScrapedTweet): 'high' | 'medium' | 'low' {
  // Determine urgency based on sentiment and keywords
  const urgentKeywords = ['urgent', 'emergency', 'warning', 'evacuate', 'danger'];
  const hasUrgentKeywords = urgentKeywords.some(keyword => 
    tweet.content.toLowerCase().includes(keyword)
  );
  
  if (hasUrgentKeywords || tweet.sentiment_score < -0.7) {
    return 'high';
  } else if (tweet.sentiment_score < -0.3) {
    return 'medium';
  } else {
    return 'low';
  }
}

function generateAnalytics(posts: SocialMediaPost[]) {
  const sentimentCounts = posts.reduce((acc, post) => {
    acc[post.sentiment.toLowerCase()] = (acc[post.sentiment.toLowerCase()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const urgencyCounts = posts.reduce((acc, post) => {
    acc[post.urgency] = (acc[post.urgency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hazardCounts = posts.reduce((acc, post) => {
    acc[post.hazard_type] = (acc[post.hazard_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const engagementStats = posts.reduce((acc, post) => {
    acc.total_likes += post.metrics.like_count || 0;
    acc.total_retweets += post.metrics.retweet_count || 0;
    acc.total_replies += post.metrics.reply_count || 0;
    acc.count += 1;
    return acc;
  }, { total_likes: 0, total_retweets: 0, total_replies: 0, count: 0 });

  return {
    total_mentions: posts.length,
    sentiment_breakdown: sentimentCounts,
    urgency_breakdown: urgencyCounts,
    hazard_types: hazardCounts,
    engagement_stats: {
      avg_likes: engagementStats.total_likes / engagementStats.count,
      avg_retweets: engagementStats.total_retweets / engagementStats.count,
      total_engagement: engagementStats.total_likes + engagementStats.total_retweets + engagementStats.total_replies
    },
    last_updated: new Date().toISOString()
  };
}
