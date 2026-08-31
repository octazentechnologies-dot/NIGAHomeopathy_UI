import axios from "axios";
import { api } from "../config";

// Helper function to get current auth user
const getCurrentAuthUser = () => {
  try {
    const authUserStr = sessionStorage.getItem("authUser");
    return authUserStr ? JSON.parse(authUserStr) : null;
  } catch (error) {
    console.error("Error parsing authUser from sessionStorage:", error);
    return null;
  }
};

/**
 * Factory function to create axios client with interceptors and authorization
 * @param {string} baseURL - The base URL for the API
 * @param {string} contentType - Content type for headers (default: "application/json")
 * @returns {object} Configured axios instance
 */
const createAxiosClient = (baseURL, contentType = "application/json") => {
  const client = axios.create({
    baseURL: baseURL,
    headers: {
      "Content-Type": contentType,
    },
  });

  // Add request interceptor to dynamically set authorization header
  client.interceptors.request.use(
    function (config) {
      const authUser = getCurrentAuthUser();
      if (authUser?.token) {
        config.headers.Authorization = "Bearer " + authUser.token;
        console.log("Setting Authorization header for:", config.url, "Token:", authUser.token.substring(0, 20) + "...");
      } else {
        console.warn("No token found for request to:", config.url);
      }
      return config;
    },
    function (error) {
      return Promise.reject(error);
    }
  );

  // Add response interceptor
  client.interceptors.response.use(
    function (response) {
      console.log("axios.interceptors.response :", response.data);
      if (response && response.data instanceof Blob) {
        return response;
      }
      return response.data ? response.data : response;
    },
    function (error) {
      let message;
      const status = error.response?.status;
      switch (status) {
        case 500:
          message = "Internal Server Error";
          break;
        case 401:
          message = error.response?.data?.message || "Invalid username or password";
          break;
        case 404:
          message = "Sorry! the data you are looking for could not be found";
          break;
        case 400: {
          const data = error.response?.data;
          if (typeof data === 'string' && data.trim()) {
            message = data;
          } else if (data?.message) {
            message = data.message;
          } else {
            message = error.message || error;
          }
          break;
        }
        default:
          message = error.message || error;
      }
      console.error("API Error:", error);
      return Promise.reject(message);
    }
  );

  return client;
};

/**
 * API Clients object with different configurations
 */
const APIClients = {
  // Default API client (HOMOCENTRUM)
  default: createAxiosClient(api.API_URL, "application/json"),

  // Nigahomeopathy API client with JSON content type
  nigahomeo: createAxiosClient(api.API_URL_NIGAHOMEOPATHY, "application/json"),

  // Nigahomeopathy API client with multipart/form-data content type
  nigahomeoMultipart: createAxiosClient(api.API_URL_NIGAHOMEOPATHY, "multipart/form-data"),
};

/**
 * Creates API methods for a specific client
 * @param {object} client - The axios client to use
 * @returns {object} API methods (get, post, put, delete, etc.)
 */
const createAPIHelpers = (client) => ({
  get: async (url, paramsOrConfig) => {
    // Check if paramsOrConfig is an axios config object
    // We detect axios config by checking for specific axios config properties that would never be query params
    // The most common case is responseType for blob downloads
    const isAxiosConfig = paramsOrConfig && typeof paramsOrConfig === 'object' && (
      // responseType is the primary indicator (used for blob downloads)
      paramsOrConfig.responseType !== undefined || 
      // Other axios-specific config properties that would never be query params
      (paramsOrConfig.headers && typeof paramsOrConfig.headers === 'object' && !Array.isArray(paramsOrConfig.headers)) ||
      (paramsOrConfig.params !== undefined && typeof paramsOrConfig.params === 'object' && !Array.isArray(paramsOrConfig.params)) ||
      paramsOrConfig.timeout !== undefined ||
      paramsOrConfig.withCredentials !== undefined ||
      paramsOrConfig.transformRequest !== undefined ||
      paramsOrConfig.transformResponse !== undefined ||
      paramsOrConfig.validateStatus !== undefined ||
      paramsOrConfig.responseEncoding !== undefined
    );

    if (isAxiosConfig) {
      // Treat as axios config object - pass directly to axios
      const response = await client.get(url, paramsOrConfig);
      console.log("get response:", response);
      return response;
    } else if (paramsOrConfig) {
      // Treat as query parameters - build query string (existing behavior)
      let paramKeys = [];
      Object.keys(paramsOrConfig).map(key => {
        const value = paramsOrConfig[key];
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => paramKeys.push(key + '=' + encodeURIComponent(v)));
          } else {
            paramKeys.push(key + '=' + encodeURIComponent(value));
          }
        }
        return paramKeys;
      });
      const queryString = paramKeys && paramKeys.length ? paramKeys.join('&') : "";
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const response = await client.get(fullUrl);
      console.log("get response:", response);
      return response;
    } else {
      const response = await client.get(`${url}`);
      console.log("get response:", response);
      return response;
    }
  },

  post: (url, data) => client.post(url, data),

  put: (url, data) => client.put(url, data),

  delete: (url, config) => client.delete(url, { ...config }),

  patch: (url, data) => client.patch(url, data),
});

/**
 * API helpers for each client - provides convenient methods for different API endpoints
 */
const apiHelpers = {
  default: createAPIHelpers(APIClients.default),
  nigahomeo: createAPIHelpers(APIClients.nigahomeo),
  nigahomeoMultipart: createAPIHelpers(APIClients.nigahomeoMultipart),
};

// Legacy exports for backward compatibility
const importAPI = APIClients.nigahomeoMultipart;
const nigahomeoAPI = APIClients.nigahomeo;

/**
 * Sets the default authorization for all API clients
 * Note: With the new request interceptor approach, this function is mainly for backward compatibility
 * The token is now dynamically retrieved from sessionStorage for each request
 * @param {*} token
 */
const setAuthorization = (token) => {
  // Update all API clients with new token (for backward compatibility)
  Object.values(APIClients).forEach(client => {
    client.defaults.headers.common["Authorization"] = "Bearer " + token;
  });
};

class APIClient {
  /**
   * Fetches data from given url using default client
   */
  get = async (url, params) => {
    let response;

    let paramKeys = [];

    if (params) {
      Object.keys(params).map(key => {
        paramKeys.push(key + '=' + params[key]);
        return paramKeys;
      });

      const queryString = paramKeys && paramKeys.length ? paramKeys.join('&') : "";
      response = await APIClients.default.get(`${url}?${queryString}`, params);
    } else {
      response = await APIClients.default.get(`${url}`, params);
    }
    console.log("get response:", response);
    return response;
  };

  /**
   * post given data to url using default client
   */
  create = (url, data) => {
    return APIClients.default.post(url, data);
  };

  /**
   * Updates data using default client
   */
  update = (url, data) => {
    return APIClients.default.patch(url, data);
  };

  put = (url, data) => {
    return APIClients.default.put(url, data);
  };

  /**
   * Delete using default client
   */
  delete = (url, config) => {
    return APIClients.default.delete(url, { ...config });
  };

  //New API for Import
  import = (url, data) => {
    debugger
    return APIClients.nigahomeoMultipart.post(url, data);
  };
}

const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export {
  APIClient,
  setAuthorization,
  getLoggedinUser,
  importAPI,
  nigahomeoAPI,
  APIClients,
  createAxiosClient,
  apiHelpers
};