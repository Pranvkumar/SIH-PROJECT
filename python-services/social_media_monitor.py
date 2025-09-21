import spacy
from geopy.geocoders import Nominatim
import time
import tweepy
from textblob import TextBlob
import json
import sys
import os
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# === CONFIGURATION ===
# Load environment variables
TWITTER_BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN', 'AAAAAAAAAAAAAAAAAAAAAOnS3wEAAAAAAYVNy0cKH%2FdLmyZIfNFs76Y%2BPmI%3Dd7TFqbMScFTpvyrg7oxvDQ0VrFgtuKhyweointfslpbAGifWnq')

# Load spaCy English model for Named Entity Recognition
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading spaCy model 'en_core_web_sm'...")
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# Initialize geolocator with a custom user_agent
geolocator = Nominatim(user_agent="corsair_ocean_hazard_app")

# Initialize Firebase Admin (if not already initialized)
try:
    if not firebase_admin._apps:
        # Use the same service account as your Next.js app
        cred = credentials.Certificate("firebase-admin-key.json")
        firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization warning: {e}")
    db = None

def is_location_coastal_india(location_name):
    """
    Enhanced location checking for coastal areas in India.
    Returns True if the location is in coastal India, else False.
    """
    coastal_keywords = [
        'beach', 'coast', 'port', 'marina', 'harbor', 'harbour', 
        'bay', 'gulf', 'sea', 'ocean', 'shore', 'waterfront'
    ]
    
    try:
        location = geolocator.geocode(location_name, exactly_one=True, timeout=10)
        if location and 'India' in location.address:
            # Check if it's a coastal area by keywords or coordinates
            address_lower = location.address.lower()
            if any(keyword in address_lower for keyword in coastal_keywords):
                return True
            
            # Check latitude/longitude for coastal proximity (rough estimation)
            lat, lng = location.latitude, location.longitude
            # India's coastal coordinates (very rough boundaries)
            if ((lat >= 8.0 and lat <= 23.0 and lng >= 68.0 and lng <= 78.0) or  # West coast
                (lat >= 8.0 and lat <= 22.0 and lng >= 80.0 and lng <= 93.0)):   # East coast
                return True
        return False
    except Exception as e:
        print(f"Geocoding error for '{location_name}': {e}")
        return False

def extract_location_from_text(text):
    """
    Extracts location entities (GPE or LOC) from text using spaCy NER.
    Returns the first location entity found or None.
    """
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ("GPE", "LOC"):
            return ent.text
    return None

def analyze_sentiment(text):
    """
    Enhanced sentiment analysis with severity scoring.
    Returns sentiment and urgency level.
    """
    analysis = TextBlob(text)
    polarity = analysis.sentiment.polarity
    
    # Determine sentiment
    if polarity > 0.1:
        sentiment = 'Positive'
    elif polarity < -0.1:
        sentiment = 'Negative'
    else:
        sentiment = 'Neutral'
    
    # Determine urgency based on keywords and sentiment
    urgent_keywords = [
        'emergency', 'urgent', 'danger', 'warning', 'alert', 'immediate',
        'evacuate', 'rescue', 'help', 'crisis', 'disaster', 'threat'
    ]
    
    urgency = 'low'
    text_lower = text.lower()
    if any(keyword in text_lower for keyword in urgent_keywords):
        if sentiment == 'Negative':
            urgency = 'high'
        else:
            urgency = 'medium'
    elif sentiment == 'Negative' and polarity < -0.5:
        urgency = 'medium'
    
    return {
        'sentiment': sentiment,
        'polarity': polarity,
        'urgency': urgency
    }

