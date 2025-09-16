import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  History,
  Plus,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: BarChart3,
    description: 'Overview, Analytics & Statistics',
    exact: true
  },
  {
    name: 'Trade History',
    href: '/trades',
    icon: History,
    description: 'All your trading records',
    exact: true
  },
  {
    name: 'Add Trade',
    href: '/trades/new',
    icon: Plus,
    description: 'Record new trade',
    exact: true
  }
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[calc(100vh-64px)]">
      <div className="flex h-full flex-col">
        {/* Main Navigation */}
        <div className="p-6">
          <nav className="space-y-1">
            {navigation.map((item) => {
              // Custom active check for exact matching
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center justify-between px-4 py-4 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 shrink-0" />
                    <div className="flex flex-col items-start">
                      <span>{item.name}</span>
                      <span className="text-xs opacity-70">{item.description}</span>
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Dashboard Info */}
        <div className="px-6 py-4 border-t">
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">All-in-One Dashboard</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio analysis, break-even analysis, and performance insights are now integrated in the main dashboard.
            </p>
          </div>
        </div>

        {/* Premium CTA */}
        <div className="mt-auto p-6">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/50 p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Advanced Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlock premium trading insights and risk analysis tools.
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;