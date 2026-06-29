// src/pages/admin/AdminAuth.jsx — Executive Security & Account Cockpit (Tailwind v4)
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/admin/ui';
import { useAvatar } from '../../hooks/useAvatar';
import toast from 'react-hot-toast';

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-xs ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0 mb-4">{children}</h3>
);

const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5 font-mono">
    {children}{required && <span className="text-rose-600 ml-1">*</span>}
  </label>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-black transition-all font-['Outfit'] ${className}`}
  />
);

const Btn = ({ children, onClick, type = 'button', variant = 'primary', disabled }) => {
  const v = {
    primary: 'bg-[#0D0D0D] text-white hover:bg-[#C9A87C] hover:text-black shadow-xs',
    outline: 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100 shadow-2xs',
    danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider cursor-pointer border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${v[variant] || v.primary}`}
    >
      {children}
    </button>
  );
};

const Alert = ({ type, children }) => {
  const cfg = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-zinc-50 text-zinc-800 border-zinc-200',
  };
  return (
    <div className={`p-4 rounded-xl border text-xs leading-relaxed mb-5 font-medium ${cfg[type] || cfg.info}`}>
      {children}
    </div>
  );
};

const SESSIONS = [
  { device: 'Trình duyệt hiện tại (Active Session)', ip: '127.0.0.1', location: 'Hệ thống nội bộ', time: 'Đang hoạt động', current: true },
];

const AdminAuth = () => {
  const { user } = useAuth();
  const { avatar, setAvatar } = useAvatar(user?.userId);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const [tab, setTab]         = useState('profile');
  const [profile, setProfile] = useState({ fullName: user?.fullName || 'Admin Executive', email: user?.email || 'admin@furnitureshop.vn', phone: user?.phoneNumber || '0901234567' });
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw]   = useState({});
  const [twoFA, setTwoFA]     = useState(false);
  const [sessions, setSessions] = useState(SESSIONS);
  const [loading, setLoading] = useState(false);

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

  const saveProfile = (e) => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('Đã Cập Nhật Hồ Sơ Quản Trị Viên!'); }, 600);
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { toast.error('Mật khẩu xác nhận không khớp'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success('Đổi Mật Khẩu Khóa Bảo Mật Thành Công!'); setPwForm({ current: '', next: '', confirm: '' }); }, 600);
  };

  const revokeSession = (idx) => {
    setSessions(prev => prev.filter((_, i) => i !== idx));
    toast.success('Đã thu hồi quyền truy cập phiên đăng nhập');
  };

  const tabs = [
    { id: 'profile', label: '👤 Hồ Sơ Quản Trị' },
    { id: 'security', label: '🔒 Đổi Mật Khẩu' },
    { id: 'twofa', label: '🛡️ Xác Thực 2 Bước' },
    { id: 'sessions', label: '💻 Thiết Bị Đăng Nhập' },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Phân Quyền Admin" 
        subtitle="Quản lý hồ sơ cá nhân, đổi mật khẩu bảo mật và kiểm soát phiên làm việc"
        breadcrumb={['Admin', 'Hệ thống', 'Phân quyền Admin']}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="md:col-span-1 flex md:flex-col gap-1.5 overflow-x-auto bg-white p-2 rounded-2xl border border-zinc-200/80 shadow-xs h-fit select-none">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`w-full px-4 py-3 rounded-xl text-xs font-semibold text-left uppercase tracking-wider transition-all cursor-pointer border-none ${
                tab === t.id ? 'bg-[#0D0D0D] text-white shadow-xs' : 'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-black'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Pane */}
        <Card className="md:col-span-3 min-h-[400px]">
          {/* Hồ Sơ */}
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-5 max-w-lg">
              <SectionTitle>Thông Tin Cá Nhân Quản Trị Viên</SectionTitle>

              {/* Avatar Section */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 mb-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[#0D0D0D] text-[#C9A87C] font-mono font-bold flex items-center justify-center text-2xl shadow-md overflow-hidden border-2 border-[#C9A87C]/30 flex-shrink-0 relative group">
                  {avatar ? (
                    <img src={avatar} alt="Admin Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (profile.fullName || 'A')[0].toUpperCase()
                  )}
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
                    {avatar && (
                      <button
                        type="button"
                        onClick={() => { setAvatar(null); toast.success('Đã xoá ảnh đại diện về mặc định'); }}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-semibold uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                      >
                        🗑️ Xoá ảnh
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Hoặc dán URL hình ảnh..."
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-black font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 text-zinc-800 text-[11px] font-semibold hover:bg-black hover:text-white transition-all cursor-pointer whitespace-nowrap"
                    >
                      Dán URL
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <Label required>Họ Và Tên Khai Sinh</Label>
                <Input value={profile.fullName} onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))} required />
              </div>
              <div>
                <Label required>Địa Chỉ Email Định Danh</Label>
                <Input type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} required />
              </div>
              <div>
                <Label>Số Điện Thoại Liên Hệ Nhanh</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="pt-2">
                <Btn type="submit" disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}</Btn>
              </div>
            </form>
          )}

          {/* Đổi Mật Khẩu */}
          {tab === 'security' && (
            <form onSubmit={changePassword} className="space-y-4 max-w-md">
              <SectionTitle>Cập Nhật Khóa Mật Khẩu</SectionTitle>
              {[['current', 'Mật Khẩu Hiện Tại'], ['next', 'Mật Khẩu Mới'], ['confirm', 'Xác Nhận Mật Khẩu Mới']].map(([k, l]) => (
                <div key={k}>
                  <Label required>{l}</Label>
                  <div className="relative">
                    <Input type={showPw[k] ? 'text' : 'password'} value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))} required className="pr-10" />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [k]: !p[k] }))} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-zinc-400 text-sm">
                      {showPw[k] ? '🙈' : '👁️'}
                    </button>
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

          {/* 2FA */}
          {tab === 'twofa' && (
            <div className="space-y-6 max-w-xl">
              <SectionTitle>Xác Thực 2 Bước (2FA)</SectionTitle>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-900">Mã Hóa Ứng Dụng OTP</div>
                  <div className="text-[11px] text-zinc-500 font-light mt-0.5">Sử dụng Google Authenticator hoặc Authy</div>
                </div>
                <button
                  onClick={() => setTwoFA(!twoFA)}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative border-none ${twoFA ? 'bg-[#0D0D0D]' : 'bg-zinc-300'}`}
                >
                  <span className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-md ${twoFA ? 'left-6.5 bg-[#C9A87C]' : 'left-0.5'}`} />
                </button>
              </div>

              {twoFA ? (
                <Alert type="success">🛡️ Khóa 2FA đang kích hoạt. Hệ thống ghi nhận lớp bảo vệ cao nhất.</Alert>
              ) : (
                <Alert type="info">⚠️ Khóa 2FA đang tắt. Khuyến nghị bật xác thực 2 bước để ngăn chặn truy cập trái phép.</Alert>
              )}

              <div className="space-y-3">
                {[
                  { icon: '📱', title: 'Google Authenticator', sub: 'Quét mã QR trực tiếp từ ứng dụng di động' },
                  { icon: '💬', title: 'SMS OTP OTP', sub: 'Nhận tin nhắn chứa mã xác thực qua số điện thoại đăng ký' },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3.5 p-3.5 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-zinc-900">{item.title}</div>
                      <div className="text-[11px] text-zinc-500 font-light mt-0.5 truncate">{item.sub}</div>
                    </div>
                    <Btn variant="outline">Cấu hình</Btn>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sessions */}
          {tab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <SectionTitle>Thiết Bị Ghi Nhận Phiên Hoạt Động</SectionTitle>
                <Btn variant="danger" onClick={() => setSessions(prev => prev.filter(s => s.current))}>Đăng xuất thiết bị lạ</Btn>
              </div>

              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${s.current ? 'bg-zinc-50 border-black' : 'bg-white border-zinc-200'}`}>
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-lg flex-shrink-0 font-bold">
                      {s.device.includes('iPhone') ? '📱' : '💻'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{s.device}</span>
                        {s.current && <span className="px-2 py-0.5 rounded bg-black text-[#C9A87C] font-mono text-[9px] font-bold uppercase tracking-wider">Thiết bị này</span>}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 mt-0.5">{s.ip} • {s.location} • {s.time}</div>
                    </div>
                    {!s.current && <Btn variant="danger" onClick={() => revokeSession(i)}>Thu hồi</Btn>}
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
