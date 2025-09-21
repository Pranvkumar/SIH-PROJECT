# 🌊 CORSAIR Social Media Integration

## Overview

The CORSAIR Social Media Integration provides real-time monitoring and analysis of social media platforms to detect, track, and analyze coastal hazard-related content. This system combines advanced NLP, sentiment analysis, and geolocation capabilities to provide actionable intelligence for emergency management.

## Features

### 📱 Real-Time Monitoring
- **Twitter/X Integration**: Monitor tweets with coastal hazard keywords
- **Sentiment Analysis**: Classify posts as positive, negative, or neutral using TextBlob
- **Location Detection**: Extract and validate coastal locations using geopy and spaCy NER
- **Urgency Classification**: Categorize posts by urgency level (high, medium, low)

### 📊 Advanced Analytics
- **Sentiment Breakdown**: Visual representation of public sentiment
- **Hazard Type Distribution**: Track most common coastal hazards mentioned
- **Location Hotspots**: Identify areas with highest social media activity
- **Engagement Metrics**: Monitor likes, retweets, and replies
- **Trending Keywords**: Track popular hashtags and terms

### 🎯 Intelligent Filtering
- **Coastal Focus**: Only processes content from coastal areas in India
- **Hazard Detection**: Uses ML to identify genuine hazard-related content
- **Spam Filtering**: Excludes irrelevant or promotional content
- **Geographic Clustering**: Groups related posts by location

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Twitter API   │    │   Python Service │    │   Firebase DB   │
│                 │────│                  │────│                 │
│ • Real-time     │    │ • NLP Processing │    │ • Data Storage  │
│ • Tweet Stream  │    │ • Sentiment      │    │ • Analytics     │
│ • Geolocation   │    │ • Classification │    │ • Persistence   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │    API Routes    │    │  React Components│
│                 │────│                  │────│                 │
│ • Dashboard     │    │ • Data Fetching  │    │ • Feed Display  │
│ • Visualization │    │ • Monitor Control│    │ • Analytics     │
│ • User Interface│    │ • Status Check   │    │ • Management    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Setup Python Environment
```bash
# Windows
.\quick-setup-social-media.bat

# Unix/Linux/macOS
./quick-setup-social-media.sh
```

### 2. Twitter Integration Setup

#### Option 1: Demo Mode (Recommended for Development)
The system includes a built-in demo mode that provides realistic ocean hazard tweets for development and testing:

```python
from backend.scraper import OceanHazardAnalyzer

# Initialize analyzer with demo data
analyzer = OceanHazardAnalyzer()
tweets = analyzer.search_ocean_hazards(use_mock_data=True)

# Process and display results
for tweet in tweets[:5]:
    print(f"User: @{tweet.handle}")
    print(f"Content: {tweet.content}")
    print(f"Sentiment: {tweet.sentiment_label} (Score: {tweet.sentiment_score:.2f})")
    print(f"Category: {tweet.hazard_category}")
```

Demo data includes realistic scenarios for:
- Tsunami warnings
- Hurricane updates
- Coastal flooding
- Marine pollution
- Climate change effects

#### Option 2: API Setup (Production)
1. Visit [Twitter Developer Portal](https://developer.twitter.com)
2. Create a new app and get Bearer Token
3. Create `python-services/.env`:
   ```
   TWITTER_BEARER_TOKEN=your_bearer_token_here
   ```

#### Firebase Setup
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Save as `python-services/firebase-admin-key.json`

### 3. Start the System
```bash
# Start the Next.js app
npm run dev

# In another terminal, start Python monitoring
cd python-services
python social_media_monitor.py
```

### 4. Access the Dashboard
1. Open http://localhost:9002
2. Sign in as an Official
3. Navigate to Dashboard > Social Media

## API Endpoints

### `/api/social-media/data`
**GET** - Retrieve social media posts and analytics
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "analytics": {...},
    "count": 25
  }
}
```

### `/api/social-media/monitor`
**POST** - Start monitoring with keywords
```json
{
  "keywords": ["tsunami", "flooding", "storm surge"]
}
```

### `/api/social-media/test-data`
**GET** - Get demo ocean hazard data
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "username": "OceanWatch",
        "handle": "oceanwatch",
        "content": "Massive tsunami warning issued for Pacific coast. Waves up to 15 feet expected. Evacuate immediately! #tsunami #safety",
        "timestamp": "2024-09-10 14:30",
        "sentiment": {
          "label": "negative",
          "score": -0.75,
          "confidence": 0.85
        },
        "hazard_category": "tsunami",
        "metrics": {
          "retweets": 1200,
          "likes": 2500,
          "replies": 300
        }
      }
    ],
    "analytics": {
      "sentiment_distribution": {
        "negative": 60,
        "neutral": 25,
        "positive": 15
      },
      "hazard_categories": {
        "tsunami": 15,
        "storms": 20,
        "flooding": 10,
        "erosion": 5
      }
    }
  },
  "message": "Demo ocean hazard data for testing"
}
```

