/**
 * API configuration and utilities
 */

// Base URL for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Cek dan tambahkan suffix /api jika belum ada
export const getApiUrl = (path: string): string => {
  let baseUrl = API_BASE_URL;
  
  // Jika tidak diakhiri dengan /api, tambahkan
  if (!baseUrl.endsWith('/api')) {
    baseUrl = baseUrl + '/api';
  }
  
  // Jika path sudah dimulai dengan /, hilangkan slash di depan
  if (path.startsWith('/')) {
    path = path.substring(1);
  }
  
  return `${baseUrl}/${path}`;
};

// Helper for API errors
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Helper function to handle API responses
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(
      errorText || `Error: ${response.status} ${response.statusText}`, 
      response.status
    );
  }
  
  // Only try to parse JSON if content exists and is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json') && response.status !== 204) {
    return response.json();
  }
  
  return response;
} 