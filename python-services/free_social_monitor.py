import requests
import json
import time
from datetime import datetime, timedelta
import feedparser
import re
from textblob import TextBlob
import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import List, Dict, Any

# === FREE DATA SOURCES CONFIGURATION ===
class FreeDataMonitor:
    def __init__(self):
        # Initialize Firebase (if not already done)
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate("firebase-admin-key.json")
                firebase_admin.initialize_app(cred)
            self.db = firestore.client()
        except Exception as e:
            print(f"Firebase initialization warning: {e}")
            self.db = None
        
        # Coastal hazard keywords
        self.keywords = [
            'tsunami', 'flooding', 'coastal flood', 'storm surge', 'hurricane',
            'tropical storm', 'high tide', 'king tide', 'beach erosion',
            'coastal erosion', 'sea level rise', 'rip current', 'marine debris',
            'oil spill', 'coastal damage', 'shore erosion', 'tidal surge'
        ]
    
    def get_reddit_posts(self) -> List[Dict]:
        """Fetch posts from Reddit using free API"""
        posts = []
        
        # Coastal-related subreddits
        subreddits = [
            'weather', 'hurricanes', 'flooding', 'CoastalEngineering',
            'oceanography', 'MarineScience', 'climate', 'NationalWeatherService'
        ]
        
        for subreddit in subreddits:
            try:
                # Reddit JSON API (no auth required for public posts)
                url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit=25"
                headers = {'User-Agent': 'CORSAIR-Monitor/1.0'}
                
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    
                    for post_data in data.get('data', {}).get('children', []):
                        post = post_data.get('data', {})
                        
                        # Check if post contains coastal keywords
                        text = f"{post.get('title', '')} {post.get('selftext', '')}"
                        if self.contains_keywords(text):
                            processed_post = self.process_reddit_post(post, subreddit)
                            if processed_post:
                                posts.append(processed_post)
                
                time.sleep(1)  # Rate limiting
                
            except Exception as e:
                print(f"Error fetching from r/{subreddit}: {e}")
                continue
        
        return posts
    
    def get_news_feeds(self) -> List[Dict]:
        """Fetch news from free RSS feeds"""
        posts = []
        
        # Free news RSS feeds
        feeds = [
            # NOAA/NWS (Government - Always Free)
            'https://alerts.weather.gov/cap/us.php?x=1',
            'https://www.nhc.noaa.gov/index-at.xml',
            
            # News RSS feeds (Free)
            'https://rss.cnn.com/rss/edition.rss',
            'https://feeds.npr.org/1001/rss.xml',
            'https://www.weather.com/feeds/rss',
            
            # BBC Weather (Free)
            'http://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
            
            # USGS (Government - Free)
            'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.atom'
        ]
        
        for feed_url in feeds:
            try:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries[:10]:  # Limit to 10 per feed
                    text = f"{entry.get('title', '')} {entry.get('summary', '')}"
                    
                    if self.contains_keywords(text):
                        processed_post = self.process_news_post(entry, feed_url)
                        if processed_post:
                            posts.append(processed_post)
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                print(f"Error fetching feed {feed_url}: {e}")
                continue
        
        return posts
    
    def get_government_alerts(self) -> List[Dict]:
        """Fetch free government alerts and warnings"""
        posts = []
        
        try:
            # NOAA Weather Alerts API (Free)
            url = "https://api.weather.gov/alerts/active"
            headers = {'User-Agent': 'CORSAIR-Monitor/1.0 (contact@corsair.com)'}
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                for alert in data.get('features', [])[:20]:  # Limit to 20 alerts
                    properties = alert.get('properties', {})
                    
                    # Check if alert is coastal-related
                    text = f"{properties.get('headline', '')} {properties.get('description', '')}"
                    if self.contains_keywords(text) or 'coastal' in text.lower():
                        processed_post = self.process_government_alert(properties)
                        if processed_post:
                            posts.append(processed_post)
            
        except Exception as e:
            print(f"Error fetching government alerts: {e}")
        
        return posts
    
    def contains_keywords(self, text: str) -> bool:
        """Check if text contains coastal hazard keywords"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.keywords)
    
    def process_reddit_post(self, post: Dict, subreddit: str) -> Dict:
        """Process Reddit post into standard format"""
        try:
            text = f"{post.get('title', '')} {post.get('selftext', '')}"
            
            # Sentiment analysis
            blob = TextBlob(text)
            sentiment = 'Positive' if blob.sentiment.polarity > 0.1 else ('Negative' if blob.sentiment.polarity < -0.1 else 'Neutral')
            
            # Determine urgency based on keywords
            urgency = self.determine_urgency(text)
            
            # Determine hazard type
            hazard_type = self.determine_hazard_type(text)
            
            return {
                'id': f"reddit_{post.get('id', '')}",
                'text': text[:500],  # Limit text length
                'created_at': datetime.fromtimestamp(post.get('created_utc', time.time())).isoformat(),
                'author': {
                    'username': post.get('author', 'unknown'),
                    'name': f"Reddit User (@{post.get('author', 'unknown')})",
                    'location': f"r/{subreddit}"
                },
                'location': {
                    'type': 'subreddit',
                    'name': f"r/{subreddit}"
                },
                'sentiment': sentiment,
                'polarity': blob.sentiment.polarity,
                'urgency': urgency,
                'hazard_type': hazard_type,
                'metrics': {
                    'upvotes': post.get('ups', 0),
                    'comments': post.get('num_comments', 0),
                    'score': post.get('score', 0)
                },
                'processed_at': datetime.now().isoformat(),
                'source': 'reddit',
                'url': f"https://reddit.com{post.get('permalink', '')}"
            }
        except Exception as e:
            print(f"Error processing Reddit post: {e}")
            return None
    
    def process_news_post(self, entry: Any, feed_url: str) -> Dict:
        """Process news feed entry into standard format"""
        try:
            text = f"{entry.get('title', '')} {entry.get('summary', '')}"
            
            # Clean HTML tags
            text = re.sub(r'<[^>]+>', '', text)
            
            # Sentiment analysis
            blob = TextBlob(text)
            sentiment = 'Positive' if blob.sentiment.polarity > 0.1 else ('Negative' if blob.sentiment.polarity < -0.1 else 'Neutral')
            
            # Determine urgency and hazard type
            urgency = self.determine_urgency(text)
            hazard_type = self.determine_hazard_type(text)
            
            # Determine source name
            source_name = self.get_source_name(feed_url)
            
            return {
                'id': f"news_{hash(entry.get('link', '') + entry.get('title', ''))}",
                'text': text[:500],
                'created_at': entry.get('published_parsed', time.gmtime()),
                'author': {
                    'username': source_name,
                    'name': source_name,
                    'location': 'News Source'
                },
                'location': {
                    'type': 'news',
                    'name': source_name
                },
                'sentiment': sentiment,
                'polarity': blob.sentiment.polarity,
                'urgency': urgency,
                'hazard_type': hazard_type,
                'metrics': {
                    'retweet_count': 0,
                    'like_count': 0,
                    'reply_count': 0
                },
                'processed_at': datetime.now().isoformat(),
                'source': 'news',
                'url': entry.get('link', '')
            }
        except Exception as e:
            print(f"Error processing news post: {e}")
            return None
    
    def process_government_alert(self, alert: Dict) -> Dict:
        """Process government alert into standard format"""
        try:
            text = f"{alert.get('headline', '')} {alert.get('description', '')}"
            
            # Government alerts are typically urgent and negative
            urgency = 'high' if any(word in text.lower() for word in ['warning', 'emergency', 'urgent', 'immediate']) else 'medium'
            hazard_type = self.determine_hazard_type(text)
            
            return {
                'id': f"gov_{alert.get('id', hash(text))}",
                'text': text[:500],
                'created_at': alert.get('sent', datetime.now().isoformat()),
                'author': {
                    'username': alert.get('senderName', 'NWS'),
                    'name': alert.get('senderName', 'National Weather Service'),
                    'location': 'Government Alert'
                },
                'location': {
                    'type': 'government',
                    'name': alert.get('areaDesc', 'Multiple Areas')
                },
                'sentiment': 'Negative',
                'polarity': -0.5,
                'urgency': urgency,
                'hazard_type': hazard_type,
                'metrics': {
                    'retweet_count': 100,  # Government alerts are widely shared
                    'like_count': 50,
                    'reply_count': 25
                },
                'processed_at': datetime.now().isoformat(),
                'source': 'government',
                'url': alert.get('web', '')
            }
        except Exception as e:
            print(f"Error processing government alert: {e}")
            return None
    
    def determine_urgency(self, text: str) -> str:
        """Determine urgency level from text"""
        text_lower = text.lower()
        
        high_urgency_words = ['emergency', 'urgent', 'immediate', 'warning', 'danger', 'evacuate', 'tsunami']
        medium_urgency_words = ['watch', 'advisory', 'alert', 'caution', 'prepare']
        
        if any(word in text_lower for word in high_urgency_words):
            return 'high'
        elif any(word in text_lower for word in medium_urgency_words):
            return 'medium'
        else:
            return 'low'
    
    def determine_hazard_type(self, text: str) -> str:
        """Determine hazard type from text"""
        text_lower = text.lower()
        
        hazard_patterns = {
            'tsunami': ['tsunami'],
            'coastal_flooding': ['coastal flood', 'flooding', 'flood'],
            'storm_surge': ['storm surge', 'surge'],
            'hurricane': ['hurricane', 'tropical storm'],
            'high_tide': ['high tide', 'king tide'],
            'beach_erosion': ['erosion', 'beach erosion'],
            'oil_spill': ['oil spill', 'marine pollution'],
            'rip_current': ['rip current', 'dangerous current']
        }
        
        for hazard, patterns in hazard_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                return hazard
        
        return 'general'
    
    def get_source_name(self, feed_url: str) -> str:
        """Extract source name from feed URL"""
        if 'weather.gov' in feed_url or 'noaa.gov' in feed_url:
            return 'NOAA/NWS'
        elif 'cnn.com' in feed_url:
            return 'CNN'
        elif 'npr.org' in feed_url:
            return 'NPR'
        elif 'bbc' in feed_url:
            return 'BBC'
        elif 'usgs.gov' in feed_url:
            return 'USGS'
        elif 'weather.com' in feed_url:
            return 'Weather.com'
        else:
            return 'News Source'
    
    def save_to_firebase(self, posts: List[Dict]):
        """Save posts to Firebase"""
        if not self.db:
            print("Firebase not initialized, skipping save")
            return
        
        try:
            collection_ref = self.db.collection('social_media_posts')
            
            for post in posts:
                # Use post ID as document ID to avoid duplicates
                doc_ref = collection_ref.document(post['id'])
                doc_ref.set(post, merge=True)
            
            print(f"Saved {len(posts)} posts to Firebase")
            
            # Update analytics
            self.update_analytics(posts)
            
        except Exception as e:
            print(f"Error saving to Firebase: {e}")
    
    def update_analytics(self, posts: List[Dict]):
        """Update analytics data"""
        try:
            analytics = {
                'total_mentions': len(posts),
                'sentiment_breakdown': {
                    'positive': sum(1 for p in posts if p['sentiment'] == 'Positive'),
                    'negative': sum(1 for p in posts if p['sentiment'] == 'Negative'),
                    'neutral': sum(1 for p in posts if p['sentiment'] == 'Neutral')
                },
                'urgency_breakdown': {
                    'high': sum(1 for p in posts if p['urgency'] == 'high'),
                    'medium': sum(1 for p in posts if p['urgency'] == 'medium'),
                    'low': sum(1 for p in posts if p['urgency'] == 'low')
                },
                'source_breakdown': {
                    'reddit': sum(1 for p in posts if p['source'] == 'reddit'),
                    'news': sum(1 for p in posts if p['source'] == 'news'),
                    'government': sum(1 for p in posts if p['source'] == 'government')
                },
                'last_updated': datetime.now().isoformat()
            }
            
            # Count hazard types
            hazard_counts = {}
            for post in posts:
                hazard = post['hazard_type']
                hazard_counts[hazard] = hazard_counts.get(hazard, 0) + 1
            
            analytics['hazard_types'] = hazard_counts
            
            # Calculate engagement stats
            total_engagement = sum(
                post['metrics'].get('upvotes', 0) + 
                post['metrics'].get('comments', 0) + 
                post['metrics'].get('score', 0) + 
                post['metrics'].get('retweet_count', 0) + 
                post['metrics'].get('like_count', 0)
                for post in posts
            )
            
            analytics['engagement_stats'] = {
                'total_engagement': total_engagement,
                'avg_engagement': total_engagement / len(posts) if posts else 0
            }
            
            # Save analytics
            self.db.collection('social_media_analytics').document('latest').set(analytics, merge=True)
            print("Analytics updated successfully")
            
        except Exception as e:
            print(f"Error updating analytics: {e}")
    
    def run_monitoring(self, keywords: List[str] = None):
        """Run the free monitoring service"""
        if keywords:
            self.keywords.extend(keywords)
        
        print("🌊 Starting FREE CORSAIR Social Media Monitor...")
        print(f"📝 Monitoring keywords: {', '.join(self.keywords)}")
        
        all_posts = []
        
        print("📱 Fetching Reddit posts...")
        reddit_posts = self.get_reddit_posts()
        all_posts.extend(reddit_posts)
        print(f"✅ Found {len(reddit_posts)} Reddit posts")
        
        print("📰 Fetching news feeds...")
        news_posts = self.get_news_feeds()
        all_posts.extend(news_posts)
        print(f"✅ Found {len(news_posts)} news posts")
        
        print("🏛️ Fetching government alerts...")
        gov_posts = self.get_government_alerts()
        all_posts.extend(gov_posts)
        print(f"✅ Found {len(gov_posts)} government alerts")
        
        print(f"📊 Total posts collected: {len(all_posts)}")
        
        if all_posts:
            print("💾 Saving to Firebase...")
            self.save_to_firebase(all_posts)
        
        # Generate summary
        result = {
            'success': True,
            'message': 'Free monitoring completed successfully',
            'data': {
                'total_posts': len(all_posts),
                'reddit_posts': len(reddit_posts),
                'news_posts': len(news_posts),
                'government_alerts': len(gov_posts),
                'keywords_monitored': len(self.keywords),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        print(json.dumps(result, indent=2))
        return result

if __name__ == "__main__":
    import sys
    
    # Get keywords from command line arguments
    keywords = []
    if len(sys.argv) > 1:
        keywords = sys.argv[1].split(',')
    
    # Run the free monitoring service
    monitor = FreeDataMonitor()
    monitor.run_monitoring(keywords)
