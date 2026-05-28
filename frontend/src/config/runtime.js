const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const DEFAULT_PRODUCTION_API_URL = 'https://td-53xy.onrender.com';

const isLocalHostname = (hostname = '') => (
  hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname === '0.0.0.0'
  || hostname.endsWith('.local')
  || /^10\.\d+\.\d+\.\d+$/.test(hostname)
  || /^192\.168\.\d+\.\d+$/.test(hostname)
  || /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)
);

const buildLocalBackendUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const port = import.meta.env.VITE_BACKEND_PORT || '5001';
  return `${window.location.protocol}//${window.location.hostname}:${port}`;
};

const inferApiBaseUrl = () => {
  const configuredApiBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '');
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  if (!isLocalHostname(window.location.hostname)) {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return buildLocalBackendUrl();
};

const inferSocketUrl = (apiBaseUrl) => {
  const configuredSocketUrl = trimTrailingSlash(import.meta.env.VITE_SOCKET_URL || '');
  if (configuredSocketUrl) {
    return configuredSocketUrl;
  }

  return apiBaseUrl || buildLocalBackendUrl();
};

export const API_BASE_URL = inferApiBaseUrl();
export const SOCKET_URL = inferSocketUrl(API_BASE_URL);
