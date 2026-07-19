// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Kiểm tra token và user từ localStorage khi app khởi động
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = (authToken, userData) => {
        setToken(authToken);
        setUser(userData);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    };

    const updateUser = (updatedFields) => {
        setUser(prev => {
            const updated = { ...prev, ...updatedFields };
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    const isAuthenticated = () => {
        return !!token && !!user;
    };

    const isAdmin = () => {
        return user?.role === 'Admin' || user?.role === 1 || user?.role === '1';
    };

    const isUser = () => {
        return user?.role === 'Customer' || user?.role === 0 || user?.role === '0';
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isAdmin,
        isUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
