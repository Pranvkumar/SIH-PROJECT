from textblob import TextBlob
import json
from datetime import datetime
from typing import List, Dict, Optional

# Reuse keywords from scraper.py
KEYWORDS = [
    "ocean hazard", "tsunami", "storm surge", "hurricane", "cyclone", "typhoon",
    "flood", "coastal erosion", "sea level rise", "marine pollution", "oil spill",
    "red tide", "whirlpool", "rip current", "underwater earthquake"
]

EXTENDED_KEYWORDS = [
    "climate change ocean", "rising sea levels", "ocean warming", "coral bleaching",
    "marine heatwave", "coastal flooding", "beach erosion", "storm damage",
    "ocean acidification", "marine ecosystem"
]

class RedditHazardAnalyzer:
    def __init__(self):
        self.sentiment_cache = {}
        self.hazard_categories = {
            "tsunami": ["tsunami", "underwater earthquake"],
            "storms": ["hurricane", "cyclone", "typhoon", "storm surge", "storm damage"],
            "flooding": ["flood", "coastal flooding", "rising sea levels"],
            "erosion": ["coastal erosion", "beach erosion", "sea level rise"],
            "pollution": ["marine pollution", "oil spill", "red tide", "ocean acidification"],
            "currents": ["rip current", "whirlpool"],
            "climate": ["climate change ocean", "ocean warming", "coral bleaching", "marine heatwave"],
            "general": ["ocean hazard", "marine ecosystem"]
        }

    def analyze_sentiment(self, text: str) -> tuple:
        """Analyze sentiment of text using TextBlob with ocean hazard context"""
        text_key = text.lower().strip()
        if text_key in self.sentiment_cache:
            return self.sentiment_cache[text_key]
        
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        # Enhanced ocean/disaster-specific sentiment modifiers with weights
        disaster_severity = {
            "extreme": ["catastrophic", "devastating", "critical", "deadly", "fatal"],
            "high": ["emergency", "disaster", "severe", "dangerous", "crisis", "urgent"],
            "medium": ["warning", "threat", "damage", "hazard", "risk", "caution"],
            "low": ["minor", "moderate", "limited", "local", "contained"]
        }
        
        recovery_terms = {
            "high": ["rescued", "evacuated", "secured", "contained", "resolved"],
            "medium": ["recovering", "improving", "stabilizing", "managing"],
            "low": ["monitoring", "observing", "assessing", "preparing"]
        }
        
        # Calculate weighted sentiment adjustments
        text_lower = text.lower()
        severity_score = 0
        for level, terms in disaster_severity.items():
            weight = {'extreme': -0.4, 'high': -0.3, 'medium': -0.2, 'low': -0.1}[level]
            matches = sum(1 for term in terms if term in text_lower)
            severity_score += matches * weight

        recovery_score = 0
        for level, terms in recovery_terms.items():
            weight = {'high': 0.3, 'medium': 0.2, 'low': 0.1}[level]
            matches = sum(1 for term in terms if term in text_lower)
            recovery_score += matches * weight
        
        # Apply adjustments
        polarity += severity_score + recovery_score
        polarity = max(-1.0, min(1.0, polarity))  # Clamp value
        
        # More nuanced sentiment labels
        if polarity > 0.3:
            label = "very_positive"
        elif polarity > 0.1:
            label = "positive"
        elif polarity > -0.1:
            label = "neutral"
        elif polarity > -0.3:
            label = "negative"
        else:
            label = "very_negative"
            
        confidence = min(abs(polarity) * 2.0, 1.0)  # Increased confidence scaling
        
        result = (polarity, label, confidence)
        self.sentiment_cache[text_key] = result
        return result

    def is_ocean_hazard_relevant(self, text: str) -> bool:
        """Check if content is relevant to ocean hazards"""
        text_lower = text.lower()
        ocean_hazard_terms = KEYWORDS + EXTENDED_KEYWORDS
        return any(term.lower() in text_lower for term in ocean_hazard_terms)

    def find_matching_keywords(self, text: str) -> List[str]:
        """Find ocean hazard keywords in text"""
        text_lower = text.lower()
        return [kw for kw in (KEYWORDS + EXTENDED_KEYWORDS) if kw.lower() in text_lower]

    def categorize_hazard(self, keywords: List[str]) -> str:
        """Categorize the type of ocean hazard"""
        for category, cat_keywords in self.hazard_categories.items():
            if any(kw in cat_keywords for kw in keywords):
                return category
        return "general"

    def analyze_reddit_post(self, post: Dict) -> Optional[Dict]:
        """Analyze a Reddit post for ocean hazard content"""
        if not self.is_ocean_hazard_relevant(post.get('title', '') + ' ' + post.get('selftext', '')):
            return None

        # Combine title and text for analysis
        full_text = f"{post['title']} {post['selftext']}"
        matched_keywords = self.find_matching_keywords(full_text)
        sentiment_score, sentiment_label, confidence = self.analyze_sentiment(full_text)
        hazard_category = self.categorize_hazard(matched_keywords)

        return {
            'id': f"reddit_{post['id']}",
            'text': full_text,
            'created_at': datetime.fromtimestamp(post['created_utc']).isoformat(),
            'author': {
                'username': post['author'],
                'name': post['author'],
                'location': post.get('subreddit', 'Unknown')
            },
            'location': {
                'type': 'subreddit',
                'name': post['subreddit_name_prefixed']
            },
            'sentiment': sentiment_label.capitalize(),
            'polarity': sentiment_score,
            'urgency': self.determine_urgency(sentiment_score, matched_keywords),
            'hazard_type': hazard_category,
            'metrics': {
                'upvotes': post['ups'],
                'comments': post['num_comments'],
                'score': post['score']
            },
            'processed_at': datetime.now().isoformat(),
            'source': 'reddit',
            'matched_keywords': matched_keywords
        }

    def determine_urgency(self, sentiment_score: float, keywords: List[str]) -> str:
        """Determine post urgency based on sentiment and keywords"""
        urgent_keywords = ['urgent', 'emergency', 'warning', 'evacuate', 'danger', 'alert']
        has_urgent = any(kw in ' '.join(keywords).lower() for kw in urgent_keywords)
        
        if has_urgent or sentiment_score < -0.7:
            return 'high'
        elif sentiment_score < -0.3:
            return 'medium'
        else:
            return 'low'

