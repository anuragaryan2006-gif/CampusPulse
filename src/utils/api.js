const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('college_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Server response error' }));
  
  if (!response.ok && response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('college_token');
    window.location.href = '/login';
  }

  return { status: response.status, ...data };
}
