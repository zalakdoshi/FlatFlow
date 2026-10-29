import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let activeDemoUserId: string | null = localStorage.getItem('flatflow_demo_user');

export function setDemoUserId(userId: string | null) {
  activeDemoUserId = userId;
  if (userId) {
    localStorage.setItem('flatflow_demo_user', userId);
  } else {
    localStorage.removeItem('flatflow_demo_user');
  }
}

export function getDemoUserId(): string | null {
  return localStorage.getItem('flatflow_demo_user') || activeDemoUserId;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. Get auth token from Supabase session if available
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    // Development / demo mode support
    const demoId = getDemoUserId();
    if (demoId) {
      headers['x-test-user-id'] = demoId;
      headers['Authorization'] = `Bearer dev-token-${demoId}`;
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const responseData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      (responseData && typeof responseData === 'object' && 'message' in responseData
        ? (responseData as { message: string }).message
        : response.statusText) || 'API Request failed';
    throw new ApiError(errorMessage, response.status, responseData);
  }

  return responseData as T;
}
