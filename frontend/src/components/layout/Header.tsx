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
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-14 items-center justify-between px-4">
        {/* Brand - Simplified */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-base font-bold text-foreground">Trading Diary</h1>
          </div>

          {/* Account Selector - Compact */}
          <div className="hidden lg:block">
            <CompactAccountSelector onCreateAccount={handleCreateAccount} />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Economic Events - Compact Icon Version */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEconomicEventsClick}
                  className="relative h-9 w-9 p-0"
                >
                  <Bell className="h-4 w-4" />
                  {highImpactCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs animate-pulse"
                    >
                      {highImpactCount}
                    </Badge>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="text-sm space-y-1">
                  <p className="font-medium">Economic Calendar</p>
                  {highImpactCount > 0 && (
                    <p className="text-xs text-orange-400">
                      {highImpactCount} high impact events today
                    </p>
                  )}
                  {nextEvent && (
                    <p className="text-xs text-muted-foreground">
                      Next: {nextEvent.event}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">Click to view all events</p>
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
                  className="h-9 w-9 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">Settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* User Avatar - Compact */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:block text-right">
              <p className="text-sm font-medium text-foreground">John Trader</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-semibold text-xs">
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