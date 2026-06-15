// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { path: '/admin/dashboard', icon: '📦', label: 'Quản lý sản phẩm' },
        { path: '/admin/categories', icon: '📁', label: 'Danh mục' },
        { path: '/admin/orders', icon: '🛒', label: 'Đơn hàng' },
        { path: '/admin/users', icon: '👥', label: 'Người dùng' },
        { path: '/admin/statistics', icon: '📊', label: 'Thống kê' },
        { path: '/admin/utilities', icon: '⚙️', label: 'Tiện ích' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <Link to="/" className="admin-logo">
                    Furniture<span>Shop</span>
                </Link>
                <span className="admin-label">Admin Panel</span>
            </div>

            <nav className="admin-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`admin-nav-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="admin-sidebar-footer">
                <div className="admin-user-info">
                    <span className="admin-user-avatar">👤</span>
                    <div className="admin-user-details">
                        <span className="admin-user-name">{user?.fullName || 'Admin'}</span>
                        <span className="admin-user-role">Quản trị viên</span>
                    </div>
                </div>
                <button onClick={handleLogout} className="admin-logout-btn">
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
