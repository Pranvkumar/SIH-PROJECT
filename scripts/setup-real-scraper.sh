#!/bin/bash

echo "Installing Real Web Scraper Dependencies..."
echo

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv-scraper" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv-scraper
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv-scraper/bin/activate

# Install dependencies
echo "Installing scraper dependencies..."
pip install -r requirements-scraper.txt

# Test the scraper
echo
echo "Testing web scraper..."
python3 python-services/real_web_scraper.py > test-output.json 2>&1

if [ -f "test-output.json" ]; then
    echo
    echo "✅ Web scraper installed successfully!"
    echo
    echo "The scraper will now fetch real-time data from:"
    echo "- NOAA Weather Alerts"
    echo "- Reddit coastal communities" 
    echo "- News RSS feeds"
    echo "- Government emergency alerts"
    echo
    echo "Press Enter to start the development server..."
    read
    
    # Start the development server
    npm run dev
else
    echo
    echo "❌ Scraper test failed. Check the error messages above."
fi
