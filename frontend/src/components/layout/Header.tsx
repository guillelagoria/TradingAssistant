import { TrendingUp, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EconomicAlertsBar, EconomicCalendarModal } from '@/components/economic';
import AccountSelector from './AccountSelector';

function Header() {
  const navigate = useNavigate();

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleCreateAccount = () => {
    // Navigate to settings page with accounts tab
    navigate('/settings?tab=accounts');
  };

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
    </header>
  );
}

export default Header;