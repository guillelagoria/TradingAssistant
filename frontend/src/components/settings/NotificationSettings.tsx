import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Bell, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  BarChart3,
  Zap,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  DollarSign
} from 'lucide-react';

import type { NotificationPreferences as NotificationPrefs } from '@/types/user';
import { cn } from '@/lib/utils';

interface NotificationSettingsProps {
  preferences: NotificationPrefs;
  onUpdate: (preferences: Partial<NotificationPrefs>) => void;
  validationErrors?: Record<string, string>;
}

export function NotificationSettings({ 
  preferences, 
  onUpdate, 
  validationErrors = {} 
}: NotificationSettingsProps) {
  
  const handleEmailChange = (field: keyof NotificationPrefs['email'], value: any) => {
    onUpdate({
      email: {
        ...preferences.email,
        [field]: value
      }
    });
  };

  const handleBrowserChange = (field: keyof NotificationPrefs['browser'], value: any) => {
    onUpdate({
      browser: {
        ...preferences.browser,
        [field]: value
      }
    });
  };

  const handleRiskChange = (field: keyof NotificationPrefs['risk'], value: any) => {
    onUpdate({
      risk: {
        ...preferences.risk,
        [field]: value
      }
    });
  };

  const handlePerformanceChange = (field: keyof NotificationPrefs['performance'], value: any) => {
    onUpdate({
      performance: {
        ...preferences.performance,
        [field]: value
      }
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        handleBrowserChange('enabled', true);
        // Show test notification
        new Notification('Trading Diary', {
          body: 'Browser notifications are now enabled!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const testEmailNotification = () => {
    // This would trigger a test email
    console.log('Test email notification sent');
  };

  const notificationStatus = 'Notification' in window ? Notification.permission : 'unsupported';

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure which events trigger email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Email Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.email.enabled && (
                <Badge variant="secondary" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              <Switch
                checked={preferences.email.enabled}
                onCheckedChange={(checked) => handleEmailChange('enabled', checked)}
              />
            </div>
          </div>

          {preferences.email.enabled && (
            <>
              <Separator />
              
              {/* Trade Alerts */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Trade Alerts
                </Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="large-win-threshold" className="text-sm">
                      Large Win Threshold ($)
                    </Label>
                    <Input
                      id="large-win-threshold"
                      type="number"
                      min="0"
                      step="10"
                      placeholder="500"
                      value={preferences.email.largeWinThreshold}
                      onChange={(e) => handleEmailChange('largeWinThreshold', parseFloat(e.target.value) || 0)}
                      className={cn(validationErrors['email.largeWinThreshold'] && 'border-red-500')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get notified when a trade profit exceeds this amount
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="large-loss-threshold" className="text-sm">
                      Large Loss Threshold ($)
                    </Label>
                    <Input
                      id="large-loss-threshold"
                      type="number"
                      max="0"
                      step="10"
                      placeholder="-200"
                      value={preferences.email.largeLossThreshold}
                      onChange={(e) => handleEmailChange('largeLossThreshold', parseFloat(e.target.value) || 0)}
                      className={cn(validationErrors['email.largeLossThreshold'] && 'border-red-500')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get notified when a trade loss exceeds this amount
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regular Reports */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Regular Reports
                </Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Weekly Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Weekly trading performance summary
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email.weeklyReports}
                      onCheckedChange={(checked) => handleEmailChange('weeklyReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Monthly Reports</Label>
                      <p className="text-xs text-muted-foreground">
                        Comprehensive monthly analysis and insights
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email.monthlyReports}
                      onCheckedChange={(checked) => handleEmailChange('monthlyReports', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">Goal Achievements</Label>
                      <p className="text-xs text-muted-foreground">
                        Notifications when you reach trading milestones
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email.goalAchievements}
                      onCheckedChange={(checked) => handleEmailChange('goalAchievements', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal">System Updates</Label>
                      <p className="text-xs text-muted-foreground">
                        Important platform updates and feature announcements
                      </p>
                    </div>
                    <Switch
                      checked={preferences.email.systemUpdates}
                      onCheckedChange={(checked) => handleEmailChange('systemUpdates', checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Test your email configuration
                </p>
                <Button variant="outline" size="sm" onClick={testEmailNotification}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Browser Notifications
          </CardTitle>
          <CardDescription>
            Real-time notifications in your browser for important events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Permission Status */}
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: notificationStatus === 'granted' ? 'rgb(240 253 244)' : 
                           notificationStatus === 'denied' ? 'rgb(254 242 242)' : 
                           'rgb(255 251 235)',
            borderColor: notificationStatus === 'granted' ? 'rgb(187 247 208)' : 
                         notificationStatus === 'denied' ? 'rgb(252 165 165)' : 
                         'rgb(251 191 36)'
          }}>
            <div className="flex items-center gap-3">
              {notificationStatus === 'granted' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : notificationStatus === 'denied' ? (
                <VolumeX className="h-5 w-5 text-red-600" />
              ) : (
                <Volume2 className="h-5 w-5 text-yellow-600" />
              )}
              
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Browser Permissions: {
                    notificationStatus === 'granted' ? 'Allowed' :
                    notificationStatus === 'denied' ? 'Blocked' :
                    notificationStatus === 'default' ? 'Not Set' :
                    'Not Supported'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {notificationStatus === 'granted' 
                    ? 'You can receive browser notifications'
                    : notificationStatus === 'denied'
                    ? 'Browser notifications are blocked. Please enable them in your browser settings.'
                    : notificationStatus === 'default'
                    ? 'Click "Enable Notifications" to allow browser notifications'
                    : 'Your browser does not support notifications'
                  }
                </p>
              </div>

              {notificationStatus !== 'granted' && notificationStatus !== 'unsupported' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestNotificationPermission}
                  disabled={notificationStatus === 'denied'}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          {/* Master Browser Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for browser notifications
              </p>
            </div>
            <Switch
              checked={preferences.browser.enabled}
              onCheckedChange={(checked) => handleBrowserChange('enabled', checked)}
              disabled={notificationStatus !== 'granted'}
            />
          </div>

          {preferences.browser.enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Notification Types
                </Label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Trade Reminders
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Reminders for pending trades or market opens
                      </p>
                    </div>
                    <Switch
                      checked={preferences.browser.tradeReminders}
                      onCheckedChange={(checked) => handleBrowserChange('tradeReminders', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal flex items-center gap-2">
                        <BarChart3 className="h-3 w-3" />
                        Daily Summary
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        End-of-day trading performance summary
                      </p>
                    </div>
                    <Switch
                      checked={preferences.browser.dailySummary}
                      onCheckedChange={(checked) => handleBrowserChange('dailySummary', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal flex items-center gap-2">
                        <Shield className="h-3 w-3" />
                        Risk Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Immediate alerts for risk management breaches
                      </p>
                    </div>
                    <Switch
                      checked={preferences.browser.riskAlerts}
                      onCheckedChange={(checked) => handleBrowserChange('riskAlerts', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-normal flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Goal Progress
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Updates on progress towards your trading goals
                      </p>
                    </div>
                    <Switch
                      checked={preferences.browser.goalProgress}
                      onCheckedChange={(checked) => handleBrowserChange('goalProgress', checked)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Risk Management Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Risk Management Alerts
          </CardTitle>
          <CardDescription>
            Protect your account with automated risk monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Risk Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Monitor and alert on risk management violations
              </p>
            </div>
            <div className="flex items-center gap-2">
              {preferences.risk.enabled && (
                <Badge variant="secondary" className="text-orange-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Monitoring
                </Badge>
              )}
              <Switch
                checked={preferences.risk.enabled}
                onCheckedChange={(checked) => handleRiskChange('enabled', checked)}
              />
            </div>
          </div>

          {preferences.risk.enabled && (
            <>
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="daily-loss-limit" className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-3 w-3" />
                    Daily Loss Limit (%)
                  </Label>
                  <Input
                    id="daily-loss-limit"
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    placeholder="5"
                    value={preferences.risk.dailyLossLimit}
                    onChange={(e) => handleRiskChange('dailyLossLimit', parseFloat(e.target.value) || 5)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when daily losses exceed this percentage of account
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consecutive-loss-limit" className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3" />
                    Consecutive Loss Limit
                  </Label>
                  <Input
                    id="consecutive-loss-limit"
                    type="number"
                    min="2"
                    max="10"
                    step="1"
                    placeholder="3"
                    value={preferences.risk.consecutiveLossLimit}
                    onChange={(e) => handleRiskChange('consecutiveLossLimit', parseInt(e.target.value) || 3)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert after this many losing trades in a row
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="drawdown-alert" className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-3 w-3" />
                    Drawdown Alert (%)
                  </Label>
                  <Input
                    id="drawdown-alert"
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    placeholder="10"
                    value={preferences.risk.drawdownAlert}
                    onChange={(e) => handleRiskChange('drawdownAlert', parseFloat(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert when account drawdown exceeds this percentage
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-normal">Position Size Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Warn when position size exceeds risk tolerance
                  </p>
                </div>
                <Switch
                  checked={preferences.risk.positionSizeAlert}
                  onCheckedChange={(checked) => handleRiskChange('positionSizeAlert', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Performance Notifications
          </CardTitle>
          <CardDescription>
            Stay informed about your trading progress and achievements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Performance Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your trading performance
              </p>
            </div>
            <Switch
              checked={preferences.performance.enabled}
              onCheckedChange={(checked) => handlePerformanceChange('enabled', checked)}
            />
          </div>

          {preferences.performance.enabled && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <BarChart3 className="h-3 w-3" />
                      Weekly P&L Summary
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Weekly profit and loss summary with key metrics
                    </p>
                  </div>
                  <Switch
                    checked={preferences.performance.weeklyPnLSummary}
                    onCheckedChange={(checked) => handlePerformanceChange('weeklyPnLSummary', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <TrendingUp className="h-3 w-3" />
                      Monthly Analysis
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Detailed monthly performance analysis and insights
                    </p>
                  </div>
                  <Switch
                    checked={preferences.performance.monthlyAnalysis}
                    onCheckedChange={(checked) => handlePerformanceChange('monthlyAnalysis', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Zap className="h-3 w-3" />
                      Streak Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Notifications about winning and losing streaks
                    </p>
                  </div>
                  <Switch
                    checked={preferences.performance.streakNotifications}
                    onCheckedChange={(checked) => handlePerformanceChange('streakNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal flex items-center gap-2">
                      <Target className="h-3 w-3" />
                      Milestone Alerts
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Celebrate when you reach important milestones
                    </p>
                  </div>
                  <Switch
                    checked={preferences.performance.milestoneAlerts}
                    onCheckedChange={(checked) => handlePerformanceChange('milestoneAlerts', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Notification Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">Email</p>
              <Badge variant={preferences.email.enabled ? "default" : "secondary"}>
                {preferences.email.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="text-center">
              <p className="font-medium">Browser</p>
              <Badge variant={preferences.browser.enabled ? "default" : "secondary"}>
                {preferences.browser.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="text-center">
              <p className="font-medium">Risk Alerts</p>
              <Badge variant={preferences.risk.enabled ? "default" : "secondary"}>
                {preferences.risk.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="text-center">
              <p className="font-medium">Performance</p>
              <Badge variant={preferences.performance.enabled ? "default" : "secondary"}>
                {preferences.performance.enabled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}