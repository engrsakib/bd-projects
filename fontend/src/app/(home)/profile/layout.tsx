import ProfileSkeleton from '@/components/profile/profile-skeleton';
import ProtectedRoutes from '@/hooks/ProtectedRoutes';
import React from 'react';

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ProtectedRoutes skeleton={<ProfileSkeleton />}>
            {children}
        </ProtectedRoutes>
    );
};

export default layout;