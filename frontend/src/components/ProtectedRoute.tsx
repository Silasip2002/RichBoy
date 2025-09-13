import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return <div>Loading...</div>; // Or a spinner
    }

    return <>{children}</>;
};

export default ProtectedRoute;
