/**
 * NT8 Import V2 Service
 * Modern API client for simplified NT8 import flow
 */

import axios from 'axios';
import type { NT8PreviewResponse, NT8ExecuteResponse } from '@/types/import';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get JWT token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Upload file and get preview with validation results
 * @param file - NT8 CSV/Excel file
 * @param accountId - Trading account ID
 * @returns Preview with validation results
 */
export async function previewNT8Import(
  file: File,
  accountId: string
): Promise<NT8PreviewResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', accountId);

  const token = getAuthToken();
  console.log('[NT8 Import Preview] Token:', token ? 'Found (' + token.substring(0, 20) + '...)' : 'Not found');

  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[NT8 Import Preview] Authorization header set');
  } else {
    console.warn('[NT8 Import Preview] No token available - request will fail');
  }

  const response = await axios.post<NT8PreviewResponse>(
    `${API_BASE_URL}/api/nt8-import-v2/preview`,
    formData,
    { headers }
  );

  return response.data;
}

/**
 * Execute import (only imports valid, non-duplicate trades)
 * @param file - NT8 CSV/Excel file
 * @param accountId - Trading account ID
 * @returns Import result summary
 */
export async function executeNT8Import(
  file: File,
  accountId: string
): Promise<NT8ExecuteResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('accountId', accountId);

  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'multipart/form-data',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await axios.post<NT8ExecuteResponse>(
    `${API_BASE_URL}/api/nt8-import-v2/execute`,
    formData,
    { headers }
  );

  return response.data;
}
