@echo off
title CORSAIR Social Media Integration Setup

echo 🌊 CORSAIR Social Media Integration Setup
echo ========================================
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

REM Install Python dependencies
echo 📚 Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Download spaCy model
echo 🧠 Downloading spaCy English model...
python -m spacy download en_core_web_sm

echo.
echo 🎉 Python services setup complete!
echo.
echo Next steps:
echo 1. Get your Twitter Bearer Token from https://developer.twitter.com
echo 2. Create a .env file in python-services\ with:
echo    TWITTER_BEARER_TOKEN=your_token_here
echo.
echo 3. Get your Firebase Admin SDK key:
echo    - Go to Firebase Console ^> Project Settings ^> Service Accounts
echo    - Generate new private key
echo    - Save as firebase-admin-key.json in python-services\
echo.
echo 4. Test the integration:
echo    npm run dev
echo    Then visit Official Dashboard ^> Social Media
echo.
echo 🚀 Ready to monitor social media for coastal hazards!
pause
