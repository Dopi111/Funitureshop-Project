// src/pages/admin/AdminStockIn.jsx — Executive Purchase Order Cockpit (Tailwind v4)
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Badge, PageHeader, Btn, Modal } from '../../components/admin/ui';
import apiService from '../../services/apiService';
import { productService } from '../../services/productService';

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const AdminStockIn = () => {
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productsList, setProductsList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [supplierVal, setSupplierVal] = useState('');
  const [notesVal, setNotesVal] = useState('');
  const [items, setItems] = useState([]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const [posRes, supRes, prodRes] = await Promise.all([
        apiService.request('/Inventory/purchase-orders', { method: 'GET' }).catch(() => ({ success: false })),
        apiService.request('/Inventory/suppliers', { method: 'GET' }).catch(() => ({ success: false })),
        productService.getProducts({ pageSize: 100 }).catch(() => ({ success: false })),
      ]);

      if (posRes.success && posRes.data) {
        setPos((posRes.data || []).map(p => ({
          id: p.purchaseOrderId,
          code: p.poCode,
          supplier: p.supplierName || p.supplier?.name || 'Đối tác cung ứng',
          totalAmount: p.totalAmount || 0,
          itemCount: p.details?.length || 0,
          createdAt: p.createdAt || new Date().toISOString(),
          status: String(p.status).toLowerCase() === 'completed' ? 'completed' : String(p.status).toLowerCase() === 'cancelled' ? 'cancelled' : 'processing',
          note: p.notes || 'Phiếu nhập kho hệ thống',
        })));
      } else {
        setPos([]);
      }

      if (supRes.success && supRes.data) {
        const sups = (supRes.data || []).filter(s => s.isActive !== false).map(s => ({ id: s.supplierId, name: s.name }));
        setSuppliersList(sups);
        if (sups.length > 0) setSupplierVal(String(sups[0].id));
      } else {
        setSuppliersList([]);
      }

      if (prodRes.success && prodRes.data) {
        const prods = (prodRes.data.data || prodRes.data.items || prodRes.data || []).map(p => ({
          id: p.productId ?? p.id,
          name: p.name || 'Sản phẩm nội thất',
          price: p.costPrice ?? null,
        }));
        setProductsList(prods);
        if (prods.length > 0) setItems([{ productId: prods[0].id, qty: 1, price: prods[0].price ?? '' }]);
      } else {
        setProductsList([]);
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const filtered = pos.filter(p => (!filter || p.status === filter) && (!search || String(p.id).toLowerCase().includes(search.toLowerCase()) || (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()))));

  const addItem = () => {
    if (!productsList.length) return;
    const first = productsList[0];
    setItems([...items, { productId: first.id, qty: 1, price: first.price ?? '' }]);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const updateItem = (idx, field, val) => {
    const next = [...items];
    if (field === 'price') {
      next[idx][field] = val === '' ? '' : Number(val);
    } else if (field === 'qty' || field === 'productId') {
      next[idx][field] = Number(val);
    } else {
      next[idx][field] = val;
    }
    if (field === 'productId') {
      const found = productsList.find(p => p.id === Number(val));
      next[idx].price = found?.price ?? '';
    }
    setItems(next);
  };

  const calcTotal = () => items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.price) || 0), 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!items.length) { toast.error('Vui lòng chọn ít nhất 1 sản phẩm nhập'); return; }

    const invalidItem = items.find(i => !i.productId || !(Number(i.qty) > 0) || !(Number(i.price) > 0));
    if (invalidItem) { toast.error('Mỗi dòng phải có số lượng và giá vốn lớn hơn 0'); return; }
    if (!supplierVal) { toast.error('Vui lòng chọn nhà cung cấp'); return; }

    try {
      const payload = {
        supplierId: Number(supplierVal),
        notes: notesVal || 'Phiếu nhập kho bổ sung',
        details: items.map(i => ({ productId: i.productId, quantity: Number(i.qty), unitPrice: Number(i.price) })),
      };
      const res = await apiService.request('/Inventory/purchase-orders', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) {
        toast.success('Tạo Phiếu Nhập Kho Thành Công!');
        fetchStockData();
        setShowModal(false);
      } else {
        toast.error(res.message || 'Không thể tạo phiếu nhập kho');
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tạo phiếu nhập');
    }
    setNotesVal('');
    if (productsList.length > 0) setItems([{ productId: productsList[0].id, qty: 1, price: productsList[0].price ?? '' }]);
  };

  const handleComplete = async (id) => {
    const res = await apiService.request(`/Inventory/purchase-orders/${id}/complete`, { method: 'POST' });
    if (res.success) {
      toast.success('Đã hoàn tất phiếu nhập và cộng tồn kho');
      fetchStockData();
    } else {
      toast.error(res.message || 'Không thể hoàn tất phiếu nhập');
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="Nhập Hàng Kho Bãi" subtitle="Quản lý phiếu nhập kho mua hàng & Kiểm soát chuỗi cung ứng đầu vào" breadcrumb={['Admin', 'Kho & Vận chuyển', 'Phiếu nhập kho']}>
        <Btn variant="primary" onClick={() => setShowModal(true)}>+ Lập Phiếu Nhập Mới</Btn>
      </PageHeader>

      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm mã phiếu #PO, tên nhà cung cấp hàng hóa..." className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black transition-all font-['Outfit']" />
          </div>
          <div className="flex items-center gap-2">
            <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 outline-none cursor-pointer focus:border-black transition-all">
              <option value="">Toàn bộ trạng thái</option>
              <option value="completed">Đã hoàn tất</option>
              <option value="processing">Đang xử lý</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Mã Phiếu</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Nhà Cung Cấp</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Ghi Chú</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-center">Số Loại</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-right">Tổng Giá Trị</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-center">Ngày Lập</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors cursor-pointer">
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#C9A87C]">#{p.code || p.id}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-zinc-900">{p.supplier}</td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500 max-w-[280px] truncate">{p.note}</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-center text-zinc-700">{p.itemCount} SP</td>
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#0D0D0D] text-right">{fmt(p.totalAmount)}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 text-center">{fmtDate(p.createdAt)}</td>
                  <td className="px-4 py-3.5 text-center"><Badge variant={p.status}>{p.status === 'completed' ? 'HOÀN TẤT' : p.status === 'processing' ? 'ĐANG NHẬP' : p.status === 'cancelled' ? 'ĐÃ HỦY' : 'CHỜ DUYỆT'}</Badge></td>
                  <td className="px-4 py-3.5 text-right">{p.status !== 'completed' && <button onClick={() => handleComplete(p.id)} className="px-3 py-1 rounded-lg bg-[#0D0D0D] text-white text-[11px] font-semibold border-none cursor-pointer">Hoàn tất</button>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-400 font-mono">{loading ? 'ĐANG TẢI DỮ LIỆU PHIẾU NHẬP TỪ HỆ THỐNG...' : 'CHƯA CÓ PHIẾU NHẬP KHO NÀO TRONG HỆ THỐNG'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={showModal} onClose={() => setShowModal(false)} title="Lập Phiếu Nhập Kho (Purchase Order)" size="lg">
        <form onSubmit={handleCreate} className="space-y-5 font-['Outfit']">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Nhà Cung Cấp / Đối Tác</label>
              <select value={supplierVal} onChange={e => setSupplierVal(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium outline-none focus:border-black bg-white">
                <option value="">Chọn nhà cung cấp</option>
                {suppliersList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Ghi Chú Phiếu Nhập</label>
              <input value={notesVal} onChange={e => setNotesVal(e.target.value)} placeholder="VD: Nhập lô hàng quý III..." className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black bg-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Danh Sách Sản Phẩm Nhập</label>
              <button type="button" onClick={addItem} className="text-xs font-semibold uppercase tracking-wider text-[#C9A87C] hover:text-black transition-colors cursor-pointer bg-transparent border-none">+ Thêm dòng</button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200/60">
                  <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black bg-white truncate max-w-[280px]">
                    {productsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>

                  <div className="w-20">
                    <input type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', e.target.value)} className="w-full px-2 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-center outline-none bg-white font-bold" placeholder="SL" />
                  </div>

                  <div className="w-32">
                    <input type="number" step={100000} value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} className="w-full px-2 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-right outline-none bg-white text-[#C9A87C] font-bold" placeholder="Giá vốn" />
                  </div>

                  <button type="button" onClick={() => removeItem(idx)} className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-bold border border-rose-200 cursor-pointer flex items-center justify-center">✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0D0D0D] text-white flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Ước Tính Tổng Giá Trị</span>
            <span className="text-xl font-mono font-bold text-[#C9A87C]">{fmt(calcTotal())}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <Btn variant="outline" onClick={() => setShowModal(false)}>Hủy</Btn>
            <Btn variant="primary" type="submit">Xác Nhận Nhập Hàng</Btn>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
};

export default AdminStockIn;