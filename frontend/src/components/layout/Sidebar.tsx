import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  History, 
  Settings, 
  Plus,
  TrendingUp,
  PieChart,
  Calculator,
  Target,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: BarChart3,
    description: 'Overview & Statistics'
  },
  { 
    name: 'Trade History', 
    href: '/trades', 
    icon: History,
    description: 'All your trades',
    badge: '23'
  },
  { 
    name: 'Add Trade', 
    href: '/trades/new', 
    icon: Plus,
    description: 'Record new trade'
  },
  { 
    name: 'Analysis', 
    href: '/analysis', 
    icon: TrendingUp,
    description: 'Performance insights'
  },
  { 
    name: 'Portfolio', 
    href: '/portfolio', 
    icon: PieChart,
    description: 'Asset allocation'
  },
];

const quickActions = [
  {
    name: 'Risk Calculator',
    icon: Calculator,
    action: 'risk-calculator'
  },
  {
    name: 'Target Price',
    icon: Target,
    action: 'target-price'
  },
  {
    name: 'Trading Notes',
    icon: BookOpen,
    action: 'notes'
  }
];

function Sidebar() {
  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    // Handle quick actions - for now just log
    console.log(`Quick action: ${action}`);
  };

  return (
    <aside className="w-72 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[calc(100vh-64px)]">
      <div className="flex h-full flex-col">
        {/* Main Navigation */}
        <div className="p-6">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-muted-foreground'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <div className="flex flex-col items-start">
                    <span>{item.name}</span>
                    <span className="text-xs opacity-70">{item.description}</span>
                  </div>
                </div>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-t">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Tools</h3>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Button
                key={action.name}
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 h-auto py-2 text-left hover:bg-accent"
                onClick={() => handleQuickAction(action.action)}
              >
                <action.icon className="h-4 w-4 shrink-0" />
                <span className="text-sm">{action.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Premium CTA */}
        <div className="mt-auto p-6">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/50 p-4 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Pro Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlock advanced trading insights and risk analysis tools.
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
              Upgrade Now
            </Button>
          </div>
        </div>

        {/* Settings */}
        <div className="p-6 pt-0">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;