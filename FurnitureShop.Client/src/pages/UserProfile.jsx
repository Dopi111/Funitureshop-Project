// src/pages/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import apiService from '../services/apiService';
import { toast } from 'react-hot-toast';
import { useAvatar } from '../hooks/useAvatar';
import '../index.css';

export default function UserProfile() {
    const { user, isAuthenticated, updateUser } = useAuth();
    const { avatar } = useAvatar(user?.userId);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('info');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // ── Personal Info ──
    const [infoForm, setInfoForm] = useState({ fullName: '', address: '', city: '', district: '', ward: '' });
    const [infoSaving, setInfoSaving] = useState(false);

    // ── Password ──
    const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdSaving, setPwdSaving] = useState(false);
    const [showPwds, setShowPwds] = useState({ old: false, new_: false, confirm: false });

    // ── Contact OTP ──
    const [contactType, setContactType] = useState('email');
    const [newContactValue, setNewContactValue] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [contactSending, setContactSending] = useState(false);
    const [contactVerifying, setContactVerifying] = useState(false);

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
        if (!infoForm.fullName.trim()) { 
            toast.error('Vui lòng nhập họ và tên'); 
            return; 
        }
        setInfoSaving(true);
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
                toast.success('Cập nhật thông tin thành công!');
                updateUser({ fullName: infoForm.fullName });
                setProfile(p => ({ ...p, fullName: infoForm.fullName, address: infoForm.address, city: infoForm.city, district: infoForm.district, ward: infoForm.ward }));
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setInfoSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin'); 
            return;
        }
        if (pwdForm.newPassword.length < 6) { 
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); 
            return; 
        }
        if (pwdForm.newPassword !== pwdForm.confirmPassword) { 
            toast.error('Xác nhận mật khẩu không khớp'); 
            return; 
        }
        setPwdSaving(true);
        try {
            const res = await apiService.changePassword({
                userId: user.userId,
                oldPassword: pwdForm.oldPassword,
                newPassword: pwdForm.newPassword,
            });
            if (res.success) {
                toast.success('Đổi mật khẩu thành công!');
                setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setPwdSaving(false);
        }
    };

    const handleSendOtp = async () => {
        const val = newContactValue.trim();
        if (!val) { 
            toast.error(contactType === 'email' ? 'Vui lòng nhập email mới' : 'Vui lòng nhập số điện thoại mới'); 
            return; 
        }
        if (contactType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { 
            toast.error('Email không hợp lệ'); 
            return; 
        }
        if (contactType === 'phone' && !/^(0|\+84)[0-9]{8,10}$/.test(val)) { 
            toast.error('Số điện thoại không hợp lệ (vd: 0901234567)'); 
            return; 
        }
        setContactSending(true);
        try {
            const res = await apiService.sendOtpForContact({ userId: user.userId, contactType, newValue: val });
            if (res.success) { 
                setOtpStep(true); 
                setDevOtp(res.otpCode || ''); 
                toast.success('Mã OTP đã được gửi thành công');
            } else { 
                toast.error(res.message || 'Có lỗi xảy ra'); 
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
        } finally {
            setContactSending(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!/^\d{6}$/.test(otpCode)) { 
            toast.error('Mã OTP phải gồm 6 chữ số'); 
            return; 
        }
        setContactVerifying(true);
        try {
            const res = await apiService.updateContact({
                userId: user.userId,
                contactType,
                newValue: newContactValue.trim(),
                otpCode,
            });
            if (res.success) {
                toast.success(res.message || 'Cập nhật thành công!');
                setOtpStep(false); 
                setOtpCode(''); 
                setNewContactValue(''); 
                setDevOtp('');
                if (contactType === 'email') updateUser({ email: newContactValue.trim() });
                await loadProfile();
            } else {
                toast.error(res.message || 'Có lỗi xảy ra');
            }
        } catch {
            toast.error('Có lỗi xảy ra, vui lòng thử lại');
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
        if (digit && i < 5) {
            setTimeout(() => document.getElementById(`potp-${i + 1}`)?.focus(), 0);
        }
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
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
            <Navbar />
            
            <main className="flex-1 py-12 md:py-16">
                <div className="max-w-[1200px] mx-auto px-6 w-full">
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#8A8278] mb-8 pb-4 border-b border-[#E8E4DC]/60">
                        <Link to="/" className="hover:text-[#0D0D0D] transition-colors">Trang chủ</Link>
                        <span className="text-[#E8E4DC]">/</span>
                        <span className="text-[#0D0D0D] font-medium">Tài khoản của tôi</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
                        {/* ── Sidebar Left ── */}
                        <aside className="lg:col-span-1 bg-[#F5F2EC] p-8 flex flex-col items-center border border-[#E8E4DC] relative">
                            {/* Squircle Avatar */}
                            <div className="w-20 h-20 bg-[#0D0D0D] text-[#FDFBF7] flex items-center justify-center text-2xl font-bold rounded-[1.5rem] mb-4 shadow-sm select-none overflow-hidden border border-[#E8E4DC]">
                                {loading ? '?' : avatar ? (
                                    <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    getInitials(profile?.fullName || user?.fullName)
                                )}
                            </div>
                            <div className="text-sm font-semibold text-[#0d0d0d] text-center max-w-full truncate">{profile?.fullName || user?.fullName}</div>
                            <div className="text-[11px] text-[#8A8278] text-center max-w-full truncate mb-4">{profile?.email || user?.email}</div>
                            
                            <span className={`text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1 border mb-8 ${
                                profile?.role === 'Admin' 
                                    ? 'bg-[#C9A87C]/15 text-[#C9A87C] border-[#C9A87C]/30' 
                                    : 'bg-[#0D0D0D]/5 text-[#0d0d0d] border-[#0D0D0D]/10'
                            }`}>
                                {profile?.role === 'Admin' ? '⚙️ Quản trị viên' : '👤 Khách hàng'}
                            </span>

                            <nav className="w-full flex flex-col gap-1 border-t border-[#E8E4DC] pt-6">
                                <button
                                    className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                                        activeTab === 'info' 
                                            ? 'bg-[#0D0D0D] text-[#FDFBF7]' 
                                            : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40'
                                    }`}
                                    onClick={() => setActiveTab('info')}
                                >
                                    👤 Thông tin cá nhân
                                </button>
                                <button
                                    className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                                        activeTab === 'password' 
                                            ? 'bg-[#0D0D0D] text-[#FDFBF7]' 
                                            : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40'
                                    }`}
                                    onClick={() => setActiveTab('password')}
                                >
                                    🔒 Đổi mật khẩu
                                </button>
                                <button
                                    className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer ${
                                        activeTab === 'contact' 
                                            ? 'bg-[#0D0D0D] text-[#FDFBF7]' 
                                            : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40'
                                    }`}
                                    onClick={() => setActiveTab('contact')}
                                >
                                    📱 Đổi liên hệ
                                </button>
                                <Link 
                                    to="/my-orders" 
                                    className="w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40 transition-all"
                                >
                                    📦 Đơn hàng của tôi
                                </Link>
                            </nav>
                        </aside>

                        {/* ── Main content panel ── */}
                        <div className="lg:col-span-3">
                            {loading ? (
                                <div className="bg-white border border-[#E8E4DC] p-12 text-center flex flex-col items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-[#E8E4DC] border-t-[#0D0D0D] rounded-full animate-spin mb-3" />
                                    <p className="text-xs uppercase tracking-wider font-bold text-[#8A8278]">Đang tải thông tin tài khoản...</p>
                                </div>
                            ) : (
                                <div className="bg-white border border-[#E8E4DC] p-8 md:p-10 shadow-[0_2px_12px_rgba(13,13,13,0.03)] animate-fade-up">
                                    
                                    {/* ── TAB: Personal Info ── */}
                                    {activeTab === 'info' && (
                                        <div className="space-y-8">
                                            <div className="pb-4 border-b border-[#E8E4DC]">
                                                <h2 className="text-lg font-medium text-[#0D0D0D] uppercase tracking-wide">Thông tin cá nhân</h2>
                                                <p className="text-xs text-[#8A8278] mt-1">Cập nhật thông tin chi tiết và địa chỉ giao hàng của bạn</p>
                                            </div>

                                            {/* 3-column Read-only grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#F5F2EC]/40 border border-[#E8E4DC]">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#8A8278] font-bold">Tên đăng nhập</span>
                                                    <span className="block text-sm font-semibold text-[#0d0d0d]">{profile?.username}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#8A8278] font-bold">Email</span>
                                                    <span className="block text-sm font-semibold text-[#0d0d0d] truncate" title={profile?.email}>{profile?.email}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#8A8278] font-bold">Số điện thoại</span>
                                                    <span className="block text-sm font-semibold text-[#0d0d0d]">
                                                        {profile?.phoneNumber || <em className="text-[#8A8278] not-italic font-normal">Chưa cập nhật</em>}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <p className="text-xs text-[#8A8278]">
                                                💡 Để đổi email hoặc số điện thoại, vui lòng chọn tab{' '}
                                                <button className="text-[#C9A87C] font-semibold hover:underline cursor-pointer" onClick={() => setActiveTab('contact')}>
                                                    Đổi thông tin liên hệ
                                                </button>.
                                            </p>

                                            <div className="border-t border-[#E8E4DC]/60 pt-8 space-y-6">
                                                {/* Form Fields */}
                                                <div className="input-wrap">
                                                    <input
                                                        type="text"
                                                        className="input-field font-medium"
                                                        placeholder=" "
                                                        value={infoForm.fullName}
                                                        onChange={e => setInfoForm(p => ({ ...p, fullName: e.target.value }))}
                                                        required
                                                    />
                                                    <label className="floating-label">Họ và tên *</label>
                                                </div>

                                                <div className="space-y-6 pt-2">
                                                    <h3 className="text-xs uppercase tracking-widest font-bold text-[#C9A87C]">Địa chỉ giao hàng mặc định</h3>

                                                    <div className="input-wrap">
                                                        <input
                                                            type="text"
                                                            className="input-field"
                                                            placeholder=" "
                                                            value={infoForm.address}
                                                            onChange={e => setInfoForm(p => ({ ...p, address: e.target.value }))}
                                                        />
                                                        <label className="floating-label">Địa chỉ cụ thể (Số nhà, tên đường...)</label>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="input-wrap">
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                placeholder=" "
                                                                value={infoForm.city}
                                                                onChange={e => setInfoForm(p => ({ ...p, city: e.target.value }))}
                                                            />
                                                            <label className="floating-label">Tỉnh / Thành phố</label>
                                                        </div>
                                                        <div className="input-wrap">
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                placeholder=" "
                                                                value={infoForm.district}
                                                                onChange={e => setInfoForm(p => ({ ...p, district: e.target.value }))}
                                                            />
                                                            <label className="floating-label">Quận / Huyện</label>
                                                        </div>
                                                        <div className="input-wrap">
                                                            <input
                                                                type="text"
                                                                className="input-field"
                                                                placeholder=" "
                                                                value={infoForm.ward}
                                                                onChange={e => setInfoForm(p => ({ ...p, ward: e.target.value }))}
                                                            />
                                                            <label className="floating-label">Phường / Xã</label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    className="w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                    onClick={handleSaveInfo}
                                                    disabled={infoSaving}
                                                >
                                                    {infoSaving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB: Change Password ── */}
                                    {activeTab === 'password' && (
                                        <div className="space-y-8 max-w-md">
                                            <div className="pb-4 border-b border-[#E8E4DC]">
                                                <h2 className="text-lg font-medium text-[#0D0D0D] uppercase tracking-wide">Đổi mật khẩu</h2>
                                                <p className="text-xs text-[#8A8278] mt-1">Đảm bảo mật khẩu của bạn có độ dài từ 6 ký tự trở lên để tăng tính bảo mật</p>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="input-wrap">
                                                    <input
                                                        type={showPwds.old ? 'text' : 'password'}
                                                        className="input-field pr-10 font-mono"
                                                        placeholder=" "
                                                        value={pwdForm.oldPassword}
                                                        onChange={e => setPwdForm(p => ({ ...p, oldPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <label className="floating-label">Mật khẩu hiện tại *</label>
                                                    <button
                                                        type="button"
                                                        className="absolute right-0 bottom-2 text-[#8A8278] hover:text-[#0d0d0d] transition-colors cursor-pointer text-sm"
                                                        onClick={() => setShowPwds(p => ({ ...p, old: !p.old }))}
                                                    >
                                                        {showPwds.old ? '🙈' : '👁️'}
                                                    </button>
                                                </div>

                                                <div className="input-wrap">
                                                    <input
                                                        type={showPwds.new_ ? 'text' : 'password'}
                                                        className="input-field pr-10 font-mono"
                                                        placeholder=" "
                                                        value={pwdForm.newPassword}
                                                        onChange={e => setPwdForm(p => ({ ...p, newPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <label className="floating-label">Mật khẩu mới *</label>
                                                    <button
                                                        type="button"
                                                        className="absolute right-0 bottom-2 text-[#8A8278] hover:text-[#0d0d0d] transition-colors cursor-pointer text-sm"
                                                        onClick={() => setShowPwds(p => ({ ...p, new_: !p.new_ }))}
                                                    >
                                                        {showPwds.new_ ? '🙈' : '👁️'}
                                                    </button>
                                                    
                                                    {/* Password strength meter */}
                                                    {pwdStrength && (
                                                        <div className="mt-2.5 flex items-center justify-between gap-3">
                                                            <div className="flex-1 h-1 bg-[#E8E4DC] relative">
                                                                <div className={`h-full transition-all duration-300 ${
                                                                    pwdStrength === 'strong' ? 'bg-emerald-600 w-full' :
                                                                    pwdStrength === 'medium' ? 'bg-[#C9A87C] w-2/3' : 'bg-red-500 w-1/3'
                                                                }`} />
                                                            </div>
                                                            <span className={`text-[10px] uppercase tracking-wider font-bold ${
                                                                pwdStrength === 'strong' ? 'text-emerald-600' :
                                                                pwdStrength === 'medium' ? 'text-[#C9A87C]' : 'text-red-500'
                                                            }`}>{pwdStrengthLabel}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="input-wrap">
                                                    <input
                                                        type={showPwds.confirm ? 'text' : 'password'}
                                                        className="input-field pr-10 font-mono"
                                                        placeholder=" "
                                                        value={pwdForm.confirmPassword}
                                                        onChange={e => setPwdForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                                        required
                                                    />
                                                    <label className="floating-label">Xác nhận mật khẩu mới *</label>
                                                    <button
                                                        type="button"
                                                        className="absolute right-0 bottom-2 text-[#8A8278] hover:text-[#0d0d0d] transition-colors cursor-pointer text-sm"
                                                        onClick={() => setShowPwds(p => ({ ...p, confirm: !p.confirm }))}
                                                    >
                                                        {showPwds.confirm ? '🙈' : '👁️'}
                                                    </button>
                                                    {pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                                                        <span className="text-red-500 text-[10px] mt-1.5 block">Xác nhận mật khẩu mới không trùng khớp</span>
                                                    )}
                                                </div>

                                                <button
                                                    className="w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                    onClick={handleChangePassword}
                                                    disabled={pwdSaving}
                                                >
                                                    {pwdSaving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── TAB: Change Contact ── */}
                                    {activeTab === 'contact' && (
                                        <div className="space-y-8">
                                            <div className="pb-4 border-b border-[#E8E4DC]">
                                                <h2 className="text-lg font-medium text-[#0D0D0D] uppercase tracking-wide">Đổi thông tin liên hệ</h2>
                                                <p className="text-xs text-[#8A8278] mt-1">Để thay đổi email hoặc số điện thoại, bạn cần xác minh qua mã OTP 6 chữ số</p>
                                            </div>

                                            {/* Current Contacts */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[#F5F2EC]/40 border border-[#E8E4DC]">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#8A8278] font-bold">Email hiện tại</span>
                                                    <span className="block text-sm font-semibold text-[#0d0d0d]">{profile?.email}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <span className="text-[9px] uppercase tracking-wider text-[#8A8278] font-bold">Số điện thoại hiện tại</span>
                                                    <span className="block text-sm font-semibold text-[#0d0d0d]">
                                                        {profile?.phoneNumber || <em className="text-[#8A8278] not-italic font-normal">Chưa liên kết số điện thoại</em>}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="max-w-md space-y-6">
                                                {!otpStep ? (
                                                    <>
                                                        <div className="flex border border-[#E8E4DC] mb-6">
                                                            <button
                                                                className={`w-1/2 py-3 text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                                                    contactType === 'email' ? 'bg-[#0D0D0D] text-[#FDFBF7]' : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40'
                                                                }`}
                                                                onClick={() => { setContactType('email'); setNewContactValue(''); }}
                                                            >
                                                                Đổi địa chỉ Email
                                                            </button>
                                                            <button
                                                                className={`w-1/2 py-3 text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-all ${
                                                                    contactType === 'phone' ? 'bg-[#0D0D0D] text-[#FDFBF7]' : 'text-[#8A8278] hover:text-[#0D0D0D] hover:bg-[#F5F2EC]/40'
                                                                }`}
                                                                onClick={() => { setContactType('phone'); setNewContactValue(''); }}
                                                            >
                                                                Đổi Số điện thoại
                                                            </button>
                                                        </div>

                                                        <div className="input-wrap">
                                                            <input
                                                                type={contactType === 'email' ? 'email' : 'tel'}
                                                                className="input-field font-medium"
                                                                placeholder=" "
                                                                value={newContactValue}
                                                                onChange={e => setNewContactValue(e.target.value)}
                                                                required
                                                            />
                                                            <label className="floating-label">
                                                                {contactType === 'email' ? 'Nhập Email mới *' : 'Nhập Số điện thoại mới *'}
                                                            </label>
                                                        </div>

                                                        <button
                                                            className="w-full py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer"
                                                            onClick={handleSendOtp}
                                                            disabled={contactSending}
                                                        >
                                                            {contactSending ? 'Đang gửi mã...' : 'Gửi mã xác nhận OTP'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="space-y-6">
                                                        <div className="space-y-1">
                                                            <h4 className="text-[11px] uppercase tracking-wider font-bold text-[#0D0D0D]">Xác minh OTP</h4>
                                                            <p className="text-xs text-[#8A8278]">Mã OTP 6 số đã được gửi đến <span className="font-semibold text-[#0d0d0d]">{newContactValue}</span></p>
                                                        </div>

                                                        {/* OTP Box Inputs */}
                                                        <div className="flex justify-center gap-3 py-4">
                                                            {[0, 1, 2, 3, 4, 5].map(i => (
                                                                <input
                                                                    key={i}
                                                                    id={`potp-${i}`}
                                                                    type="text"
                                                                    inputMode="numeric"
                                                                    maxLength="1"
                                                                    className="w-12 h-14 text-center text-lg font-semibold bg-white border border-[#E8E4DC] focus:outline-none focus:border-[#0D0D0D] transition-colors"
                                                                    value={otpCode[i] || ''}
                                                                    onChange={e => handleOtpInput(i, e.target.value)}
                                                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                                                />
                                                            ))}
                                                        </div>

                                                        {devOtp && (
                                                            <div className="p-3 bg-[#FDF4E3] border border-[#E8D5BC] text-[#B27B13] text-[11px] tracking-wide font-mono text-center">
                                                                [DEVELOPMENT ONLY] Mã OTP giả định là: <strong>{devOtp}</strong>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4">
                                                            <button
                                                                className="w-1/2 py-3.5 border border-[#0d0d0d] text-[#0d0d0d] hover:bg-[#F5F2EC] text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
                                                                onClick={() => { setOtpStep(false); setOtpCode(''); setDevOtp(''); }}
                                                            >
                                                                Quay lại
                                                            </button>
                                                            <button
                                                                className="w-1/2 py-3.5 bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D] text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer text-center disabled:opacity-50"
                                                                onClick={handleVerifyOtp}
                                                                disabled={contactVerifying || otpCode.length < 6}
                                                            >
                                                                {contactVerifying ? 'Đang xác thực...' : 'Xác nhận OTP'}
                                                            </button>
                                                        </div>

                                                        <button
                                                            className="w-full text-center text-[10px] font-bold uppercase tracking-wider text-[#8A8278] hover:text-[#0D0D0D] transition-colors cursor-pointer mt-4"
                                                            onClick={handleSendOtp}
                                                            disabled={contactSending}
                                                        >
                                                            {contactSending ? 'Đang gửi lại OTP...' : '🔄 Gửi lại mã OTP'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
