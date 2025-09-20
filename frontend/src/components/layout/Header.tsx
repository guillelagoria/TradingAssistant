import React, { useState } from 'react';
import { TrendingUp, Settings, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EconomicAlertsBar, EconomicCalendarModal } from '@/components/economic';
import AccountSelector from './AccountSelector';
import QuickTradeDialog from '@/components/trades/QuickTradeDialog';
import { useQuickTradeShortcuts } from '@/hooks/useQuickTradeShortcuts';

function Header() {
  const navigate = useNavigate();
  const [quickTradeOpen, setQuickTradeOpen] = useState(false);
  const [quickTradeDirection, setQuickTradeDirection] = useState<'LONG' | 'SHORT' | undefined>();

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleCreateAccount = () => {
    // Navigate to settings page with accounts tab
    navigate('/settings?tab=accounts');
  };

  const handleOpenQuickTrade = (direction?: 'LONG' | 'SHORT') => {
    setQuickTradeDirection(direction);
    setQuickTradeOpen(true);
  };

  const handleCloseQuickTrade = (open: boolean) => {
    setQuickTradeOpen(open);
    if (!open) {
      setQuickTradeDirection(undefined);
    }
  };

  // Setup keyboard shortcuts
  useQuickTradeShortcuts({
    onOpenQuickTrade: handleOpenQuickTrade,
    enabled: true
  });

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Trading Diary</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Professional Trading Journal</p>
            </div>
          </div>

          {/* Account Selector */}
          <div className="hidden lg:block">
            <AccountSelector
              showBalance={true}
              showCreateButton={true}
              onCreateAccount={handleCreateAccount}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Economic Alerts */}
          <div className="hidden lg:block">
            <EconomicAlertsBar />
          </div>

          {/* Quick Trade Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleOpenQuickTrade()}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Quick Trade</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-medium mb-1">Quick Trade Entry</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Ctrl+Alt+B - Long</div>
                    <div>Ctrl+Alt+S - Short</div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-foreground">John Trader</p>
              <p className="text-xs text-muted-foreground">Premium Account</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt="User" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-violet-600 text-white font-semibold">
                JT
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Economic Calendar Modal */}
      <EconomicCalendarModal />

      {/* Quick Trade Dialog */}
      <QuickTradeDialog
        open={quickTradeOpen}
        onOpenChange={handleCloseQuickTrade}
        prefilledDirection={quickTradeDirection}
      />
    </header>
  );
}

export default Header;