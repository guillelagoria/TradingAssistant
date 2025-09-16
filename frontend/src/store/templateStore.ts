import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TradeTemplate, DEFAULT_TEMPLATES } from '@/types/template';

interface TemplateStore {
  templates: TradeTemplate[];
  selectedTemplateId: string | null;

  // Actions
  addTemplate: (template: Omit<TradeTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateTemplate: (id: string, template: Partial<TradeTemplate>) => void;
  deleteTemplate: (id: string) => void;
  selectTemplate: (id: string | null) => void;
  incrementUsageCount: (id: string) => void;
  getTemplateById: (id: string) => TradeTemplate | undefined;
  initializeDefaults: () => void;
  resetTemplates: () => void;
}

// Helper to generate unique ID
const generateId = () => `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initialize default templates with IDs
const initDefaultTemplates = (): TradeTemplate[] => {
  return DEFAULT_TEMPLATES.map(template => ({
    ...template,
    id: generateId(),
    createdAt: new Date(),
    usageCount: 0
  }));
};

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      selectedTemplateId: null,

      addTemplate: (templateData) => {
        const newTemplate: TradeTemplate = {
          ...templateData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          isDefault: false
        };

        set((state) => ({
          templates: [...state.templates, newTemplate]
        }));
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === id
              ? {
                  ...template,
                  ...updates,
                  updatedAt: new Date(),
                  id: template.id, // Ensure ID can't be changed
                  createdAt: template.createdAt, // Ensure creation date can't be changed
                  isDefault: template.isDefault // Ensure default status can't be changed
                }
              : template
          )
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(template =>
            // Can't delete default templates
            template.id !== id || template.isDefault
          ),
          selectedTemplateId: state.selectedTemplateId === id ? null : state.selectedTemplateId
        }));
      },

      selectTemplate: (id) => {
        set({ selectedTemplateId: id });

        // Increment usage count if selecting a template
        if (id) {
          get().incrementUsageCount(id);
        }
      },

      incrementUsageCount: (id) => {
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === id
              ? {
                  ...template,
                  usageCount: (template.usageCount || 0) + 1,
                  updatedAt: new Date()
                }
              : template
          )
        }));
      },

      getTemplateById: (id) => {
        return get().templates.find(template => template.id === id);
      },

      initializeDefaults: () => {
        const state = get();
        // Only add defaults if no templates exist
        if (state.templates.length === 0) {
          set({
            templates: initDefaultTemplates()
          });
        }
      },

      resetTemplates: () => {
        set({
          templates: initDefaultTemplates(),
          selectedTemplateId: null
        });
      }
    }),
    {
      name: 'trading-templates',
      version: 1,
      // Custom migration to ensure dates are properly handled
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from version 0 to 1
          return {
            ...persistedState,
            templates: (persistedState.templates || []).map((t: any) => ({
              ...t,
              createdAt: new Date(t.createdAt),
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined
            }))
          };
        }
        return persistedState as TemplateStore;
      }
    }
  )
);

// Initialize defaults on first load
if (typeof window !== 'undefined') {
  useTemplateStore.getState().initializeDefaults();
}