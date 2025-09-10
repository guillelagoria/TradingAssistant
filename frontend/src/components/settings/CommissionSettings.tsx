import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  Star,
  Calculator,
  Building,
  Percent,
  AlertTriangle,
  Info,
  Download,
  Upload,
  TrendingUp,
} from 'lucide-react';

import useSettingsStore from '@/store/settingsStore';
import { type Commission, DEFAULT_COMMISSION } from '@/types/settings';
import { validateCommission } from '@/utils/settingsHelpers';
import { cn } from '@/lib/utils';

interface CommissionFormData {
  name: string;
  exchange: string;
  makerFee: number;
  takerFee: number;
  currency: string;
  type: 'percentage' | 'fixed';
  isDefault: boolean;
  swapFee?: number;
  withdrawalFee?: number;
  depositFee?: number;
}

const defaultFormData: CommissionFormData = {
  name: '',
  exchange: '',
  makerFee: 0.1,
  takerFee: 0.1,
  currency: 'USD',
  type: 'percentage',
  isDefault: false,
};

const popularExchanges = [
  'Interactive Brokers',
  'TD Ameritrade',
  'E*TRADE',
  'Charles Schwab',
  'Fidelity',
  'Robinhood',
  'Binance',
  'Coinbase Pro',
  'Kraken',
  'FTX',
  'MetaTrader',
  'cTrader',
  'Custom',
];

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

