import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/store/tradeStore';
import NewTradeForm from '@/components/trades/NewTradeForm';
import { TradeFormData } from '@/types';

// Wrapper page component to maintain route compatibility and add navigation handlers
export function ModernTradeFormPage() {
  const navigate = useNavigate();
  const { addTrade, loading } = useTradeStore();

  const handleSubmit = async (tradeData: TradeFormData) => {
    try {
      await addTrade(tradeData);

      // Navigate to trades list on successful save
      navigate('/trades', {
        state: {
          message: 'Trade saved successfully!',
          type: 'success'
        }
      });
    } catch (error) {
      // Error handling is already done in the form component via tradeStore
      throw error; // Re-throw to let the form handle the error display
    }
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <NewTradeForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={loading}
      />
    </div>
  );
}