// src/components/admin/AdminSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SidebarGroup = ({ label, icon, children, defaultOpen = false, collapsed }) => {
  const location = useLocation();
  const childPaths = React.Children.map(children, c => c?.props?.to) || [];
  const isAnyActive = childPaths.some(p => p && location.pathname === p);
  const [open, setOpen] = useState(defaultOpen || isAnyActive);

  if (collapsed) {
    return (
      <li className="px-3 py-1">
        <div title={label} className="flex items-center justify-center p-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-all">
          {icon}
        </div>
      </li>
    );
  }

  return (
    <li className="px-3 py-1 font-['Outfit']">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
          isAnyActive ? 'text-[#C9A87C] bg-zinc-900/90' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
        }`}
      >
        <div className="flex items-center gap-3 truncate">
          <span className="flex-shrink-0 text-base">{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <span className={`text-[10px] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <ul className="mt-1 space-y-1 pl-4 border-l border-zinc-800 ml-5">{children}</ul>}
    </li>
  );
};

const SubItem = ({ to, label, badge }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <li>
      <Link
        to={to}
        className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs transition-all ${
          active
            ? 'text-white font-semibold bg-[#C9A87C]/15 border border-[#C9A87C]/30'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 font-normal'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-[#C9A87C]' : 'bg-zinc-600'}`} />
          <span className="truncate">{label}</span>
        </div>
        {badge && <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#C9A87C] text-black rounded-full">{badge}</span>}
      </Link>
    </li>
  );
};

const DirectLink = ({ to, icon, label, badge, collapsed }) => {
  const location = useLocation();
  const active = location.pathname === to;
  return (
    <li className="px-3 py-1 font-['Outfit']">
      <Link
        to={to}
        title={collapsed ? label : undefined}
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
          active
            ? 'text-[#C9A87C] bg-zinc-900 border border-[#C9A87C]/30 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
        } ${collapsed ? 'justify-center p-3' : ''}`}
      >
        <span className="flex-shrink-0 text-base">{icon}</span>
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
        {!collapsed && badge && <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#C9A87C] text-black rounded-full">{badge}</span>}
      </Link>
    </li>
  );
};

const AdminSidebar = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#0D0D0D] text-zinc-300 border-r border-zinc-800/80 flex flex-col transition-all duration-300 ease-in-out select-none ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <Link to="/admin/overview" className={`flex items-center gap-3 px-6 py-5 border-b border-zinc-800/80 flex-shrink-0 hover:bg-zinc-900/50 transition-colors ${collapsed ? 'justify-center px-4' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A87C] to-[#8c7353] flex items-center justify-center text-black font-extrabold text-lg shadow-md flex-shrink-0">
          ⚡
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-sm font-bold tracking-widest uppercase text-white block truncate">Furniture<span className="font-light text-[#C9A87C]">Admin</span></span>
            <span className="text-[9px] font-mono tracking-widest uppercase text-zinc-500 block">Executive Cockpit v2</span>
          </div>
        )}
      </Link>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-6 custom-scrollbar">
        {/* SECTION 1 */}
        <div className="space-y-1">
          {!collapsed && <div className="px-6 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">CHIẾN LƯỢC</div>}
          <ul className="space-y-0.5 m-0 p-0">
            <SidebarGroup label="Tổng Quan" icon="📊" defaultOpen={true} collapsed={collapsed}>
              <SubItem to="/admin/overview" label="Executive Trung Tâm" />
              <SubItem to="/admin/statistics" label="Phân tích Doanh thu" />
              <SubItem to="/admin/behavior" label="Hành vi Khách hàng" badge="HOT" />
            </SidebarGroup>
          </ul>
        </div>

        {/* SECTION 2 */}
        <div className="space-y-1">
          {!collapsed && <div className="px-6 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">VẬN HÀNH</div>}
          <ul className="space-y-0.5 m-0 p-0">
            <SidebarGroup label="Thương Mại" icon="🛍️" defaultOpen={true} collapsed={collapsed}>
              <SubItem to="/admin/orders" label="Quản lý Đơn hàng" />
              <SubItem to="/admin/dashboard" label="Sản phẩm Nội thất" />
              <SubItem to="/admin/categories" label="Danh mục Bộ sưu tập" />
              <SubItem to="/admin/users" label="Khách hàng Thành viên" />
              <SubItem to="/admin/promotions" label="Khuyến mãi & Coupon" />
            </SidebarGroup>

            <SidebarGroup label="Kho & Vận Chuyển" icon="📦" defaultOpen={true} collapsed={collapsed}>
              <SubItem to="/admin/inventory" label="Tồn kho Hiện tại" />
              <SubItem to="/admin/stockin" label="Phiếu Nhập kho" />
              <SubItem to="/admin/suppliers" label="Đối tác Cung cấp" />
              <SubItem to="/admin/delivery" label="Vận chuyển Giao hàng" />
            </SidebarGroup>
          </ul>
        </div>

        {/* SECTION 3 */}
        <div className="space-y-1">
          {!collapsed && <div className="px-6 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">HỖ TRỢ & CSKH</div>}
          <ul className="space-y-0.5 m-0 p-0">
            <DirectLink to="/admin/chat" icon="💬" label="Hỗ trợ Trực tuyến" collapsed={collapsed} />
            <DirectLink to="/admin/tickets" icon="🎫" label="Yêu cầu Khiếu nại" badge="NEW" collapsed={collapsed} />
          </ul>
        </div>

        {/* SECTION 4 */}
        <div className="space-y-1">
          {!collapsed && <div className="px-6 text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-zinc-500 mb-2">HỆ THỐNG</div>}
          <ul className="space-y-0.5 m-0 p-0">
            <DirectLink to="/admin/utilities" icon="🛠️" label="Tiện ích & Backup" collapsed={collapsed} />
            <DirectLink to="/admin/auditlogs" icon="📜" label="Nhật ký Hoạt động" collapsed={collapsed} />
            <DirectLink to="/admin/auth" icon="🔒" label="Phân quyền Admin" collapsed={collapsed} />
            <DirectLink to="/admin/settings" icon="⚙️" label="Cấu hình Hệ thống" collapsed={collapsed} />
          </ul>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 flex-shrink-0 font-['Outfit']">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 ${collapsed ? 'justify-center p-2' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[#C9A87C] text-black font-extrabold flex items-center justify-center text-sm flex-shrink-0 font-mono">
            {(user?.fullName || 'A')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 overflow-hidden">
              <span className="text-xs font-semibold text-white truncate block">{user?.fullName || 'Quản trị viên'}</span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#C9A87C] block">Super Admin</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Đăng xuất"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-400 transition-all cursor-pointer"
            >
              ⎋
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
