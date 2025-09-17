import axios from 'axios';

// Use the same base URL as the API client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create a dedicated axios instance for file uploads
const uploadClient = axios.create({
  baseURL: API_BASE_URL.replace('/api', ''), // Remove /api since we need the base URL
  headers: {
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests
uploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
  };
}

export const uploadService = {
  /**
   * Upload an image file to the server
   * @param file The File object to upload
   * @returns Promise with the upload response containing the file URL
   */
  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadClient.post<UploadResponse>(
        '/api/uploads/image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        return response.data.data.url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
      }
      throw error;
    }
  },

  /**
   * Delete an uploaded image
   * @param filename The filename to delete
   */
  async deleteImage(filename: string): Promise<void> {
    try {
      await uploadClient.delete(`/api/uploads/image/${filename}`);
    } catch (error) {
      console.error('Delete error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error?.message || 'Failed to delete image');
      }
      throw error;
    }
  },

  /**
   * Extract filename from URL
   * @param url The full URL of the uploaded file
   * @returns The filename extracted from the URL
   */
  getFilenameFromUrl(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1];
  }
};