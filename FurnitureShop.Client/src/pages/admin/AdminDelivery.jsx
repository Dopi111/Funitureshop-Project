// src/pages/admin/AdminDelivery.jsx — Executive Dispatch Cockpit (Tailwind v4)
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Badge, PageHeader } from '../../components/admin/ui';
import orderService from '../../services/orderService';

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/* ── Empty removed ── */

const DRIVERS = ['Trần Minh Tuấn (Xe tải 1.5T)', 'Lê Văn Hùng (Xe tải 2.5T)', 'Ngô Thị Mai (Bán tải)', 'Đặng Văn Khánh (Xe tải 1.5T)'];

const StatCard = ({ icon, label, value, desc }) => (
  <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex items-start gap-4 hover:border-zinc-300 transition-all">
    <div className="w-12 h-12 rounded-xl bg-[#0D0D0D] text-[#C9A87C] flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
      <span className="text-xl sm:text-2xl font-mono font-bold text-[#0D0D0D] block mt-1 truncate">{value}</span>
      {desc && <span className="text-[10px] text-zinc-400 font-light mt-0.5 block">{desc}</span>}
    </div>
  </div>
);

const AdminDelivery = () => {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('');
  const [assigning, setAssigning] = useState(null);
  const [driverVal, setDriverVal] = useState('');

  useEffect(() => {
    const fetchDeliveryOrders = async () => {
      try {
        setLoading(true);
        const res = await orderService.getAllOrders(1, 100);
        if (res.success && res.data) {
          const list = res.data.items || res.data || [];
          const mapped = list.map(o => ({
            id: String(o.id || o.orderCode || ''),
            customer: o.fullName || o.shippingAddress?.fullName || 'Khách hàng',
            phone: o.phoneNumber || o.shippingAddress?.phoneNumber || '',
            address: o.shippingAddress?.address || o.address || 'Giao hàng tận nơi',
            total: o.totalAmount || 0,
            driver: o.driverName || null,
            method: o.shippingMethod || 'Giao hàng tiêu chuẩn',
            status: o.status === 4 ? 'completed' : o.status === 3 ? 'shipped' : o.status === 5 ? 'cancelled' : 'pending'
          }));
          setOrders(mapped);
        }
      } catch {
        // empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveryOrders();
  }, []);

  const filtered = orders.filter(o =>
    (!filter || o.status === filter) &&
    (!search || o.id.includes(search) || o.customer.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search))
  );

  const assignDriver = (id) => {
    if (!driverVal) return;
    setOrders(prev => prev.map(o => o.id === id ? { ...o, driver: driverVal, status: 'shipped' } : o));
    setAssigning(null);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Vận chuyển Giao hàng" 
        subtitle="Quản lý điều phối xe, phân công tài xế và theo dõi lộ trình đơn hàng"
        breadcrumb={['Admin', 'Kho & Vận chuyển', 'Vận chuyển giao hàng']}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon="⏳" label="Chờ Phân Công" value={`${orders.filter(o=>!o.driver).length} Đơn`} desc="Chưa gán tài xế/đơn vị vận chuyển" />
        <StatCard icon="🚚" label="Đang Luân Chuyển" value={`${orders.filter(o=>o.status==='shipped'||o.status==='processing').length} Đơn`} desc="Trên lộ trình giao đến khách" />
        <StatCard icon="✅" label="Giao Thành Công" value={`${orders.filter(o=>o.status==='completed').length} Đơn`} desc="Đã ký nhận hoàn tất" />
        <StatCard icon="❌" label="Thất Bại / Hủy" value={`${orders.filter(o=>o.status==='cancelled').length} Đơn`} desc="Khách từ chối hoặc sai địa chỉ" />
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã vận đơn #ORD, tên khách nhận, số điện thoại..."
              className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black transition-all font-['Outfit']"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-white px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 outline-none cursor-pointer focus:border-black transition-all"
            >
              <option value="">Toàn bộ trạng thái giao</option>
              <option value="pending">Chờ điều phối</option>
              <option value="processing">Đang đóng gói</option>
              <option value="shipped">Đang trên đường</option>
              <option value="completed">Đã bàn giao</option>
              <option value="cancelled">Giao thất bại</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Mã Đơn</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Người Nhận</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Địa Chỉ Giao</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-right">Tổng Tiền</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Đơn Vị</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Điều Phối / Tài Xế</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(o => {
                const isAssign = assigning === o.id;
                return (
                  <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#C9A87C]">#{o.id}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-zinc-900">
                      <div>{o.customer}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-600 max-w-[240px] truncate">{o.address}</td>
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-zinc-900 text-right">{fmt(o.total)}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-center text-zinc-700">{o.method}</td>
                    <td className="px-4 py-3.5 text-center">
                      {isAssign ? (
                        <div className="inline-flex items-center gap-1">
                          <select
                            value={driverVal}
                            onChange={e => setDriverVal(e.target.value)}
                            className="bg-white border border-black rounded-lg px-2 py-1 text-xs outline-none"
                            autoFocus
                          >
                            <option value="">Chọn tài xế...</option>
                            {DRIVERS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <button onClick={() => assignDriver(o.id)} className="w-6 h-6 bg-[#0D0D0D] text-white rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✓</button>
                          <button onClick={() => setAssigning(null)} className="w-6 h-6 bg-zinc-100 text-zinc-600 rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✕</button>
                        </div>
                      ) : o.driver ? (
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100" onClick={() => { setAssigning(o.id); setDriverVal(o.driver); }}>
                          🚘 {o.driver.split('(')[0]}
                        </span>
                      ) : (
                        <button
                          onClick={() => { setAssigning(o.id); setDriverVal(DRIVERS[0]); }}
                          className="px-3 py-1 rounded-lg bg-[#0D0D0D] text-[#C9A87C] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer shadow-2xs border-none"
                        >
                          + Điều Phối
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={o.status}>
                        {o.status === 'completed' ? 'ĐÃ GIAO' : o.status === 'shipped' ? 'ĐANG GIAO' : o.status === 'cancelled' ? 'THẤT BẠI' : 'CHỜ ĐIỀU PHỐI'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400 font-mono">
                    {loading ? 'ĐANG TẢI DỮ LIỆU ĐƠN VẬN CHUYỂN TỪ HỆ THỐNG...' : 'KHÔNG CÓ ĐƠN HÀNG VẬN CHUYỂN NÀO HOẶC KHÔNG KHỚP BỘ LỌC'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDelivery;
