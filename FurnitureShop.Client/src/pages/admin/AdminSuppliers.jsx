import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { PageHeader, TableCard, Table, Thead, Th, Td, TableState, Btn, Modal, FormBody, ActionBtn, Badge, Filters, SearchInput, FilterSelect } from '../../components/admin/ui';
import apiService from '../../services/apiService';

const AdminSuppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        isActive: true
    });

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await apiService.request('/Inventory/suppliers', { method: 'GET' });
            if (res.success) {
                setSuppliers(res.data || []);
            } else {
                toast.error(res.message || 'Lỗi khi tải danh sách nhà cung cấp');
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách nhà cung cấp');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenModal = (supplier = null) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name || '',
                phone: supplier.phone || '',
                email: supplier.email || '',
                address: supplier.address || '',
                notes: supplier.notes || '',
                isActive: supplier.isActive !== undefined ? supplier.isActive : true
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: '',
                phone: '',
                email: '',
                address: '',
                notes: '',
                isActive: true
            });
        }
        setIsModalVisible(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên nhà cung cấp');
            return;
        }

        try {
            if (editingSupplier) {
                const res = await apiService.request(`/Inventory/suppliers/${editingSupplier.supplierId}`, {
                    method: 'PUT',
                    data: { ...formData, supplierId: editingSupplier.supplierId }
                });
                if (res.success) {
                    toast.success('Cập nhật thông tin thành công');
                    setIsModalVisible(false);
                    fetchSuppliers();
                } else {
                    toast.error(res.message || 'Cập nhật thất bại');
                }
            } else {
                const res = await apiService.request('/Inventory/suppliers', {
                    method: 'POST',
                    data: formData
                });
                if (res.success) {
                    toast.success('Thêm nhà cung cấp thành công');
                    setIsModalVisible(false);
                    fetchSuppliers();
                } else {
                    toast.error(res.message || 'Thêm thất bại');
                }
            }
        } catch (error) {
            toast.error('Có lỗi xảy ra khi lưu thông tin');
        }
    };

    const handleDelete = async (id, name) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa/ngừng hợp tác nhà cung cấp "${name}"?`)) {
            try {
                const res = await apiService.request(`/Inventory/suppliers/${id}`, { method: 'DELETE' });
                if (res.success) {
                    toast.success('Đã ngừng hợp tác nhà cung cấp');
                    fetchSuppliers();
                } else {
                    toast.error(res.message || 'Thao tác thất bại');
                }
            } catch (error) {
                toast.error('Lỗi kết nối khi xóa nhà cung cấp');
            }
        }
    };

    // Filter suppliers
    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = !searchTerm || (
            (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.address || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesStatus = statusFilter === '' ? true : String(s.isActive) === String(statusFilter);
        return matchesSearch && matchesStatus;
    });

    const activeCount = suppliers.filter(s => s.isActive).length;

    return (
        <AdminLayout>
            <PageHeader 
                title="Quản lý Nhà cung cấp" 
                subtitle="Danh sách đối tác cung ứng nội thất & nguyên vật liệu"
                breadcrumb={['Admin', 'Kho & Vận chuyển', 'Đối tác cung cấp']}
            >
                <Btn variant="primary" onClick={() => handleOpenModal()}>
                    + Thêm nhà cung cấp
                </Btn>
            </PageHeader>

            {/* KPI Bento Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-zinc-400 mb-1">Tổng Đối Tác</div>
                        <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{suppliers.length} <span className="text-xs font-normal text-zinc-400">đơn vị</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center text-xl font-bold">
                        🏢
                    </div>
                </div>

                <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
                    <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Đang Hợp Tác</div>
                        <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{activeCount} <span className="text-xs font-normal text-zinc-400">hoạt động</span></div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
                        🤝
                    </div>
                </div>
            </div>

            <Filters>
                <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Tìm theo tên đối tác, số điện thoại, email..." 
                />
                <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="true">Đang hợp tác</option>
                    <option value="false">Ngưng hợp tác</option>
                </FilterSelect>
            </Filters>

            <TableCard>
                <Table>
                    <Thead>
                        <tr>
                            <Th>Đối tác cung ứng</Th>
                            <Th>Liên hệ</Th>
                            <Th>Địa chỉ & Ghi chú</Th>
                            <Th>Trạng thái</Th>
                            <Th align="right">Thao tác</Th>
                        </tr>
                    </Thead>
                    <tbody>
                        {loading ? (
                            <TableState type="loading" colSpan={5} message="Đang tải danh sách nhà cung cấp..." />
                        ) : filteredSuppliers.length === 0 ? (
                            <TableState type="empty" colSpan={5} message="Không có nhà cung cấp nào phù hợp" />
                        ) : (
                            filteredSuppliers.map(s => {
                                const firstChar = (s.name || 'N')[0].toUpperCase();
                                return (
                                    <tr key={s.supplierId} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors">
                                        <Td>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#C9A87C]/15 text-[#C9A87C] border border-[#C9A87C]/20 flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                                                    {firstChar}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 text-sm">{s.name}</div>
                                                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">ID: #{s.supplierId}</div>
                                                </div>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="space-y-1">
                                                {s.phone && (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-mono">
                                                        <span>📞</span> {s.phone}
                                                    </div>
                                                )}
                                                {s.email && (
                                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                        <span>✉️</span> {s.email}
                                                    </div>
                                                )}
                                                {!s.phone && !s.email && <span className="text-zinc-400 text-xs italic">Chưa có liên hệ</span>}
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="max-w-xs">
                                                <div className="text-xs text-zinc-800 line-clamp-1">{s.address || 'Chưa cập nhật địa chỉ'}</div>
                                                {s.notes && <div className="text-[11px] text-zinc-400 italic mt-0.5 line-clamp-1">"{s.notes}"</div>}
                                            </div>
                                        </Td>
                                        <Td>
                                            <Badge variant={s.isActive ? 'active' : 'inactive'}>
                                                {s.isActive ? 'Hoạt động' : 'Đã khóa'}
                                            </Badge>
                                        </Td>
                                        <Td align="right">
                                            <div className="flex justify-end gap-1.5">
                                                <ActionBtn variant="edit" onClick={() => handleOpenModal(s)} title="Sửa thông tin">
                                                    ✏️
                                                </ActionBtn>
                                                <ActionBtn variant="delete" onClick={() => handleDelete(s.supplierId, s.name)} title="Ngừng hợp tác / Xóa">
                                                    🗑️
                                                </ActionBtn>
                                            </div>
                                        </Td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </TableCard>

            <Modal 
                show={isModalVisible} 
                title={editingSupplier ? `Cập nhật đối tác #${editingSupplier.supplierId}` : 'Thêm Nhà Cung Cấp Mới'} 
                onClose={() => setIsModalVisible(false)}
            >
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">
                            Tên nhà cung cấp <span className="text-rose-500">*</span>
                        </label>
                        <input 
                            required 
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']" 
                            placeholder="VD: Công ty TNHH Gỗ An Cường"
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Số điện thoại</label>
                            <input 
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit'] font-mono" 
                                placeholder="0987xxx..."
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Email liên hệ</label>
                            <input 
                                type="email" 
                                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']" 
                                placeholder="contact@supplier.com"
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Địa chỉ kho / trụ sở</label>
                        <textarea 
                            rows={2}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']" 
                            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành..."
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-1.5">Ghi chú hợp đồng / thanh toán</label>
                        <textarea 
                            rows={2}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#0D0D0D] transition-all shadow-2xs font-['Outfit']" 
                            placeholder="Chiết khấu 10%, công nợ 30 ngày..."
                            value={formData.notes} 
                            onChange={e => setFormData({...formData, notes: e.target.value})} 
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <input 
                            type="checkbox" 
                            id="isActiveSupplier"
                            className="w-4 h-4 rounded text-[#0D0D0D] focus:ring-[#0D0D0D] cursor-pointer"
                            checked={formData.isActive}
                            onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        />
                        <label htmlFor="isActiveSupplier" className="text-xs font-medium text-zinc-800 cursor-pointer select-none">
                            Đang hợp tác hoạt động
                        </label>
                    </div>

                    <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                        <Btn variant="outline" onClick={() => setIsModalVisible(false)}>Hủy</Btn>
                        <Btn type="submit" variant="primary">{editingSupplier ? 'Cập nhật' : 'Lưu đối tác'}</Btn>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
};

export default AdminSuppliers;
