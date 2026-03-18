export CORS_ALLOW_ORIGIN="http://127.0.0.1:5175;http://localhost:5175;http://127.0.0.1:8080"
PORT="${PORT:-8080}"
uvicorn open_webui.main:app --port $PORT --host 0.0.0.0 --forwarded-allow-ips '*' --reload
