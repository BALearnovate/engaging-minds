// Look for the variable first, then fall back to production URL
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 
  'https://engagingmindstoolkit.learnovatecentre.org';

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

export interface ApiFetchOptions extends RequestInit {
  token?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, params, headers, ...customConfig } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const effectiveToken = token || getStoredToken();
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (effectiveToken) {
    reqHeaders.Authorization = `Bearer ${effectiveToken}`;
  }

  const response = await fetch(url, {
    ...customConfig,
    headers: reqHeaders,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let result: any = null;
  if (isJson) {
    try {
      result = await response.json();
    } catch {
      result = null;
    }
  } else {
    try {
      result = await response.text();
    } catch {
      result = null;
    }
  }

  if (!response.ok) {
    let errorMsg = 'API request failed';
    if (result && typeof result === 'object') {
      if (Array.isArray(result.message)) {
        errorMsg = result.message.join(', ');
      } else if (result.message) {
        errorMsg = result.message;
      } else if (result.error) {
        errorMsg = result.error;
      }
    } else if (typeof result === 'string' && result.trim()) {
      errorMsg = result;
    } else {
      errorMsg = `${response.status} ${response.statusText}`;
    }

    const error: any = new Error(errorMsg);
    error.status = response.status;
    error.data = result;
    throw error;
  }

  return result as T;
}

