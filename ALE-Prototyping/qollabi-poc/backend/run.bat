@echo off
REM Qollabi Backend Quick Start Script for Windows

echo ========================================
echo Qollabi Partner Management Backend
echo ========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

echo Python version:
python --version
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created.
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install/upgrade dependencies
echo Installing dependencies...
pip install -q -r requirements.txt
echo Dependencies installed.
echo.

REM Import data if database doesn't exist
if not exist "data\qollabi.db" (
    echo Database not found. Importing data from Excel...
    python scripts\import_data.py
    echo.
) else (
    echo Database found at data\qollabi.db
    echo.
)

REM Start the server
echo Starting FastAPI server...
echo.
echo ========================================
echo Server running at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
