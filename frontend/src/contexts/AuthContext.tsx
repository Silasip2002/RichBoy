import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
        login: (token: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchUserProfile(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserProfile = async (token: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/users/profile/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                logout();
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (newToken: string) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        await fetchUserProfile(newToken);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
