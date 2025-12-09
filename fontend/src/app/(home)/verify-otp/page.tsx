import React, { Suspense } from 'react';
import VerifyOTPPage from './verify-otp-client';

const page = () => {
  return (
    <Suspense>
      <VerifyOTPPage />
    </Suspense>
  );
};

export default page;
export const dynamic = 'force-dynamic'