def generate_mock_reddit_posts() -> List[Dict]:
    """Generate mock Reddit posts for testing"""
    return [
        {
            'id': 'mock1',
            'title': 'URGENT: Massive coastal erosion reported in Florida',
            'selftext': 'Beach areas are experiencing severe erosion due to recent storms. Local authorities advising residents to stay away from affected areas.',
            'author': 'CoastalScientist',
            'created_utc': datetime.now().timestamp(),
            'subreddit': 'CoastalEngineering',
            'subreddit_name_prefixed': 'r/CoastalEngineering',
            'ups': 156,
            'num_comments': 45,
            'score': 180
        },
        {
            'id': 'mock2',
            'title': 'Rising sea levels threaten Pacific island communities',
            'selftext': 'New study shows accelerating coastal flooding and erosion patterns. Communities need immediate adaptation strategies.',
            'author': 'OceanResearcher',
            'created_utc': datetime.now().timestamp(),
            'subreddit': 'ClimateChange',
            'subreddit_name_prefixed': 'r/ClimateChange',
            'ups': 234,
            'num_comments': 78,
            'score': 250
        },
        {
            'id': 'mock3',
            'title': 'Oil spill detected off California coast',
            'selftext': 'Environmental teams responding to marine pollution incident. Wildlife at risk, cleanup operations underway.',
            'author': 'MarineConservation',
            'created_utc': datetime.now().timestamp(),
            'subreddit': 'Environment',
            'subreddit_name_prefixed': 'r/Environment',
            'ups': 567,
            'num_comments': 123,
            'score': 600
        }
    ]

def get_analyzed_reddit_posts(use_mock: bool = True) -> List[Dict]:
    """Get and analyze Reddit posts"""
    analyzer = RedditHazardAnalyzer()
    
    if use_mock:
        posts = generate_mock_reddit_posts()
    else:
        # TODO: Implement real Reddit API integration
        posts = generate_mock_reddit_posts()
    
    analyzed_posts = []
    for post in posts:
        analyzed = analyzer.analyze_reddit_post(post)
        if analyzed:
            analyzed_posts.append(analyzed)
    
    return analyzed_posts

if __name__ == "__main__":
    # Test the analyzer
    posts = get_analyzed_reddit_posts()
    print(json.dumps(posts, indent=2))
