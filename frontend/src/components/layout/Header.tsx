import React from 'react';
import { TrendingUp, Settings, Bell, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EconomicCalendarModal } from '@/components/economic';
import { useEconomicEvents, useEconomicEventsModal } from '@/store/economicEventsStore';
import CompactAccountSelector from './CompactAccountSelector';
import { useQuickTradeShortcuts } from '@/hooks/useQuickTradeShortcuts';

function Header() {
  const navigate = useNavigate();
  const { highImpactCount, nextEvent } = useEconomicEvents();
  const { openModal } = useEconomicEventsModal();

  const handleSettings = () => {
    navigate('/settings');
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

          {/* Settings */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSettings}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Open settings"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Open settings</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider">Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* User Avatar - Minimal, Professional */}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-foreground tracking-tight">John Trader</p>
            </div>
            <Avatar className="h-8 w-8 border border-border/50">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-foreground text-background font-semibold text-xs">
                JT
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Economic Calendar Modal */}
      <EconomicCalendarModal />
    </header>
  );
}

export default Header;