// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../index.css';

const LOOKBOOK_IMG = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (formData.username.length < 4) {
            setError('Tên đăng nhập phải có ít nhất 4 ký tự');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return false;
        }
        if (!formData.agreeTerms) {
            setError('Vui lòng đồng ý với điều khoản sử dụng');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Đăng ký thất bại');
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] p-6">
                <div className="max-w-md w-full bg-white p-10 border border-[#E8E4DC] text-center space-y-6 shadow-[0_12px_40px_rgba(13,13,13,0.08)] animate-fade-up">
                    <div className="w-16 h-16 bg-[#0D0D0D] text-[#FDFBF7] rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                        ✓
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-medium tracking-tight uppercase">Đăng ký thành công!</h2>
                        <p className="text-sm text-[#8A8278] font-light leading-relaxed">
                            Tài khoản <strong className="text-[#0D0D0D] font-semibold">{formData.username}</strong> đã được tạo thành công. Trải nghiệm không gian nội thất cao cấp ngay.
                        </p>
                    </div>
                    <Link 
                        to="/login" 
                        className="w-full inline-flex items-center justify-center gap-3 rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300"
                    >
                        <span>Đăng nhập ngay</span>
                        <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px]">↗</span>
                    </Link>
                </div>
            </div>
        );
    }

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
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A87C] font-semibold block mb-2">Đặc Quyền Thành Viên</span>
                    <h2 className="text-2xl xl:text-3xl font-light tracking-tight uppercase">
                        Furniture<span className="font-bold">Shop</span>
                    </h2>
                </div>

                <div className="relative z-10 max-w-lg mb-8">
                    <p className="text-xl xl:text-2xl font-light leading-relaxed mb-6 text-[#E8E4DC]">
                        "Mỗi thiết kế đều mang một câu chuyện riêng, chờ đợi bạn viết tiếp trong chính ngôi nhà của mình."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-[#C9A87C]" />
                        <span className="text-xs uppercase tracking-widest font-mono text-[#C9A87C]">Triết lý kiến trúc</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Clean Luxury Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 py-16">
                <div className="w-full max-w-md space-y-8 animate-fade-up my-auto">
                    <div className="space-y-2 text-center lg:text-left">
                        <Link to="/" className="lg:hidden text-lg font-light tracking-tight uppercase inline-block mb-4">
                            Furniture<span className="font-bold">Shop</span>
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight uppercase text-[#0D0D0D]">Đăng Ký</h1>
                        <p className="text-sm text-[#8A8278] font-light">Tạo tài khoản để trải nghiệm dịch vụ nội thất cao cấp.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-[#FFEBEE] border border-[#C62828]/20 text-[#C62828] text-xs font-medium flex items-center gap-3">
                            <span className="text-base">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label htmlFor="username" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Tên đăng nhập *
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="hungking_2026"
                                    required
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="fullName" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Hùng"
                                    required
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label htmlFor="email" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="contact@example.com"
                                    required
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="phone" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Số điện thoại
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0912 345 678"
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label htmlFor="password" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Tối thiểu 6 ký tự"
                                    required
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <div className="space-y-1">
                                <label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Xác nhận mật khẩu *
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Nhập lại mật khẩu"
                                    required
                                    className="w-full px-0 py-2.5 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>
                        </div>

                        <div className="pt-3">
                            <label className="inline-flex items-start gap-2.5 cursor-pointer select-none group">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    className="w-4 h-4 mt-0.5 accent-[#0D0D0D] cursor-pointer"
                                />
                                <span className="text-xs text-[#8A8278] leading-relaxed group-hover:text-[#0D0D0D] transition-colors">
                                    Tôi đồng ý với{' '}
                                    <Link to="/terms" className="text-[#0D0D0D] font-semibold underline">Điều khoản sử dụng</Link>
                                    {' '}và{' '}
                                    <Link to="/privacy" className="text-[#0D0D0D] font-semibold underline">Chính sách bảo mật</Link>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group shadow-[0_4px_20px_rgba(13,13,13,0.15)] disabled:opacity-50 mt-4"
                        >
                            <span>{loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Ngay'}</span>
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
                            Hoặc kết nối nhanh
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
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="font-bold text-[#0D0D0D] hover:text-[#C9A87C] uppercase tracking-wider ml-1 transition-colors">
                                Đăng nhập →
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
