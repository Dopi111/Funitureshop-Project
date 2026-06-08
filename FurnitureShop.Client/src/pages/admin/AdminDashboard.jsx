// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import '../../index.css';

const AdminDashboard = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        basePrice: '',
        discountPrice: '',
        stockQuantity: '',
        categoryId: '',
        productType: 'Furniture',
        isActive: true,
        isFeatured: false,
        // Detail fields
        material: '',
        color: '',
        brand: '',
        width: '',
        height: '',
        depth: '',
        weight: ''
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);
    // Image upload state
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const pageSize = 10;

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage,
                pageSize: pageSize
            });

            if (selectedCategory) {
                params.append('categoryId', selectedCategory);
            }

            const response = await fetch(`/api/products?${params}`);
            const data = await response.json();

            let filteredProducts = data.data || [];

            // Client-side search filter
            if (searchTerm) {
                filteredProducts = filteredProducts.filter(p =>
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            setProducts(filteredProducts);
            setTotalPages(data.totalPages || 1);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            setCategories(data || []);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, selectedCategory]);

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (currentPage === 1) {
                fetchProducts();
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const openAddModal = () => {
        setModalMode('add');
        setSelectedProduct(null);
        setFormData({
            name: '',
            description: '',
            basePrice: '',
            discountPrice: '',
            stockQuantity: '',
            categoryId: categories[0]?.categoryId || '',
            productType: 'Furniture',
            isActive: true,
            isFeatured: false,
            material: '',
            color: '',
            brand: '',
            width: '',
            height: '',
            depth: '',
            weight: ''
        });
        setFormError('');
        setSelectedImage(null);
        setImagePreview(null);
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            basePrice: product.basePrice?.toString() || '',
            discountPrice: product.discountPrice?.toString() || '',
            stockQuantity: product.stockQuantity?.toString() || '',
            categoryId: product.categoryId?.toString() || '',
            productType: product.productType || 'Furniture',
            isActive: product.isActive ?? true,
            isFeatured: product.isFeatured ?? false,
            material: product.material || '',
            color: product.color || '',
            brand: product.brand || '',
            width: product.width?.toString() || '',
            height: product.height?.toString() || '',
            depth: product.depth?.toString() || '',
            weight: product.weight?.toString() || ''
        });
        setFormError('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
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

    // Handle image file selection
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setFormError('Chỉ chấp nhận file ảnh: jpg, jpeg, png, gif, webp');
                return;
            }
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                setFormError('File ảnh không được vượt quá 5MB');
                return;
            }
            setSelectedImage(file);
            setFormError('');
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Upload image for a product
    const uploadProductImage = async (productId) => {
        if (!selectedImage) return true;

        const token = localStorage.getItem('authToken');
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedImage);

        try {
            const response = await fetch(`/api/products/${productId}/upload-image`, {
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
            setFormError(`Sản phẩm đã được tạo nhưng lỗi upload ảnh: ${err.message}`);
            return false;
        }
    };

    // Set primary image
    const handleSetPrimaryImage = async (productId, imageId) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/products/${productId}/images/${imageId}/set-primary`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể đặt ảnh chính');
            }

            // Refresh products list
            await fetchProducts();
            // Update selected product images if in edit mode
            if (selectedProduct) {
                const updatedImages = selectedProduct.images.map(img => ({
                    ...img,
                    isPrimary: img.imageId === imageId
                }));
                setSelectedProduct({ ...selectedProduct, images: updatedImages });
            }
        } catch (err) {
            alert(err.message);
        }
    };

    // Delete product image
    const handleDeleteImage = async (productId, imageId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
            return;
        }

        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`/api/products/${productId}/images/${imageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể xóa ảnh');
            }

            // Refresh products list
            await fetchProducts();
            // Update selected product if in edit mode
            if (selectedProduct) {
                const updatedImages = selectedProduct.images.filter(img => img.imageId !== imageId);
                setSelectedProduct({ ...selectedProduct, images: updatedImages });
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
            const productData = {
                name: formData.name,
                description: formData.description,
                basePrice: parseFloat(formData.basePrice) || 0,
                discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
                stockQuantity: parseInt(formData.stockQuantity) || 0,
                categoryId: parseInt(formData.categoryId),
                productType: formData.productType,
                isActive: formData.isActive,
                isFeatured: formData.isFeatured,
                // Detail fields
                material: formData.material || null,
                color: formData.color || null,
                brand: formData.brand || null,
                width: formData.width ? parseFloat(formData.width) : null,
                height: formData.height ? parseFloat(formData.height) : null,
                depth: formData.depth ? parseFloat(formData.depth) : null,
                weight: formData.weight ? parseFloat(formData.weight) : null
            };

            let response;
            if (modalMode === 'add') {
                response = await fetch('/api/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                response = await fetch(`/api/products/${selectedProduct.productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ...productData,
                        productId: selectedProduct.productId
                    })
                });
            }

            // Kiểm tra response có content không trước khi parse JSON
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

            // Get product ID from response
            const productId = modalMode === 'add' ? data?.data?.productId : selectedProduct.productId;

            // Upload image if selected
            if (productId && selectedImage) {
                await uploadProductImage(productId);
            }

            // Refresh products list
            await fetchProducts();
            closeModal();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            return;
        }

        const token = localStorage.getItem('authToken');

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Không thể xóa sản phẩm');
            }

            await fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header">
                    <h1>Quản lý sản phẩm</h1>
                    <button onClick={openAddModal} className="btn btn-primary">
                        + Thêm sản phẩm
                    </button>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                    <div className="admin-search">
                        <input
                            type="text"
                            placeholder="Tìm kiếm sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="admin-filter-group">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(cat => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Products Table */}
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
                                        <th>Hình ảnh</th>
                                        <th>Tên sản phẩm</th>
                                        <th>Danh mục</th>
                                        <th>Giá gốc</th>
                                        <th>Giá KM</th>
                                        <th>Tồn kho</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center">
                                                Không có sản phẩm nào
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map(product => (
                                            <tr key={product.productId}>
                                                <td>{product.productId}</td>
                                                <td>
                                                    <img
                                                        src={product.images?.[0]?.imageUrl || 'https://via.placeholder.com/50'}
                                                        alt={product.name}
                                                        className="product-thumbnail"
                                                    />
                                                </td>
                                                <td>
                                                    <div className="product-name-cell">
                                                        <span className="product-name">{product.name}</span>
                                                        {product.isFeatured && (
                                                            <span className="badge badge-featured">Nổi bật</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{product.category?.name || '-'}</td>
                                                <td>{formatPrice(product.basePrice)}</td>
                                                <td>
                                                    {product.discountPrice
                                                        ? formatPrice(product.discountPrice)
                                                        : '-'}
                                                </td>
                                                <td>
                                                    <span className={`stock-badge ${product.stockQuantity <= 0 ? 'out-of-stock' : product.stockQuantity < 10 ? 'low-stock' : ''}`}>
                                                        {product.stockQuantity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                                                        {product.isActive ? 'Hoạt động' : 'Ẩn'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            onClick={() => openEditModal(product)}
                                                            className="btn-action btn-edit"
                                                            title="Sửa"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.productId)}
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
                            <h2>{modalMode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}</h2>
                            <button onClick={closeModal} className="modal-close">&times;</button>
                        </div>

                        {formError && (
                            <div className="auth-error">
                                <span>⚠️</span> {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label htmlFor="name">Tên sản phẩm *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Mô tả</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    rows="4"
                                />
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="basePrice">Giá gốc (VNĐ) *</label>
                                    <input
                                        type="number"
                                        id="basePrice"
                                        name="basePrice"
                                        value={formData.basePrice}
                                        onChange={handleFormChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="discountPrice">Giá khuyến mãi (VNĐ)</label>
                                    <input
                                        type="number"
                                        id="discountPrice"
                                        name="discountPrice"
                                        value={formData.discountPrice}
                                        onChange={handleFormChange}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-row-2">
                                <div className="form-group">
                                    <label htmlFor="stockQuantity">Số lượng tồn kho *</label>
                                    <input
                                        type="number"
                                        id="stockQuantity"
                                        name="stockQuantity"
                                        value={formData.stockQuantity}
                                        onChange={handleFormChange}
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="categoryId">Danh mục *</label>
                                    <select
                                        id="categoryId"
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {categories.map(cat => (
                                            <option key={cat.categoryId} value={cat.categoryId}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="productType">Loại sản phẩm</label>
                                <select
                                    id="productType"
                                    name="productType"
                                    value={formData.productType}
                                    onChange={handleFormChange}
                                >
                                    <option value="Furniture">Nội thất</option>
                                    <option value="Table">Bàn</option>
                                    <option value="Chair">Ghế</option>
                                    <option value="Bed">Giường</option>
                                    <option value="Sofa">Sofa</option>
                                    <option value="Storage">Tủ kệ</option>
                                    <option value="Decor">Trang trí</option>
                                </select>
                            </div>

                            {/* Product Details Section */}
                            <h3 className="form-section-title">Chi tiết sản phẩm</h3>

                            <div className="form-row-3">
                                <div className="form-group">
                                    <label htmlFor="material">Chất liệu</label>
                                    <input
                                        type="text"
                                        id="material"
                                        name="material"
                                        value={formData.material}
                                        onChange={handleFormChange}
                                        placeholder="Vd: Gỗ sồi, Da..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="color">Màu sắc</label>
                                    <input
                                        type="text"
                                        id="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleFormChange}
                                        placeholder="Vd: Nâu, Đen..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="brand">Thương hiệu</label>
                                    <input
                                        type="text"
                                        id="brand"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleFormChange}
                                        placeholder="Vd: Nhà Xinh..."
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Kích thước (cm) & Trọng lượng</label>
                                <div className="form-row-4">
                                    <div>
                                        <input
                                            type="number"
                                            name="width"
                                            value={formData.width}
                                            onChange={handleFormChange}
                                            placeholder="Rộng (cm)"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height}
                                            onChange={handleFormChange}
                                            placeholder="Cao (cm)"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="depth"
                                            value={formData.depth}
                                            onChange={handleFormChange}
                                            placeholder="Sâu (cm)"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="weight"
                                            value={formData.weight}
                                            onChange={handleFormChange}
                                            placeholder="Nặng (kg)"
                                            min="0"
                                        />
                                    </div>
                                </div>

                            </div>

                            {/* Image Upload Section */}
                            <div className="form-group">
                                <label htmlFor="productImage">Hình ảnh sản phẩm</label>
                                <div className="image-upload-container">
                                    <input
                                        type="file"
                                        id="productImage"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                        className="file-input"
                                    />
                                    <div className="upload-hint">
                                        Chấp nhận: jpg, jpeg, png, gif, webp (tối đa 5MB)
                                    </div>
                                </div>

                                {/* Image Preview */}
                                {imagePreview && (
                                    <div className="image-preview-container">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="image-preview"
                                        />
                                        <button
                                            type="button"
                                            className="btn-remove-image"
                                            onClick={() => {
                                                setSelectedImage(null);
                                                setImagePreview(null);
                                            }}
                                        >
                                            ✕ Xóa ảnh
                                        </button>
                                    </div>
                                )}

                                {/* Existing Product Images (when editing) */}
                                {modalMode === 'edit' && selectedProduct?.images?.length > 0 && (
                                    <div className="existing-images">
                                        <p className="existing-images-label">Ảnh hiện tại (click để đặt làm ảnh chính):</p>
                                        <div className="existing-images-grid">
                                            {selectedProduct.images.map(img => (
                                                <div key={img.imageId} className={`existing-image-item ${img.isPrimary ? 'is-primary' : ''}`}>
                                                    <img
                                                        src={img.imageUrl}
                                                        alt={img.altText || 'Product'}
                                                        className="existing-image"
                                                        onClick={() => !img.isPrimary && handleSetPrimaryImage(selectedProduct.productId, img.imageId)}
                                                        style={{ cursor: img.isPrimary ? 'default' : 'pointer' }}
                                                        title={img.isPrimary ? 'Ảnh chính' : 'Click để đặt làm ảnh chính'}
                                                    />
                                                    <div className="image-actions">
                                                        {img.isPrimary ? (
                                                            <span className="primary-badge">⭐ Ảnh chính</span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn-set-primary"
                                                                onClick={() => handleSetPrimaryImage(selectedProduct.productId, img.imageId)}
                                                            >
                                                                Đặt ảnh chính
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            className="btn-delete-image"
                                                            onClick={() => handleDeleteImage(selectedProduct.productId, img.imageId)}
                                                            title="Xóa ảnh"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="form-row checkbox-row">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleFormChange}
                                    />
                                    <span>Hiển thị sản phẩm</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="isFeatured"
                                        checked={formData.isFeatured}
                                        onChange={handleFormChange}
                                    />
                                    <span>Sản phẩm nổi bật</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={closeModal} className="btn btn-outline">
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm sản phẩm' : 'Cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
