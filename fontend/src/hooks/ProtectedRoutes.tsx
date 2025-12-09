'use client';

import { useGetUserInfoQuery } from '@/redux/api/api-query';
import { usePathname, useRouter } from 'next/navigation';
import React, { FC, useEffect, useRef } from 'react';

const ProtectedRoutes: FC<{ children: React.ReactNode; skeleton?: React.ReactNode }> = ({
  children,
  skeleton,
}) => {
  const { data, isLoading } = useGetUserInfoQuery({});
  const router = useRouter();
  const pathname = usePathname();

  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !data && !redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(`/login?to=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, data, router, pathname]);

  if (isLoading) {
    return (
      (skeleton as React.ReactNode) ?? (
        <div className="font-medium text-xl text-center min-h-screen flex justify-center items-center">
          Authenticating...
        </div>
      )
    );
  }

  if (!data) return null;

  return children;
};

export default ProtectedRoutes;
