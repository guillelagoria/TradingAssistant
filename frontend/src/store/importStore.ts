import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
// import { immer } from 'zustand/middleware/immer';
import type {
  ImportSession,
  ImportProgress,
  ImportStats,
  ImportPreviewData,
  ImportOptions,
  FileUploadStatus,
} from '@/types/import';

interface ImportState {
  // Current import session
  currentSession: ImportSession | null;
  previewData: ImportPreviewData | null;
  importProgress: ImportProgress | null;

  // Import history
  sessions: ImportSession[];
  stats: ImportStats | null;

  // File upload
  uploadStatus: FileUploadStatus | null;

  // Settings
  options: ImportOptions;

  // UI state
  isUploading: boolean;
  isProcessing: boolean;
  isImporting: boolean;
  currentWizardStep: number;

  // Error handling
  error: string | null;
}

interface ImportActions {
  // File upload
  setUploadStatus: (status: FileUploadStatus | null) => void;
  updateUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;

  // Preview
  setPreviewData: (data: ImportPreviewData | null) => void;

  // Import session
  setCurrentSession: (session: ImportSession | null) => void;
  updateImportProgress: (progress: ImportProgress) => void;

  // Import history
  setSessions: (sessions: ImportSession[]) => void;
  addSession: (session: ImportSession) => void;
  updateSession: (id: string, updates: Partial<ImportSession>) => void;
  removeSession: (id: string) => void;

  // Stats
  setStats: (stats: ImportStats) => void;

  // Options
  setOptions: (options: Partial<ImportOptions>) => void;

  // UI state
  setCurrentWizardStep: (step: number) => void;
  nextWizardStep: () => void;
  previousWizardStep: () => void;
  resetWizard: () => void;

  // Loading states
  setIsUploading: (isUploading: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  setIsImporting: (isImporting: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset functions
  resetImport: () => void;
  resetCurrentSession: () => void;
}

const initialState: ImportState = {
  currentSession: null,
  previewData: null,
  importProgress: null,
  sessions: [],
  stats: null,
  uploadStatus: null,
  options: {
    skipDuplicates: true,
    validateData: true,
    dryRun: false,
    dateFormat: 'MM/dd/yyyy HH:mm:ss',
    timezone: 'America/New_York',
  },
  isUploading: false,
  isProcessing: false,
  isImporting: false,
  currentWizardStep: 0,
  error: null,
};

export const useImportStore = create<ImportState & ImportActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // File upload actions
      setUploadStatus: (status) =>
        set({ uploadStatus: status }),

      updateUploadProgress: (progress) =>
        set((state) => ({
          uploadStatus: state.uploadStatus ? {
            ...state.uploadStatus,
            progress
          } : null
        })),

      setUploadError: (error) =>
        set((state) => ({
          uploadStatus: state.uploadStatus ? {
            ...state.uploadStatus,
            error: error || undefined,
            status: error ? 'error' : 'pending'
          } : null
        })),

      // Preview actions
      setPreviewData: (data) =>
        set({ previewData: data }),

      // Import session actions
      setCurrentSession: (session) =>
        set({ currentSession: session }),

      updateImportProgress: (progress) =>
        set({ importProgress: progress }),

      // Import history actions
      setSessions: (sessions) =>
        set({ sessions }),

      addSession: (session) =>
        set((state) => ({
          sessions: [session, ...state.sessions]
        })),

      updateSession: (id, updates) =>
        set((state) => {
          const updatedSessions = state.sessions.map(s =>
            s.id === id ? { ...s, ...updates } : s
          );
          const updatedCurrentSession = state.currentSession?.id === id
            ? { ...state.currentSession, ...updates }
            : state.currentSession;

          return {
            sessions: updatedSessions,
            currentSession: updatedCurrentSession
          };
        }),

      removeSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter(s => s.id !== id),
          currentSession: state.currentSession?.id === id ? null : state.currentSession
        })),

      // Stats actions
      setStats: (stats) =>
        set({ stats }),

      // Options actions
      setOptions: (options) =>
        set((state) => ({
          options: { ...state.options, ...options }
        })),

      // UI state actions
      setCurrentWizardStep: (step) =>
        set({ currentWizardStep: step }),

      nextWizardStep: () =>
        set((state) => ({
          currentWizardStep: Math.min(state.currentWizardStep + 1, 3)
        })),

      previousWizardStep: () =>
        set((state) => ({
          currentWizardStep: Math.max(state.currentWizardStep - 1, 0)
        })),

      resetWizard: () =>
        set({ currentWizardStep: 0 }),

      // Loading state actions
      setIsUploading: (isUploading) =>
        set({ isUploading }),

      setIsProcessing: (isProcessing) =>
        set({ isProcessing }),

      setIsImporting: (isImporting) =>
        set({ isImporting }),

      // Error handling actions
      setError: (error) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      // Reset actions
      resetImport: () =>
        set({
          currentSession: null,
          previewData: null,
          importProgress: null,
          uploadStatus: null,
          isUploading: false,
          isProcessing: false,
          isImporting: false,
          currentWizardStep: 0,
          error: null,
        }),

      resetCurrentSession: () =>
        set({
          currentSession: null,
          previewData: null,
          importProgress: null,
        }),
    }),
    {
      name: 'import-store',
    }
  )
);