export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

export interface QuickAction {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: string;
}

export type NavigationState = 'pending' | 'active' | 'inactive';