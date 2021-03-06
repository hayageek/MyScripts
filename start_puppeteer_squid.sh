export CONNECTION_TIMEOUT=60000
export MAX_QUEUE_LENGTH=25
export MAX_CONCURRENT_SESSIONS=10
export PREBOOT_CHROME=true
export WORKSPACE_DELETE_EXPIRED=true
export ENABLE_DEBUGGER=false
export ENABLE_CORS=true
export ENABLE_XVBF=false
export KEEP_ALIVE=true
export FUNCTION_ENABLE_INCOGNITO_MODE=true
export DEFAULT_IGNORE_HTTPS_ERRORS= true
export TOKEN=$HTTP_API_PROXY_KEY
cd node_app && pm2 start index.js
sh $APP_DIR/start.sh
