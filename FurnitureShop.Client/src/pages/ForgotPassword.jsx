// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

const LOOKBOOK_IMG = 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1200&q=80';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể gửi mã xác thực');
            }

            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (index, value) => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        const code = verificationCode.join('');

        if (code.length !== 6) {
            setError('Vui lòng nhập đủ 6 số');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/verify-reset-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Mã xác thực không đúng');
            }

            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    code: verificationCode.join(''),
                    newPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Không thể đổi mật khẩu');
            }

            setSuccess(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Không thể gửi lại mã');
            }

            setVerificationCode(['', '', '', '', '', '']);
            alert('Mã xác thực mới đã được gửi đến email của bạn!');
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
                        <h2 className="text-2xl font-medium tracking-tight uppercase">Đổi mật khẩu thành công!</h2>
                        <p className="text-sm text-[#8A8278] font-light leading-relaxed">
                            Mật khẩu của bạn đã được cập nhật an toàn. Đăng nhập để tiếp tục mua sắm nội thất.
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
            <Link to="/login" className="absolute top-6 left-6 md:top-8 md:left-8 z-30 inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#0D0D0D] md:text-white hover:opacity-75 transition-opacity bg-white/80 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none px-4 py-2 md:p-0">
                <span>←</span> Quay lại đăng nhập
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
                    <span className="text-[10px] tracking-[0.25em] uppercase text-[#C9A87C] font-semibold block mb-2">Bảo Mật Tài Khoản</span>
                    <h2 className="text-2xl xl:text-3xl font-light tracking-tight uppercase">
                        Furniture<span className="font-bold">Shop</span>
                    </h2>
                </div>

                <div className="relative z-10 max-w-lg mb-8">
                    <p className="text-xl xl:text-2xl font-light leading-relaxed mb-6 text-[#E8E4DC]">
                        "Sự an tâm và riêng tư của bạn là ưu tiên hàng đầu trong mọi trải nghiệm dịch vụ của chúng tôi."
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-[#C9A87C]" />
                        <span className="text-xs uppercase tracking-widest font-mono text-[#C9A87C]">Trung tâm hỗ trợ</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Clean Luxury Reset Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-20 xl:p-24">
                <div className="w-full max-w-md space-y-8 animate-fade-up">
                    <div className="space-y-2 text-center lg:text-left">
                        <Link to="/" className="lg:hidden text-lg font-light tracking-tight uppercase inline-block mb-4">
                            Furniture<span className="font-bold">Shop</span>
                        </Link>
                        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight uppercase text-[#0D0D0D]">
                            {step === 1 && 'Quên Mật Khẩu'}
                            {step === 2 && 'Xác Thực OTP'}
                            {step === 3 && 'Tạo Mật Khẩu Mới'}
                        </h1>
                        <p className="text-sm text-[#8A8278] font-light">
                            {step === 1 && 'Nhập địa chỉ email liên kết với tài khoản của bạn.'}
                            {step === 2 && `Nhập mã 6 chữ số vừa được gửi đến ${email}`}
                            {step === 3 && 'Tạo mật khẩu mới mạnh mẽ và bảo mật hơn.'}
                        </p>
                    </div>

                    {/* Minimal Step Progress */}
                    <div className="flex items-center gap-2 pt-2">
                        {[1, 2, 3].map((num) => (
                            <div key={num} className="flex-1 flex items-center gap-2">
                                <div className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                                    step >= num ? 'bg-[#0D0D0D]' : 'bg-[#E8E4DC]'
                                }`} />
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className="p-4 bg-[#FFEBEE] border border-[#C62828]/20 text-[#C62828] text-xs font-medium flex items-center gap-3">
                            <span className="text-base">⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Email đã đăng ký
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    required
                                    className="w-full px-0 py-3 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group shadow-[0_4px_20px_rgba(13,13,13,0.15)] disabled:opacity-50"
                            >
                                <span>{loading ? 'Đang gửi OTP...' : 'Gửi Mã Xác Thực'}</span>
                                {!loading && <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] group-hover:translate-x-1 transition-transform">↗</span>}
                            </button>
                        </form>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyCode} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block text-center lg:text-left">
                                    Mã xác thực 6 số
                                </label>
                                <div className="flex justify-between gap-2 max-w-xs mx-auto lg:mx-0">
                                    {verificationCode.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`code-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value)}
                                            onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                            className="w-11 h-12 bg-white border border-[#E8E4DC] focus:border-[#0D0D0D] text-center text-lg font-mono font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-[#0D0D0D] transition-all shadow-xs"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group shadow-[0_4px_20px_rgba(13,13,13,0.15)] disabled:opacity-50"
                            >
                                <span>{loading ? 'Đang xác minh...' : 'Xác Nhận OTP'}</span>
                                {!loading && <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] group-hover:translate-x-1 transition-transform">↗</span>}
                            </button>

                            <div className="text-center text-xs text-[#8A8278]">
                                Chưa nhận được email?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={loading}
                                    className="font-bold text-[#0D0D0D] hover:text-[#C9A87C] underline ml-1 cursor-pointer"
                                >
                                    Gửi lại mã
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-1.5">
                                <label htmlFor="newPassword" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="•••••••• (ít nhất 6 ký tự)"
                                    required
                                    className="w-full px-0 py-3 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="confirmPassword" className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8278] block">
                                    Xác nhận mật khẩu mới
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-0 py-3 bg-transparent border-b border-[#E8E4DC] text-sm text-[#0D0D0D] placeholder:text-[#8A8278]/40 focus:outline-none focus:border-[#0D0D0D] transition-colors font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-full py-4 px-6 bg-[#0D0D0D] text-[#FDFBF7] text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 group shadow-[0_4px_20px_rgba(13,13,13,0.15)] disabled:opacity-50"
                            >
                                <span>{loading ? 'Đang cập nhật...' : 'Hoàn Tất Đổi Mật Khẩu'}</span>
                                {!loading && <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-[10px] group-hover:translate-x-1 transition-transform">↗</span>}
                            </button>
                        </form>
                    )}

                    <div className="text-center pt-4 border-t border-[#E8E4DC]/60">
                        <Link to="/login" className="text-xs text-[#8A8278] hover:text-[#0D0D0D] font-medium transition-colors">
                            ← Quay lại trang đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
