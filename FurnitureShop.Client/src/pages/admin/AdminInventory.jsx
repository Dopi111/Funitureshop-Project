// src/pages/admin/AdminInventory.jsx — Executive Warehouse Cockpit (Tailwind v4)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Badge, PageHeader, Btn } from '../../components/admin/ui';
import { productService } from '../../services/productService';

/* ── Helpers ── */
const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);
const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(v ?? 0);

/* ── Empty removed ── */

/* ── Stat Card ── */
const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex items-start gap-4 hover:border-zinc-300 transition-all">
    <div className="w-12 h-12 rounded-xl bg-[#0D0D0D] text-[#C9A87C] flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
      <span className="text-xl sm:text-2xl font-mono font-bold text-[#0D0D0D] block mt-1 truncate">{value}</span>
      {sub && <span className="text-[10px] text-zinc-400 font-light mt-0.5 block">{sub}</span>}
    </div>
  </div>
);

/* ── Main Inventory Cockpit ── */
const AdminInventory = () => {
  const navigate = useNavigate();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('');
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editVal, setEditVal] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await productService.getProducts({ pageSize: 100 });
        if (res.success && res.data) {
          const list = res.data.items || res.data || [];
          const mapped = list.map(p => ({
            id: p.id,
            name: p.name || 'Sản phẩm nội thất',
            sku: p.sku || `SKU-${p.id}`,
            category: p.categoryName || p.category?.name || 'Nội thất',
            stock: p.stockQuantity ?? p.stock ?? 0,
            reserved: 0,
            price: p.price || 0,
            cost: p.costPrice || (p.price ? p.price * 0.6 : 0),
            status: (p.stockQuantity ?? p.stock ?? 0) === 0 ? 'cancelled' : (p.stockQuantity ?? p.stock ?? 0) <= 5 ? 'warning' : 'completed'
          }));
          setItems(mapped);
        }
      } catch {
        // keep empty array on error
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const filtered = items.filter(i =>
    (!filter || i.status === filter) &&
    (!search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const totalValue = items.reduce((s, i) => s + i.stock * i.cost, 0);
  const lowCount   = items.filter(i => i.status === 'warning').length;
  const outCount   = items.filter(i => i.status === 'cancelled').length;
  const totalItems = items.reduce((s, i) => s + i.stock, 0);

  const saveEdit = (id) => {
    const n = parseInt(editVal);
    if (isNaN(n) || n < 0) return;
    setItems(prev => prev.map(i => i.id === id ? {
      ...i, stock: n,
      status: n === 0 ? 'cancelled' : n <= 5 ? 'warning' : 'completed',
    } : i));
    setEditing(null);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Quản Trị Kho Bãi" 
        subtitle="Hệ thống giám sát tồn kho thời gian thực & Kiểm soát định giá COGS"
        breadcrumb={['Admin', 'Kho & Vận chuyển', 'Tồn kho hiện tại']}
      >
        <Btn variant="primary" onClick={() => navigate('/admin/stockin')}>
          + Tạo Phiếu Nhập Hàng
        </Btn>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon="📦" label="Tổng Sản Phẩm Tồn" value={`${fmtNum(totalItems)} SP`} sub="Khả dụng lưu kho" />
        <StatCard icon="💰" label="Tổng Giá Trị Vốn" value={fmt(totalValue)} sub="Định giá hàng hóa COGS" />
        <StatCard icon="⚠️" label="Chạm Ngưỡng Tối Thiểu" value={`${lowCount} SP`} sub="Cần nhập bổ sung gấp" />
        <StatCard icon="🚫" label="Hết Hàng Hoàn Toàn" value={`${outCount} SP`} sub="Đang tạm ẩn trên website" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã SKU, tên sản phẩm nội thất..."
              className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black transition-all font-['Outfit']"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-white px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 outline-none cursor-pointer focus:border-black transition-all"
            >
              <option value="">Toàn bộ trạng thái kho</option>
              <option value="completed">An toàn (Còn hàng)</option>
              <option value="warning">Cảnh báo (Sắp hết)</option>
              <option value="cancelled">Khẩn cấp (Hết hàng)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[840px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Mã SKU</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sản Phẩm</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phân Loại</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-center">Tồn Thực Tế</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-center">Đang Giữ</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-right">Giá Bán</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-right">Giá Vốn</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(item => {
                const isEdit = editing === item.id;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#C9A87C]">{item.sku}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-zinc-900 max-w-[220px] truncate">{item.name}</td>
                    <td className="px-4 py-3.5 text-xs text-zinc-500">{item.category}</td>
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-center">
                      {isEdit ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            value={editVal}
                            onChange={e => setEditVal(e.target.value)}
                            min={0}
                            className="w-16 px-2 py-1 bg-white border border-black rounded-lg text-xs font-mono outline-none text-center"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditing(null); }}
                          />
                          <button onClick={() => saveEdit(item.id)} className="w-6 h-6 bg-[#0D0D0D] text-white rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✓</button>
                          <button onClick={() => setEditing(null)} className="w-6 h-6 bg-zinc-100 text-zinc-600 rounded-md border-none cursor-pointer flex items-center justify-center text-[10px] font-bold">✕</button>
                        </div>
                      ) : (
                        <span className={item.stock === 0 ? 'text-rose-600' : item.stock <= 5 ? 'text-amber-600' : 'text-zinc-900'}>{item.stock}</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 text-center">{item.reserved}</td>
                    <td className="px-4 py-3.5 text-xs font-mono font-bold text-zinc-900 text-right">{fmt(item.price)}</td>
                    <td className="px-4 py-3.5 text-xs font-mono text-zinc-500 text-right">{fmt(item.cost)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={item.status}>
                        {item.status === 'completed' ? 'CÒN HÀNG' : item.status === 'warning' ? 'SẮP HẾT' : 'HẾT HÀNG'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => { setEditing(item.id); setEditVal(String(item.stock)); }}
                        className="px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[11px] font-medium text-zinc-700 hover:border-black hover:bg-black hover:text-white transition-all cursor-pointer shadow-2xs"
                      >
                        Kiểm kê
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-zinc-400 font-mono">
                    {loading ? 'ĐANG TẢI DỮ LIỆU TỒN KHO TỪ HỆ THỐNG...' : 'KHÔNG CÓ DỮ LIỆU SẢN PHẨM HOẶC KHÔNG KHỚP BỘ LỌC'}
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

export default AdminInventory;
