#!/bin/bash

echo "🌊 CORSAIR Social Media Integration Setup"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found"

# Create Python virtual environment
echo "📦 Creating Python virtual environment..."
cd python-services
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📚 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
echo "🧠 Downloading spaCy English model..."
python -m spacy download en_core_web_sm

echo ""
echo "🎉 Python services setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Twitter Bearer Token from https://developer.twitter.com"
echo "2. Create a .env file in python-services/ with:"
echo "   TWITTER_BEARER_TOKEN=your_token_here"
echo ""
echo "3. Get your Firebase Admin SDK key:"
echo "   - Go to Firebase Console > Project Settings > Service Accounts"
echo "   - Generate new private key"
echo "   - Save as firebase-admin-key.json in python-services/"
echo ""
echo "4. Test the integration:"
echo "   npm run dev"
echo "   Then visit Official Dashboard > Social Media"
echo ""
echo "🚀 Ready to monitor social media for coastal hazards!"
