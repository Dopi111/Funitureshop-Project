// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (isAuthenticated()) {
            if (isAdmin()) {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, isAdmin, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
            }

            // Lưu token và user thông qua AuthContext
            login(data.token, data.user);

            // Redirect dựa theo role - sử dụng window.location để force reload
            if (data.user?.role === 'Admin' || data.user?.role === 1 || data.user?.role === '1') {
                window.location.href = '/admin/dashboard';
            } else {
                window.location.href = '/';
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            Furniture<span>Shop</span>
                        </Link>
                        <h1>Đăng Nhập</h1>
                        <p>Chào mừng bạn quay trở lại!</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Tên đăng nhập</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập tên đăng nhập"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Nhập mật khẩu"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="auth-btn"
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>hoặc</span>
                    </div>

                    <div className="social-login">
                        <button className="social-btn google">
                            <span>G</span> Đăng nhập với Google
                        </button>
                        <button className="social-btn facebook">
                            <span>f</span> Đăng nhập với Facebook
                        </button>
                    </div>

                    <div className="auth-footer">
                        Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
