@echo off
echo Installing Real Web Scraper Dependencies...
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

:: Create virtual environment if it doesn't exist
if not exist "venv-scraper" (
    echo Creating Python virtual environment...
    python -m venv venv-scraper
)

:: Activate virtual environment
echo Activating virtual environment...
call venv-scraper\Scripts\activate.bat

:: Install dependencies
echo Installing scraper dependencies...
pip install -r requirements-scraper.txt

:: Test the scraper
echo.
echo Testing web scraper...
python python-services\real_web_scraper.py > test-output.json 2>&1

if exist test-output.json (
    echo.
    echo ✅ Web scraper installed successfully!
    echo.
    echo The scraper will now fetch real-time data from:
    echo - NOAA Weather Alerts
    echo - Reddit coastal communities
    echo - News RSS feeds
    echo - Government emergency alerts
    echo.
    echo Press any key to start the development server...
    pause >nul
    
    :: Start the development server
    npm run dev
) else (
    echo.
    echo ❌ Scraper test failed. Check the error messages above.
    pause
)
