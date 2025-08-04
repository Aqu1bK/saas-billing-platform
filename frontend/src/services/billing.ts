import { api } from './api';

export const getPlans = async () => {
  const response = await api.get('/api/billing/plans');
  return response.data;
};

export const createSubscription = async (data: {
  planId: string;
  email: string;
  paymentMethodId: string;
  trialDays?: number;
}) => {
  const response = await api.post('/api/billing/create-subscription', data);
  return response.data;
};

export const cancelSubscription = async (subscriptionId: string) => {
  const response = await api.post('/api/billing/cancel-subscription', {
    subscriptionId
  });
  return response.data;
};

export const getBillingPortal = async () => {
  const response = await api.get('/api/billing/portal');
  return response.data;
};