def extract_hazard_type(text):
    """
    Identifies the type of coastal hazard mentioned in the text.
    """
    hazard_mapping = {
        'tsunami': ['tsunami', 'tidal wave', 'seismic wave'],
        'flooding': ['flood', 'flooding', 'inundation', 'water logging'],
        'erosion': ['erosion', 'coastal erosion', 'beach erosion', 'shoreline retreat'],
        'storm_surge': ['storm surge', 'surge', 'high tide', 'king tide'],
        'pollution': ['pollution', 'oil spill', 'plastic waste', 'contamination'],
        'high_waves': ['high waves', 'rough sea', 'heavy surf', 'dangerous waves'],
        'rip_current': ['rip current', 'undertow', 'strong current'],
        'coral_bleaching': ['coral bleaching', 'coral death', 'reef damage'],
        'other': ['hazard', 'danger', 'risk', 'threat', 'emergency']
    }
    
    text_lower = text.lower()
    for hazard_type, keywords in hazard_mapping.items():
        if any(keyword in text_lower for keyword in keywords):
            return hazard_type
    
    return 'unknown'

def search_coastal_hazard_tweets(keywords=None, max_results=50):
    """
    Searches for tweets related to coastal hazards in India.
    Enhanced for CORSAIR integration.
    """
    if keywords is None:
        keywords = [
            "coastal flooding", "tsunami warning", "high tide", "storm surge",
            "beach erosion", "sea level rise", "marine pollution", "oil spill",
            "rip current", "coral bleaching", "coastal damage", "shore erosion",
            "tidal flooding", "rough sea", "dangerous waves", "coastal alert"
        ]
    
    try:
        client = tweepy.Client(bearer_token=TWITTER_BEARER_TOKEN)
    except Exception as e:
        print(f"Error creating Tweepy client: {e}")
        return []

    # Enhanced query for coastal hazards
    query = f"({' OR '.join(keywords)}) (India OR coastal OR beach OR shore) -is:retweet lang:en"
    
    try:
        tweets_response = client.search_recent_tweets(
            query=query,
            max_results=max_results,
            expansions=['geo.place_id', 'author_id'],
            place_fields=['country', 'country_code', 'full_name', 'name', 'place_type'],
            tweet_fields=['geo', 'text', 'created_at', 'public_metrics'],
            user_fields=['username', 'name', 'location']
        )
        
        if not tweets_response.data:
            print("No tweets found for coastal hazard keywords.")
            return []
        
        # Map place_id and author_id for efficient lookup
        places = {place.id: place for place in tweets_response.includes.get('places', [])}
        users = {user.id: user for user in tweets_response.includes.get('users', [])}
        
        filtered_results = []
        for tweet in tweets_response.data:
            is_coastal_india = False
            location_info = None
            
            # Check geo information
            place = places.get(tweet.geo.get('place_id')) if tweet.geo else None
            if place and place.country_code == "IN":
                is_coastal_india = True
                location_info = {
                    'type': 'geo',
                    'name': place.full_name,
                    'country': place.country
                }
            else:
                # Extract location from text or user profile
                location_name = extract_location_from_text(tweet.text)
                user = users.get(tweet.author_id)
                
                if not location_name and user and user.location:
                    location_name = user.location
                
                if location_name:
                    is_coastal_india = is_location_coastal_india(location_name)
                    if is_coastal_india:
                        location_info = {
                            'type': 'extracted',
                            'name': location_name
                        }
                    time.sleep(1)  # Rate limiting for geocoding
            
            if is_coastal_india:
                # Analyze the tweet
                sentiment_data = analyze_sentiment(tweet.text)
                hazard_type = extract_hazard_type(tweet.text)
                user_info = users.get(tweet.author_id)
                
                tweet_data = {
                    'id': tweet.id,
                    'text': tweet.text,
                    'created_at': tweet.created_at.isoformat() if tweet.created_at else None,
                    'author': {
                        'username': user_info.username if user_info else None,
                        'name': user_info.name if user_info else None,
                        'location': user_info.location if user_info else None
                    },
                    'location': location_info,
                    'sentiment': sentiment_data['sentiment'],
                    'polarity': sentiment_data['polarity'],
                    'urgency': sentiment_data['urgency'],
                    'hazard_type': hazard_type,
                    'metrics': {
                        'retweet_count': tweet.public_metrics.get('retweet_count', 0),
                        'like_count': tweet.public_metrics.get('like_count', 0),
                        'reply_count': tweet.public_metrics.get('reply_count', 0)
                    } if tweet.public_metrics else {},
                    'processed_at': datetime.now().isoformat(),
                    'source': 'twitter'
                }
                
                filtered_results.append(tweet_data)
        
        return filtered_results
    
    except tweepy.errors.TooManyRequests:
        print("Rate limit exceeded. Please wait before trying again.")
        return []
    except Exception as e:
        print(f"Error fetching tweets: {e}")
        return []

