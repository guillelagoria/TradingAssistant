import { BarChart3, TrendingUp, Plus, Bell, Settings, ChevronDown, Zap, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function Header() {
  const navigate = useNavigate();

  const handleQuickTrade = () => {
    navigate('/trades/wizard');
  };

  const handleFullForm = () => {
    navigate('/trades/new');
  };

  const handleNotifications = () => {
    // Handle notifications - for now just log
    console.log('Show notifications');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Trading Diary</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Professional Trading Journal</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Add Trade Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">New Trade</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleQuickTrade} className="cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Quick Entry Wizard</div>
                    <div className="text-xs text-muted-foreground">Fast, guided trade entry</div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleFullForm} className="cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium">Full Trade Form</div>
                    <div className="text-xs text-muted-foreground">Traditional detailed entry</div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="relative"
            onClick={handleNotifications}
          >
            <Bell className="h-4 w-4" />
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-2 w-2 rounded-full p-0">
              <span className="sr-only">New notifications</span>
            </Badge>
          </Button>

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
    </header>
  );
}

export default Header;