## Data Structure

### Social Media Post
```typescript
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
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
  processed_at: string;
  source: string;
}
```

### Analytics Data
```typescript
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
  location_hotspots: Array<{
    location: string;
    mentions: number;
    risk_level: 'high' | 'medium' | 'low';
  }>;
  last_updated: string;
}
```

## Components

### 🔄 Social Media Management (`SocialMediaManagement.tsx`)
- **Purpose**: Main dashboard for social media monitoring
- **Features**: System status, monitoring controls, tabbed interface
- **Tabs**: Feed, Analytics, Settings

### 📊 Analytics Dashboard (`SocialMediaAnalyticsDashboard.tsx`)
- **Purpose**: Comprehensive analytics and visualization
- **Features**: Key metrics, sentiment analysis, location hotspots
- **Visualizations**: Charts, maps, trend analysis

### 📱 Social Media Feed (`OfficialSocialMediaFeed.tsx`)
- **Purpose**: Real-time social media post display
- **Features**: Post filtering, search, engagement metrics
- **Interactions**: Like, share, reply tracking

## Monitoring Keywords

The system monitors these coastal hazard keywords by default:
- `tsunami`
- `flooding`
- `storm surge`
- `coastal erosion`
- `hurricane`
- `high tide`
- `beach erosion`
- `sea level rise`
- `coastal flooding`

## Location Detection

The system focuses on coastal areas in India and uses:
- **Coastal Keywords**: beach, coast, port, marina, harbor, bay, gulf, sea, ocean
- **Geographic Validation**: Coordinates within 100km of coastline
- **Named Entity Recognition**: spaCy NER for location extraction
- **Geocoding**: Nominatim for address resolution

## Sentiment Analysis

Using TextBlob for sentiment classification:
- **Positive**: Polarity > 0.1
- **Negative**: Polarity < -0.1
- **Neutral**: -0.1 ≤ Polarity ≤ 0.1

## Security & Privacy

- **No Personal Data Storage**: Only public social media data
- **API Rate Limiting**: Respects Twitter API limits
- **Data Retention**: 30-day automatic cleanup
- **Anonymization**: User identifiers are hashed

## Troubleshooting

### Demo Data Generation

The system includes a `MockDataGenerator` class that provides realistic ocean hazard tweets for development and testing:

```python
from backend.scraper import MockDataGenerator

# Generate 20 mock tweets
mock_tweets = MockDataGenerator.generate_mock_tweets(num_tweets=20)

# Process mock tweets
for tweet in mock_tweets:
    print(f"Author: {tweet['username']}")
    print(f"Content: {tweet['content']}")
    print(f"Engagement: {tweet['likes']} likes, {tweet['retweets']} retweets")
```

### Common Issues

#### 1. Python Service Not Starting
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip install -r requirements.txt

# Test spaCy model
python -c "import spacy; nlp = spacy.load('en_core_web_sm')"
```

#### 2. Twitter API Errors
- Verify Bearer Token is correct
- Check API usage limits
- Ensure app has read permissions

#### 3. Firebase Connection Issues
- Verify service account key path
- Check Firebase project permissions
- Ensure Firestore is enabled

#### 4. No Data Appearing
- Check network connectivity
- Verify API endpoints are working
- Test with mock data first

### Debug Mode
```bash
# Enable debug logging
cd python-services
python social_media_monitor.py --debug

