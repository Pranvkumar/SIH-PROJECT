# CORSAIR Python Services

This directory contains Python microservices for the CORSAIR coastal hazard reporting system.

## Setup

1. **Install Python dependencies:**
```bash
cd python-services
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

2. **Environment Variables:**
Create a `.env` file in the python-services directory:
```
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
```

3. **Firebase Admin Key:**
Place your `firebase-admin-key.json` file in this directory.

## Services

### Social Media Monitor (`social_media_monitor.py`)
- Monitors Twitter for coastal hazard mentions in India
- Performs sentiment analysis and location extraction
- Saves data to Firestore for CORSAIR dashboard integration
- Provides analytics for the official dashboard

## Usage

### Standalone:
```bash
python social_media_monitor.py
```

### With custom keywords:
```bash
python social_media_monitor.py "tsunami,flooding,erosion"
```

### From Node.js (via API):
The service is integrated with your Next.js app through API endpoints.

## Integration with CORSAIR

The Python services integrate with your CORSAIR dashboard through:
1. **Firestore Database** - Shared data storage
2. **API Endpoints** - Called from your Next.js app
3. **Real-time Updates** - Live social media monitoring

## Data Structure

Social media posts are stored in Firestore with this structure:
```json
{
  "id": "twitter_post_id",
  "text": "tweet content",
  "sentiment": "Positive|Negative|Neutral",
  "urgency": "high|medium|low",
  "hazard_type": "flooding|erosion|tsunami|etc",
  "location": {...},
  "metrics": {...},
  "processed_at": "2025-09-06T10:30:00Z"
}
```
