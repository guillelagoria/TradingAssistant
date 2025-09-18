import { create } from 'zustand';
import { EconomicEvent, economicEventsService } from '@/services/economicEvents.service';

interface EconomicEventsState {
  // Data
  todayEvents: EconomicEvent[];
  upcomingEvents: EconomicEvent[];
  highImpactEvents: EconomicEvent[];

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isModalOpen: boolean;
  activeTab: 'today' | 'week';
  showHighImpactOnly: boolean;
  apiKeyConfigured: boolean;

  // Auto-refresh
  refreshInterval: NodeJS.Timeout | null;

  // Actions
  fetchTodayEvents: () => Promise<void>;
  fetchUpcomingEvents: () => Promise<void>;
  fetchHighImpactEvents: () => Promise<void>;
  refreshAllEvents: () => Promise<void>;

  // UI Actions
  openModal: () => void;
  closeModal: () => void;
  setActiveTab: (tab: 'today' | 'week') => void;
  toggleHighImpactFilter: () => void;

  // Auto-refresh management
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;

  // Selectors
  getNextEvent: () => EconomicEvent | null;
  getTodayHighImpactCount: () => number;
  getFilteredEvents: () => EconomicEvent[];
}

export const useEconomicEventsStore = create<EconomicEventsState>()((set, get) => ({
  // Initial state
  todayEvents: [],
  upcomingEvents: [],
  highImpactEvents: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  isModalOpen: false,
  activeTab: 'today',
  showHighImpactOnly: false,
  apiKeyConfigured: true,
  refreshInterval: null,

  // Fetch today's events
  fetchTodayEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await economicEventsService.getTodayEvents();
      set({
        todayEvents: response.events,
        apiKeyConfigured: response.apiKeyConfigured,
        lastUpdated: new Date(),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch today events',
        isLoading: false
      });
    }
  },

  // Fetch upcoming events (next 7 days)
  fetchUpcomingEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await economicEventsService.getUpcomingEvents();
      set({
        upcomingEvents: response.events,
        apiKeyConfigured: response.apiKeyConfigured,
        lastUpdated: new Date(),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch upcoming events',
        isLoading: false
      });
    }
  },

  // Fetch high impact events
  fetchHighImpactEvents: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await economicEventsService.getHighImpactEvents();
      set({
        highImpactEvents: response.events,
        apiKeyConfigured: response.apiKeyConfigured,
        lastUpdated: new Date(),
        isLoading: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch high impact events',
        isLoading: false
      });
    }
  },

  // Refresh all events
  refreshAllEvents: async () => {
    const { fetchTodayEvents, fetchUpcomingEvents, fetchHighImpactEvents } = get();

    try {
      set({ isLoading: true, error: null });
      await Promise.all([
        fetchTodayEvents(),
        fetchUpcomingEvents(),
        fetchHighImpactEvents()
      ]);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh events',
        isLoading: false
      });
    }
  },

  // UI Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleHighImpactFilter: () => set((state) => ({
    showHighImpactOnly: !state.showHighImpactOnly
  })),

  // Auto-refresh management
  startAutoRefresh: () => {
    const { refreshAllEvents, stopAutoRefresh } = get();

    // Stop existing interval if any
    stopAutoRefresh();

    // Start new interval (refresh every 30 minutes)
    const interval = setInterval(() => {
      refreshAllEvents();
    }, 30 * 60 * 1000); // 30 minutes

    set({ refreshInterval: interval });
  },

  stopAutoRefresh: () => {
    const { refreshInterval } = get();
    if (refreshInterval) {
      clearInterval(refreshInterval);
      set({ refreshInterval: null });
    }
  },

  // Selectors
  getNextEvent: () => {
    const { todayEvents, upcomingEvents } = get();
    const allEvents = [...(todayEvents || []), ...(upcomingEvents || [])];
    return economicEventsService.getNextEvent(allEvents);
  },

  getTodayHighImpactCount: () => {
    const { todayEvents } = get();
    return economicEventsService.getHighImpactOnly(todayEvents || []).length;
  },

  getFilteredEvents: () => {
    const { activeTab, todayEvents, upcomingEvents, showHighImpactOnly } = get();

    let events = activeTab === 'today' ? (todayEvents || []) : (upcomingEvents || []);

    if (showHighImpactOnly) {
      events = economicEventsService.getHighImpactOnly(events);
    }

    return economicEventsService.sortEventsByTime(events);
  }
}));

// Selector hooks for cleaner component usage
export const useEconomicEvents = () => {
  const store = useEconomicEventsStore();
  return {
    events: store.getFilteredEvents(),
    nextEvent: store.getNextEvent(),
    highImpactCount: store.getTodayHighImpactCount(),
    isLoading: store.isLoading,
    error: store.error,
    lastUpdated: store.lastUpdated,
    apiKeyConfigured: store.apiKeyConfigured
  };
};

export const useEconomicEventsModal = () => {
  const store = useEconomicEventsStore();
  return {
    isOpen: store.isModalOpen,
    activeTab: store.activeTab,
    showHighImpactOnly: store.showHighImpactOnly,
    openModal: store.openModal,
    closeModal: store.closeModal,
    setActiveTab: store.setActiveTab,
    toggleHighImpactFilter: store.toggleHighImpactFilter
  };
};

export const useEconomicEventsActions = () => {
  const store = useEconomicEventsStore();
  return {
    fetchTodayEvents: store.fetchTodayEvents,
    fetchUpcomingEvents: store.fetchUpcomingEvents,
    fetchHighImpactEvents: store.fetchHighImpactEvents,
    refreshAllEvents: store.refreshAllEvents,
    startAutoRefresh: store.startAutoRefresh,
    stopAutoRefresh: store.stopAutoRefresh
  };
};