import { API_BASE_URL, handleApiResponse, getApiUrl } from './config';

interface SaveVariableDTO {
  name: string;
  label?: string;
  type: string;
  width?: number;
  decimal?: number;
  alignment?: string;
  measure?: string;
  columns?: number;
  valueLabels?: {
    value: string | number;
    label: string;
  }[];
}

interface SaveSavFileDTO {
  data: Record<string, any>[];
  variables: SaveVariableDTO[];
}

/**
 * Upload an SAV file to the backend
 * Accepts either a File object or FormData with a file field
 */
export async function uploadSavFile(fileOrFormData: File | FormData) {
  let formData: FormData;
  
  if (fileOrFormData instanceof FormData) {
    formData = fileOrFormData;
  } else {
    formData = new FormData();
    formData.append('file', fileOrFormData);
  }

  const response = await fetch(getApiUrl('sav/upload'), {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}

/**
 * Create and download an SAV file from data
 */
export async function createSavFile(data: SaveSavFileDTO): Promise<Blob> {
  const response = await fetch(getApiUrl('sav/create'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  // For blob responses, we need to handle differently
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Error: ${response.status} ${response.statusText}`);
  }
  
  return response.blob();
}

/**
 * Helper to download a file from a blob
 */
export function downloadBlobAsFile(blob: Blob, filename: string = 'data.sav') {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
} 