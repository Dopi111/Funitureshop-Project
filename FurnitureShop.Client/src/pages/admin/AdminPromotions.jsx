import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import couponService from '../../services/couponService';
import { PageHeader, TableCard, Table, Thead, Th, Td, TableState, ActionBtn, Modal, Btn, Badge, Filters, SearchInput, FilterSelect } from '../../components/admin/ui';

export default function AdminPromotions() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountPercentage: 0,
        maxDiscountAmount: '',
        minOrderAmount: '',
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
        usageLimit: 0,
        isActive: true
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const res = await couponService.getAllCoupons();
            if (res.success) {
                setCoupons(res.data || []);
            }
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code || '',
                description: coupon.description || '',
                discountPercentage: coupon.discountPercentage || 0,
                maxDiscountAmount: coupon.maxDiscountAmount || '',
                minOrderAmount: coupon.minOrderAmount || '',
                startDate: coupon.startDate ? coupon.startDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
                endDate: coupon.endDate ? coupon.endDate.slice(0, 16) : new Date().toISOString().slice(0, 16),
                usageLimit: coupon.usageLimit || 0,
                isActive: coupon.isActive !== undefined ? coupon.isActive : true
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                description: '',
                discountPercentage: 0,
                maxDiscountAmount: '',
                minOrderAmount: '',
                startDate: new Date().toISOString().slice(0, 16),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 16),
                usageLimit: 0,
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.code.trim() || formData.discountPercentage <= 0) {
            toast.error('Vui lòng nhập mã và phần trăm giảm giá hợp lệ (> 0%)');
            return;
        }
        
        try {
            const dataToSave = {
                ...formData,
                code: formData.code.toUpperCase().trim(),
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null
            };

            if (editingCoupon) {
                const res = await couponService.updateCoupon(editingCoupon.couponId, { ...dataToSave, couponId: editingCoupon.couponId });
                if (res.success) {
                    toast.success('Cập nhật mã giảm giá thành công');
                    setShowModal(false);
                    fetchCoupons();
                } else {
                    toast.error(res.message || 'Cập nhật thất bại');
                }
            } else {
                const res = await couponService.createCoupon(dataToSave);
                if (res.success) {
                    toast.success('Tạo mã giảm giá mới thành công');
                    setShowModal(false);
                    fetchCoupons();
                } else {
                    toast.error(res.message || 'Tạo mới thất bại');
                }
            }
        } catch (error) {
            toast.error('Lỗi khi lưu mã giảm giá');
        }
    };

    const handleDeleteConfirm = async (id) => {
        try {
            const res = await couponService.deleteCoupon(id);
            if (res.success) {
                toast.success('Đã xóa mã giảm giá');
                setConfirmDeleteId(null);
                fetchCoupons();
            } else {
                toast.error(res.message || 'Xóa thất bại');
            }
        } catch (error) {
            toast.error('Lỗi khi xóa mã giảm giá');
        }
    };

    // Filtered coupons
    const filteredCoupons = coupons.filter(c => {
        const matchesSearch = !searchTerm || (
            (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        let matchesStatus = true;
        const isNotExpired = new Date(c.endDate) > new Date();
        if (statusFilter === 'active') matchesStatus = c.isActive && isNotExpired;
        else if (statusFilter === 'expired') matchesStatus = !isNotExpired;
        else if (statusFilter === 'inactive') matchesStatus = !c.isActive;
        return matchesSearch && matchesStatus;
    });

    // KPI Metrics calculation
    const now = new Date();
    const activeCouponsCount = coupons.filter(c => c.isActive && new Date(c.endDate) > now).length;
    const totalUsedCount = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
    const expiringSoonCount = coupons.filter(c => {
        if (!c.isActive) return false;
        const end = new Date(c.endDate);
        const diffDays = (end - now) / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
    }).length;

    return (
        <AdminLayout>
            <PageHeader 
                title="Quản lý Khuyến mãi" 
                subtitle="Thiết lập mã giảm giá, voucher chiến dịch và giới hạn áp dụng"
                breadcrumb={['Admin', 'Thương mại', 'Khuyến mãi & Coupon']}
            >
                <Btn variant="primary" onClick={() => handleOpenModal()}>
                    + Thêm mã voucher
                </Btn>
            </PageHeader>

            {/* KPI Bento Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Mã Đang Hiệu Lực</div>
                        <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{activeCouponsCount} <span className="text-xs font-normal text-zinc-400">campaigns</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
                        🎟️
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">Tổng Lượt Đã Dùng</div>
                        <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{totalUsedCount.toLocaleString()} <span className="text-xs font-normal text-zinc-400">lượt</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl font-bold">
                        🔥
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">Sắp Hết Hạn (7 ngày)</div>
                        <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{expiringSoonCount} <span className="text-xs font-normal text-zinc-400">mã</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-100">
                        ⏳
                    </div>
                </div>
            </div>

            <Filters>
                <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Tìm theo mã coupon (VD: SUMMER2024), mô tả..." 
                />
                <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hiệu lực</option>
                    <option value="expired">Đã hết hạn</option>
                    <option value="inactive">Đã tạm tắt</option>
                </FilterSelect>
            </Filters>

            <TableCard>
                <Table>
                    <Thead>
                        <tr>
                            <Th>Mã Coupon</Th>
                            <Th>Mức giảm</Th>
                            <Th>Điều kiện áp dụng</Th>
                            <Th>Thời hạn hiệu lực</Th>
                            <Th>Lượt dùng</Th>
                            <Th>Trạng thái</Th>
                            <Th align="right">Thao tác</Th>
                        </tr>
                    </Thead>
                    <tbody>
                        {loading ? (
                            <TableState type="loading" colSpan={7} message="Đang tải danh sách khuyến mãi..." />
                        ) : filteredCoupons.length === 0 ? (
                            <TableState type="empty" colSpan={7} message="Chưa có mã giảm giá nào phù hợp" />
                        ) : (
                            filteredCoupons.map(c => {
                                const isExpired = new Date(c.endDate) < now;
                                const percentUsed = c.usageLimit > 0 ? Math.min(100, Math.round((c.usedCount / c.usageLimit) * 100)) : 0;
                                const isConfirming = confirmDeleteId === c.couponId;

                                return (
                                    <tr key={c.couponId} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors">
                                        <Td>
                                            <div className="space-y-1">
                                                <span className="inline-block bg-[#0D0D0D] text-[#FDFBF7] font-mono text-xs font-bold px-2.5 py-1 rounded-md tracking-wider uppercase border border-zinc-800 shadow-2xs">
                                                    {c.code}
                                                </span>
                                                {c.description && <div className="text-[11px] text-zinc-500 font-light max-w-[180px] truncate" title={c.description}>{c.description}</div>}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="font-bold text-zinc-900 text-sm">{c.discountPercentage}%</div>
                                            {c.maxDiscountAmount ? (
                                                <div className="text-[11px] text-zinc-400 font-mono">Tối đa: {c.maxDiscountAmount.toLocaleString()}đ</div>
                                            ) : (
                                                <div className="text-[11px] text-zinc-400 italic">Không giới hạn</div>
                                            )}
                                        </Td>
                                        <Td>
                                            {c.minOrderAmount ? (
                                                <div className="text-xs font-mono text-zinc-700">Đơn từ: <span className="font-bold">{c.minOrderAmount.toLocaleString()}đ</span></div>
                                            ) : (
                                                <span className="text-xs text-zinc-400 italic">Mọi đơn hàng</span>
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="text-xs space-y-0.5 font-mono">
                                                <div className="text-zinc-500">Từ: {new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                                                <div className={isExpired ? 'text-rose-600 font-bold' : 'text-zinc-800 font-medium'}>
                                                    Đến: {new Date(c.endDate).toLocaleDateString('vi-VN')}
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="w-28 space-y-1">
                                                <div className="flex justify-between text-xs font-mono">
                                                    <span className="font-bold text-zinc-800">{c.usedCount || 0}</span>
                                                    <span className="text-zinc-400">/ {c.usageLimit === 0 ? '∞' : c.usageLimit}</span>
                                                </div>
                                                {c.usageLimit > 0 && (
                                                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200/60">
                                                        <div 
                                                            className={`h-full transition-all duration-500 ${percentUsed >= 90 ? 'bg-rose-500' : percentUsed >= 70 ? 'bg-amber-500' : 'bg-[#0D0D0D]'}`} 
                                                            style={{ width: `${percentUsed}%` }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>
                                            {isExpired ? (
                                                <Badge variant="inactive">Đã hết hạn</Badge>
                                            ) : (
                                                <Badge variant={c.isActive ? 'active' : 'inactive'}>
                                                    {c.isActive ? 'Hoạt động' : 'Tạm khóa'}
                                                </Badge>
                                            )}
                                        </Td>
                                        <Td align="right">
                                            {isConfirming ? (
                                                <div className="inline-flex items-center gap-1.5 animate-fade-in">
                                                    <button 
                                                        onClick={() => handleDeleteConfirm(c.couponId)}
                                                        className="px-2 py-1 bg-rose-600 text-white rounded-md text-[11px] font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                                                    >
                                                        Xóa ngay
                                                    </button>
                                                    <button 
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[11px] font-medium hover:bg-zinc-200 transition-colors cursor-pointer"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-1.5">
                                                    <ActionBtn variant="edit" onClick={() => handleOpenModal(c)} title="Sửa mã voucher">✏️</ActionBtn>
                                                    <ActionBtn variant="delete" onClick={() => setConfirmDeleteId(c.couponId)} title="Xóa mã voucher">🗑️</ActionBtn>
                                                </div>
                                            )}
                                        </Td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </TableCard>

            <Modal 
                show={showModal} 
                title={editingCoupon ? `Cập nhật mã voucher: ${editingCoupon.code}` : 'Tạo Mã Khuyến Mãi Mới'} 
                onClose={() => setShowModal(false)}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                                Mã Coupon <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono uppercase font-bold focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit'] placeholder:font-normal"
                                value={formData.code}
                                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="VD: SUMMER2024"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                                % Giảm giá <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="1" max="100"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-bold focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.discountPercentage}
                                onChange={e => setFormData({...formData, discountPercentage: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Mô tả chiến dịch</label>
                        <input
                            type="text"
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            placeholder="Giảm 20% cho toàn bộ bàn ghế sofa hè 2024..."
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Giảm tối đa (VNĐ)</label>
                            <input
                                type="number"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.maxDiscountAmount}
                                onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})}
                                placeholder="Để trống nếu ko giới hạn"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Đơn tối thiểu (VNĐ)</label>
                            <input
                                type="number"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.minOrderAmount}
                                onChange={e => setFormData({...formData, minOrderAmount: e.target.value})}
                                placeholder="VD: 500000"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Ngày bắt đầu</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.startDate}
                                onChange={e => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Ngày kết thúc</label>
                            <input
                                type="datetime-local"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.endDate}
                                onChange={e => setFormData({...formData, endDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Giới hạn số lần dùng</label>
                            <input
                                type="number"
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 font-mono focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']"
                                value={formData.usageLimit}
                                onChange={e => setFormData({...formData, usageLimit: parseInt(e.target.value) || 0})}
                                placeholder="0 = không giới hạn"
                            />
                        </div>
                        <div className="pt-4 sm:pt-6">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded text-[#0D0D0D] focus:ring-[#0D0D0D] cursor-pointer"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                />
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-800">Kích hoạt voucher</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                        <Btn variant="outline" onClick={() => setShowModal(false)}>Hủy</Btn>
                        <Btn type="submit" variant="primary">{editingCoupon ? 'Lưu thay đổi' : 'Phát hành voucher'}</Btn>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
