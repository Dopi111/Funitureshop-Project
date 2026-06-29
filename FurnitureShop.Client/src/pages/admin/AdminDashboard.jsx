// src/pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminVariantsModal from '../../components/admin/AdminVariantsModal';
import {
  PageHeader, Btn, Filters, SearchInput, FilterSelect,
  TableCard, Table, Thead, Th, Td, Badge, ActionBtn, Pagination,
  TableState, Modal, FormBody, FormRow, FormGroup, FormInput,
  FormSelect, FormTextarea, FormCheckbox, FormActions, FormError, FormSectionTitle, confirmAction
} from '../../components/admin/ui';

const AdminDashboard = () => {
  const genSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\u0111/g, 'd').replace(/\u0110/g, 'D').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isVariantsModalOpen, setIsVariantsModalOpen] = useState(false);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', description: '', basePrice: '', discountPrice: '',
    stockQuantity: '', categoryId: '', productType: 'Furniture',
    isActive: true, isFeatured: false,
    material: '', color: '', brand: '', slug: '', width: '', height: '', depth: '', weight: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const pageSize = 10;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, pageSize });
      if (selectedCategory) params.append('categoryId', selectedCategory);
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json();
      let filtered = data.data || [];
      if (selectedCategory) {
        filtered = filtered.filter(p => String(p.categoryId) === String(selectedCategory) || String(p.category?.categoryId) === String(selectedCategory) || String(p.category?.id) === String(selectedCategory));
      }
      if (searchTerm) filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setProducts(filtered);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch { setError('Không thể tải danh sách sản phẩm'); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const r = await fetch('/api/categories');
      setCategories(await r.json() || []);
    } catch {}
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchProducts(); }, [currentPage, selectedCategory]);
  useEffect(() => {
    const t = setTimeout(() => currentPage === 1 ? fetchProducts() : setCurrentPage(1), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const defaultForm = () => ({
    name: '', description: '', basePrice: '', discountPrice: '',
    stockQuantity: '', categoryId: categories[0]?.categoryId || '',
    productType: 'Furniture', isActive: true, isFeatured: false,
    material: '', color: '', brand: '', slug: '', width: '', height: '', depth: '', weight: '', imageUrl: ''
  });

  const openAddModal = () => { setModalMode('add'); setSelectedProduct(null); setFormData(defaultForm()); setFormError(''); setSelectedImage(null); setImagePreview(null); setShowModal(true); };
  const openEditModal = (p) => {
    setModalMode('edit'); setSelectedProduct(p);
    setFormData({ name: p.name || '', description: p.description || '', basePrice: p.basePrice?.toString() || '', discountPrice: p.discountPrice?.toString() || '', stockQuantity: p.stockQuantity?.toString() || '', categoryId: p.categoryId?.toString() || '', productType: p.productType || 'Furniture', isActive: p.isActive ?? true, isFeatured: p.isFeatured ?? false, material: p.material || '', color: p.color || '', brand: p.brand || '', slug: p.slug || '', width: p.width?.toString() || '', height: p.height?.toString() || '', depth: p.depth?.toString() || '', weight: p.weight?.toString() || '', imageUrl: p.images?.[0]?.imageUrl || '' });
    setFormError(''); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setSelectedProduct(null); setFormError(''); setSelectedImage(null); setImagePreview(null); };
  const handleChange = (e) => { const { name, value, type, checked } = e.target; setFormData(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === genSlug(prev.name) ? genSlug(name) : prev.slug,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/jpg','image/png','image/gif','image/webp'].includes(file.type)) { setFormError('Chỉ chấp nhận file ảnh: jpg, png, gif, webp'); return; }
    if (file.size > 5 * 1024 * 1024) { setFormError('File ảnh không được vượt quá 5MB'); return; }
    setSelectedImage(file); setFormError('');
    setFormData(p => ({ ...p, imageUrl: '' }));
    const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file);
  };

  const uploadImage = async (productId) => {
    if (!selectedImage) return true;
    const fd = new FormData(); fd.append('file', selectedImage);
    try {
      const r = await fetch(`/api/products/${productId}/upload-image`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }, body: fd });
      if (!r.ok) { const d = await r.json(); throw new Error(d.message || 'Lỗi upload ảnh'); }
      return true;
    } catch (err) { setFormError(`Sản phẩm đã tạo nhưng lỗi upload ảnh: ${err.message}`); return false; }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    const token = localStorage.getItem('authToken');
    try {
      const payload = { name: formData.name, description: formData.description, basePrice: parseFloat(formData.basePrice) || 0, discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null, stockQuantity: parseInt(formData.stockQuantity) || 0, categoryId: parseInt(formData.categoryId), productType: formData.productType, isActive: formData.isActive, isFeatured: formData.isFeatured, material: formData.material || null, color: formData.color || null, brand: formData.brand || null, slug: formData.slug || genSlug(formData.name), width: formData.width ? parseFloat(formData.width) : null, height: formData.height ? parseFloat(formData.height) : null, depth: formData.depth ? parseFloat(formData.depth) : null, weight: formData.weight ? parseFloat(formData.weight) : null, imageUrl: formData.imageUrl };
      const url = modalMode === 'add' ? '/api/products' : `/api/products/${selectedProduct.productId}`;
      const r = await fetch(url, { method: modalMode === 'add' ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(modalMode === 'edit' ? { ...payload, productId: selectedProduct.productId } : payload) });
      const ct = r.headers.get('content-type');
      const data = ct?.includes('application/json') ? JSON.parse(await r.text() || 'null') : null;
      if (!r.ok) throw new Error(data?.message || `Lỗi ${r.status}`);
      const productId = modalMode === 'add' ? data?.data?.productId : selectedProduct.productId;
      if (productId && selectedImage) await uploadImage(productId);
      toast.success(modalMode === 'add' ? 'Thêm sản phẩm thành công' : 'Cập nhật sản phẩm thành công');
      await fetchProducts(); closeModal();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (productId) => {
    if (!await confirmAction('Bạn có chắc chắn muốn xóa sản phẩm này?', 'Xóa', 'danger')) return;
    const r = await fetch(`/api/products/${productId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } });
    if (!r.ok) { toast.error('Không thể xóa sản phẩm'); return; }
    toast.success('Đã xóa sản phẩm');
    await fetchProducts();
  };

  const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  const totalProductsCount = products.length;
  const inStockCount = products.filter(p => (p.stockQuantity ?? 10) > 0).length;
  const outOfStockCount = products.filter(p => (p.stockQuantity ?? 10) <= 0).length;

  return (
    <AdminLayout>
      <PageHeader 
        title="Quản lý sản phẩm" 
        subtitle="Quản lý danh sách mặt hàng, định giá, số lượng tồn kho và thuộc tính nội thất"
        breadcrumb={['Admin', 'Thương mại', 'Sản phẩm nội thất']}
      >
        <Btn onClick={openAddModal}>+ Thêm sản phẩm</Btn>
      </PageHeader>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-blue-600 mb-1">Tổng Sản Phẩm</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{totalProductsCount} <span className="text-xs font-normal text-zinc-400">mặt hàng</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold border border-blue-100">
            🛋️
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Đang Kinh Doanh</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{inStockCount} <span className="text-xs font-normal text-zinc-400">còn hàng</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
            🟢
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-rose-600 mb-1">Hết Hàng / Tạm Ngừng</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{outOfStockCount} <span className="text-xs font-normal text-zinc-400">hết hàng</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl font-bold border border-rose-100">
            ⚠️
          </div>
        </div>
      </div>

      <Filters>
        <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm sản phẩm..." />
        <FilterSelect value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
        </FilterSelect>
      </Filters>

      <TableCard>
        <Table>
          <Thead>
            <Th>ID</Th><Th>Hình ảnh</Th><Th>Tên sản phẩm</Th><Th>Slug</Th><Th>Danh mục</Th><Th>Chi tiết</Th>
            <Th>Giá gốc</Th><Th>Giá KM</Th><Th>Tồn kho</Th><Th>Trạng thái</Th><Th>Hành động</Th>
          </Thead>
          <tbody>
            {loading ? <TableState type="loading" colSpan={11} /> :
             error   ? <TableState type="error" colSpan={11} message={error} /> :
             products.length === 0 ? <TableState type="empty" colSpan={11} message="Không có sản phẩm nào" /> :
             products.map(p => (
              <tr key={p.productId} className="hover:bg-slate-50 transition-colors">
                <Td className="text-slate-400">{p.productId}</Td>
                <Td>
                  <img src={p.images?.[0]?.imageUrl || 'https://via.placeholder.com/50'} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-slate-200" />
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">{p.name}</span>
                    {p.isFeatured && <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-[0.65rem] font-semibold rounded w-fit">Nổi bật</span>}
                  </div>
                </Td>
                <Td><code className="text-xs text-slate-500">{p.slug || '-'}</code></Td>
                <Td>{p.category?.name || '-'}</Td>
                <Td>
                  <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                    {p.material && <span>Chất liệu: {p.material}</span>}
                    {p.color && <span>Màu: {p.color}</span>}
                  </div>
                </Td>
                <Td className="font-medium">{fmt(p.basePrice)}</Td>
                <Td>{p.discountPrice ? fmt(p.discountPrice) : <span className="text-slate-300">—</span>}</Td>
                <Td>
                  <span className={`font-semibold ${p.stockQuantity <= 0 ? 'text-red-500' : p.stockQuantity < 10 ? 'text-amber-500' : 'text-slate-700'}`}>
                    {p.stockQuantity}
                  </span>
                </Td>
                <Td><Badge variant={p.isActive ? 'active' : 'inactive'}>{p.isActive ? 'Hoạt động' : 'Ẩn'}</Badge></Td>
                <Td>
                  <div className="flex gap-1.5">
                    <ActionBtn variant="edit" onClick={() => openEditModal(p)} title="Sửa">✏️</ActionBtn>
                    <ActionBtn variant="edit" onClick={() => { setSelectedVariantProduct(p); setIsVariantsModalOpen(true); }} title="Quản lý biến thể">📦</ActionBtn>
                    <ActionBtn variant="delete" onClick={() => handleDelete(p.productId)} title="Xóa">🗑️</ActionBtn>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!loading && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPrev={() => setCurrentPage(p => Math.max(p-1,1))}
            onNext={() => setCurrentPage(p => Math.min(p+1, totalPages))} />
        )}
      </TableCard>

      <Modal show={showModal} onClose={closeModal} title={modalMode === 'add' ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'} size="lg">
        <FormBody onSubmit={handleSubmit}>
          <FormError message={formError} />

          <FormGroup label="Tên sản phẩm" required>
            <FormInput name="name" value={formData.name} onChange={handleNameChange} required />
          </FormGroup>

          <FormGroup label="Slug (URL)">
            <FormInput name="slug" value={formData.slug} onChange={handleChange} placeholder="Tự động tạo từ tên" />
          </FormGroup>

          <FormGroup label="Mô tả">
            <FormTextarea name="description" value={formData.description} onChange={handleChange} rows={3} />
          </FormGroup>

          <FormRow>
            <FormGroup label="Giá gốc (VNĐ)" required>
              <FormInput type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} min="0" required />
            </FormGroup>
            <FormGroup label="Giá khuyến mãi (VNĐ)">
              <FormInput type="number" name="discountPrice" value={formData.discountPrice} onChange={handleChange} min="0" />
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup label="Tồn kho" required>
              <FormInput type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} min="0" required />
            </FormGroup>
            <FormGroup label="Danh mục" required>
              <FormSelect name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
              </FormSelect>
            </FormGroup>
          </FormRow>

          <FormGroup label="Loại sản phẩm">
            <FormSelect name="productType" value={formData.productType} onChange={handleChange}>
              {['Furniture','Table','Chair','Bed','Sofa','Storage','Decor'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </FormSelect>
          </FormGroup>

          <FormSectionTitle>Chi tiết sản phẩm</FormSectionTitle>

          <FormRow cols={3}>
            <FormGroup label="Chất liệu"><FormInput name="material" value={formData.material} onChange={handleChange} placeholder="Vd: Gỗ sồi..." /></FormGroup>
            <FormGroup label="Màu sắc"><FormInput name="color" value={formData.color} onChange={handleChange} /></FormGroup>
            <FormGroup label="Thương hiệu"><FormInput name="brand" value={formData.brand} onChange={handleChange} /></FormGroup>
          </FormRow>

          <FormRow cols={3}>
            <FormGroup label="Rộng (cm)"><FormInput type="number" name="width" value={formData.width} onChange={handleChange} min="0" step="0.1" /></FormGroup>
            <FormGroup label="Cao (cm)"><FormInput type="number" name="height" value={formData.height} onChange={handleChange} min="0" step="0.1" /></FormGroup>
            <FormGroup label="Sâu (cm)"><FormInput type="number" name="depth" value={formData.depth} onChange={handleChange} min="0" step="0.1" /></FormGroup>
          </FormRow>

          <FormGroup label="Hình ảnh (Tải file hoặc dán URL)">
            <div className="space-y-2">
              <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border file:border-zinc-200 file:text-xs file:font-semibold file:bg-zinc-100 file:text-[#0D0D0D] hover:file:bg-[#C9A87C] hover:file:text-[#0D0D0D] hover:file:border-[#C9A87C] transition-all cursor-pointer font-['Outfit']" />
              <input
                type="text"
                placeholder="Hoặc dán URL hình ảnh..."
                value={formData.imageUrl || ''}
                onChange={(e) => {
                  const url = e.target.value;
                  setFormData(p => ({ ...p, imageUrl: url }));
                  setImagePreview(url || null);
                  setSelectedImage(null);
                }}
                className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-800 outline-none focus:border-black font-mono"
              />
            </div>
            {imagePreview && (
              <div className="flex items-center gap-3 mt-2">
                <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                <Btn variant="outline" size="sm" type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); setFormData(p => ({ ...p, imageUrl: '' })); }}>✕ Xóa</Btn>
              </div>
            )}
          </FormGroup>

          <div className="flex gap-6">
            <FormCheckbox label="Sản phẩm hoạt động" name="isActive" checked={formData.isActive} onChange={handleChange} />
            <FormCheckbox label="Sản phẩm nổi bật" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} />
          </div>

          <FormActions>
            <Btn variant="outline" onClick={closeModal}>Hủy</Btn>
            <Btn type="submit" disabled={formLoading}>{formLoading ? 'Đang xử lý...' : modalMode === 'add' ? 'Thêm sản phẩm' : 'Cập nhật'}</Btn>
          </FormActions>
        </FormBody>
      </Modal>

      <AdminVariantsModal 
        isOpen={isVariantsModalOpen} 
        onClose={() => { setIsVariantsModalOpen(false); setSelectedVariantProduct(null); }} 
        product={selectedVariantProduct} 
      />
    </AdminLayout>
  );
};

export default AdminDashboard;

