# API Factory Pattern Usage Guide

## Overview

The API helper has been refactored to use a factory pattern that supports multiple base URLs and content types. This allows you to easily switch between different API endpoints based on your requirements.

## Available API Clients

### 1. `APIClients.default`
- **Base URL**: `https://api1.homeocentrum.com/api`
- **Content Type**: `application/json`
- **Use Case**: Default API for most operations

### 2. `APIClients.nigahomeo`
- **Base URL**: `https://api.nigahomeopathy.com/api`
- **Content Type**: `application/json`
- **Use Case**: Nigahomeopathy API for JSON operations

### 3. `APIClients.nigahomeoMultipart`
- **Base URL**: `https://api.nigahomeopathy.com/api`
- **Content Type**: `multipart/form-data`
- **Use Case**: Nigahomeopathy API for file uploads and form data

## Usage Examples

### 1. Direct API Client Usage

```javascript
import { APIClients } from './api_helper';

// Use default API (HOMOCENTRUM)
const response = await APIClients.default.get('/users');

// Use Nigahomeopathy API with JSON
const clinicalData = await APIClients.nigahomeo.get('/clinicalquestions');

// Use Nigahomeopathy API with multipart for file upload
const formData = new FormData();
formData.append('file', file);
const uploadResult = await APIClients.nigahomeoMultipart.post('/import', formData);
```

### 2. Using the APIClient Class

```javascript
import { APIClient } from './api_helper';

const api = new APIClient();

// These use the default API client
const users = await api.get('/users');
const result = await api.create('/users', userData);
```

### 3. In Redux Thunks

```javascript
import { APIClients } from '../helpers/api_helper';

export const fetchClinicalQuestions = () => {
  return async (dispatch) => {
    try {
      // Use Nigahomeopathy API specifically
      const response = await APIClients.nigahomeo.get('/clinicalquestions');
      dispatch({ type: 'FETCH_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'FETCH_ERROR', payload: error });
    }
  };
};

export const uploadFile = (file) => {
  return async (dispatch) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use multipart API for file upload
      const response = await APIClients.nigahomeoMultipart.post('/import', formData);
      dispatch({ type: 'UPLOAD_SUCCESS', payload: response });
    } catch (error) {
      dispatch({ type: 'UPLOAD_ERROR', payload: error });
    }
  };
};
```

### 4. Creating Custom API Instances

```javascript
import { createAxiosClient } from './api_helper';

// Create a custom API client with specific configuration
const customAPI = createAxiosClient('https://custom-api.com/api', 'application/xml');

// Use the custom client
const response = await customAPI.get('/custom-endpoint');
```

## Authorization Management

All API clients automatically include the authorization token. When you update the token using `setAuthorization()`, it updates all clients:

```javascript
import { setAuthorization } from './api_helper';

// This updates the token for all API clients
setAuthorization(newToken);
```

## Migration Guide

### Before (Old Way)
```javascript
import { APIClient, importAPI } from './api_helper';

const api = new APIClient();

// All calls used the same base URL
const data = await api.get('/endpoint');
const fileUpload = await api.import('/upload', formData);
```

### After (New Way)
```javascript
import { APIClient, APIClients } from './api_helper';

const api = new APIClient(); // Still works for default API

// Choose specific API client based on needs
const data = await APIClients.nigahomeo.get('/endpoint');
const fileUpload = await APIClients.nigahomeoMultipart.post('/upload', formData);
```

## Real Backend Helper Integration

The `realbackend_helper.js` has been updated to use the appropriate API clients:

- **Clinical Questions**: Use `APIClients.nigahomeo`
- **Import/Export**: Use `APIClients.nigahomeoMultipart`
- **Other operations**: Use default API client

Example:
```javascript
// This now uses Nigahomeopathy API
export const getClinicalQuestionBodyPart = data => 
  APIClients.nigahomeo.get(url.GET_CLINICAL_QUESTION_BODY_PART, data);

// This uses multipart API for file operations
export const importFromExcel = data => 
  APIClients.nigahomeoMultipart.post(url.IMPORT_FROM_EXCEL, data);
```

## Best Practices

1. **Use specific clients**: Choose the right API client based on the endpoint and content type
2. **Consistent naming**: Use descriptive names for API client selection
3. **Error handling**: All clients have the same error handling interceptors
4. **Token management**: Use `setAuthorization()` to update tokens across all clients
5. **Backward compatibility**: Existing code continues to work with the default API client

## Configuration

The base URLs are configured in `config.js`:

```javascript
module.exports = {
  api: {
    API_URL: "https://api1.homeocentrum.com/api",           // Default API
    API_URL_NIGAHOMEOPATHY: "https://api.nigahomeopathy.com/api"  // Nigahomeopathy API
  }
};
```

