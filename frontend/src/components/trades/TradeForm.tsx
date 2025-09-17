// Modern simplified TradeForm - uses NewTradeForm for better UX
import React from 'react';
import NewTradeForm from './NewTradeForm';
import { TradeFormData } from '@/types';
import { tradesService } from '@/services/tradesService';
import { useActiveAccount } from '@/store/accountStore';
import { toast } from 'sonner';

interface TradeFormProps {
  tradeId?: string;
  onSuccess?: (trade: any) => void;
  onCancel?: () => void;
}

function TradeForm({ tradeId, onSuccess, onCancel }: TradeFormProps) {
  const activeAccount = useActiveAccount();

  const handleSubmit = async (tradeData: TradeFormData) => {
    if (!activeAccount) {
      toast.error('No active account selected');
      return;
    }

    try {
      if (tradeId) {
        await tradesService.updateTrade(tradeId, tradeData, activeAccount.id);
        toast.success('Trade updated successfully!');
      } else {
        await tradesService.createTrade(tradeData, activeAccount.id);
        toast.success('Trade created successfully!');
      }
      onSuccess?.(tradeData);
    } catch (error) {
      console.error('Error saving trade:', error);
      toast.error('Failed to save trade');
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <NewTradeForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={false}
    />
  );
}

export default TradeForm;