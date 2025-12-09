import React from 'react';
import PreOrderCheckoutPage from './pre-order-client';

const PreOrderClient = async ({ searchParams }: { searchParams: Promise<{ order_now: boolean }> }) => {
  
  
  const order_now = (await searchParams)?.order_now;

  return <PreOrderCheckoutPage isOrderNow={order_now} />
};

export default PreOrderClient;