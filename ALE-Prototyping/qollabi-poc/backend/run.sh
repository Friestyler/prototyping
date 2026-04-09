#!/bin/bash
# Qollabi PoC - Quick Start
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
export DB_PATH="${DB_PATH:-$SCRIPT_DIR/data/qollabi.db}"
mkdir -p "$(dirname "$DB_PATH")"

echo "=== Qollabi Partner Intelligence Platform ==="

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

if [ ! -f "$DB_PATH" ]; then
    echo "Importing data from Excel..."
    EXCEL="${1:-$SCRIPT_DIR/../ALE Leadership smart update.xlsx}"
    [ -f "$EXCEL" ] && python3 scripts/import_data.py "$EXCEL" || echo "Run: python3 scripts/import_data.py /path/to/excel.xlsx"
fi

echo ""
echo "Server:   http://localhost:8000"
echo "API docs: http://localhost:8000/docs"
echo "Frontend: open ../frontend/index.html"
echo ""
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
