@echo off
echo 🌊 Setting up CORSAIR Python Services...

REM Create virtual environment
echo Creating Python virtual environment...
python -m venv python-services\venv

REM Activate virtual environment
echo Activating virtual environment...
call python-services\venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r python-services\requirements.txt

REM Download spaCy model
echo Downloading spaCy English model...
python -m spacy download en_core_web_sm

echo ✅ Python services setup complete!
echo.
echo Next steps:
echo 1. Add your Twitter Bearer Token to python-services\.env:
echo    TWITTER_BEARER_TOKEN=your_token_here
echo.
echo 2. Place your firebase-admin-key.json in the python-services directory
echo.
echo 3. Test the integration with:
echo    npm run dev
echo    Then visit the Official Dashboard ^> Social Media Feed
echo.
echo 🚀 Ready to monitor social media for coastal hazards!
pause
