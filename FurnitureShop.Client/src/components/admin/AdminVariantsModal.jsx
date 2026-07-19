import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Modal, Btn, Table, Thead, Th, Td, ActionBtn } from './ui';

const AdminVariantsModal = ({ isOpen, onClose, product }) => {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '', color: '', size: '', material: '', additionalPrice: 0, stockQuantity: 0
  });

  const fetchVariants = async () => {
    if (!product?.productId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/products/${product.productId}/variants`);
      const data = await res.json();
      if (data.success) {
        setVariants(data.data || []);
      }
    } catch (err) {
      toast.error('Lỗi tải biến thể');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchVariants();
      setFormData({ sku: '', color: '', size: '', material: '', additionalPrice: 0, stockQuantity: 0 });
    }
  }, [isOpen, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/products/${product.productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          productId: product.productId,
          sku: formData.sku,
          color: formData.color,
          size: formData.size,
          material: formData.material,
          additionalPrice: parseFloat(formData.additionalPrice) || 0,
          stockQuantity: parseInt(formData.stockQuantity) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã thêm biến thể');
        setFormData({ sku: '', color: '', size: '', material: '', additionalPrice: 0, stockQuantity: 0 });
        fetchVariants();
      } else {
        toast.error(data.message || 'Lỗi thêm biến thể');
      }
    } catch (err) {
      toast.error('Không thể thêm biến thể');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa biến thể này?')) return;
    try {
      const res = await fetch(`/api/products/${product.productId}/variants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã xóa biến thể');
        fetchVariants();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Lỗi xóa biến thể');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" title={`Quản lý Biến thể: ${product?.name}`}>
      <div className="p-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="w-full md:w-1/3 border-r pr-4">
            <h3 className="font-semibold mb-3">Thêm Biến thể mới</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">SKU</label>
                <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border rounded p-1.5 text-sm" placeholder="VD: SOFA-RED-1M8" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Màu sắc</label>
                <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full border rounded p-1.5 text-sm" placeholder="VD: Đỏ, Xám..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Kích thước</label>
                <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className="w-full border rounded p-1.5 text-sm" placeholder="VD: 1m8, 2m..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Chất liệu</label>
                <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full border rounded p-1.5 text-sm" placeholder="VD: Da bò, Nỉ..." />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Giá cộng thêm (VND)</label>
                <input type="number" value={formData.additionalPrice} onChange={e => setFormData({...formData, additionalPrice: e.target.value})} className="w-full border rounded p-1.5 text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Tồn kho</label>
                <input type="number" required value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} className="w-full border rounded p-1.5 text-sm" />
              </div>
              <Btn type="submit" variant="primary" className="mt-2 w-full justify-center">Thêm mới</Btn>
            </form>
          </div>
          <div className="w-full md:w-2/3 mt-4 md:mt-0">
            <h3 className="font-semibold mb-3">Danh sách Biến thể</h3>
            {loading ? <div className="text-center py-4">Đang tải...</div> : 
             variants.length === 0 ? <div className="text-center py-4 text-slate-400 text-sm">Chưa có biến thể nào</div> : (
              <div className="overflow-auto border rounded max-h-96">
                <Table>
                  <Thead>
                    <tr>
                      <Th>Thuộc tính</Th>
                      <Th>Tồn kho</Th>
                      <Th>Giá +</Th>
                      <Th>Xóa</Th>
                    </tr>
                  </Thead>
                  <tbody>
                    {variants.map(v => (
                      <tr key={v.variantId} className="border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors">
                        <Td>
                          <div className="text-xs font-semibold">{v.sku}</div>
                          <div className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-1">
                            {v.color && <span className="bg-slate-100 px-1 rounded">🎨 {v.color}</span>}
                            {v.size && <span className="bg-slate-100 px-1 rounded">📏 {v.size}</span>}
                            {v.material && <span className="bg-slate-100 px-1 rounded">🧵 {v.material}</span>}
                          </div>
                        </Td>
                        <Td className="text-sm">{v.stockQuantity}</Td>
                        <Td className="text-sm font-medium text-emerald-600">+{v.additionalPrice.toLocaleString()}đ</Td>
                        <Td>
                          <ActionBtn onClick={() => handleDelete(v.variantId)} variant="delete">🗑️</ActionBtn>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 border-t flex justify-end gap-3 bg-slate-50 rounded-b-xl">
        <Btn onClick={onClose} variant="outline">Đóng</Btn>
      </div>
    </Modal>
  );
};

export default AdminVariantsModal;