def save_to_firestore(tweets_data):
    """
    Saves social media data to Firestore for CORSAIR integration.
    """
    if not db:
        print("Firestore not initialized. Skipping database save.")
        return False
    
    try:
        batch = db.batch()
        collection_ref = db.collection('social_media_posts')
        
        for tweet in tweets_data:
            doc_ref = collection_ref.document(f"twitter_{tweet['id']}")
            batch.set(doc_ref, tweet, merge=True)
        
        batch.commit()
        print(f"Saved {len(tweets_data)} tweets to Firestore.")
        return True
    except Exception as e:
        print(f"Error saving to Firestore: {e}")
        return False

def get_analytics_summary(tweets_data):
    """
    Generates analytics summary for the dashboard.
    """
    if not tweets_data:
        return {}
    
    total_tweets = len(tweets_data)
    sentiments = [tweet['sentiment'] for tweet in tweets_data]
    urgency_levels = [tweet['urgency'] for tweet in tweets_data]
    hazard_types = [tweet['hazard_type'] for tweet in tweets_data]
    
    summary = {
        'total_mentions': total_tweets,
        'sentiment_breakdown': {
            'positive': sentiments.count('Positive'),
            'negative': sentiments.count('Negative'),
            'neutral': sentiments.count('Neutral')
        },
        'urgency_breakdown': {
            'high': urgency_levels.count('high'),
            'medium': urgency_levels.count('medium'),
            'low': urgency_levels.count('low')
        },
        'hazard_types': {hazard: hazard_types.count(hazard) for hazard in set(hazard_types)},
        'engagement_stats': {
            'avg_likes': sum(tweet['metrics'].get('like_count', 0) for tweet in tweets_data) / total_tweets,
            'avg_retweets': sum(tweet['metrics'].get('retweet_count', 0) for tweet in tweets_data) / total_tweets,
            'total_engagement': sum(
                tweet['metrics'].get('like_count', 0) + 
                tweet['metrics'].get('retweet_count', 0) + 
                tweet['metrics'].get('reply_count', 0) 
                for tweet in tweets_data
            )
        },
        'last_updated': datetime.now().isoformat()
    }
    
    return summary

def main():
    """
    Main function that can be called from Node.js or run standalone.
    """
    # Get keywords from command line arguments or use defaults
    keywords = None
    if len(sys.argv) > 1:
        keywords = sys.argv[1].split(',')
    
    print("🌊 CORSAIR Social Media Monitor Starting...")
    print(f"Searching for coastal hazard tweets with keywords: {keywords or 'default set'}")
    
    # Search for tweets
    tweets_data = search_coastal_hazard_tweets(keywords)
    
    if tweets_data:
        print(f"\n✅ Found {len(tweets_data)} relevant tweets from coastal India")
        
        # Save to Firestore
        save_to_firestore(tweets_data)
        
        # Generate analytics
        analytics = get_analytics_summary(tweets_data)
        
        # Output results as JSON for Node.js integration
        output = {
            'success': True,
            'tweets': tweets_data,
            'analytics': analytics,
            'timestamp': datetime.now().isoformat()
        }
        
        print(json.dumps(output, indent=2))
        
        # Also save analytics to Firestore
        if db:
            try:
                db.collection('social_media_analytics').document('latest').set(analytics, merge=True)
                print("📊 Analytics saved to Firestore")
            except Exception as e:
                print(f"Error saving analytics: {e}")
    
    else:
        output = {
            'success': False,
            'message': 'No relevant tweets found',
            'tweets': [],
            'analytics': {},
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(output))

if __name__ == "__main__":
    main()
