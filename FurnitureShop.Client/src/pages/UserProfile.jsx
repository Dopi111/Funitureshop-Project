// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import apiService from '../services/apiService';

export default function UserProfile() {
    const { user, isAuthenticated, updateUser } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('info');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Personal Info ──
    const [infoForm, setInfoForm] = useState({ fullName: '', address: '', city: '', district: '', ward: '' });
    const [infoSaving, setInfoSaving] = useState(false);
    const [infoSuccess, setInfoSuccess] = useState('');
    const [infoError, setInfoError] = useState('');

    // ── Password ──
    const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdSuccess, setPwdSuccess] = useState('');
    const [pwdError, setPwdError] = useState('');
    const [showPwds, setShowPwds] = useState({ old: false, new_: false, confirm: false });

    // ── Contact OTP ──
    const [contactType, setContactType] = useState('email');
    const [newContactValue, setNewContactValue] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [contactSending, setContactSending] = useState(false);
    const [contactVerifying, setContactVerifying] = useState(false);
    const [contactSuccess, setContactSuccess] = useState('');
    const [contactError, setContactError] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const data = await apiService.getProfile(user.userId);
            setProfile(data);
            setInfoForm({
                fullName: data.fullName || '',
                address: data.address || '',
                city: data.city || '',
                district: data.district || '',
                ward: data.ward || '',
            });
        } catch {
            setInfoForm({ fullName: user?.fullName || '', address: '', city: '', district: '', ward: '' });
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0][0].toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // ── Handlers ──

    const handleSaveInfo = async () => {
        if (!infoForm.fullName.trim()) { setInfoError('Vui lòng nhập họ và tên'); return; }
        setInfoSaving(true); setInfoError(''); setInfoSuccess('');
        try {
            const res = await apiService.updateProfile({
                userId: user.userId,
                fullName: infoForm.fullName,
                address: infoForm.address || null,
                city: infoForm.city || null,
                district: infoForm.district || null,
                ward: infoForm.ward || null,
            });
            if (res.success) {
                setInfoSuccess('Cập nhật thông tin thành công!');
                updateUser({ fullName: infoForm.fullName });
                setProfile(p => ({ ...p, fullName: infoForm.fullName, address: infoForm.address, city: infoForm.city, district: infoForm.district, ward: infoForm.ward }));
                setTimeout(() => setInfoSuccess(''), 4000);
            } else {
                setInfoError(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            setInfoError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setInfoSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
            setPwdError('Vui lòng điền đầy đủ thông tin'); return;
        }
        if (pwdForm.newPassword.length < 6) { setPwdError('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
        if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdError('Xác nhận mật khẩu không khớp'); return; }
        setPwdSaving(true); setPwdError(''); setPwdSuccess('');
        try {
            const res = await apiService.changePassword({
                userId: user.userId,
                oldPassword: pwdForm.oldPassword,
                newPassword: pwdForm.newPassword,
            });
            if (res.success) {
                setPwdSuccess('Đổi mật khẩu thành công!');
                setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setPwdSuccess(''), 4000);
            } else {
                setPwdError(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            setPwdError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setPwdSaving(false);
        }
    };

    const handleSendOtp = async () => {
        const val = newContactValue.trim();
        if (!val) { setContactError(contactType === 'email' ? 'Vui lòng nhập email mới' : 'Vui lòng nhập số điện thoại mới'); return; }
        if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { setContactError('Email không hợp lệ'); return; }
        if (contactType === 'phone' && !/^(0|\+84)[0-9]{8,10}$/.test(val)) { setContactError('Số điện thoại không hợp lệ (vd: 0901234567)'); return; }
        setContactSending(true); setContactError('');
        try {
            const res = await apiService.sendOtpForContact({ userId: user.userId, contactType, newValue: val });
            if (res.success) { setOtpStep(true); setDevOtp(res.otpCode || ''); }
            else { setContactError(res.message || 'Có lỗi xảy ra'); }
        } catch {
            setContactError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setContactSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!/^\d{6}$/.test(otpCode)) { setContactError('Mã OTP phải gồm 6 chữ số'); return; }
        setContactVerifying(true); setContactError('');
        try {
            const res = await apiService.updateContact({
                userId: user.userId,
                contactType,
                newValue: newContactValue.trim(),
                otpCode,
            });
            if (res.success) {
                setContactSuccess(res.message || 'Cập nhật thành công!');
                setOtpStep(false); setOtpCode(''); setNewContactValue(''); setDevOtp('');
                if (contactType === 'email') updateUser({ email: newContactValue.trim() });
                await loadProfile();
                setTimeout(() => setContactSuccess(''), 5000);
            } else {
                setContactError(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            setContactError('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setContactVerifying(false);
        }
    };

    const handleOtpInput = (i, val) => {
        const digit = val.replace(/\D/g, '').slice(-1);
        setOtpCode(prev => {
            const chars = prev.split('');
            while (chars.length <= i) chars.push('');
            chars[i] = digit;
            while (chars.length > 0 && chars[chars.length - 1] === '') chars.pop();
            return chars.join('');
        });
        if (digit && i < 5) setTimeout(() => document.getElementById(`potp-${i + 1}`)?.focus(), 0);
    };

    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otpCode[i] && i > 0) {
            document.getElementById(`potp-${i - 1}`)?.focus();
        }
    };

    const pwdStrength = pwdForm.newPassword.length === 0 ? '' :
        pwdForm.newPassword.length >= 10 ? 'strong' :
        pwdForm.newPassword.length >= 6 ? 'medium' : 'weak';

    const pwdStrengthLabel = { strong: 'Mạnh', medium: 'Trung bình', weak: 'Yếu' }[pwdStrength] || '';

    if (!isAuthenticated()) return null;

    return (
        <div className="app">
            <Navbar />
            <main className="profile-page">
                <div className="container">
                    {/* Breadcrumb */}
                    <div className="profile-breadcrumb">
                        <Link to="/">Trang chủ</Link>
                        <span> &rsaquo; </span>
                        <span>Tài khoản của tôi</span>
                    </div>

                    <div className="profile-layout">
                        {/* ── Sidebar ── */}
                        <aside className="profile-sidebar">
                            <div className="profile-avatar-box">
                                <div className="profile-avatar">
                                    {loading ? '?' : getInitials(profile?.fullName || user?.fullName)}
                                </div>
                                <div className="profile-avatar-name">{profile?.fullName || user?.fullName}</div>
                                <div className="profile-avatar-email">{profile?.email || user?.email}</div>
                                <span className={`profile-role-badge${profile?.role === 'Admin' ? ' admin' : ''}`}>
                                    {profile?.role === 'Admin' ? '⚙️ Quản trị viên' : '👤 Khách hàng'}
                                </span>
                            </div>

                            <nav className="profile-nav">
                                <button
                                    className={`profile-nav-item${activeTab === 'info' ? ' active' : ''}`}
                                    onClick={() => setActiveTab('info')}
                                >
                                    📋 Thông tin cá nhân
                                </button>
                                <button
                                    className={`profile-nav-item${activeTab === 'password' ? ' active' : ''}`}
                                    onClick={() => setActiveTab('password')}
                                >
                                    🔒 Đổi mật khẩu
                                </button>
                                <button
                                    className={`profile-nav-item${activeTab === 'contact' ? ' active' : ''}`}
                                    onClick={() => setActiveTab('contact')}
                                >
                                    📱 Đổi liên hệ
                                </button>
                                <Link to="/my-orders" className="profile-nav-item">
                                    📦 Đơn hàng của tôi
                                </Link>
                            </nav>
                        </aside>

                        {/* ── Main content ── */}
                        <div className="profile-content">
                            {loading ? (
                                <div className="profile-card profile-loading">
                                    <div className="loading-spinner" />
                                    <p>Đang tải thông tin tài khoản...</p>
                                </div>
                            ) : (
                                <>
                                    {/* ── TAB: Personal Info ── */}
                                    {activeTab === 'info' && (
                                        <div className="profile-card">
                                            <div className="profile-card-header">
                                                <h2>📋 Thông tin cá nhân</h2>                                                
                                            </div>

                                            {infoSuccess && <div className="profile-success">{infoSuccess}</div>}
                                            {infoError && <div className="profile-error">{infoError}</div>}

                                            {/* Read-only fields */}
                                            <div className="profile-readonly-grid">
                                                <div className="profile-readonly-item">
                                                    <span className="profile-readonly-label">Tên đăng nhập</span>
                                                    <span className="profile-readonly-value">{profile?.username}</span>
                                                </div>
                                                <div className="profile-readonly-item">
                                                    <span className="profile-readonly-label">Email</span>
                                                    <span className="profile-readonly-value">{profile?.email}</span>
                                                </div>
                                                <div className="profile-readonly-item">
                                                    <span className="profile-readonly-label">Số điện thoại</span>
                                                    <span className="profile-readonly-value">
                                                        {profile?.phoneNumber || <em className="profile-empty">Chưa cập nhật</em>}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="profile-readonly-hint">
                                                💡 Để đổi email hoặc số điện thoại, vui lòng vào tab{' '}
                                                <button className="profile-tab-link" onClick={() => setActiveTab('contact')}>
                                                    Đổi liên hệ
                                                </button>
                                            </p>

                                            <div className="profile-divider" />

                                            <div className="profile-form">
                                                <div className="form-group">
                                                    <label>Họ và tên <span className="co-required">*</span></label>
                                                    <input
                                                        type="text"
                                                        className="profile-input"
                                                        value={infoForm.fullName}
                                                        onChange={e => setInfoForm(p => ({ ...p, fullName: e.target.value }))}
                                                        placeholder="Nguyễn Văn A"
                                                    />
                                                </div>

                                                <div className="profile-address-section">
                                                    <h3 className="profile-section-title">🏠 Địa chỉ giao hàng mặc định</h3>

                                                    <div className="form-group">
                                                        <label>Địa chỉ (số nhà, tên đường, phường/xã)</label>
                                                        <input
                                                            type="text"
                                                            className="profile-input"
                                                            value={infoForm.address}
                                                            onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))}
                                                            placeholder="123 Đường Lê Lợi, Phường Bến Nghé"
                                                        />
                                                    </div>

                                                    <div className="profile-form-row-3">
                                                        <div className="form-group">
                                                            <label>Tỉnh / Thành phố</label>
                                                            <input
                                                                type="text"
                                                                className="profile-input"
                                                                value={infoForm.city}
                                                                onChange={e => setInfoForm(p => ({ ...p, city: e.target.value }))}
                                                                placeholder="TP. Hồ Chí Minh"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Quận / Huyện</label>
                                                            <input
                                                                type="text"
                                                                className="profile-input"
                                                                value={infoForm.district}
                                                                onChange={e => setInfoForm(p => ({ ...p, district: e.target.value }))}
                                                                placeholder="Quận 1"
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Phường / Xã</label>
                                                            <input
                                                                type="text"
                                                                className="profile-input"
                                                                value={infoForm.ward}
                                                                onChange={e => setInfoForm(p => ({ ...p, ward: e.target.value }))}
                                                                placeholder="Phường Bến Nghé"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    className="profile-btn-primary"
                                                    onClick={handleSaveInfo}
                                                    disabled={infoSaving}
                                                >
                                                    {infoSaving ? 'Đang lưu...' : '💾 Lưu thông tin'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB: Change Password ── */}
                                    {activeTab === 'password' && (
                                        <div className="profile-card">
                                            <div className="profile-card-header">
                                                <h2>🔒 Đổi mật khẩu</h2>
                                                <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác</p>
                                            </div>

                                            {pwdSuccess && <div className="profile-success">{pwdSuccess}</div>}
                                            {pwdError && <div className="profile-error">{pwdError}</div>}

                                            <div className="profile-form profile-form-narrow">
                                                <div className="form-group">
                                                    <label>Mật khẩu hiện tại <span className="co-required">*</span></label>
                                                    <div className="profile-input-wrap">
                                                        <input
                                                            type={showPwds.old ? 'text' : 'password'}
                                                            className="profile-input"
                                                            value={pwdForm.oldPassword}
                                                            onChange={e => setPwdForm(p => ({ ...p, oldPassword: e.target.value }))}
                                                            placeholder="Nhập mật khẩu hiện tại"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="profile-eye-btn"
                                                            onClick={() => setShowPwds(p => ({ ...p, old: !p.old }))}
                                                        >
                                                            {showPwds.old ? '🙈' : '👁️'}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="form-group">
                                                    <label>Mật khẩu mới <span className="co-required">*</span></label>
                                                    <div className="profile-input-wrap">
                                                        <input
                                                            type={showPwds.new_ ? 'text' : 'password'}
                                                            className="profile-input"
                                                            value={pwdForm.newPassword}
                                                            onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                                                            placeholder="Ít nhất 6 ký tự"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="profile-eye-btn"
                                                            onClick={() => setShowPwds(p => ({ ...p, new_: !p.new_ }))}
                                                        >
                                                            {showPwds.new_ ? '🙈' : '👁️'}
                                                        </button>
                                                    </div>
                                                    {pwdStrength && (
                                                        <div className="profile-pwd-strength">
                                                            <div className="profile-pwd-track">
                                                                <div className={`profile-pwd-fill ${pwdStrength}`} />
                                                            </div>
                                                            <span className="profile-pwd-label">{pwdStrengthLabel}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="form-group">
                                                    <label>Xác nhận mật khẩu mới <span className="co-required">*</span></label>
                                                    <div className="profile-input-wrap">
                                                        <input
                                                            type={showPwds.confirm ? 'text' : 'password'}
                                                            className="profile-input"
                                                            value={pwdForm.confirmPassword}
                                                            onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                                            placeholder="Nhập lại mật khẩu mới"
                                                        />
                                                        <button
                                                            type="button"
                                                            className="profile-eye-btn"
                                                            onClick={() => setShowPwds(p => ({ ...p, confirm: !p.confirm }))}
                                                        >
                                                            {showPwds.confirm ? '🙈' : '👁️'}
                                                        </button>
                                                    </div>
                                                    {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                                                        <span className="co-err-msg">Mật khẩu không khớp</span>
                                                    )}
                                                </div>

                                                <button
                                                    className="profile-btn-primary"
                                                    onClick={handleChangePassword}
                                                    disabled={pwdSaving}
                                                >
                                                    {pwdSaving ? 'Đang xử lý...' : '🔒 Đổi mật khẩu'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB: Change Contact ── */}
                                    {activeTab === 'contact' && (
                                        <div className="profile-card">
                                            <div className="profile-card-header">
                                                <h2>📱 Đổi thông tin liên hệ</h2>
                                            </div>

                                            {contactSuccess && <div className="profile-success">{contactSuccess}</div>}
                                            {contactError && <div className="profile-error">{contactError}</div>}

                                            <div className="profile-current-contact">
                                                <div className="profile-contact-item">
                                                    <span className="profile-contact-label">Email hiện tại</span>
                                                    <span className="profile-contact-val">{profile?.email}</span>
                                                </div>
                                                <div className="profile-contact-item">
                                                    <span className="profile-contact-label">Số điện thoại hiện tại</span>
                                                    <span className="profile-contact-val">
                                                        {profile?.phoneNumber || <em className="profile-empty">Chưa có</em>}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="profile-form profile-form-narrow">
                                                {!otpStep ? (
                                                    <>
                                                        <div className="profile-contact-tabs">
                                                            <button
                                                                className={`profile-ctab${contactType === 'email' ? ' active' : ''}`}
                                                                onClick={() => { setContactType('email'); setNewContactValue(''); setContactError(''); setContactSuccess(''); }}
                                                            >
                                                                📧 Đổi Email
                                                            </button>
                                                            <button
                                                                className={`profile-ctab${contactType === 'phone' ? ' active' : ''}`}
                                                                onClick={() => { setContactType('phone'); setNewContactValue(''); setContactError(''); setContactSuccess(''); }}
                                                            >
                                                                📱 Đổi Số điện thoại
                                                            </button>
                                                        </div>

                                                        <div className="form-group">
                                                            <label>
                                                                {contactType === 'email' ? 'Email mới' : 'Số điện thoại mới'}
                                                                <span className="co-required"> *</span>
                                                            </label>
                                                            <input
                                                                type={contactType === 'email' ? 'email' : 'tel'}
                                                                className="profile-input"
                                                                value={newContactValue}
                                                                onChange={e => setNewContactValue(e.target.value)}
                                                                placeholder={contactType === 'email' ? 'email@example.com' : '0901234567'}
                                                            />
                                                        </div>

                                                        <button
                                                            className="profile-btn-primary"
                                                            onClick={handleSendOtp}
                                                            disabled={contactSending}
                                                        >
                                                            {contactSending ? 'Đang gửi...' : '📨 Gửi mã OTP'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>

                                                        <div className="form-group">
                                                            <label>Nhập mã OTP (6 chữ số) <span className="co-required">*</span></label>
                                                            <div className="verification-code-group">
                                                                <div className="code-inputs">
                                                                    {[0, 1, 2, 3, 4, 5].map(i => (
                                                                        <input
                                                                            key={i}
                                                                            id={`potp-${i}`}
                                                                            type="text"
                                                                            inputMode="numeric"
                                                                            maxLength="1"
                                                                            className="code-input"
                                                                            value={otpCode[i] || ''}
                                                                            onChange={e => handleOtpInput(i, e.target.value)}
                                                                            onKeyDown={e => handleOtpKeyDown(i, e)}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="profile-otp-actions">
                                                            <button
                                                                className="profile-btn-outline"
                                                                onClick={() => { setOtpStep(false); setOtpCode(''); setDevOtp(''); setContactError(''); }}
                                                            >
                                                                ← Quay lại
                                                            </button>
                                                            <button
                                                                className="profile-btn-primary"
                                                                onClick={handleVerifyOtp}
                                                                disabled={contactVerifying || !/^\d{6}$/.test(otpCode)}
                                                            >
                                                                {contactVerifying ? 'Đang xác nhận...' : '✅ Xác nhận OTP'}
                                                            </button>
                                                        </div>

                                                        <button
                                                            className="profile-resend-btn"
                                                            onClick={handleSendOtp}
                                                            disabled={contactSending}
                                                        >
                                                            {contactSending ? 'Đang gửi lại...' : '🔄 Gửi lại mã OTP'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
