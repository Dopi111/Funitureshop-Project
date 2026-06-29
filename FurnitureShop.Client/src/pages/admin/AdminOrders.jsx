// src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import orderService from '../../services/orderService';
import {
  PageHeader, Filters, SearchInput, FilterSelect,
  TableCard, Table, Thead, Th, Td, Badge, ActionBtn, Pagination,
  TableState, Modal, confirmAction
} from '../../components/admin/ui';

const STATUS = {
  1: { label: 'Chờ xác nhận', variant: 'pending',    icon: '⏳' },
  2: { label: 'Đang xử lý',   variant: 'processing', icon: '🔄' },
  3: { label: 'Đang giao',    variant: 'shipped',     icon: '🚚' },
  4: { label: 'Hoàn thành',   variant: 'completed',  icon: '✅' },
  5: { label: 'Đã hủy',       variant: 'cancelled',  icon: '❌' },
  6: { label: 'Hoàn tiền',    variant: 'inactive',   icon: '💸' },
  7: { label: 'Trả hàng',     variant: 'inactive',   icon: '🔙' },
  8: { label: 'Yêu cầu trả hàng', variant: 'warning', icon: '📦' },
};

const Btn = ({ children, onClick, disabled, variant = 'primary', size = 'sm' }) => {
  const base = 'inline-flex items-center justify-center gap-1.5 font-semibold rounded-xl cursor-pointer border transition-all uppercase tracking-wider text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-1.5 font-["Outfit"]';
  const v = {
    primary: 'bg-[#0D0D0D] text-white border-[#0D0D0D] hover:bg-[#C9A87C] hover:border-[#C9A87C] hover:text-black',
    danger: 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700',
    outline: 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100 hover:text-black hover:border-zinc-300'
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${v[variant]||v.primary}`}>{children}</button>;
};

const InfoItem = ({ label, value, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
    <p className="text-xs font-medium text-zinc-800 mt-1 m-0 break-words leading-relaxed">{value || '—'}</p>
  </div>
);

const AdminOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [stateDesc, setStateDesc] = useState('');
  const pageSize = 10;

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const result = await orderService.getAllOrders(currentPage, pageSize, statusFilter || null);
      if (!result.success) { setError(result.message || 'Không thể tải đơn hàng'); setOrders([]); return; }
      let list = result.data?.data || [];
      if (statusFilter !== '' && statusFilter !== null) {
        list = list.filter(o => String(o.status) === String(statusFilter));
      }
      if (searchTerm) list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.shippingFullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.shippingPhone?.includes(searchTerm)
      );
      setOrders(Array.isArray(list) ? list : []);
      setTotalPages(result.data?.totalPages || 1);
      setError(null);
    } catch { setError('Không thể tải danh sách đơn hàng'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [currentPage, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => currentPage === 1 ? fetchOrders() : setCurrentPage(1), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' }) : '-';

  const viewDetail = async (orderId) => {
    try {
      const r = await orderService.getOrderById(orderId);
      if (r.success && r.data) {
        setSelectedOrder(r.data);
        setCanUndo(r.data?.canUndo ?? false);
        setCanRedo(r.data?.canRedo ?? false);
        try {
          const sr = await orderService.getOrderState(orderId);
          if (sr.success) { setStateDesc(sr.data?.description ?? ''); }
        } catch {}
        try {
          const alRes = await fetch(`/api/auditlogs?entityType=Order&entityId=${orderId}`);
          if (alRes.ok) {
            const alData = await alRes.json();
            if (alData.success) setAuditLogs(alData.data || []);
          }
        } catch {}
        setShowDetail(true);
      } else toast.error(r.message || 'Không thể tải chi tiết');
    } catch { toast.error('Không thể tải chi tiết đơn hàng'); }
  };

  const handleTransition = async (orderId) => {
    if (!selectedOrder) return;
    const s = selectedOrder.status;
    if (s !== 1 && s !== 2) { toast.error('Không thể chuyển trạng thái'); return; }
    const label = s === 1 ? 'xác nhận' : 'giao hàng';
    if (!await confirmAction(`Bạn có chắc chắn muốn ${label} đơn hàng này?`, 'Đồng ý', 'primary')) return;
    setProcessing(orderId);
    try {
      const fn = s === 1 ? () => orderService.confirmOrder(orderId, user?.fullName||'Admin') : () => orderService.shipOrder(orderId, user?.fullName||'Admin');
      const r = await fn();
      if (!r.success) { toast.error(r.message || 'Không thể cập nhật'); return; }
      toast.success(`Đã ${label} đơn hàng thành công!`);
      setCanUndo(r.data?.canUndo??false); setCanRedo(r.data?.canRedo??false);
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleNextStateGeneric = async (orderId, targetStatus) => {
    if (!selectedOrder) return;
    const notes = window.prompt(`Nhập ghi chú cho trạng thái ${STATUS[targetStatus].label}:`);
    if (notes === null) return;
    setProcessing(orderId);
    try {
      const r = await orderService.transitionState(orderId, notes || `Chuyển sang ${STATUS[targetStatus].label}`, user?.fullName || 'Admin');
      if (!r.success) { toast.error(r.message || 'Không thể cập nhật trạng thái'); return; }
      toast.success(`Đã cập nhật trạng thái đơn hàng thành: ${STATUS[targetStatus].label}`);
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleApproveReturn = async (orderId) => {
    if (!selectedOrder) return;
    const notes = window.prompt('Nhập ghi chú cho việc duyệt trả hàng:');
    if (notes === null) return;
    setProcessing(orderId);
    try {
      const r = await orderService.approveReturn(orderId, notes || 'Admin duyệt trả hàng', user?.fullName || 'Admin');
      if (!r.success) { toast.error(r.message || 'Không thể phê duyệt trả hàng'); return; }
      toast.success('Đã phê duyệt trả hàng và hoàn lại tồn kho thành công!');
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleCancel = async (orderId) => {
    const reason = window.prompt('Nhập lý do hủy đơn hàng:');
    if (reason === null) return;
    setProcessing(orderId);
    try {
      const r = await orderService.cancelOrder(orderId, reason||'Hủy bởi Admin', user?.fullName||'Admin');
      if (!r.success) { toast.error(r.message||'Không thể hủy'); return; }
      toast.success('Đã hủy đơn hàng');
      setCanUndo(r.data?.canUndo??false); setCanRedo(r.data?.canRedo??false);
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleUndo = async (orderId) => {
    if (!await confirmAction('Hoàn tác thao tác cuối cùng?', 'Hoàn tác', 'primary')) return;
    setProcessing(orderId);
    try {
      const r = await orderService.undoCommand(orderId, user?.fullName||'Admin');
      if (!r.success) { toast.error(r.message||'Không thể hoàn tác'); return; }
      toast.success('Đã hoàn tác thao tác');
      setCanUndo(r.data?.canUndo??false); setCanRedo(r.data?.canRedo??false);
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleRedo = async (orderId) => {
    setProcessing(orderId);
    try {
      const r = await orderService.redoCommand(orderId, user?.fullName || 'Admin');
      if (!r.success) { toast.error(r.message || 'Không thể Redo'); return; }
      toast.success('Làm lại thành công');
      setCanUndo(r.data?.canUndo ?? false); setCanRedo(r.data?.canRedo ?? false);
      await fetchOrders(); await viewDetail(orderId);
    } catch (err) { toast.error(err.message); }
    finally { setProcessing(null); }
  };

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    
    // CSV Header
    const headers = ['Mã ĐH', 'Khách hàng', 'Trạng thái', 'Ngày đặt', 'Tổng tiền', 'Phương thức thanh toán'];
    
    // CSV Rows
    const rows = orders.map(o => [
      o.orderNumber,
      `"${o.userName}"`,
      `"${STATUS[o.status]?.label || o.status}"`,
      new Date(o.createdAt).toLocaleDateString('vi-VN'),
      o.totalAmount,
      o.paymentMethod
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');
    
    // Create Blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF is BOM for UTF-8 Excel support
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DonHang_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn #${selectedOrder.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .info-col { width: 45%; }
            .info-title { font-weight: bold; margin-bottom: 5px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #f8f9fa; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; font-size: 16px; }
            .footer { margin-top: 50px; text-align: center; font-style: italic; color: #666; }
            .signature { display: flex; justify-content: space-around; margin-top: 40px; }
            .sig-box { text-align: center; }
            .sig-space { height: 80px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>HÓA ĐƠN BÁN HÀNG</h1>
            <p>Mã đơn: <strong>${selectedOrder.orderNumber}</strong> | Ngày: ${new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-col">
              <div class="info-title">Thông tin khách hàng:</div>
              <div>Họ tên: ${selectedOrder.shippingFullName || selectedOrder.userName}</div>
              <div>SĐT: ${selectedOrder.shippingPhone || selectedOrder.phoneNumber}</div>
              <div>Địa chỉ: ${[selectedOrder.shippingAddress, selectedOrder.shippingWard, selectedOrder.shippingDistrict, selectedOrder.shippingCity].filter(Boolean).join(', ')}</div>
            </div>
            <div class="info-col">
              <div class="info-title">Thông tin thanh toán:</div>
              <div>Phương thức: ${selectedOrder.paymentMethod}</div>
              <div>Trạng thái: ${selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
              <div>Ghi chú: ${selectedOrder.notes || 'Không'}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th class="text-right">Số lượng</th>
                <th class="text-right">Đơn giá</th>
                <th class="text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${selectedOrder.orderDetails.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">${item.unitPrice.toLocaleString()}đ</td>
                  <td class="text-right">${(item.quantity * item.unitPrice).toLocaleString()}đ</td>
                </tr>
              `).join('')}
              ${selectedOrder.installationFee > 0 ? `
                <tr>
                  <td colspan="3" class="text-right">Phí lắp đặt</td>
                  <td class="text-right">${selectedOrder.installationFee.toLocaleString()}đ</td>
                </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="3" class="text-right">Tổng cộng:</td>
                <td class="text-right">${selectedOrder.totalAmount.toLocaleString()}đ</td>
              </tr>
            </tbody>
          </table>
          
          <div class="signature">
            <div class="sig-box">
              <div><strong>Người mua hàng</strong></div>
              <div class="sig-space"></div>
              <div>(Ký, ghi rõ họ tên)</div>
            </div>
            <div class="sig-box">
              <div><strong>Người bán hàng</strong></div>
              <div class="sig-space"></div>
              <div>(Ký, ghi rõ họ tên)</div>
            </div>
          </div>
          
          <div class="footer">
            Cảm ơn quý khách đã mua sắm tại FurnitureShop!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // setTimeout to allow images/css to load before printing
    setTimeout(() => {
      printWindow.print();
      // printWindow.close(); // Optional: close after print
    }, 250);
  };

  const nextLabel = { 1:'Xác nhận đơn', 2:'Giao hàng', 3:'Hoàn thành' };

  const pendingCount = orders.filter(o => o.status === 0 || o.status === '0' || o.status === 1 || o.status === '1').length;
  const shippingCount = orders.filter(o => o.status === 2 || o.status === '2').length;
  const completedCount = orders.filter(o => o.status === 3 || o.status === '3').length;

  return (
    <AdminLayout>
      <PageHeader 
        title="Quản lý Đơn hàng" 
        subtitle="Theo dõi, xử lý trạng thái và vận chuyển đơn đặt hàng nội thất"
        breadcrumb={['Admin', 'Thương mại', 'Quản lý đơn hàng']}
      >
        <Btn variant="outline" onClick={handleExportCSV}>📥 Xuất Excel (CSV)</Btn>
      </PageHeader>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">Chờ Xử Lý / Xác Nhận</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{pendingCount} <span className="text-xs font-normal text-zinc-400">đơn</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-100">
            📦
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-1">Đang Giao Hàng</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{shippingCount} <span className="text-xs font-normal text-zinc-400">đơn</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100">
            🚚
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Đã Hoàn Thành</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{completedCount} <span className="text-xs font-normal text-zinc-400">đơn</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
            ✅
          </div>
        </div>
      </div>

      <Filters>
        <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm theo mã đơn, tên, SĐT..." />
        <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </FilterSelect>
      </Filters>

      <TableCard>
        <Table>
          <Thead>
            <Th>Mã đơn</Th><Th>Khách hàng</Th><Th>SĐT</Th><Th>Tổng tiền</Th>
            <Th>Thanh toán</Th><Th>Trạng thái</Th><Th>Ngày đặt</Th><Th>Hành động</Th>
          </Thead>
          <tbody>
            {loading ? <TableState type="loading" colSpan={8} /> :
             error   ? <TableState type="error" colSpan={8} message={error} /> :
             orders.length === 0 ? <TableState type="empty" colSpan={8} message="Không có đơn hàng nào" /> :
             orders.map(o => (
              <tr key={o.orderId} className="hover:bg-slate-50 transition-colors">
                <Td><span className="font-mono text-indigo-600 font-medium text-xs">{o.orderNumber}</span></Td>
                <Td><span className="font-medium">{o.shippingFullName}</span></Td>
                <Td className="text-slate-500">{o.shippingPhone}</Td>
                <Td className="font-semibold text-slate-700">{fmt(o.totalAmount)}</Td>
                <Td><Badge variant={o.isPaid ? 'paid' : 'unpaid'}>{o.isPaid ? '✓ Đã TT' : '○ Chưa TT'}</Badge></Td>
                <Td><Badge variant={STATUS[o.status]?.variant}>{STATUS[o.status]?.icon} {STATUS[o.status]?.label||'N/A'}</Badge></Td>
                <Td className="text-slate-400 text-xs">{fmtDate(o.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <ActionBtn variant="view" onClick={() => viewDetail(o.orderId)} title="Xem chi tiết">👁️</ActionBtn>
                    {o.status < 4 && <ActionBtn variant="next" onClick={() => { setSelectedOrder(o); handleTransition(o.orderId); }} title={nextLabel[o.status]} disabled={processing === o.orderId}>➡️</ActionBtn>}
                    {o.status < 3 && <ActionBtn variant="delete" onClick={() => { setSelectedOrder(o); handleCancel(o.orderId); }} title="Hủy đơn" disabled={processing === o.orderId}>❌</ActionBtn>}
                    {o.status === 4 && <ActionBtn variant="reset" onClick={() => { setSelectedOrder(o); handleNextStateGeneric(o.orderId, 7); }} title="Trả hàng" disabled={processing === o.orderId}>🔙</ActionBtn>}
                    {o.status === 5 && <ActionBtn variant="reset" onClick={() => { setSelectedOrder(o); handleNextStateGeneric(o.orderId, 6); }} title="Hoàn tiền" disabled={processing === o.orderId}>💸</ActionBtn>}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(p-1,1))}
            onNext={() => setCurrentPage(p => Math.min(p+1,totalPages))} />
        )}
      </TableCard>

      {/* Order Detail Modal */}
      <Modal show={showDetail} onClose={() => setShowDetail(false)} title={`Chi tiết đơn hàng #${selectedOrder?.orderNumber}`} size="xl">
        {selectedOrder && (
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Status + Actions */}
            <div className="flex flex-wrap items-start gap-4">
              <div>
                <Badge variant={STATUS[selectedOrder.status]?.variant} >
                  {STATUS[selectedOrder.status]?.icon} {STATUS[selectedOrder.status]?.label}
                </Badge>
                {stateDesc && <p className="text-xs text-slate-400 italic mt-1 m-0">{stateDesc}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 8 && (
                    <Btn variant="primary" onClick={() => handleApproveReturn(selectedOrder.orderId)} disabled={processing === selectedOrder.orderId}>
                      📦 Phê duyệt Trả hàng
                    </Btn>
                  )}
                  {selectedOrder.status < 4 && nextLabel[selectedOrder.status] && (
                    <Btn onClick={() => handleTransition(selectedOrder.orderId)} disabled={processing === selectedOrder.orderId}>
                      {nextLabel[selectedOrder.status]}
                    </Btn>
                  )}
                  {selectedOrder.status < 3 && (
                    <Btn variant="danger" onClick={() => handleCancel(selectedOrder.orderId)} disabled={processing === selectedOrder.orderId}>Hủy đơn</Btn>
                  )}
                  {selectedOrder.status === 4 && (
                    <Btn variant="outline" onClick={() => handleNextStateGeneric(selectedOrder.orderId, 7)} disabled={processing === selectedOrder.orderId}>🔙 Trả hàng</Btn>
                  )}
                  {selectedOrder.status === 5 && (
                    <Btn variant="outline" onClick={() => handleNextStateGeneric(selectedOrder.orderId, 6)} disabled={processing === selectedOrder.orderId}>💸 Hoàn tiền</Btn>
                  )}
                  {canUndo && <Btn variant="outline" onClick={() => handleUndo(selectedOrder.orderId)} disabled={processing === selectedOrder.orderId}>↶ Hoàn tác</Btn>}
                  {canRedo && <Btn variant="outline" onClick={() => handleRedo(selectedOrder.orderId)} disabled={processing === selectedOrder.orderId}>↷ Làm lại</Btn>}
                </div>
              {selectedOrder.status >= 4 && selectedOrder.status <= 5 && (
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 4 && (
                    <Btn variant="outline" onClick={() => handleNextStateGeneric(selectedOrder.orderId, 7)} disabled={processing === selectedOrder.orderId}>🔙 Trả hàng</Btn>
                  )}
                  {selectedOrder.status === 5 && (
                    <Btn variant="outline" onClick={() => handleNextStateGeneric(selectedOrder.orderId, 6)} disabled={processing === selectedOrder.orderId}>💸 Hoàn tiền</Btn>
                  )}
                </div>
              )}
            </div>

            {/* Shipping */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 m-0">Thông tin giao hàng</h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Người nhận" value={selectedOrder.shippingFullName} />
                <InfoItem label="Số điện thoại" value={selectedOrder.shippingPhone} />
                <InfoItem label="Địa chỉ" full value={[selectedOrder.shippingAddress, selectedOrder.shippingWard, selectedOrder.shippingDistrict, selectedOrder.shippingCity].filter(Boolean).join(', ')} />
                {selectedOrder.notes && <InfoItem label="Ghi chú" full value={selectedOrder.notes} />}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                <InfoItem label="Dịch vụ lắp đặt" value={selectedOrder.requireInstallation ? 'Có yêu cầu lắp đặt' : 'Không'} />
                {selectedOrder.requireInstallation && <InfoItem label="Phí lắp đặt" value={fmt(selectedOrder.installationFee)} />}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Sản phẩm đặt mua</h3>
              <div className="bg-slate-50 rounded-xl overflow-hidden">
                <table className="w-full border-collapse text-sm">
                  <thead><tr className="border-b border-slate-200">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Sản phẩm</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase">Đơn giá</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-400 uppercase">SL</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase">Thành tiền</th>
                  </tr></thead>
                  <tbody>
                    {selectedOrder.orderDetails?.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-700">{item.productName}</div>
                          {item.productSku && <div className="text-xs text-slate-400">SKU: {item.productSku}</div>}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{fmt(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmt(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200">
                    <tr><td colSpan={3} className="px-4 py-2 text-right text-slate-500 text-xs">Tạm tính:</td><td className="px-4 py-2 text-right text-sm">{fmt(selectedOrder.subTotal)}</td></tr>
                    <tr><td colSpan={3} className="px-4 py-2 text-right text-slate-500 text-xs">Phí vận chuyển:</td><td className="px-4 py-2 text-right text-sm">{fmt(selectedOrder.shippingFee)}</td></tr>
                    {selectedOrder.requireInstallation && <tr><td colSpan={3} className="px-4 py-2 text-right text-slate-500 text-xs">Phí lắp đặt:</td><td className="px-4 py-2 text-right text-sm">{fmt(selectedOrder.installationFee)}</td></tr>}
                    <tr className="font-bold"><td colSpan={3} className="px-4 py-2 text-right text-slate-700 text-sm">Tổng cộng:</td><td className="px-4 py-2 text-right text-sm text-indigo-600">{fmt(selectedOrder.totalAmount)}</td></tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 m-0">Thông tin thanh toán</h3>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="Phương thức" value={selectedOrder.paymentMethod || 'COD'} />
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Trạng thái</span>
                  <div className="mt-1"><Badge variant={selectedOrder.isPaid ? 'paid' : 'unpaid'}>{selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Badge></div>
                </div>
                {selectedOrder.paidAt && <InfoItem label="Ngày thanh toán" value={fmtDate(selectedOrder.paidAt)} />}
              </div>
            </div>

            {/* Timeline */}
            {selectedOrder.statusHistories?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Lịch sử đơn hàng</h3>
                <div className="flex flex-col gap-0">
                  {selectedOrder.statusHistories.map((h, i) => (
                    <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                        {i < selectedOrder.statusHistories.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex flex-col pb-1">
                        <span className="text-sm font-medium text-slate-700">{STATUS[h.toStatus]?.label || `Trạng thái ${h.toStatus}`}</span>
                        <span className="text-xs text-slate-400">{fmtDate(h.changedAt)}</span>
                        {h.notes && <span className="text-xs text-slate-500 italic mt-0.5">{h.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Logs */}
            {auditLogs?.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Nhật ký hệ thống (Audit Logs)</h3>
                <div className="flex flex-col gap-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-white p-3 rounded border border-slate-200 text-xs">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-700">{log.action}</span>
                        <span className="text-slate-400">{fmtDate(log.createdAt)}</span>
                      </div>
                      <div className="text-slate-600 mb-1">
                        Thực hiện bởi: <span className="font-medium">{log.userId ? `User ID ${log.userId}` : 'Hệ thống'}</span>
                      </div>
                      <div className="text-slate-500 break-words font-mono text-[10px] bg-slate-50 p-1 rounded">
                        {log.details}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminOrders;