export function CommissionSettings() {
  const { commissions, addCommission, updateCommission, deleteCommission } = useSettingsStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);
  const [formData, setFormData] = useState<CommissionFormData>(defaultFormData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tradeValue, setTradeValue] = useState(10000); // For calculator

  const handleCreateCommission = () => {
    setEditingCommission(null);
    setFormData(defaultFormData);
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleEditCommission = (commission: Commission) => {
    setEditingCommission(commission);
    setFormData({
      name: commission.name,
      exchange: commission.exchange,
      makerFee: commission.makerFee,
      takerFee: commission.takerFee,
      currency: commission.currency,
      type: commission.type,
      isDefault: commission.isDefault || false,
      swapFee: commission.swapFee,
      withdrawalFee: commission.withdrawalFee,
      depositFee: commission.depositFee,
    });
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    const errors = validateCommission(formData);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Ensure only one default commission
    if (formData.isDefault) {
      commissions.forEach((commission) => {
        if (commission.isDefault && commission.id !== editingCommission?.id) {
          updateCommission(commission.id, { isDefault: false });
        }
      });
    }

    if (editingCommission) {
      updateCommission(editingCommission.id, formData);
    } else {
      addCommission(formData);
    }

    setIsDialogOpen(false);
    setFormData(defaultFormData);
    setValidationErrors({});
  };

  const handleDeleteCommission = (id: string) => {
    if (confirm('Are you sure you want to delete this commission setting?')) {
      deleteCommission(id);
    }
  };

  const handleSetDefault = (id: string) => {
    // Remove default from all others
    commissions.forEach((commission) => {
      updateCommission(commission.id, { isDefault: commission.id === id });
    });
  };

  const calculateCommission = (commission: Commission, value: number): number => {
    if (commission.type === 'percentage') {
      return (value * commission.takerFee) / 100;
    } else {
      return commission.takerFee;
    }
  };

  const exportCommissions = () => {
    const dataStr = JSON.stringify(commissions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `commission-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCommissions = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCommissions = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedCommissions)) {
          importedCommissions.forEach((commission) => {
            const { id, ...commissionData } = commission;
            addCommission(commissionData);
          });
        }
      } catch (error) {
        alert('Invalid file format. Please select a valid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const getCommissionDisplayValue = (commission: Commission): string => {
    if (commission.type === 'percentage') {
      return `${commission.takerFee}%`;
    } else {
      return `${commission.currency} ${commission.takerFee}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Commission Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure trading fees and commissions for different exchanges and brokers
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importCommissions}
            className="hidden"
            id="import-commissions"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('import-commissions')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportCommissions}
            disabled={commissions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button onClick={handleCreateCommission}>
            <Plus className="h-4 w-4 mr-2" />
            Add Commission
          </Button>
        </div>
      </div>

      {/* Commission Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Commission Calculator
          </CardTitle>
          <CardDescription>
            Calculate commission costs for different trade values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade-value">Trade Value</Label>
              <Input
                id="trade-value"
                type="number"
                value={tradeValue}
                onChange={(e) => setTradeValue(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
            </div>
          </div>
          
          {commissions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissions.map((commission) => {
                const cost = calculateCommission(commission, tradeValue);
                const percentage = (cost / tradeValue) * 100;
                
                return (
                  <div key={commission.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{commission.name}</span>
                      {commission.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-medium">
                          {commission.currency} {cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Percentage:</span>
                        <span className="text-muted-foreground">
                          {percentage.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commissions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Commission Settings ({commissions.length})
          </CardTitle>
          <CardDescription>
            Manage commission rates for different exchanges and trading instruments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No commission settings</h3>
              <p className="text-muted-foreground mb-4">
                Add commission settings for accurate trade calculations
              </p>
              <Button onClick={handleCreateCommission}>
                <Plus className="h-4 w-4 mr-2" />
                Add Commission Setting
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Maker Fee</TableHead>
                  <TableHead>Taker Fee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{commission.name}</span>
                        {commission.isDefault && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{commission.exchange}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {commission.type === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {commission.makerFee}
                        {commission.type === 'percentage' ? '%' : ` ${commission.currency}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {commission.type === 'percentage' ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <DollarSign className="h-3 w-3" />
                        )}
                        {commission.takerFee}
                        {commission.type === 'percentage' ? '%' : ` ${commission.currency}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={commission.type === 'percentage' ? 'default' : 'secondary'}>
                        {commission.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{commission.currency}</TableCell>
                    <TableCell>
                      {commission.isDefault ? (
                        <Badge variant="default">Default</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(commission.id)}
                        >
                          Set Default
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCommission(commission)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!commission.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(commission.id)}>
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteCommission(commission.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Commission Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Commission Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Maker fees are typically lower than taker fees on most exchanges</li>
            <li>• Consider volume discounts when setting up commission tiers</li>
            <li>• Include spreads in your commission calculations for forex trading</li>
            <li>• Set one commission setting as default for quick trade entry</li>
            <li>• Review and update commission rates regularly as they may change</li>
          </ul>
        </CardContent>
      </Card>

      {/* Create/Edit Commission Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCommission ? 'Edit Commission Setting' : 'Add Commission Setting'}
            </DialogTitle>
            <DialogDescription>
              {editingCommission 
                ? 'Update the commission rates and settings' 
                : 'Configure commission rates for a broker or exchange'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commission-name">Name *</Label>
              <Input
                id="commission-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Interactive Brokers"
                className={cn(validationErrors.name && 'border-red-500')}
              />
              {validationErrors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission-exchange">Exchange/Broker *</Label>
              <Select 
                value={formData.exchange} 
                onValueChange={(value) => setFormData({ ...formData, exchange: value })}
              >
                <SelectTrigger className={cn(validationErrors.exchange && 'border-red-500')}>
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {popularExchanges.map((exchange) => (
                    <SelectItem key={exchange} value={exchange}>
                      {exchange}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.exchange && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {validationErrors.exchange}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission-type">Fee Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission-currency">Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maker-fee">
                  Maker Fee {formData.type === 'percentage' ? '(%)' : `(${formData.currency})`}
                </Label>
                <Input
                  id="maker-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.makerFee}
                  onChange={(e) => setFormData({ ...formData, makerFee: parseFloat(e.target.value) || 0 })}
                  className={cn(validationErrors.makerFee && 'border-red-500')}
                />
                {validationErrors.makerFee && (
                  <p className="text-sm text-red-600">{validationErrors.makerFee}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="taker-fee">
                  Taker Fee {formData.type === 'percentage' ? '(%)' : `(${formData.currency})`}
                </Label>
                <Input
                  id="taker-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.takerFee}
                  onChange={(e) => setFormData({ ...formData, takerFee: parseFloat(e.target.value) || 0 })}
                  className={cn(validationErrors.takerFee && 'border-red-500')}
                />
                {validationErrors.takerFee && (
                  <p className="text-sm text-red-600">{validationErrors.takerFee}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Set as Default</Label>
                <p className="text-xs text-muted-foreground">
                  Use this commission setting as the default for new trades
                </p>
              </div>
              <Switch
                checked={formData.isDefault}
                onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {editingCommission ? 'Update' : 'Add'} Commission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}