# Test with specific keywords
python social_media_monitor.py "tsunami,flooding"
```

## Demo Data Integration Guide

### Setup Demo Environment

1. **Install Required Packages**
```bash
pip install selenium webdriver-manager fake-useragent beautifulsoup4 requests pandas textblob
```

2. **Import Demo Components**
```python
from backend.scraper import (
    OceanHazardAnalyzer,
    MockDataGenerator,
    OceanHazardTweet
)
```

3. **Initialize Demo System**
```python
# Create analyzer with demo mode
analyzer = OceanHazardAnalyzer()

# Generate demo data
demo_tweets = analyzer.search_ocean_hazards(
    max_tweets_per_keyword=15,
    use_mock_data=True
)
```

### Available Demo Data Types

1. **Emergency Alerts**
```python
# Example emergency tweet
{
    'username': 'OceanWatch',
    'content': 'URGENT: Tsunami warning for Pacific coast...',
    'hazard_category': 'tsunami',
    'sentiment_label': 'negative',
    'urgency': 'high'
}
```

2. **Status Updates**
```python
# Example status update
{
    'username': 'CoastGuard',
    'content': 'Storm surge levels decreasing. Monitoring continues...',
    'hazard_category': 'storms',
    'sentiment_label': 'neutral',
    'urgency': 'medium'
}
```

3. **Recovery Reports**
```python
# Example recovery tweet
{
    'username': 'MarineRescue',
    'content': 'Cleanup operations successful. Beach areas secured...',
    'hazard_category': 'pollution',
    'sentiment_label': 'positive',
    'urgency': 'low'
}
```

### Using Demo Data in Development

1. **Basic Demo Data Retrieval**
```python
def get_demo_hazard_data():
    analyzer = OceanHazardAnalyzer()
    tweets = analyzer.search_ocean_hazards(use_mock_data=True)
    return tweets

# Usage
demo_data = get_demo_hazard_data()
```

2. **Custom Demo Data Generation**
```python
def generate_custom_demo(num_tweets=20, hazard_type=None):
    mock_gen = MockDataGenerator()
    tweets = mock_gen.generate_mock_tweets(num_tweets)
    
    if hazard_type:
        tweets = [t for t in tweets if t['hazard_category'] == hazard_type]
    
    return tweets

# Usage
tsunami_data = generate_custom_demo(10, 'tsunami')
```

3. **Demo Data Analysis**
```python
def analyze_demo_data(tweets):
    # Group by hazard type
    hazard_groups = {}
    for tweet in tweets:
        category = tweet.hazard_category
        if category not in hazard_groups:
            hazard_groups[category] = []
        hazard_groups[category].append(tweet)
    
    # Calculate statistics
    analysis = {
        'total_tweets': len(tweets),
        'by_category': {
            category: len(tweets) 
            for category, tweets in hazard_groups.items()
        },
        'sentiment': {
            'positive': len([t for t in tweets if t.sentiment_label == 'positive']),
            'negative': len([t for t in tweets if t.sentiment_label == 'negative']),
            'neutral': len([t for t in tweets if t.sentiment_label == 'neutral'])
        }
    }
    
    return analysis

# Usage
demo_analysis = analyze_demo_data(demo_data)
```

### Demo Data Categories

The demo system provides realistic data for these hazard categories:

1. **Natural Disasters**
   - Tsunamis
   - Hurricanes
   - Storm surges
   - Earthquakes

2. **Environmental Hazards**
   - Marine pollution
   - Oil spills
   - Red tides
   - Beach erosion

3. **Climate Effects**
   - Sea level rise
   - Coral bleaching
   - Ocean warming
   - Marine heatwaves

### Demo Data Integration Examples

1. **API Endpoint Integration**
```python
from fastapi import FastAPI
from backend.scraper import OceanHazardAnalyzer

app = FastAPI()

@app.get("/api/demo/hazards")
async def get_hazard_data():
    analyzer = OceanHazardAnalyzer()
    tweets = analyzer.search_ocean_hazards(use_mock_data=True)
    return {
        "success": True,
        "data": [tweet.__dict__ for tweet in tweets]
    }
