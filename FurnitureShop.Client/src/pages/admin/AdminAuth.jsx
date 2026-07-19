// src/pages/admin/AdminAuth.jsx — Executive Security & Account Cockpit (Tailwind v4)
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/admin/ui';
import { useAvatar } from '../../hooks/useAvatar';
import toast from 'react-hot-toast';
import apiService from '../../services/apiService';

const Card = ({ children, className = '' }) => <div className={`bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs ${className}`}>{children}</div>;
const SectionTitle = ({ children }) => <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0 mb-4">{children}</h3>;
const Label = ({ children, required }) => <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 font-mono">{children}{required && <span className="text-rose-600 ml-1">*</span>}</label>;
const Input = ({ className = '', ...props }) => <input {...props} className={`w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-black transition-all font-['Outfit'] ${className}`} />;

const Btn = ({ children, onClick, type = 'button', variant = 'primary', disabled }) => {
  const v = {
    primary: 'bg-[#0D0D0D] text-white hover:bg-[#C9A87C] hover:text-black shadow-xs',
    outline: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 shadow-2xs',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white',
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${v[variant] || v.primary}`}>{children}</button>;
};

const Alert = ({ type, children }) => {
  const cfg = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-zinc-50 text-zinc-800 border-zinc-200',
  };
  return <div className={`p-4 rounded-xl border text-xs leading-relaxed mb-5 font-medium ${cfg[type] || cfg.info}`}>{children}</div>;
};

const AdminAuth = () => {
  const { user, updateUser } = useAuth();
  const { avatar, setAvatar } = useAvatar(user?.userId);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [tab, setTab] = useState('profile');
  const [profile, setProfile] = useState({ fullName: '', email: '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({});
  const [twoFA, setTwoFA] = useState(false);
  const [securitySupported, setSecuritySupported] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.userId) return;

    let active = true;

    apiService.request(`/auth/profile/${user.userId}`, { method: 'GET' }).then(res => {
      if (!active) return;
      const data = res.data || res;
      if (res.success && data) {
        setProfile({ fullName: data.fullName || '', email: data.email || '', phone: data.phoneNumber || data.phone || '' });
      } else {
        setProfile({ fullName: '', email: '', phone: '' });
      }
      setProfileLoading(false);
    }).catch(() => {
      if (!active) return;
      setProfile({ fullName: '', email: '', phone: '' });
      setProfileLoading(false);
    });

    apiService.request(`/admin-operations/security/${user.userId}`, { method: 'GET' }).then(res => {
      if (!active) return;
      if (res.success && res.data) {
        setTwoFA(Boolean(res.data.twoFactorEnabled));
        setSessions(Array.isArray(res.data.sessions) ? res.data.sessions : []);
        setSecuritySupported(true);
      } else {
        setTwoFA(false);
        setSessions([]);
        setSecuritySupported(false);
      }
      setSecurityLoading(false);
    }).catch(() => {
      if (!active) return;
      setTwoFA(false);
      setSessions([]);
      setSecuritySupported(false);
      setSecurityLoading(false);
    });

    return () => { active = false; };
  }, [user?.userId]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target.result);
      toast.success('Đã cập nhật ảnh đại diện Admin!');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (!avatarUrlInput.trim()) {
      toast.error('Vui lòng nhập đường dẫn URL hợp lệ');
      return;
    }
    setAvatar(avatarUrlInput.trim());
    setAvatarUrlInput('');
    toast.success('Đã cập nhật ảnh đại diện Admin!');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user?.userId) return;
    setLoading(true);
    const res = await apiService.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId: user.userId, fullName: profile.fullName, email: profile.email, phoneNumber: profile.phone }),
    });
    setLoading(false);
    if (res.success) {
      updateUser({ fullName: profile.fullName, email: profile.email, phoneNumber: profile.phone });
      toast.success('Đã cập nhật hồ sơ quản trị viên');
    } else {
      toast.error(res.message || 'Không thể cập nhật hồ sơ');
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    if (pwForm.next.length < 6) { toast.error('Mật khẩu mới phải có ít nhất 6 ký tự'); return; }
    if (!user?.userId) return;
    setLoading(true);
    const res = await apiService.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ userId: user.userId, oldPassword: pwForm.current, newPassword: pwForm.next }),
    });
    setLoading(false);
    if (res.success) {
      toast.success('Đổi mật khẩu thành công');
      setPwForm({ current: '', next: '', confirm: '' });
    } else {
      toast.error(res.message || 'Không thể đổi mật khẩu');
    }
  };

  const revokeSession = async (sessionId) => {
    if (!user?.userId) return;
    const res = await apiService.request(`/admin-operations/security/${user.userId}/sessions/${sessionId}`, { method: 'DELETE' });
    if (res.success) {
      setSessions(prev => prev.filter(s => String(s.id) !== String(sessionId)));
      toast.success('Đã thu hồi quyền truy cập phiên đăng nhập');
    } else {
      toast.error(res.message || 'Không thể thu hồi phiên đăng nhập');
    }
  };

  const toggleTwoFactor = async () => {
    if (!user?.userId) return;
    if (!securitySupported) {
      toast.error('Chức năng 2FA chưa được backend hỗ trợ đầy đủ');
      return;
    }
    const enabled = !twoFA;
    const res = await apiService.request(`/admin-operations/security/${user.userId}/two-factor`, {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    });
    if (res.success) {
      setTwoFA(enabled);
      toast.success(enabled ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước');
    } else {
      toast.error(res.message || 'Không thể cập nhật 2FA');
    }
  };

  const tabs = [
    { id: 'profile', label: '👤 Hồ Sơ Quản Trị' },
    { id: 'security', label: '🔒 Đổi Mật Khẩu' },
    { id: 'twofa', label: '🛡️ Xác Thực 2 Bước' },
    { id: 'sessions', label: '💻 Thiết Bị Đăng Nhập' },
  ];

  const otherSessions = sessions.filter(s => !s.current);

  return (
    <AdminLayout>
      <PageHeader
        title="Phân Quyền Admin"
        subtitle="Quản lý hồ sơ cá nhân, đổi mật khẩu bảo mật và kiểm soát phiên làm việc"
        breadcrumb={['Admin', 'Hệ thống', 'Phân quyền Admin']}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex md:flex-col gap-1.5 overflow-x-auto bg-white p-2 rounded-2xl border border-zinc-200/80 shadow-xs h-fit select-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold text-left uppercase tracking-wider transition-all cursor-pointer border-none ${tab === t.id ? 'bg-[#0D0D0D] text-white shadow-xs' : 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Card className="md:col-span-3 min-h-[400px]">
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-5 max-w-lg">
              <SectionTitle>Thông Tin Cá Nhân Quản Trị Viên</SectionTitle>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 mb-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#0D0D0D] text-[#C9A87C] font-mono font-bold flex items-center justify-center text-2xl shadow-md overflow-hidden border-2 border-[#C9A87C]/30 flex-shrink-0 relative group">
                  {avatar ? <img src={avatar} alt="Admin Avatar" className="w-full h-full object-cover" /> : (profile.fullName || user?.fullName || 'A')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <div className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Ảnh Đại Diện Admin</div>
                    <div className="text-[11px] text-zinc-500 font-light mt-0.5">Tải lên file ảnh (tối đa 2MB) hoặc dán đường dẫn URL</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-1.5 rounded-xl bg-[#0D0D0D] text-white text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#C9A87C] hover:text-black transition-all shadow-2xs">
                      📁 Tải ảnh lên
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                    {avatar && <button type="button" onClick={() => { setAvatar(null); toast.success('Đã xoá ảnh đại diện về mặc định'); }} className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all cursor-pointer">🗑️ Xoá ảnh</button>}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input type="text" placeholder="Hoặc dán URL hình ảnh..." value={avatarUrlInput} onChange={(e) => setAvatarUrlInput(e.target.value)} className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-black font-mono" />
                    <button type="button" onClick={handleApplyUrl} className="px-3 py-1.5 rounded-xl bg-zinc-200 text-zinc-800 text-[11px] font-semibold hover:bg-black hover:text-white transition-all cursor-pointer whitespace-nowrap">Dán URL</button>
                  </div>
                </div>
              </div>

              <div>
                <Label required>Họ Và Tên Khai Sinh</Label>
                <Input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} required disabled={profileLoading} placeholder={profileLoading ? 'Đang tải...' : ''} />
              </div>
              <div>
                <Label required>Địa Chỉ Email Định Danh</Label>
                <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} required disabled={profileLoading} placeholder={profileLoading ? 'Đang tải...' : ''} />
              </div>
              <div>
                <Label>Số Điện Thoại Liên Hệ Nhanh</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} disabled={profileLoading} placeholder={profileLoading ? 'Đang tải...' : ''} />
              </div>
              <div className="pt-2">
                <Btn type="submit" disabled={loading || profileLoading}>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</Btn>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <SectionTitle>Cập Nhật Khóa Mật Khẩu</SectionTitle>
              {[
                ['current', 'Mật Khẩu Hiện Tại'],
                ['next', 'Mật Khẩu Mới'],
                ['confirm', 'Xác Nhận Mật Khẩu Mới'],
              ].map(([k, l]) => (
                <div key={k}>
                  <Label required>{l}</Label>
                  <div className="relative">
                    <Input type={showPw[k] ? 'text' : 'password'} value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))} required className="pr-10" />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-zinc-400 text-sm">{showPw[k] ? '🙈' : '👁️'}</button>
                  </div>
                </div>
              ))}

              <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200/60 text-xs text-zinc-600 space-y-1.5 font-light">
                <strong className="text-zinc-900 block font-semibold mb-1">Quy chuẩn an toàn khóa bảo mật:</strong>
                <p className="m-0 text-emerald-600 flex items-center gap-1.5"><span>✓</span> Chiều dài tối thiểu 8 ký tự</p>
                <p className="m-0 text-emerald-600 flex items-center gap-1.5"><span>✓</span> Tích hợp chữ hoa, chữ thường và chữ số</p>
              </div>

              <div className="pt-2">
                <Btn type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Cập Nhật Mật Khẩu'}</Btn>
              </div>
            </form>
          )}

          {tab === 'twofa' && (
            <div className="space-y-6 max-w-xl">
              <SectionTitle>Xác Thực 2 Bước (2FA)</SectionTitle>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Mã Hóa Ứng Dụng OTP</div>
                  <div className="text-[11px] text-zinc-500 font-light mt-0.5">Sử dụng Google Authenticator hoặc Authy</div>
                </div>
                <button
                  onClick={toggleTwoFactor}
                  disabled={!securitySupported || securityLoading}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative border-none disabled:opacity-50 ${twoFA ? 'bg-[#0D0D0D]' : 'bg-zinc-300'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${twoFA ? 'left-6.5 bg-[#C9A87C]' : 'left-0.5'}`} />
                </button>
              </div>

              {twoFA ? <Alert type="success">🛡️ Khóa 2FA đang kích hoạt. Hệ thống ghi nhận lớp bảo vệ cao hơn.</Alert> : <Alert type="info">⚠️ Khóa 2FA đang tắt. Khuyến nghị bật xác thực 2 bước để ngăn chặn truy cập trái phép.</Alert>}

              <div className="space-y-3">
                {[
                  { icon: '📱', title: 'Google Authenticator', sub: securitySupported ? 'Quét mã QR trực tiếp từ ứng dụng di động' : 'Chưa được backend hỗ trợ đầy đủ' },
                  { icon: '💬', title: 'SMS OTP', sub: 'Nhận tin nhắn chứa mã xác thực qua số điện thoại đăng ký' },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-zinc-900">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 font-light mt-0.5 truncate">{item.sub}</div>
                    </div>
                    <Btn variant="outline" disabled>Chưa hỗ trợ</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <SectionTitle>Thiết Bị Ghi Nhận Phiên Hoạt Động</SectionTitle>
                <Btn
                  variant="danger"
                  disabled={!otherSessions.length}
                  onClick={async () => {
                    if (!otherSessions.length) return;
                    const results = await Promise.all(otherSessions.map(s => apiService.request(`/admin-operations/security/${user.userId}/sessions/${s.id}`, { method: 'DELETE' })));
                    if (results.every(r => r.success)) {
                      setSessions(prev => prev.filter(s => s.current));
                      toast.success('Đã đăng xuất các thiết bị lạ');
                    } else {
                      toast.error('Không thể thu hồi toàn bộ phiên đăng nhập');
                    }
                  }}
                >
                  Đăng xuất thiết bị lạ
                </Btn>
              </div>

              <div className="space-y-3">
                {sessions.length === 0 && <div className="text-xs text-zinc-400 font-mono">Không có phiên đăng nhập nào được trả về từ API.</div>}
                {sessions.map((s, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${s.current ? 'bg-zinc-50 border-black' : 'bg-white border-zinc-200'}`}>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg flex-shrink-0 font-bold">{String(s.device || '').includes('Phone') || String(s.device || '').includes('Điện thoại') ? '📱' : '💻'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{s.device || 'Thiết bị không xác định'}</span>
                        {s.current && <span className="px-2 py-0.5 rounded bg-black text-[#C9A87C] font-mono text-[9px] font-bold uppercase tracking-wider">Thiết bị này</span>}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">{s.ip || 'N/A'} • {s.location || 'N/A'} • {s.time ? new Date(s.time).toLocaleString('vi-VN') : 'N/A'}</div>
                    </div>
                    {!s.current && <Btn variant="danger" onClick={() => revokeSession(s.id)}>Thu hồi</Btn>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAuth;
