import React, { useState, useEffect } from 'react';
import { TrendingUp, Settings, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EconomicCalendarModal } from '@/components/economic';
import { useEconomicEvents, useEconomicEventsModal } from '@/store/economicEventsStore';
import { useAuthStore } from '@/store/authStore';
import CompactAccountSelector from './CompactAccountSelector';
import { useQuickTradeShortcuts } from '@/hooks/useQuickTradeShortcuts';
import { ThemeToggle } from '@/components/theme';

interface ProfileData {
  name: string;
  email: string;
  avatar?: string;
}

function Header() {
  const navigate = useNavigate();
  const { highImpactCount, nextEvent } = useEconomicEvents();
  const { openModal } = useEconomicEventsModal();
  const { user, logout } = useAuthStore();

  // Load profile from localStorage and listen for changes
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('user-profile');
    return saved ? JSON.parse(saved) : { name: 'User', email: '', avatar: undefined };
  });

  // Listen for storage changes (when profile is updated from Settings)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('user-profile');
      if (saved) {
        setProfile(JSON.parse(saved));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage every second to catch same-tab changes
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Determine display name and email (prioritize auth user, fallback to profile)
  const displayName = user?.name || profile.name || 'User';
  const displayEmail = user?.email || profile.email || '';
  const displayAvatar = profile.avatar;

  const getUserInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateAccount = () => {
    // Navigate to settings page with accounts tab
    navigate('/settings?tab=accounts');
  };

  const handleEconomicEventsClick = () => {
    openModal();
  };

  // Setup keyboard shortcuts for quick trade (still available via shortcuts)
  useQuickTradeShortcuts({
    onOpenQuickTrade: () => {
      // Quick trade now handled via keyboard shortcuts only
      navigate('/trades/new');
    },
    enabled: true
  });

  return (
    <header className="border-b border-border/50 bg-card backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Brand - Professional, Minimal */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-foreground">
              <TrendingUp className="h-4 w-4 text-background" />
            </div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">Trading Diary</h1>
          </div>

          {/* Account Selector - Compact */}
          <div className="hidden lg:block">
            <CompactAccountSelector onCreateAccount={handleCreateAccount} />
          </div>
        </div>

        {/* Right Actions - Subtle, Professional */}
        <div className="flex items-center gap-2">
          {/* Economic Events - Compact Icon Version */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEconomicEventsClick}
                  className="relative h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Open economic calendar"
                >
                  <Bell className="h-4 w-4" />
                  <span className="sr-only">Open economic calendar</span>
                  {highImpactCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-[10px] font-mono font-bold border border-background"
                    >
                      {highImpactCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs border-border/50">
                <div className="text-xs space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[10px]">Economic Calendar</p>
                  {highImpactCount > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      {highImpactCount} high impact events today
                    </p>
                  )}
                  {nextEvent && (
                    <p className="text-xs text-muted-foreground">
                      Next: {nextEvent.event}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu Dropdown */}
          <div className="ml-2 pl-2 border-l border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-9 px-2 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-7 w-7 border border-border/50">
                    <AvatarImage src={displayAvatar} alt={displayName} />
                    <AvatarFallback className="bg-foreground text-background font-semibold text-[10px]">
                      {getUserInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden lg:inline text-sm font-medium text-foreground tracking-tight">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {displayEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettings} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Economic Calendar Modal */}
      <EconomicCalendarModal />
    </header>
  );
}

export default Header;