```

2. **Frontend Integration**
```typescript
// React component example
const HazardFeed: React.FC = () => {
    const [hazards, setHazards] = useState<HazardTweet[]>([]);

    useEffect(() => {
        fetch('/api/demo/hazards')
            .then(res => res.json())
            .then(data => setHazards(data.data));
    }, []);

    return (
        <div className="hazard-feed">
            {hazards.map(hazard => (
                <HazardCard
                    key={hazard.tweet_id}
                    data={hazard}
                />
            ))}
        </div>
    );
};
```

3. **Data Visualization**
```python
import pandas as pd
import matplotlib.pyplot as plt

def visualize_demo_data(tweets):
    df = pd.DataFrame([tweet.__dict__ for tweet in tweets])
    
    # Create visualizations
    plt.figure(figsize=(12, 6))
    
    # Hazard distribution
    df['hazard_category'].value_counts().plot(kind='bar')
    plt.title('Hazard Type Distribution')
    plt.show()
    
    # Sentiment analysis
    df['sentiment_label'].value_counts().plot(kind='pie')
    plt.title('Sentiment Distribution')
    plt.show()

# Usage
demo_tweets = get_demo_hazard_data()
visualize_demo_data(demo_tweets)
```

### Best Practices for Demo Data

1. **Development Workflow**
   - Use demo data during initial development
   - Test all features with demo data first
   - Validate UI components with various data scenarios

2. **Testing Scenarios**
   - Test with different volumes of data
   - Include edge cases in mock data
   - Verify handling of all hazard types

3. **Demo Data Maintenance**
   - Regularly update mock data patterns
   - Keep demo content realistic and relevant
   - Maintain consistent data structure

### Transitioning to Production

When ready to move from demo to production:

1. **Data Source Switch**
```python
def get_hazard_data(use_demo=False):
    analyzer = OceanHazardAnalyzer()
    if use_demo:
        return analyzer.search_ocean_hazards(use_mock_data=True)
    else:
        return analyzer.search_ocean_hazards(use_mock_data=False)
```

2. **Configuration Management**
```python
# config.py
ENVIRONMENT = 'development'  # or 'production'
USE_DEMO_DATA = ENVIRONMENT == 'development'

# usage
demo_mode = config.USE_DEMO_DATA
hazard_data = get_hazard_data(use_demo=demo_mode)
```

## Performance Optimization

### Database Optimization
- **Indexing**: Automatic indexing on timestamp and location
- **Pagination**: Large datasets are paginated
- **Caching**: 5-minute cache for analytics data

### API Optimization
- **Rate Limiting**: Respects Twitter API limits (2M tweets/month)
- **Batching**: Processes posts in batches of 100
- **Filtering**: Pre-filters irrelevant content

### UI Optimization
- **Lazy Loading**: Components load data as needed
- **Virtual Scrolling**: Handles large post lists efficiently
- **Debounced Search**: Reduces API calls during search

## Deployment

### Production Deployment
1. Set up production Firebase project
2. Configure environment variables
3. Deploy Python service to cloud (AWS/GCP/Azure)
4. Set up monitoring and alerts
5. Configure backup and disaster recovery

### Environment Variables
```bash
# Production .env
TWITTER_BEARER_TOKEN=prod_token
FIREBASE_PROJECT_ID=corsair-prod
ENVIRONMENT=production
LOG_LEVEL=info
```

## Monitoring & Alerts

The system includes built-in monitoring:
- **Health Checks**: Automatic service status monitoring
- **Error Tracking**: Failed API calls and processing errors
- **Performance Metrics**: Processing speed and memory usage
- **Data Quality**: Sentiment accuracy and location validation

## Future Enhancements

### Planned Features
- **Facebook Integration**: Monitor Facebook posts and pages
- **Instagram Integration**: Analyze Instagram stories and posts
- **Reddit Monitoring**: Track coastal hazard discussions
- **YouTube Analysis**: Monitor coastal hazard videos
- **Multi-language Support**: Expand beyond English
- **AI Prediction**: Predict hazard severity from social signals

### Advanced Analytics
- **Trend Prediction**: Forecast hazard likelihood
- **Influence Mapping**: Identify key social media influencers
- **Cross-platform Correlation**: Compare data across platforms
- **Real-time Alerts**: Instant notifications for high-urgency posts

## Support

For technical support or feature requests:
1. Check this documentation
2. Review troubleshooting section
3. Check GitHub issues
4. Contact development team

---

**Built with ❤️ for coastal safety and emergency management**
