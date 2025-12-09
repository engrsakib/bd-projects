import React from 'react';
import ProductDetails from './product-details-client';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: slug } = await params
  return (
    <ProductDetails slug={slug} />
  );
};

export default page;