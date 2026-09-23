const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiUrl) {
  throw new Error('EXPO_PUBLIC_API_URL is not set. Copy .env.example to .env.');
}

if (!__DEV__ && !apiUrl.startsWith('https://')) {
  throw new Error('Production builds must use an https:// API URL.');
}

export const API_URL = apiUrl.replace(/\/+$/, '');
export const REQUEST_TIMEOUT_MS = 20000;
