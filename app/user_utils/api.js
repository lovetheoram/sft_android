// src/api.js

const isProd = !__DEV__;

export const API_BASE_URL = isProd
  ? 'https://sanjeevpratap99209920.pythonanywhere.com' // ✅ Production
  : 'http://localhost:8000'; // ✅ Development (use IP when testing on real devices)
