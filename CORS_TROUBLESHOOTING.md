# CORS Error Troubleshooting for LM Studio

## Quick Fix Steps

### 1. Restart the Development Server
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 2. Verify LM Studio is Running
1. Open LM Studio
2. Go to the "Server" tab
3. Make sure the server is running on `http://localhost:1234`
4. Check that it shows "Server is running"

### 3. Test LM Studio Connection
Open your browser and go to: `http://localhost:1234/v1/models`

You should see a JSON response with available models.

### 4. Check Browser Console
Open browser dev tools (F12) and look for:
- Network errors
- CORS errors
- Connection refused errors

## Alternative Solutions

### Option 1: Use Direct Connection (Bypass Proxy)
If the proxy doesn't work, you can modify the constants to use direct connection:

```typescript
// In src/constants/index.ts
LMSTUDIO_BASE_URL: 'http://localhost:1234/v1',
```

**Note**: This may still cause CORS errors depending on your LM Studio configuration.

### Option 2: Enable CORS in LM Studio
1. In LM Studio, go to Settings
2. Look for CORS or API settings
3. Enable CORS for localhost:5173 (Vite dev server)
4. Or enable "Allow all origins"

### Option 3: Use Different Port
If port 1234 is blocked, try:
1. In LM Studio, change the server port to 8080
2. Update the fallback URL in the service:
```typescript
private fallbackUrl: string = 'http://localhost:8080/v1'
```

### Option 4: Browser Extension
Install a CORS browser extension like "CORS Unblock" for development.

## Debugging Steps

### 1. Check Network Tab
1. Open browser dev tools
2. Go to Network tab
3. Try to send a message
4. Look for failed requests to `/api/lmstudio/chat/completions`

### 2. Check Console Logs
The service will log:
- "Proxy failed, trying direct connection to LM Studio"
- "Proxy failed for models, trying direct connection to LM Studio"

### 3. Test API Endpoints Manually
```bash
# Test models endpoint
curl http://localhost:1234/v1/models

# Test chat endpoint
curl -X POST http://localhost:1234/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3.2-3b-instruct",
    "messages": [{"role": "user", "content": "Hello"}],
    "stream": false
  }'
```

## Common Issues

### Issue: "Failed to fetch"
- **Cause**: LM Studio not running
- **Solution**: Start LM Studio server

### Issue: "CORS policy" error
- **Cause**: Browser blocking cross-origin requests
- **Solution**: Use the proxy (already configured) or enable CORS in LM Studio

### Issue: "Connection refused"
- **Cause**: Wrong port or LM Studio not running
- **Solution**: Check LM Studio is running on port 1234

### Issue: "Model not found"
- **Cause**: Model not loaded in LM Studio
- **Solution**: Load a model in LM Studio first

## Fallback Configuration

The service is configured to automatically fallback from proxy to direct connection if the proxy fails. This should handle most CORS issues automatically.

## Still Having Issues?

1. Check if LM Studio is actually running
2. Try a different browser
3. Clear browser cache
4. Restart both LM Studio and the dev server
5. Check firewall settings
