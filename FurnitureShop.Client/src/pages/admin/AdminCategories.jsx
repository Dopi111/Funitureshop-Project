// src/pages/admin/AdminCategories.jsx
import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import '../../index.css';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        slug: '',
        displayOrder: 0,
        isActive: true,
        imageUrl: '',
        parentId: null
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    // ProductTypes panel
    const [viewingCategory, setViewingCategory] = useState(null);
    const [categoryProductTypes, setCategoryProductTypes] = useState([]);
    const [productTypesLoading, setProductTypesLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/categories/all');
            const data = await response.json();
            setCategories(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Only show root categories (no parentId)
    const rootCategories = categories.filter(cat => !cat.parentId);

    const filteredCategories = rootCategories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openAddModal = () => {
        setModalMode('add');
        setSelectedCategory(null);
        setFormData({
            name: '',
            description: '',
            slug: '',
            displayOrder: 0,
            isActive: true,
            imageUrl: '',
            parentId: null
        });
        setFormError('');
        setSelectedImage(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (category) => {
        setModalMode('edit');
        setSelectedCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || '',
            slug: category.slug || '',
            displayOrder: category.displayOrder || 0,
            isActive: category.isActive ?? true,
            imageUrl: category.imageUrl || '',
            parentId: category.parentId || null
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCategory(null);
        setFormError('');
        setSelectedImage(null);
        setImagePreview(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name)
        }));
    };

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setFormError('Chỉ cho phép file ảnh: jpg, png, gif, webp');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                setFormError('Kích thước file tối đa là 5MB');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload category image
    const uploadCategoryImage = async (categoryId) => {
        if (!selectedImage) return true;

        const token = localStorage.getItem('authToken');
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedImage);

        try {
            const response = await fetch(`/api/categories/${categoryId}/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataUpload
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi upload ảnh');
            }
            return true;
        } catch (err) {
            console.error('Upload error:', err);
            setFormError(`Danh mục đã được tạo nhưng lỗi upload ảnh: ${err.message}`);
            return false;
        }
    };

    // Delete category image
    const handleDeleteImage = async (categoryId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
            return;
        }

        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/categories/${categoryId}/image`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể xóa ảnh');
            }

            await fetchCategories();
            setFormData(prev => ({ ...prev, imageUrl: '' }));
            if (selectedCategory) {
                setSelectedCategory({ ...selectedCategory, imageUrl: null });
            }
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');

        const token = localStorage.getItem('authToken');

        try {
            const categoryData = {
                name: formData.name,
                description: formData.description,
                slug: formData.slug || generateSlug(formData.name),
                displayOrder: parseInt(formData.displayOrder) || 0,
                isActive: formData.isActive,
                imageUrl: formData.imageUrl,
                parentId: formData.parentId ? parseInt(formData.parentId) : null
            };

            let response;
            if (modalMode === 'add') {
                response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(categoryData)
                });
            } else {
                response = await fetch(`/api/categories/${selectedCategory.categoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...categoryData,
                        categoryId: selectedCategory.categoryId
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

            // Get the category ID for image upload
            const categoryId = modalMode === 'add' ? data?.categoryId : selectedCategory.categoryId;

            // Upload image if selected
            if (categoryId && selectedImage) {
                await uploadCategoryImage(categoryId);
            }

            await fetchCategories();
            closeModal();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (categoryId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) {
            return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/categories/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể xóa danh mục');
            }

            await fetchCategories();
        } catch (err) {
            alert(err.message);
        }
    };

    const getParentName = (parentId) => {
        const parent = categories.find(c => c.categoryId === parentId);
        return parent?.name || '-';
    };

    // Fetch ProductTypes for a category
    const fetchProductTypesByCategory = async (category) => {
        try {
            setProductTypesLoading(true);
            setViewingCategory(category);
            const response = await fetch(`/api/products/product-types/by-category/${category.categoryId}`);
            if (response.ok) {
                const data = await response.json();
                setCategoryProductTypes(data || []);
            }
        } catch (err) {
            console.error('Error fetching product types:', err);
        } finally {
            setProductTypesLoading(false);
        }
    };

    const closeProductTypesPanel = () => {
        setViewingCategory(null);
        setCategoryProductTypes([]);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header">
                    <h1>Quản lý danh mục</h1>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + Thêm danh mục
                    </button>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories Table */}
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
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Hình ảnh</th>
                                    <th>Tên danh mục</th>
                                    <th>Mô tả</th>
                                    <th>Thứ tự</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center">
                                            Không có danh mục nào
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map(category => (
                                        <tr key={category.categoryId}>
                                            <td>{category.categoryId}</td>
                                            <td>
                                                <img
                                                    src={category.imageUrl || 'https://via.placeholder.com/50'}
                                                    alt={category.name}
                                                    className="product-thumbnail"
                                                />
                                            </td>
                                            <td>
                                                <button
                                                    className="category-name-link"
                                                    onClick={() => fetchProductTypesByCategory(category)}
                                                    title="Click để xem loại sản phẩm"
                                                >
                                                    {category.name}
                                                </button>
                                            </td>
                                            <td>{category.description || '-'}</td>
                                            <td>{category.displayOrder}</td>
                                            <td>
                                                <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                                                    {category.isActive ? 'Hoạt động' : 'Ẩn'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => openEditModal(category)}
                                                        className="btn-action btn-edit"
                                                        title="Sửa"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(category.categoryId)}
                                                        className="btn-action btn-delete"
                                                        title="Xóa"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ProductTypes Panel */}
                {viewingCategory && (
                    <div className="product-types-panel">
                        <div className="panel-header">
                            <h3>Loại sản phẩm trong "{viewingCategory.name}"</h3>
                            <button onClick={closeProductTypesPanel} className="panel-close">×</button>
                        </div>
                        <div className="panel-content">
                            {productTypesLoading ? (
                                <p>Đang tải...</p>
                            ) : categoryProductTypes.length === 0 ? (
                                <p className="text-muted">Chưa có sản phẩm nào trong danh mục này</p>
                            ) : (
                                <ul className="product-types-list">
                                    {categoryProductTypes.map(type => (
                                        <li key={type.productType} className="product-type-item">
                                            <span className="type-name">{type.productType}</span>
                                            <span className="type-count">{type.count} sản phẩm</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}</h2>
                            <button onClick={closeModal} className="modal-close">&times;</button>
                        </div>

                        {formError && (
                            <div className="auth-error" style={{ margin: '0 1.5rem' }}>
                                <span>⚠️</span> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="name">Tên danh mục *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="slug">Slug (URL)</label>
                                <input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleFormChange}
                                    placeholder="Tự động tạo từ tên"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Mô tả</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows="3"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="form-group">
                                <label>Hình ảnh</label>
                                <div className="image-upload-container">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                        className="file-input"
                                    />
                                    <p className="upload-hint">Chấp nhận: JPG, PNG, GIF, WebP (tối đa 5MB)</p>
                                </div>

                                {/* Image Preview (new upload) */}
                                {imagePreview && (
                                    <div className="image-preview-container">
                                        <img src={imagePreview} alt="Preview" className="image-preview" />
                                        <button
                                            type="button"
                                            className="btn-remove-image"
                                            onClick={() => {
                                                setSelectedImage(null);
                                                setImagePreview(null);
                                            }}
                                        >
                                            ✕ Xóa ảnh mới
                                        </button>
                                    </div>
                                )}

                                {/* Current Image (when editing) */}
                                {modalMode === 'edit' && selectedCategory?.imageUrl && !imagePreview && (
                                    <div className="existing-images">
                                        <p className="existing-images-label">Ảnh hiện tại:</p>
                                        <div className="existing-image-item">
                                            <img
                                                src={selectedCategory.imageUrl}
                                                alt={selectedCategory.name}
                                                className="existing-image"
                                            />
                                            <button
                                                type="button"
                                                className="btn-delete-image"
                                                onClick={() => handleDeleteImage(selectedCategory.categoryId)}
                                                title="Xóa ảnh"
                                            >
                                                🗑️ Xóa ảnh
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="parentId">Danh mục cha</label>
                                    <select
                                        id="parentId"
                                        name="parentId"
                                        value={formData.parentId || ''}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Không có (Danh mục gốc)</option>
                                        {categories
                                            .filter(c => c.categoryId !== selectedCategory?.categoryId)
                                            .map(cat => (
                                                <option key={cat.categoryId} value={cat.categoryId}>
                                                    {cat.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="displayOrder">Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        id="displayOrder"
                                        name="displayOrder"
                                        value={formData.displayOrder}
                                        onChange={handleFormChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-row checkbox-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleFormChange}
                                    />
                                    <span>Hiển thị danh mục</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-outline">
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm danh mục' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
