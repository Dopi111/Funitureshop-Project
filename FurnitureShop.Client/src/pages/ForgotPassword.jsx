// src/pages/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../index.css';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: email, 2: verification code, 3: new password
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Handle email submit
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

            setStep(2); // Move to verification code step
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle verification code input
    const handleCodeChange = (index, value) => {
        if (value.length > 1) return; // Only allow single digit
        if (!/^\d*$/.test(value)) return; // Only allow numbers

        const newCode = [...verificationCode];
        newCode[index] = value;
        setVerificationCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    // Handle verification code backspace
    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    // Verify code submit
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

            setStep(3); // Move to new password step
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Handle password reset
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

    // Resend code
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
            alert('Mã xác thực mới đã được gửi!');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Success screen
    if (success) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-card">
                        <div className="auth-success">
                            <div className="success-icon">✓</div>
                            <h2>Đổi mật khẩu thành công!</h2>
                            <p>Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.</p>
                            <Link to="/login" className="auth-btn">
                                Đăng nhập ngay
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            Furniture<span>Shop</span>
                        </Link>
                        <h1>
                            {step === 1 && 'Quên Mật Khẩu'}
                            {step === 2 && 'Xác Thực Email'}
                            {step === 3 && 'Đặt Mật Khẩu Mới'}
                        </h1>
                        <p>
                            {step === 1 && 'Nhập email để nhận mã xác thực'}
                            {step === 2 && `Nhập mã 6 số đã gửi đến ${email}`}
                            {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="progress-steps">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                            <span>1</span>
                            <p>Email</p>
                        </div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                            <span>2</span>
                            <p>Xác thực</p>
                        </div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                            <span>3</span>
                            <p>Mật khẩu</p>
                        </div>
                    </div>

                    {error && (
                        <div className="auth-error">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Step 1: Email input */}
                    {step === 1 && (
                        <form onSubmit={handleEmailSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập email đã đăng ký"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="auth-btn"
                                disabled={loading}
                            >
                                {loading ? 'Đang gửi...' : 'Gửi Mã Xác Thực'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Verification code */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyCode} className="auth-form">
                            <div className="verification-code-group">
                                <label>Mã xác thực</label>
                                <div className="code-inputs">
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
                                            className="code-input"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-btn"
                                disabled={loading}
                            >
                                {loading ? 'Đang xác thực...' : 'Xác Thực'}
                            </button>

                            <div className="resend-code">
                                Không nhận được mã?{' '}
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    className="resend-btn"
                                    disabled={loading}
                                >
                                    Gửi lại
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: New password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="newPassword">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Nhập lại mật khẩu mới"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="auth-btn"
                                disabled={loading}
                            >
                                {loading ? 'Đang xử lý...' : 'Đổi Mật Khẩu'}
                            </button>
                        </form>
                    )}

                    <div className="auth-footer" style={{ marginTop: '2rem' }}>
                        <Link to="/login" className="back-link">
                            ← Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
