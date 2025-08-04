// // frontend/src/services/api.ts
// import axios from 'axios';

// // Determine the API base URL
// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// // --- Define your test tenant ID ---
// // Make sure this matches a tenant created in your backend DB (e.g., via pgAdmin)
// const CURRENT_TENANT_ID = 'acme'; // Hardcoded for local dev, derive dynamically later

// // --- Placeholder for current user's email (FOR RBAC DEMO ONLY) ---
// // In a real app, this would come from authentication state (e.g., JWT payload).
// // WARNING: Hardcoding like this is NOT secure for production.
// const CURRENT_USER_EMAIL = 'testuser@example.com'; // MUST match the email in your tenant_acme.users table with the correct role

// export const api = axios.create({
//   baseURL: API_URL,
//   headers: {
//     'Content-Type': 'application/json',
//     // ALWAYS send the tenant ID header for multi-tenancy
//     'x-tenant-id': CURRENT_TENANT_ID,
//     // --- SEND USER EMAIL FOR RBAC DEMO (Remove/replace this in a real auth system) ---
//     'x-user-email': CURRENT_USER_EMAIL, // <-- CRITICAL LINE FOR RBAC TESTING
//   },
// });

// // Optional: Add request interceptor for dynamic token/header management (for future real auth)
// // api.interceptors.request.use(
// //   (config) => {
// //     // Example: Get token from localStorage/sessionStorage
// //     // const token = localStorage.getItem('authToken');
// //     // if (token) {
// //     //   config.headers.Authorization = `Bearer ${token}`;
// //     // }

// //     // Example: Get tenant ID dynamically (e.g., from subdomain or app state)
// //     // const dynamicTenantId = getTenantId(); // You would implement getTenantId()
// //     // if (dynamicTenantId) {
// //     //    config.headers['x-tenant-id'] = dynamicTenantId;
// //     // }

// //     // Example: Get user email dynamically (NOT recommended for real auth, use token instead)
// //     // const dynamicUserEmail = getUserEmail(); // You would implement getUserEmail()
// //     // if (dynamicUserEmail) {
// //     //    config.headers['x-user-email'] = dynamicUserEmail; // For demo only
// //     // }

// //     return config;
// //   },
// //   (error) => {
// //     return Promise.reject(error);
// //   }
// // );

// // Optional: Add response interceptor for global error handling/logging
// // api.interceptors.response.use(
// //   response => response,
// //   error => {
// //     console.error('API Error:', error.response?.status, error.response?.data);
// //     // You could handle specific errors here, e.g., redirect on 401/403
// //     if (error.response?.status === 401) {
// //        // Handle unauthorized access (e.g., redirect to login)
// //        // window.location.href = '/login';
// //     }
// //     if (error.response?.status === 403) {
// //        // Handle forbidden access (e.g., show permission denied message)
// //        console.warn('Access forbidden:', error.response.data?.error);
// //     }
// //     return Promise.reject(error);
// //   }
// // );


// frontend/src/services/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// --- Define your test tenant ID ---
// In a real app, this would likely come from the subdomain or app context.
// For local development, we'll hardcode it. Ensure 'acme' tenant exists in your DB.
const CURRENT_TENANT_ID = 'acme'; // <-- MUST match a tenant in your DB

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // ALWAYS send the tenant ID header for multi-tenancy
    'x-tenant-id': CURRENT_TENANT_ID, // <-- CRUCIAL for backend tenant routing
    // --- REMOVE the hardcoded user email ---
    // 'x-user-email': 'testuser@example.com', // <-- REMOVE THIS LINE
    // The backend should get the user context from the session or auth token.
  },
});

// Optional: Add request/response interceptors for auth tokens, global error handling, etc.
// Example request interceptor to add auth token (if you implement auth later):
// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('authToken'); // Or from context/session
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     // Ensure tenant ID is always sent
//     config.headers['x-tenant-id'] = CURRENT_TENANT_ID;
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );