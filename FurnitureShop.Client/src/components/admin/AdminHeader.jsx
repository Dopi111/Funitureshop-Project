// src/components/admin/AdminHeader.jsx
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import apiClient from '../../utils/apiClient';
import { useAvatar } from '../../hooks/useAvatar';

/* ── Click-outside hook ─────────────────────── */
function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

/* ── Icon button ─────────────────────────────── */
const IconBtn = ({ children, title, onClick, badge, active }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`relative flex items-center justify-center w-9 h-9 rounded-xl border transition-all cursor-pointer ${
      active
        ? 'border-[#0D0D0D] bg-[#0D0D0D] text-white shadow-xs'
        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 hover:text-black shadow-2xs'
    }`}
  >
    {children}
    {badge > 0 && (
      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center border-2 border-white leading-none shadow-xs animate-pulse">
        {badge}
      </span>
    )}
  </button>
);

/* ── Command Palette Items ───────────────────── */
const COMMAND_ITEMS = [
  { id: 'overview', category: 'Trang quản trị', name: 'Tổng quan Executive', path: '/admin', icon: '📊' },
  { id: 'orders', category: 'Trang quản trị', name: 'Quản lý Đơn hàng', path: '/admin/orders', icon: '🛒' },
  { id: 'inventory', category: 'Trang quản trị', name: 'Sản phẩm Nội thất (Kho)', path: '/admin/inventory', icon: '🛋️' },
  { id: 'stockin', category: 'Trang quản trị', name: 'Lập Phiếu Nhập Kho', path: '/admin/stockin', icon: '📥' },
  { id: 'promotions', category: 'Trang quản trị', name: 'Khuyến mãi & Coupon', path: '/admin/promotions', icon: '🏷️' },
  { id: 'users', category: 'Trang quản trị', name: 'Khách hàng Thành viên', path: '/admin/users', icon: '👥' },
  { id: 'suppliers', category: 'Trang quản trị', name: 'Đối tác Cung cấp', path: '/admin/suppliers', icon: '🤝' },
  { id: 'delivery', category: 'Trang quản trị', name: 'Vận chuyển & Lắp ráp', path: '/admin/delivery', icon: '🚚' },
  { id: 'tickets', category: 'Trang quản trị', name: 'Yêu cầu & Khiếu nại (Tickets)', path: '/admin/tickets', icon: '🎫' },
  { id: 'auditlogs', category: 'Trang quản trị', name: 'Nhật ký Hoạt động (Audit Logs)', path: '/admin/auditlogs', icon: '📝' },
  { id: 'auth', category: 'Hệ thống', name: 'Phân quyền Admin', path: '/admin/auth', icon: '🔐' },
  { id: 'settings', category: 'Hệ thống', name: 'Cài đặt Hệ thống', path: '/admin/settings', icon: '⚙️' },
];

/* ── Command Palette Modal ───────────────────── */
const QuickSearchModal = ({ onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = COMMAND_ITEMS.filter(item =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[99999] bg-zinc-950/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-fade-in font-['Outfit'] select-none">
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-200 overflow-hidden animate-scale-up flex flex-col">
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 bg-zinc-50/80">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && filtered.length > 0) {
                onSelect(filtered[0].path);
              }
            }}
            placeholder="Tìm kiếm trang quản trị, lệnh nhanh... (Nhấn Enter để chọn)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-800 placeholder:text-zinc-400 font-medium"
          />
          <button type="button" onClick={onClose} className="text-[10px] font-mono font-bold bg-zinc-200 hover:bg-zinc-300 text-zinc-600 px-2 py-1 rounded cursor-pointer border-none">ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">Không tìm thấy kết quả phù hợp cho "{query}"</div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => onSelect(item.path)}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#0D0D0D] hover:text-white group transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span className="font-semibold text-zinc-800 group-hover:text-white">{item.name}</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-300 bg-zinc-100 group-hover:bg-zinc-800 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Phím tắt <kbd className="font-mono font-bold bg-zinc-200 text-zinc-600 px-1 rounded">⌘K</kbd> / <kbd className="font-mono font-bold bg-zinc-200 text-zinc-600 px-1 rounded">Ctrl+K</kbd></span>
          <span>Click hoặc nhấn Enter để mở trang</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ── Notifications panel ─────────────────────── */
const NotifPanel = ({ notifs, onSelectNotif, onViewAll }) => {
  const unreadCount = notifs.filter(n => !n.read).length;
  return (
    <div className="w-80 sm:w-96 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden font-['Outfit'] animate-fade-down">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/80">
        <span className="font-bold text-sm uppercase tracking-wider text-[#0D0D0D]">Thông báo hệ thống</span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0D0D0D] text-[#FDFBF7] px-2 py-0.5 rounded-full">
          {unreadCount} Mới
        </span>
      </div>
      <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 font-light">Không có thông báo mới nào</div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => onSelectNotif(n)}
              className={`flex items-start gap-3.5 px-5 py-3.5 transition-colors cursor-pointer hover:bg-zinc-100/80 ${n.read ? 'bg-white' : 'bg-amber-50/40'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-mono font-bold ${n.avatarBg} ${n.avatarColor}`}>
                {n.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="m-0 text-xs font-semibold text-zinc-900 truncate">{n.name}</p>
                <p className="m-0 text-xs text-zinc-600 mt-0.5 font-light">{n.action}</p>
                <span className="text-[10px] font-mono text-zinc-400 mt-1 block">{n.time}</span>
              </div>
              {!n.read && <span className="w-2 h-2 rounded-full bg-[#C9A87C] mt-2 flex-shrink-0 shadow-2xs" />}
            </div>
          ))
        )}
      </div>
      <div className="p-3 border-t border-zinc-100 text-center bg-zinc-50/50">
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold uppercase tracking-wider text-zinc-600 hover:text-black cursor-pointer bg-transparent border-none w-full py-1"
        >
          Xem tất cả thông báo & Nhật ký
        </button>
      </div>
    </div>
  );
};

/* ── User menu panel ─────────────────────────── */
const UserPanel = ({ user, avatar, onLogout, onNavigate }) => (
  <div className="w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden font-['Outfit'] animate-fade-down">
    <div className="p-4 border-b border-zinc-100 bg-zinc-50/80">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D0D0D] text-[#C9A87C] font-mono font-bold flex items-center justify-center text-base shadow-xs overflow-hidden border border-zinc-700">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            (user?.fullName || 'A')[0].toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-900 truncate">{user?.fullName || 'Quản trị viên'}</div>
          <div className="text-[11px] text-zinc-500 truncate font-light mt-0.5">{user?.email || 'admin@furnitureshop.vn'}</div>
        </div>
      </div>
    </div>
    <div className="py-2">
      <button
        type="button"
        onClick={() => onNavigate('/admin/settings')}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer bg-transparent border-none font-medium text-left"
      >
        <span>👤</span> Cập nhật thông tin
      </button>
      <button
        type="button"
        onClick={() => onNavigate('/admin/auth')}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs text-zinc-700 hover:bg-zinc-100 hover:text-black transition-colors cursor-pointer bg-transparent border-none font-medium text-left"
      >
        <span>⚙️</span> Cài đặt bảo mật
      </button>
    </div>
    <div className="border-t border-zinc-100 py-2">
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer bg-transparent border-none text-left"
      >
        <span>⎋</span> Đăng xuất khỏi Admin
      </button>
    </div>
  </div>
);

/* ── Main Header ─────────────────────────────── */
const AdminHeader = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { avatar } = useAvatar(user?.userId);
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [notifs, setNotifs] = useState([]);

  const notifRef = useRef(null);
  const userRef = useRef(null);

  useClickOutside(notifRef, () => setShowNotif(false));
  useClickOutside(userRef, () => setShowUser(false));

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await apiClient.get('/auditlogs?page=1&pageSize=5');
        if (res.success && res.data) {
          const mapped = res.data.map((log, i) => ({
            id: log.id || i + 1,
            avatarBg: i % 2 === 0 ? 'bg-blue-100' : 'bg-amber-100',
            avatarColor: i % 2 === 0 ? 'text-blue-700' : 'text-amber-800',
            initials: (log.userName || 'AD').substring(0, 2).toUpperCase(),
            name: log.action || 'Hoạt động hệ thống',
            action: log.details || log.entityName || 'Dữ liệu phát sinh',
            time: new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            read: false,
            path: '/admin/auditlogs'
          }));
          setNotifs(mapped);
        }
      } catch {
        // Fallback silently if unauthenticated or error
      }
    };
    fetchNotifs();
  }, []);

  /* Keyboard shortcut Cmd+K or Ctrl+K to toggle quick search */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearch(v => !v);
        setShowNotif(false);
        setShowUser(false);
      } else if (e.key === 'Escape') {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSelectNotif = (item) => {
    setNotifs(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
    setShowNotif(false);
    if (item.path) navigate(item.path);
  };

  const handleViewAllNotifs = () => {
    setShowNotif(false);
    navigate('/admin/auditlogs');
  };

  const handleUserNavigate = (path) => {
    setShowUser(false);
    navigate(path);
  };

  const handleSearchSelect = (path) => {
    setShowSearch(false);
    navigate(path);
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 h-16 min-h-[64px] bg-[#F8F9FA]/80 backdrop-blur-md border-b border-zinc-200/80 gap-3 select-none font-['Outfit']">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <IconBtn title="Đóng/Mở Sidebar" onClick={onToggleSidebar}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </IconBtn>

        {/* Quick Command / Search trigger */}
        <div
          onClick={() => { setShowSearch(true); setShowNotif(false); setShowUser(false); }}
          className="hidden sm:flex items-center gap-2 bg-white border border-zinc-200/80 rounded-xl px-3 py-1.5 h-9 max-w-xs flex-1 shadow-2xs hover:border-black cursor-pointer transition-all group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover:text-black transition-colors">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span className="text-xs text-zinc-400 group-hover:text-zinc-700 flex-1 truncate transition-colors">Tìm kiếm trang, lệnh nhanh...</span>
          <span className="text-[10px] font-mono font-bold text-zinc-500 bg-zinc-100 group-hover:bg-zinc-200 rounded px-1.5 py-0.5 transition-colors">⌘K</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <IconBtn
            title="Thông báo hệ thống"
            onClick={() => { setShowNotif(v => !v); setShowUser(false); }}
            badge={unreadCount}
            active={showNotif}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </IconBtn>
          {showNotif && (
            <div className="absolute top-[calc(100%+12px)] right-0 z-50">
              <NotifPanel
                notifs={notifs}
                onSelectNotif={handleSelectNotif}
                onViewAll={handleViewAllNotifs}
              />
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {/* User Profile */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => { setShowUser(v => !v); setShowNotif(false); }}
            className={`flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs ${
              showUser ? 'border-black bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#0D0D0D] text-[#C9A87C] font-mono font-bold flex items-center justify-center text-xs overflow-hidden border border-zinc-700">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.fullName || 'A')[0].toUpperCase()
              )}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-semibold text-zinc-800 truncate max-w-[120px]">{user?.fullName || 'Admin'}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">Executive</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-zinc-400 transition-transform ${showUser ? 'rotate-180' : ''}`}>
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showUser && (
            <div className="absolute top-[calc(100%+12px)] right-0 z-50">
              <UserPanel
                user={user}
                avatar={avatar}
                onLogout={handleLogout}
                onNavigate={handleUserNavigate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Quick Search Command Palette Modal */}
      {showSearch && (
        <QuickSearchModal
          onClose={() => setShowSearch(false)}
          onSelect={handleSearchSelect}
        />
      )}
    </header>
  );
};

export default AdminHeader;
