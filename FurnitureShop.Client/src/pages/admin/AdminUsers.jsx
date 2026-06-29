// src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader, Btn, Filters, SearchInput, FilterSelect,
  TableCard, Table, Thead, Th, Td, Badge, ActionBtn, Pagination,
  TableState, Modal, FormBody, FormRow, FormGroup, FormInput,
  FormSelect, FormCheckbox, FormActions, FormError,
} from '../../components/admin/ui';

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', fullName: '', phoneNumber: '', address: '', city: '', district: '', ward: '', role: 0, isActive: true });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const pageSize = 10;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, pageSize });
      if (roleFilter !== '') params.append('role', roleFilter);
      if (statusFilter !== '') params.append('isActive', statusFilter);
      const r = await fetch(`/api/auth/users?${params}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
      const data = await r.json();
      let list = data.data || data || [];
      if (roleFilter !== '') list = list.filter(u => String(u.role) === String(roleFilter));
      if (statusFilter !== '') list = list.filter(u => String(u.isActive) === String(statusFilter));
      if (searchTerm) list = list.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phoneNumber?.includes(searchTerm)
      );
      setUsers(list); setTotalPages(data.totalPages || 1); setError(null);
    } catch { setError('Không thể tải danh sách người dùng'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [currentPage, roleFilter, statusFilter]);
  useEffect(() => {
    const t = setTimeout(() => currentPage === 1 ? fetchUsers() : setCurrentPage(1), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

  const openAddModal = () => { setModalMode('add'); setSelectedUser(null); setFormData({ username:'',email:'',password:'',fullName:'',phoneNumber:'',address:'',city:'',district:'',ward:'',role:0,isActive:true }); setFormError(''); setShowModal(true); };
  const openEditModal = (u) => { setModalMode('edit'); setSelectedUser(u); setFormData({ username:u.username||'',email:u.email||'',password:'',fullName:u.fullName||'',phoneNumber:u.phoneNumber||'',address:u.address||'',city:u.city||'',district:u.district||'',ward:u.ward||'',role:u.role??0,isActive:u.isActive??true }); setFormError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedUser(null); setFormError(''); };
  const handleChange = (e) => { const {name,value,type,checked} = e.target; setFormData(p => ({...p,[name]:type==='checkbox'?checked:value})); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    const token = localStorage.getItem('authToken');
    try {
      const payload = { username:formData.username, email:formData.email, fullName:formData.fullName, phoneNumber:formData.phoneNumber, address:formData.address, city:formData.city, district:formData.district, ward:formData.ward, role:parseInt(formData.role), isActive:formData.isActive };
      if (formData.password) payload.password = formData.password;
      if (modalMode === 'add' && !formData.password) throw new Error('Vui lòng nhập mật khẩu cho tài khoản mới');
      const url = modalMode === 'add' ? '/api/auth/users' : `/api/auth/users/${selectedUser.userId}`;
      const r = await fetch(url, { method: modalMode === 'add' ? 'POST' : 'PUT', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${token}` }, body: JSON.stringify(modalMode === 'edit' ? {...payload,userId:selectedUser.userId} : payload) });
      const ct = r.headers.get('content-type');
      const data = ct?.includes('application/json') ? JSON.parse(await r.text()||'null') : null;
      if (!r.ok) throw new Error(data?.message || `Lỗi ${r.status}`);
      await fetchUsers(); closeModal();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleToggleStatus = async (userId, current) => {
    if (userId === user?.userId) { alert('Bạn không thể khóa tài khoản của chính mình!'); return; }
    if (!window.confirm(`Bạn có chắc chắn muốn ${current ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản này?`)) return;
    const r = await fetch(`/api/auth/users/${userId}/toggle-status`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
    if (!r.ok) { alert('Không thể thay đổi trạng thái'); return; }
    await fetchUsers();
  };

  const handleDelete = async (userId) => {
    if (userId === user?.userId) { alert('Bạn không thể xóa tài khoản của chính mình!'); return; }
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    const r = await fetch(`/api/auth/users/${userId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
    if (!r.ok) { alert('Không thể xóa người dùng'); return; }
    await fetchUsers();
  };

  const handleResetPassword = async (userId) => {
    const pw = window.prompt('Nhập mật khẩu mới:');
    if (!pw) return;
    if (pw.length < 6) { alert('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    const r = await fetch(`/api/auth/users/${userId}/reset-password`, { method: 'POST', headers: { 'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('authToken')}` }, body: JSON.stringify({ newPassword: pw }) });
    alert(r.ok ? 'Đặt lại mật khẩu thành công' : 'Không thể đặt lại mật khẩu');
  };

  const totalUsersCount = users.length;
  const customerCount = users.filter(u => u.role === 0 || u.role === '0' || u.role === 'Customer').length;
  const adminCount = users.filter(u => u.role !== 0 && u.role !== '0' && u.role !== 'Customer').length;

  return (
    <AdminLayout>
      <PageHeader 
        title="Khách hàng Thành viên" 
        subtitle="Quản lý danh sách tài khoản, phân quyền hồ sơ và thành viên mua sắm"
        breadcrumb={['Admin', 'Thương mại', 'Khách hàng thành viên']}
      >
        <Btn onClick={openAddModal}>+ Thêm người dùng</Btn>
      </PageHeader>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-1">Tổng Tài Khoản</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{totalUsersCount} <span className="text-xs font-normal text-zinc-400">người dùng</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100">
            👥
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Khách Hàng Thành Viên</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{customerCount} <span className="text-xs font-normal text-zinc-400">khách hàng</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
            🛍️
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-purple-600 mb-1">Nhân Viên & Quản Trị</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{adminCount} <span className="text-xs font-normal text-zinc-400">nhân sự</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold border border-purple-100">
            🛡️
          </div>
        </div>
      </div>

      <Filters>
        <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm theo tên, email, SĐT..." />
        <FilterSelect value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="0">Khách hàng</option>
          <option value="1">Admin</option>
          <option value="2">SuperAdmin</option>
          <option value="3">Quản lý Đơn hàng</option>
          <option value="4">Quản lý Kho</option>
        </FilterSelect>
        <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã khóa</option>
        </FilterSelect>
      </Filters>

      <TableCard>
        <Table>
          <Thead>
            <Th>ID</Th><Th>Tên đăng nhập</Th><Th>Họ tên</Th><Th>Email</Th>
            <Th>SĐT</Th><Th>Vai trò</Th><Th>Trạng thái</Th><Th>Đăng nhập gần nhất</Th><Th>Hành động</Th>
          </Thead>
          <tbody>
            {loading ? <TableState type="loading" colSpan={9} /> :
             error   ? <TableState type="error" colSpan={9} message={error} /> :
             users.length === 0 ? <TableState type="empty" colSpan={9} message="Không có người dùng nào" /> :
             users.map(u => (
              <tr key={u.userId} className="hover:bg-slate-50 transition-colors">
                <Td className="text-slate-400">{u.userId}</Td>
                <Td><span className="font-medium text-slate-700">{u.username}</span></Td>
                <Td>{u.fullName}</Td>
                <Td className="text-slate-500">{u.email}</Td>
                <Td>{u.phoneNumber || <span className="text-slate-300">—</span>}</Td>
                <Td>
                  <Badge variant={u.role === 2 ? 'admin' : u.role === 1 ? 'active' : u.role > 0 ? 'inactive' : 'customer'}>
                    {u.role === 2 ? 'SuperAdmin' : u.role === 1 ? 'Admin' : u.role === 3 ? 'Quản lý Đơn' : u.role === 4 ? 'Quản lý Kho' : 'Khách hàng'}
                  </Badge>
                </Td>
                <Td><Badge variant={u.isActive ? 'active' : 'inactive'}>{u.isActive ? 'Hoạt động' : 'Đã khóa'}</Badge></Td>
                <Td className="text-slate-400 text-xs">{formatDate(u.lastLoginAt)}</Td>
                <Td>
                  <div className="flex gap-1.5">
                    <ActionBtn variant="edit" onClick={() => openEditModal(u)} title="Sửa">✏️</ActionBtn>
                    <ActionBtn variant="reset" onClick={() => handleResetPassword(u.userId)} title="Đặt lại mật khẩu">🔑</ActionBtn>
                    <ActionBtn variant={u.isActive ? 'lock' : 'unlock'} onClick={() => handleToggleStatus(u.userId, u.isActive)} title={u.isActive ? 'Khóa' : 'Mở khóa'} disabled={u.userId === user?.userId}>
                      {u.isActive ? '🔒' : '🔓'}
                    </ActionBtn>
                    {u.userId !== user?.userId && u.role !== 1 && (
                      <ActionBtn variant="delete" onClick={() => handleDelete(u.userId)} title="Xóa">🗑️</ActionBtn>
                    )}
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

      <Modal show={showModal} onClose={closeModal} title={modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}>
        <FormBody onSubmit={handleSubmit}>
          <FormError message={formError} />
          <FormRow>
            <FormGroup label="Tên đăng nhập" required>
              <FormInput name="username" value={formData.username} onChange={handleChange} required disabled={modalMode === 'edit'} />
            </FormGroup>
            <FormGroup label="Email" required>
              <FormInput type="email" name="email" value={formData.email} onChange={handleChange} required />
            </FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Họ và tên" required>
              <FormInput name="fullName" value={formData.fullName} onChange={handleChange} required />
            </FormGroup>
            <FormGroup label="Số điện thoại">
              <FormInput type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </FormGroup>
          </FormRow>
          <FormGroup label={modalMode === 'add' ? 'Mật khẩu' : 'Mật khẩu mới (để trống nếu không đổi)'} required={modalMode === 'add'}>
            <FormInput type="password" name="password" value={formData.password} onChange={handleChange} required={modalMode === 'add'} minLength={6} placeholder={modalMode === 'edit' ? '••••••••' : ''} />
          </FormGroup>
          <FormGroup label="Địa chỉ">
            <FormInput name="address" value={formData.address} onChange={handleChange} />
          </FormGroup>
          <FormRow cols={3}>
            <FormGroup label="Tỉnh/Thành phố"><FormInput name="city" value={formData.city} onChange={handleChange} /></FormGroup>
            <FormGroup label="Quận/Huyện"><FormInput name="district" value={formData.district} onChange={handleChange} /></FormGroup>
            <FormGroup label="Phường/Xã"><FormInput name="ward" value={formData.ward} onChange={handleChange} /></FormGroup>
          </FormRow>
          <FormRow>
            <FormGroup label="Vai trò" required>
              <FormSelect name="role" value={formData.role} onChange={handleChange} required>
                <option value={0}>Khách hàng</option>
                <option value={1}>Admin</option>
                <option value={2}>SuperAdmin</option>
                <option value={3}>Quản lý Đơn hàng</option>
                <option value={4}>Quản lý Kho</option>
              </FormSelect>
            </FormGroup>
            <FormGroup label=" ">
              <FormCheckbox label="Tài khoản hoạt động" name="isActive" checked={formData.isActive} onChange={handleChange} />
            </FormGroup>
          </FormRow>
          <FormActions>
            <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
            <Btn type="submit" disabled={formLoading}>{formLoading ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm người dùng' : 'Cập nhật'}</Btn>
          </FormActions>
        </FormBody>
      </Modal>
    </AdminLayout>
  );
};

export default AdminUsers;
