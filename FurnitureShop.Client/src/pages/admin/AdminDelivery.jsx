// src/pages/admin/AdminDelivery.jsx — Executive Dispatch Cockpit (Tailwind v4)
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Badge, PageHeader } from '../../components/admin/ui';
import apiService from '../../services/apiService';
import toast from 'react-hot-toast';

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);

const StatCard = ({ icon, label, value, desc }) => (
  <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex items-start gap-4 hover:border-zinc-300 transition-all">
    <div className="w-12 h-12 rounded-xl bg-[#0D0D0D] text-[#C9A87C] flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">{icon}</div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
      <span className="text-xl sm:text-2xl font-mono font-bold text-[#0D0D0D] block mt-1 truncate">{value}</span>
      {desc && <span className="text-[10px] text-zinc-400 font-light mt-0.5 block">{desc}</span>}
    </div>
  </div>
);

const AdminDelivery = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [driverName, setDriverName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  useEffect(() => {
    const fetchDeliveryOrders = async () => {
      try {
        setLoading(true);
        const res = await apiService.request('/admin-operations/delivery', { method: 'GET' });
        if (res.success && res.data) setOrders(Array.isArray(res.data) ? res.data : []);
        else setOrders([]);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveryOrders();
  }, []);

  const filtered = orders.filter(o => {
    const id = String(o.id ?? '').toLowerCase();
    const customer = String(o.customer || '').toLowerCase();
    const phone = String(o.phone || '').toLowerCase();
    return (!filter || o.status === filter) && (!search || id.includes(search.toLowerCase()) || customer.includes(search.toLowerCase()) || phone.includes(search.toLowerCase()));
  });

  const assignDriver = async (id) => {
    if (!driverName.trim()) { toast.error('Vui lòng nhập tên tài xế'); return; }
    const res = await apiService.request(`/admin-operations/delivery/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ driverName: driverName.trim(), vehicle: vehicle.trim() || null, trackingCode: trackingCode.trim() || null }),
    });
    if (!res.success) {
      toast.error(res.message || 'Không thể phân công tài xế');
      return;
    }
    setOrders(prev => prev.map(o => o.id === id ? { ...o, driver: driverName.trim(), vehicle: vehicle.trim() || o.vehicle, status: 'shipped' } : o));
    setAssigning(null);
    setDriverName('');
    setVehicle('');
    setTrackingCode('');
    toast.success('Đã phân công giao hàng');
  };

  const updateStatus = async (id, status) => {
    const res = await apiService.request(`/admin-operations/delivery/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success(status === 'completed' ? 'Đã xác nhận giao thành công' : 'Đã cập nhật giao hàng');
    } else {
      toast.error(res.message || 'Không thể cập nhật trạng thái');
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Vận Chuyển Giao Hàng" subtitle="Quản lý điều phối xe, phân công tài xế và theo dõi lộ trình đơn hàng" breadcrumb={['Admin', 'Kho & Vận chuyển', 'Vận chuyển giao hàng']} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon="⏳" label="Chờ Phân Công" value={`${orders.filter(o => !o.driver).length} Đơn`} desc="Chưa gán tài xế/đơn vị vận chuyển" />
        <StatCard icon="🚚" label="Đang Luân Chuyển" value={`${orders.filter(o => o.status === 'shipped' || o.status === 'processing').length} Đơn`} desc="Trên lộ trình giao đến khách" />
        <StatCard icon="✅" label="Giao Thành Công" value={`${orders.filter(o => o.status === 'completed').length} Đơn`} desc="Đã ký nhận hoàn tất" />
        <StatCard icon="❌" label="Thất Bại / Hủy" value={`${orders.filter(o => o.status === 'cancelled').length} Đơn`} desc="Khách từ chối hoặc sai địa chỉ" />
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm mã vận đơn #ORD, tên khách nhận, số điện thoại..." className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black transition-all font-['Outfit']" />
          </div>

          <div className="flex items-center gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 outline-none cursor-pointer focus:border-black transition-all">
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
                      <div>{o.customer || 'N/A'}</div>
                      <div className="text-[11px] font-mono text-zinc-400">{o.phone || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-600 max-w-[240px] truncate">{o.address || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-zinc-900 text-right">{fmt(o.total)}</td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-center text-zinc-700">{o.method || 'N/A'}</td>
                    <td className="px-4 py-3.5 text-center">
                      {isAssign ? (
                        <div className="space-y-2 min-w-[300px]">
                          <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Tên tài xế" className="w-full bg-white border border-black rounded-lg px-3 py-1.5 text-xs outline-none" autoFocus />
                          <input value={vehicle} onChange={e => setVehicle(e.target.value)} placeholder="Phương tiện (tuỳ chọn)" className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                          <input value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="Mã theo dõi (tuỳ chọn)" className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-xs outline-none" />
                          <div className="inline-flex items-center gap-1">
                            <button onClick={() => assignDriver(o.id)} className="w-6 h-6 bg-[#0D0D0D] text-white rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✓</button>
                            <button onClick={() => { setAssigning(null); setDriverName(''); setVehicle(''); setTrackingCode(''); }} className="w-6 h-6 bg-zinc-100 text-zinc-600 rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✕</button>
                          </div>
                        </div>
                      ) : o.driver ? (
                        <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer hover:bg-emerald-100" onClick={() => { setAssigning(o.id); setDriverName(o.driver || ''); setVehicle(o.vehicle || ''); }}>
                          🚘 {String(o.driver).split('(')[0]}
                        </span>
                      ) : (
                        <button onClick={() => { setAssigning(o.id); setDriverName(''); setVehicle(''); setTrackingCode(''); }} className="px-3 py-1 rounded-lg bg-[#0D0D0D] text-[#C9A87C] text-[11px] font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer shadow-2xs border-none">+ Điều Phối</button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={o.status}>{o.status === 'completed' ? 'ĐÃ GIAO' : o.status === 'shipped' ? 'ĐANG GIAO' : o.status === 'cancelled' ? 'THẤT BẠI' : 'CHỜ ĐIỀU PHỐI'}</Badge>
                      {o.status === 'shipped' && <button onClick={() => updateStatus(o.id, 'completed')} className="ml-2 px-2 py-1 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold cursor-pointer">Đã giao</button>}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400 font-mono">{loading ? 'ĐANG TẢI DỮ LIỆU ĐƠN VẬN CHUYỂN TỪ HỆ THỐNG...' : 'KHÔNG CÓ ĐƠN HÀNG VẬN CHUYỂN NÀO HOẶC KHÔNG KHỚP BỘ LỌC'}</td>
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