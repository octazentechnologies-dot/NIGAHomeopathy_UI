import axios from "axios";
import { api } from "../config";

// Create axios instance with interceptors
const axiosInstance = axios.create({
  baseURL: api.API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to dynamically set authorization header
axiosInstance.interceptors.request.use(
  function (config) {
    try {
      const authUserStr = sessionStorage.getItem("authUser");
      console.log("CommonServices: Raw authUser from sessionStorage:", authUserStr);
      
      const authUser = authUserStr ? JSON.parse(authUserStr) : null;
      console.log("CommonServices: Parsed authUser:", authUser);
      
      if (authUser?.token) {
        config.headers.Authorization = "Bearer " + authUser.token;
        console.log("CommonServices: Setting Authorization header for:", config.url, "Token:", authUser.token.substring(0, 20) + "...");
      } else {
        console.warn("CommonServices: No token found for request to:", config.url);
        console.warn("CommonServices: authUser object:", authUser);
      }
    } catch (error) {
      console.error("CommonServices: Error parsing authUser from sessionStorage:", error);
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    console.error("CommonServices API Error:", error);
    return Promise.reject(error);
  }
);

class CommonServices {
  // Get data by ID
  static getDataById(id, endpoint) {
    return axiosInstance.get(`${endpoint}/${id}`);
  }

  // Get data without ID
  static getData(endpoint) {
    return axiosInstance.get(endpoint);
  }

  // Post data
  static postData(data, endpoint) {
    return axiosInstance.post(endpoint, data);
  }

  // Put data (for updates)
  static putData(data, endpoint) {
    return axiosInstance.put(endpoint, data);
  }

  // Delete data
  static deleteData(endpoint) {
    return axiosInstance.delete(endpoint);
  }

  // Delete data by ID
  static deleteDataById(id, endpoint) {
    return axiosInstance.delete(`${endpoint}/${id}`);
  }
}

export default CommonServices;