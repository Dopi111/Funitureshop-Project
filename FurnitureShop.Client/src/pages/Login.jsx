// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../index.css';

const LOOKBOOK_IMG = 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80';

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

    useEffect(() => {
        if (isAuthenticated()) {
            if (isAdmin()) {
                navigate('/admin/overview');
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

            login(data.token, data.user);

            if (data.user?.role === 'Admin' || data.user?.role === 1 || data.user?.role === '1') {
                window.location.href = '/admin/overview';
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
        <div className="min-h-[100dvh] w-full flex bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] selection:bg-[#C9A87C] selection:text-white relative overflow-x-hidden">
            {/* Minimal Back Link */}
            <Link to="/" className="absolute top-6 left-6 md:top-8 md:left-8 z-30 inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#0D0D0D] md:text-white hover:opacity-75 transition-opacity bg-white/80 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none px-4 py-2 md:p-0">
                <span>←</span> Trang chủ
            </Link>

            {/* Left Column: Atmospheric Lookbook */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-[#0D0D0D] overflow-hidden justify-between flex-col p-12 xl:p-16 text-[#FDFBF7]">
                <img 
                    src={LOOKBOOK_IMG} 
                    alt="Luxury Interior Lookbook" 
                    className="absolute inset-0 w-full h-full object-cover opacity-65 scale-105 animate-pulse duration-[10s]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-transparent" />

                <div className="relative z-10 pt-12">
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A87C] font-semibold block mb-2">Bộ Sưu Tập Hùng King</span>
                    <h2 className="text-2xl xl:text-3xl font-light tracking-tight uppercase">
                        Furniture<span className="font-bold">Shop</span>
                    </h2>
                </div>

                <div className="relative z-10 max-w-lg mb-8">
                    <p className="text-xl xl:text-2xl font-light leading-relaxed mb-6 text-[#E8E4DC]">
                        "Không gian sống không chỉ để ở, mà là tác phẩm nghệ thuật phản chiếu cá tính và bản ngã của chính bạn."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-[#C9A87C]" />
                        <span className="text-xs uppercase tracking-widest font-mono text-[#C9A87C]">Kiến trúc sư trưởng</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Clean Luxury Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 xl:p-24">
                <div className="w-full max-w-md space-y-8 animate-fade-up">
                    <div className="space-y-2 text-center lg:text-left">
                        <Link to="/" className="lg:hidden text-lg font-light tracking-tight uppercase inline-block mb-4">
                            Furniture<span className="font-bold">Shop</span>
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight uppercase text-[#0D0D0D]">Đăng Nhập</h1>
                        <p className="text-sm text-[#8A8278] font-light">Chào mừng bạn quay trở lại với không gian nội thất.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-[#FFEBEE] border border-[#C62828]/20 text-[#C62828] text-xs font-medium flex items-center gap-3">
                            <span className="text-base">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label htmlFor="username" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Nhập tên đăng nhập hoặc email"
                                required
                                className="w-full px-0 py-3 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Mật khẩu
                                </label>
                                <Link to="/forgot-password" className="text-[11px] text-[#C9A87C] hover:text-[#0D0D0D] font-medium transition-colors">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full px-0 py-3 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                            />
                        </div>

                        <div className="flex items-center pt-2">
                            <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                    className="w-4 h-4 accent-[#0D0D0D] cursor-pointer"
                                />
                                <span className="text-xs text-[#8A8278] group-hover:text-[#0D0D0D] transition-colors">Ghi nhớ đăng nhập</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group shadow-[0_4px_20px_rgba(13,13,13,0.15)] disabled:opacity-50"
                        >
                            <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
                            {!loading && (
                                <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] group-hover:translate-x-1 transition-transform">
                                    ↗
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-x-0 h-[1px] bg-[#E8E4DC]" />
                        <span className="relative z-10 bg-[#FDFBF7] px-4 text-[10px] uppercase tracking-widest font-semibold text-[#8A8278]">
                            Hoặc kết nối với
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" className="py-3 px-4 border border-[#E8E4DC] hover:border-[#0D0D0D] bg-white text-xs font-semibold text-[#0D0D0D] flex items-center justify-center gap-2 transition-all cursor-pointer">
                            <span className="font-bold text-red-500">G</span> Google
                        </button>
                        <button type="button" className="py-3 px-4 border border-[#E8E4DC] hover:border-[#0D0D0D] bg-white text-xs font-semibold text-[#0D0D0D] flex items-center justify-center gap-2 transition-all cursor-pointer">
                            <span className="font-bold text-blue-600">f</span> Facebook
                        </button>
                    </div>

                    <div className="text-center pt-4 border-t border-[#E8E4DC]/60">
                        <p className="text-xs text-[#8A8278]">
                            Chưa có tài khoản?{' '}
                            <Link to="/register" className="font-bold text-[#0D0D0D] hover:text-[#C9A87C] uppercase tracking-wider ml-1 transition-colors">
                                Đăng ký ngay →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
