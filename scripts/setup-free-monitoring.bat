@echo off
title CORSAIR FREE Social Media Monitoring Setup

echo 🌊 CORSAIR FREE Social Media Monitoring Setup
echo ================================================
echo 💰 Cost: FREE - No API fees required!
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

echo ✅ Python found

REM Create Python virtual environment
echo 📦 Creating Python virtual environment...
cd python-services
python -m venv venv

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install FREE dependencies
echo 📚 Installing FREE Python dependencies...
echo 💰 No API costs - all sources are free!
python -m pip install --upgrade pip
pip install -r requirements-free.txt

echo.
echo 🎉 FREE monitoring setup complete!
echo.
echo 📊 Available FREE data sources:
echo   ✅ Reddit API (no auth required for public posts)
echo   ✅ News RSS feeds (CNN, NPR, BBC, Weather.com)
echo   ✅ NOAA/NWS Government APIs (always free)
echo   ✅ USGS Earthquake data (free government data)
echo.
echo 🚀 To start monitoring:
echo   1. Run: python free_social_monitor.py
echo   2. Or use the dashboard interface
echo.
echo 💡 NO API KEYS NEEDED!
echo   - No Twitter API fees ($100+/month saved!)
echo   - No premium news API costs
echo   - Only free, public data sources
echo.
echo ✨ Ready to monitor coastal hazards for FREE!
pause
