import React from 'react';
import { useNavigate } from 'react-router-dom';
import TradeFormComponent from '../components/trades/TradeForm';

export function TradeFormPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to trades list on successful save
    navigate('/trades', { 
      state: { 
        message: 'Trade saved successfully!',
        type: 'success'
      }
    });
  };

  const handleCancel = () => {
    navigate('/trades');
  };

  return (
    <TradeFormComponent 
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}