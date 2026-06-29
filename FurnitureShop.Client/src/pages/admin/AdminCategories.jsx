import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  PageHeader, Btn, Filters, SearchInput, FilterSelect,
  TableCard, Table, Thead, Th, Td, Badge, ActionBtn,
  TableState, Modal, FormBody, FormRow, FormGroup, FormInput,
  FormSelect, FormTextarea, FormCheckbox, FormActions, FormError,
} from '../../components/admin/ui';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({ name:'',description:'',slug:'',displayOrder:0,isActive:true,imageUrl:'',parentId:null });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [viewingCategory, setViewingCategory] = useState(null);
  const [productTypes, setProductTypes] = useState([]);
  const [ptLoading, setPtLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const r = await fetch('/api/categories/all');
      setCategories(await r.json() || []);
      setError(null);
    } catch { setError('Không thể tải danh sách danh mục'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const roots = categories.filter(c => !c.parentId).filter(c => {
    const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' ? true : String(c.isActive) === String(statusFilter);
    return matchesSearch && matchesStatus;
  });

  const genSlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const openAddModal = () => { setModalMode('add'); setSelectedCategory(null); setFormData({name:'',description:'',slug:'',displayOrder:0,isActive:true,imageUrl:'',parentId:null}); setFormError(''); setSelectedImage(null); setImagePreview(null); setShowModal(true); };
  const openEditModal = (cat) => { setModalMode('edit'); setSelectedCategory(cat); setFormData({name:cat.name||'',description:cat.description||'',slug:cat.slug||'',displayOrder:cat.displayOrder||0,isActive:cat.isActive??true,imageUrl:cat.imageUrl||'',parentId:cat.parentId||null}); setFormError(''); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setSelectedCategory(null); setFormError(''); setSelectedImage(null); setImagePreview(null); };
  const handleChange = (e) => { const {name,value,type,checked}=e.target; setFormData(p=>({...p,[name]:type==='checkbox'?checked:value})); };
  const handleNameChange = (e) => { const n=e.target.value; setFormData(p=>({...p,name:n,slug:genSlug(n)})); };

  const handleImageChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    if (!['image/jpeg','image/jpg','image/png','image/gif','image/webp'].includes(file.type)) { setFormError('Chỉ cho phép file ảnh: jpg, png, gif, webp'); return; }
    if (file.size > 5*1024*1024) { setFormError('Kích thước file tối đa là 5MB'); return; }
    setSelectedImage(file);
    setFormData(p => ({ ...p, imageUrl: '' }));
    const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result); reader.readAsDataURL(file);
  };

  const uploadImage = async (categoryId) => {
    if (!selectedImage) return true;
    const fd = new FormData(); fd.append('file', selectedImage);
    try {
      const r = await fetch(`/api/categories/${categoryId}/upload-image`, { method:'POST', headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`}, body:fd });
      if (!r.ok) { const d=await r.json(); throw new Error(d.message||'Lỗi upload ảnh'); }
      return true;
    } catch (err) { setFormError(`Danh mục đã tạo nhưng lỗi upload ảnh: ${err.message}`); return false; }
  };

  const handleDeleteImage = async (categoryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;
    const r = await fetch(`/api/categories/${categoryId}/image`, { method:'DELETE', headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}` } });
    if (!r.ok) { alert('Không thể xóa ảnh'); return; }
    await fetchCategories(); setFormData(p=>({...p,imageUrl:''}));
    if (selectedCategory) setSelectedCategory({...selectedCategory,imageUrl:null});
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true); setFormError('');
    const token = localStorage.getItem('authToken');
    try {
      const payload = { name:formData.name, description:formData.description, slug:formData.slug||genSlug(formData.name), displayOrder:parseInt(formData.displayOrder)||0, isActive:formData.isActive, imageUrl:formData.imageUrl, parentId:formData.parentId?parseInt(formData.parentId):null };
      const url = modalMode==='add' ? '/api/categories' : `/api/categories/${selectedCategory.categoryId}`;
      const r = await fetch(url, { method:modalMode==='add'?'POST':'PUT', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`}, body:JSON.stringify(modalMode==='edit'?{...payload,categoryId:selectedCategory.categoryId}:payload) });
      const ct = r.headers.get('content-type');
      const data = ct?.includes('application/json') ? JSON.parse(await r.text()||'null') : null;
      if (!r.ok) throw new Error(data?.message||`Lỗi ${r.status}`);
      const catId = modalMode==='add' ? data?.categoryId : selectedCategory.categoryId;
      if (catId && selectedImage) await uploadImage(catId);
      await fetchCategories(); closeModal();
    } catch (err) { setFormError(err.message); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    const r = await fetch(`/api/categories/${categoryId}`, { method:'DELETE', headers:{'Authorization':`Bearer ${localStorage.getItem('authToken')}`} });
    if (!r.ok) { alert('Không thể xóa danh mục'); return; }
    await fetchCategories();
  };

  const fetchProductTypes = async (cat) => {
    try { setPtLoading(true); setViewingCategory(cat);
      const r = await fetch(`/api/products/product-types/by-category/${cat.categoryId}`);
      if (r.ok) setProductTypes(await r.json() || []);
    } catch {} finally { setPtLoading(false); }
  };

  const totalCatCount = categories.length;
  const activeCatCount = categories.filter(c => c.isActive !== false).length;
  const hiddenCatCount = categories.filter(c => c.isActive === false).length;

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý danh mục"
        subtitle="Phân loại, tổ chức nhóm mặt hàng và cấu trúc bộ sưu tập nội thất"
        breadcrumb={['Admin', 'Thương mại', 'Danh mục bộ sưu tập']}
      >
        <Btn onClick={openAddModal}>+ Thêm danh mục</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-purple-600 mb-1">Tổng Danh Mục</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{totalCatCount} <span className="text-xs font-normal text-zinc-400">nhóm</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold border border-purple-100">
            DM
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">Đang Hoạt Động</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{activeCatCount} <span className="text-xs font-normal text-zinc-400">hiển thị</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold border border-emerald-100">
            ON
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-bold text-amber-600 mb-1">Đã Ẩn / Tạm Ngừng</div>
            <div className="text-2xl sm:text-3xl font-light text-[#0D0D0D] tracking-tight">{hiddenCatCount} <span className="text-xs font-normal text-zinc-400">đã ẩn</span></div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold border border-amber-100">
            OFF
          </div>
        </div>
      </div>

      <Filters>
        <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Tìm kiếm danh mục..." />
        <FilterSelect value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="true">Hoạt động</option>
          <option value="false">Đã ẩn</option>
        </FilterSelect>
      </Filters>

      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0">
          <TableCard>
            <Table>
              <Thead>
                <Th>ID</Th><Th>Hình ảnh</Th><Th>Tên danh mục</Th><Th>Slug</Th><Th>Mô tả</Th><Th>Thứ tự</Th><Th>Trạng thái</Th><Th>Hành động</Th>
              </Thead>
              <tbody>
                {loading ? <TableState type="loading" colSpan={8} /> :
                 error   ? <TableState type="error" colSpan={8} message={error} /> :
                 roots.length === 0 ? <TableState type="empty" colSpan={8} message="Không có danh mục nào" /> :
                 roots.map(cat => (
                  <tr key={cat.categoryId} className="hover:bg-slate-50 transition-colors">
                    <Td className="text-slate-400">{cat.categoryId}</Td>
                    <Td>
                      <img src={cat.imageUrl||'https://via.placeholder.com/50'} alt={cat.name} className="w-11 h-11 object-cover rounded-lg border border-slate-200" />
                    </Td>
                    <Td>
                      <button onClick={() => fetchProductTypes(cat)} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline bg-transparent border-none cursor-pointer p-0 text-sm">
                        {cat.name}
                      </button>
                    </Td>
                    <Td><code className="text-xs text-slate-500">{cat.slug || '-'}</code></Td>
                    <Td className="text-slate-500 max-w-xs truncate">{cat.description || <span className="text-slate-300">-</span>}</Td>
                    <Td className="text-center">{cat.displayOrder}</Td>
                    <Td><Badge variant={cat.isActive?'active':'inactive'}>{cat.isActive?'Hoạt động':'Ẩn'}</Badge></Td>
                    <Td>
                      <div className="flex gap-1.5">
                        <ActionBtn variant="edit" onClick={() => openEditModal(cat)} title="Sửa">Sua</ActionBtn>
                        <ActionBtn variant="delete" onClick={() => handleDelete(cat.categoryId)} title="Xóa">Xoa</ActionBtn>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableCard>
        </div>

        {viewingCategory && (
          <div className="w-72 shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 m-0">"{viewingCategory.name}"</h3>
              <button onClick={() => setViewingCategory(null)} className="w-6 h-6 rounded text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-lg leading-none">x</button>
            </div>
            <div className="p-4">
              {ptLoading ? (
                <p className="text-sm text-slate-400 text-center py-3">Đang tải...</p>
              ) : productTypes.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-3">Chưa có sản phẩm nào</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {productTypes.map(t => (
                    <li key={t.productType} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{t.productType}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">{t.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal show={showModal} onClose={closeModal} title={modalMode==='add'?'Thêm danh mục mới':'Chỉnh sửa danh mục'}>
        <FormBody onSubmit={handleSubmit}>
          <FormError message={formError} />
          <FormGroup label="Tên danh mục" required>
            <FormInput name="name" value={formData.name} onChange={handleNameChange} required />
          </FormGroup>
          <FormGroup label="Slug (URL)">
            <FormInput name="slug" value={formData.slug} onChange={handleChange} placeholder="Tự động tạo từ tên" />
          </FormGroup>
          <FormGroup label="Mô tả">
            <FormTextarea name="description" value={formData.description} onChange={handleChange} rows={3} />
          </FormGroup>
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
                <Btn variant="outline" size="sm" type="button" onClick={() => { setSelectedImage(null); setImagePreview(null); setFormData(p => ({ ...p, imageUrl: '' })); }}>Xóa</Btn>
              </div>
            )}
            {modalMode==='edit' && selectedCategory?.imageUrl && !imagePreview && (
              <div className="flex items-center gap-3 mt-2">
                <img src={selectedCategory.imageUrl} alt={selectedCategory.name} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                <Btn variant="outline" size="sm" type="button" onClick={() => handleDeleteImage(selectedCategory.categoryId)}>Xóa ảnh</Btn>
              </div>
            )}
          </FormGroup>
          <FormRow>
            <FormGroup label="Danh mục cha">
              <FormSelect name="parentId" value={formData.parentId||''} onChange={handleChange}>
                <option value="">Không có (Danh mục gốc)</option>
                {categories.filter(c=>c.categoryId!==selectedCategory?.categoryId).map(c=>(
                  <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                ))}
              </FormSelect>
            </FormGroup>
            <FormGroup label="Thứ tự hiển thị">
              <FormInput type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} min="0" />
            </FormGroup>
          </FormRow>
          <FormCheckbox label="Hiển thị danh mục" name="isActive" checked={formData.isActive} onChange={handleChange} />
          <FormActions>
            <Btn variant="outline" type="button" onClick={closeModal}>Hủy</Btn>
            <Btn type="submit" disabled={formLoading}>{formLoading ? 'Đang xử lý...' : modalMode==='add' ? 'Thêm danh mục' : 'Cập nhật'}</Btn>
          </FormActions>
        </FormBody>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCategories;
