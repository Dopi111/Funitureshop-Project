// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Route bảo vệ cho user đã đăng nhập
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

// Route bảo vệ chỉ dành cho Admin
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    // TẠM THỜI BYPASS ĐỂ TEST GIAO DIỆN UI/UX
    // if (!isAuthenticated()) {
    //     return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    // if (!isAdmin()) {
    //     return <Navigate to="/" replace />;
    // }

    return children;
};

export default ProtectedRoute;
