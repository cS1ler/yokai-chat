# Base URL Configuration Fix

## Issue

The application was using hardcoded base URLs (`/v1` and `http://localhost:5173/v1`) instead of the user-provided IP address from the landing page.

## Changes Made

### 1. **Constants Update** (`src/constants/index.ts`)

- ✅ Removed hardcoded `LMSTUDIO_BASE_URL: '/v1'`
- ✅ Added comment explaining that base URL is now dynamic

### 2. **Models Store Update** (`src/stores/models.ts`)

- ✅ Changed initial `lmStudioBaseUrl` from `APP_CONFIG.LMSTUDIO_BASE_URL` to empty string
- ✅ Added `isBaseUrlValid()` method to validate URL format
- ✅ Added `clearBaseUrl()` method for reset functionality
- ✅ All methods now use dynamic base URL from user input

### 3. **Router Guards Enhancement** (`src/router/index.ts`)

- ✅ Enhanced navigation guards to validate base URL format
- ✅ Added proper URL validation using `new URL()`
- ✅ Prevents access to `/chat` and `/models` without valid base URL
- ✅ Redirects to landing page if base URL is invalid or missing
- ✅ Uses store's `isBaseUrlValid()` method for consistent validation

### 4. **Service Layer Fix** (`src/services/lmstudio.ts`)

- ✅ Removed hardcoded singleton export `lmStudioService`
- ✅ All service instances now use `createLMStudioService(baseUrl)`
- ✅ Service properly uses dynamic base URL from user input

### 5. **View Components Update**

- ✅ **ChatView**: Added `loadLMStudioBaseUrlFromStorage()` on mount
- ✅ **ModelDownloadView**: Enhanced to load base URL from storage and validate
- ✅ **LandingPage**: Already properly handling user input and URL construction

### 6. **Navigation Flow**

- ✅ Users must provide valid IP address on landing page
- ✅ Base URL is validated before allowing access to protected routes
- ✅ Invalid or missing base URL redirects to landing page
- ✅ All API requests use the user-provided base URL

## Validation Rules

### Base URL Validation

```typescript
const isBaseUrlValid = () => {
  if (!lmStudioBaseUrl.value || lmStudioBaseUrl.value === '') {
    return false
  }

  try {
    new URL(lmStudioBaseUrl.value)
    return true
  } catch {
    return false
  }
}
```

### Router Guard Logic

```typescript
// Check if user is trying to access protected routes without a valid base URL
if (to.name === 'chat' || to.name === 'models') {
  const modelsStore = useModelsStore()

  // Load the base URL from storage if not already loaded
  if (!modelsStore.lmStudioBaseUrl) {
    modelsStore.loadLMStudioBaseUrlFromStorage()
  }

  // Check if base URL is valid
  if (!modelsStore.isBaseUrlValid()) {
    console.warn('No valid LM Studio base URL found, redirecting to landing page')
    return next({ name: 'landing' })
  }
}
```

## User Flow

1. **Landing Page**: User enters IP address (e.g., `192.168.1.100:1234`)
2. **URL Construction**: App constructs full URL (`http://192.168.1.100:1234/v1`)
3. **Validation**: URL is validated and stored in localStorage
4. **Navigation**: User can access `/chat` and `/models` routes
5. **API Calls**: All requests use the user-provided base URL

## Error Handling

- ✅ Invalid URL format redirects to landing page
- ✅ Missing base URL redirects to landing page
- ✅ Hardcoded URLs (`/v1`, `localhost:5173`) are rejected
- ✅ Proper error messages and console warnings

## Testing Scenarios

### ✅ Valid Scenarios

- `192.168.1.100:1234` → `http://192.168.1.100:1234/v1`
- `http://192.168.1.100:1234` → `http://192.168.1.100:1234/v1`
- `https://192.168.1.100:1234` → `https://192.168.1.100:1234/v1`

### ❌ Invalid Scenarios (Redirect to Landing)

- Empty string
- `/v1` (relative path)
- `http://localhost:5173/v1` (hardcoded localhost)
- Invalid URL format
- Missing base URL

## Benefits

1. **Dynamic Configuration**: Users can connect to any LM Studio instance
2. **Proper Validation**: Prevents invalid URLs from being used
3. **Security**: No hardcoded URLs that could be exploited
4. **User Experience**: Clear error handling and redirects
5. **Flexibility**: Supports both HTTP and HTTPS, custom ports

## Files Modified

- `src/constants/index.ts` - Removed hardcoded base URL
- `src/stores/models.ts` - Added validation and dynamic base URL handling
- `src/router/index.ts` - Enhanced navigation guards
- `src/services/lmstudio.ts` - Removed hardcoded singleton
- `src/views/ChatView.vue` - Added base URL loading
- `src/views/ModelDownloadView.vue` - Enhanced base URL handling

## Result

✅ **All API requests now use the user-provided IP address**
✅ **No hardcoded URLs remain in the codebase**
✅ **Proper validation prevents invalid configurations**
✅ **Users are redirected to landing page if no valid base URL is set**
