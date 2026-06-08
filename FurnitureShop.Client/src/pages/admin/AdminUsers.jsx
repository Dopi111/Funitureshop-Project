// src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';
import '../../index.css';

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
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phoneNumber: '',
        address: '',
        city: '',
        district: '',
        ward: '',
        role: 0,
        isActive: true
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const pageSize = 10;

    const roleLabels = {
        0: { label: 'Khách hàng', class: 'customer' },
        1: { label: 'Admin', class: 'admin' }
    };

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: pageSize
            });

            if (roleFilter !== '') {
                params.append('role', roleFilter);
            }
            if (statusFilter !== '') {
                params.append('isActive', statusFilter);
            }

            const response = await fetch(`/api/auth/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            const data = await response.json();

            let filteredUsers = data.data || data || [];

            // Client-side search filter
            if (searchTerm) {
                filteredUsers = filteredUsers.filter(u =>
                    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.phoneNumber?.includes(searchTerm)
                );
            }

            setUsers(filteredUsers);
            setTotalPages(data.totalPages || 1);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, roleFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchUsers();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const openAddModal = () => {
        setModalMode('add');
        setSelectedUser(null);
        setFormData({
            username: '',
            email: '',
            password: '',
            fullName: '',
            phoneNumber: '',
            address: '',
            city: '',
            district: '',
            ward: '',
            role: 0,
            isActive: true
        });
        setFormError('');
        setShowModal(true);
    };

    const openEditModal = (userData) => {
        setModalMode('edit');
        setSelectedUser(userData);
        setFormData({
            username: userData.username || '',
            email: userData.email || '',
            password: '', // Don't populate password for security
            fullName: userData.fullName || '',
            phoneNumber: userData.phoneNumber || '',
            address: userData.address || '',
            city: userData.city || '',
            district: userData.district || '',
            ward: userData.ward || '',
            role: userData.role ?? 0,
            isActive: userData.isActive ?? true
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
        setFormError('');
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const token = localStorage.getItem('authToken');

        try {
            const userData = {
                username: formData.username,
                email: formData.email,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                address: formData.address,
                city: formData.city,
                district: formData.district,
                ward: formData.ward,
                role: parseInt(formData.role),
                isActive: formData.isActive
            };

            // Only include password if provided
            if (formData.password) {
                userData.password = formData.password;
            }

            let response;
            if (modalMode === 'add') {
                if (!formData.password) {
                    throw new Error('Vui lòng nhập mật khẩu cho tài khoản mới');
                }
                response = await fetch('/api/auth/users', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(userData)
                });
            } else {
                response = await fetch(`/api/auth/users/${selectedUser.userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...userData,
                        userId: selectedUser.userId
                    })
                });
            }

            const contentType = response.headers.get('content-type');
            let data = null;

            if (contentType && contentType.includes('application/json')) {
                const text = await response.text();
                if (text) {
                    data = JSON.parse(text);
                }
            }

            if (!response.ok) {
                throw new Error(data?.message || `Lỗi ${response.status}: Có lỗi xảy ra`);
            }

            await fetchUsers();
            closeModal();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        // Prevent admin from locking their own account
        if (userId === user?.userId) {
            alert('Bạn không thể khóa tài khoản của chính mình!');
            return;
        }

        const action = currentStatus ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản này?`)) {
            return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/auth/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Không thể ${action} tài khoản`);
            }

            await fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (userId) => {
        // Prevent admin from deleting their own account
        if (userId === user?.userId) {
            alert('Bạn không thể xóa tài khoản của chính mình!');
            return;
        }

        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) {
            return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể xóa người dùng');
            }

            await fetchUsers();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleResetPassword = async (userId) => {
        const newPassword = window.prompt('Nhập mật khẩu mới (để trống để hủy):');
        if (!newPassword) return;

        if (newPassword.length < 6) {
            alert('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/auth/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (!response.ok) {
                throw new Error('Không thể đặt lại mật khẩu');
            }

            alert('Đặt lại mật khẩu thành công');
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header">
                    <h1>Quản lý người dùng</h1>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + Thêm người dùng
                    </button>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email, SĐT..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="admin-filter-group">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="0">Khách hàng</option>
                            <option value="1">Admin</option>
                        </select>
                    </div>
                    <div className="admin-filter-group">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="true">Hoạt động</option>
                            <option value="false">Đã khóa</option>
                        </select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="admin-table-container">
                    {loading ? (
                        <div className="admin-loading">
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : error ? (
                        <div className="admin-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên đăng nhập</th>
                                        <th>Họ tên</th>
                                        <th>Email</th>
                                        <th>SĐT</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Đăng nhập gần nhất</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                Không có người dùng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map(userData => (
                                            <tr key={userData.userId}>
                                                <td>{userData.userId}</td>
                                                <td>
                                                    <span className="username">{userData.username}</span>
                                                </td>
                                                <td>{userData.fullName}</td>
                                                <td>{userData.email}</td>
                                                <td>{userData.phoneNumber || '-'}</td>
                                                <td>
                                                    <span className={`role-badge ${roleLabels[userData.role]?.class || ''}`}>
                                                        {roleLabels[userData.role]?.label || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${userData.isActive ? 'active' : 'inactive'}`}>
                                                        {userData.isActive ? 'Hoạt động' : 'Đã khóa'}
                                                    </span>
                                                </td>
                                                <td>{formatDate(userData.lastLoginAt)}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => openEditModal(userData)}
                                                            className="btn-action btn-edit"
                                                            title="Sửa"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(userData.userId)}
                                                            className="btn-action btn-reset"
                                                            title="Đặt lại mật khẩu"
                                                        >
                                                            🔑
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(userData.userId, userData.isActive)}
                                                            className={`btn-action ${userData.isActive ? 'btn-lock' : 'btn-unlock'}`}
                                                            title={userData.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                                                            disabled={userData.userId === user?.userId}
                                                        >
                                                            {userData.isActive ? '🔒' : '🔓'}
                                                        </button>
                                                        {userData.userId !== user?.userId && userData.role !== 1 && (
                                                            <button
                                                                onClick={() => handleDelete(userData.userId)}
                                                                className="btn-action btn-delete"
                                                                title="Xóa"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="admin-pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="pagination-btn"
                                    >
                                        ← Trước
                                    </button>
                                    <span className="pagination-info">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="pagination-btn"
                                    >
                                        Sau →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'add' ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng'}</h2>
                            <button onClick={closeModal} className="modal-close">&times;</button>
                        </div>

                        {formError && (
                            <div className="auth-error" style={{ margin: '0 1.5rem' }}>
                                <span>⚠️</span> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="username">Tên đăng nhập *</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleFormChange}
                                        required
                                        disabled={modalMode === 'edit'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="fullName">Họ và tên *</label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="phoneNumber">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">
                                    {modalMode === 'add' ? 'Mật khẩu *' : 'Mật khẩu mới (để trống nếu không đổi)'}
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    required={modalMode === 'add'}
                                    minLength={6}
                                    placeholder={modalMode === 'edit' ? '••••••••' : ''}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="address">Địa chỉ</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                />
                            </div>

                            <div className="form-row-3">
                                <div className="form-group">
                                    <label htmlFor="city">Tỉnh/Thành phố</label>
                                    <input
                                        type="text"
                                        id="city"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="district">Quận/Huyện</label>
                                    <input
                                        type="text"
                                        id="district"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleFormChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="ward">Phường/Xã</label>
                                    <input
                                        type="text"
                                        id="ward"
                                        name="ward"
                                        value={formData.ward}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="role">Vai trò *</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value={0}>Khách hàng</option>
                                        <option value={1}>Admin</option>
                                    </select>
                                </div>
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={formData.isActive}
                                            onChange={handleFormChange}
                                        />
                                        <span>Tài khoản hoạt động</span>
                                    </label>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-outline">
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm người dùng' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
