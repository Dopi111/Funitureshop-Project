// src/pages/admin/AdminUtilities.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import productService from '../../services/productService';
import notificationService from '../../services/notificationService';
import { PageHeader, FormGroup, FormInput, FormSelect, FormTextarea } from '../../components/admin/ui';

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick}
    className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer font-[inherit] bg-transparent ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
    {label}
  </button>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-6 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }) => (
  <h3 className="text-base font-semibold text-slate-700 mb-4 m-0">{children}</h3>
);

const AlertBox = ({ type, children }) => {
  const s = { success: 'bg-emerald-50 border-emerald-200 text-emerald-700', error: 'bg-red-50 border-red-200 text-red-600' };
  return <div className={`flex items-start gap-2 px-4 py-3 border rounded-xl text-sm mb-4 ${s[type]}`}>{type === 'success' ? '✓' : '⚠️'} {children}</div>;
};

const SubmitBtn = ({ loading, children }) => (
  <button type="submit" disabled={loading}
    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-[inherit]">
    {loading ? 'Đang xử lý...' : children}
  </button>
);

const AdminUtilities = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('product-types');
  const [productTypes, setProductTypes] = useState([]);
  const [typeStats, setTypeStats] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [typeError, setTypeError] = useState(null);
  const [validateForm, setValidateForm] = useState({ name:'', productType:'Furniture', width:'', height:'', depth:'', weight:'', basePrice:'', categoryId:'1' });
  const [validateLoading, setValidateLoading] = useState(false);
  const [validateResult, setValidateResult] = useState(null);
  const [validateError, setValidateError] = useState(null);
  const [emailForm, setEmailForm] = useState({ to: user?.email||'', subject:'Test Email', body:'This is a test email from FurnitureShop Admin' });
  const [smsForm, setSmsForm] = useState({ phoneNumber:'', message:'Test SMS from FurnitureShop Admin' });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState(null);
  const [notifError, setNotifError] = useState(null);

  useEffect(() => { if (activeTab === 'product-types') loadTypes(); }, [activeTab]);

  const loadTypes = async () => {
    setLoadingTypes(true); setTypeError(null);
    try {
      const [tr, sr] = await Promise.all([productService.getProductTypes(), productService.getProductTypeStats()]);
      if (tr.success) setProductTypes(tr.data ?? []);
      if (sr.success) setTypeStats(sr.data ?? []);
    } catch { setTypeError('Không thể tải thông tin loại sản phẩm'); }
    finally { setLoadingTypes(false); }
  };

  const handleValidate = async (e) => {
    e.preventDefault(); setValidateLoading(true); setValidateError(null); setValidateResult(null);
    try {
      const r = await productService.validateProductType({ name:validateForm.name, productType:validateForm.productType, width:parseFloat(validateForm.width)||0, height:parseFloat(validateForm.height)||0, depth:parseFloat(validateForm.depth)||0, weight:parseFloat(validateForm.weight)||0, basePrice:parseFloat(validateForm.basePrice)||0, categoryId:parseInt(validateForm.categoryId)||1 });
      if (r.success) setValidateResult(r.data); else setValidateError(r.message||'Kiểm tra thất bại');
    } catch (err) { setValidateError('Lỗi: '+(err.message||'Không thể kiểm tra sản phẩm')); }
    finally { setValidateLoading(false); }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault(); setNotifLoading(true); setNotifError(null); setNotifStatus(null);
    try {
      const r = await notificationService.sendTestEmail(emailForm.to, emailForm.subject, emailForm.body);
      if (r.success) setNotifStatus('Email test đã được gửi (check queue)'); else setNotifError(r.message||'Gửi email thất bại');
    } catch (err) { setNotifError('Lỗi: '+(err.message||'Không thể gửi email')); }
    finally { setNotifLoading(false); }
  };

  const handleSendSms = async (e) => {
    e.preventDefault(); setNotifLoading(true); setNotifError(null); setNotifStatus(null);
    try {
      const r = await notificationService.sendTestSms(smsForm.phoneNumber, smsForm.message);
      if (r.success) setNotifStatus('SMS test đã được gửi (check queue)'); else setNotifError(r.message||'Gửi SMS thất bại');
    } catch (err) { setNotifError('Lỗi: '+(err.message||'Không thể gửi SMS')); }
    finally { setNotifLoading(false); }
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Tiện ích & Backup" 
        subtitle="Quản lý cấu hình mở rộng, thử nghiệm thông báo và công cụ hỗ trợ hệ thống"
        breadcrumb={['Admin', 'Hệ thống', 'Tiện ích & Backup']}
      />

      <div className="flex border-b border-slate-200 mb-6">
        <Tab label="📦 Loại Sản Phẩm"        active={activeTab==='product-types'}  onClick={() => setActiveTab('product-types')} />
        <Tab label="📨 Thử Nghiệm Thông Báo" active={activeTab==='notifications'}  onClick={() => setActiveTab('notifications')} />
      </div>

      {activeTab === 'product-types' && (
        <div className="flex flex-col gap-6">
          {typeError && <AlertBox type="error">{typeError}</AlertBox>}
          {loadingTypes ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Đang tải...</span>
            </div>
          ) : (
            <>
              {productTypes.length > 0 && (
                <Card>
                  <SectionTitle>Các Loại Sản Phẩm Hiện Có</SectionTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {productTypes.map((type, i) => {
                      const stat = typeStats.find(s => s.productType === type);
                      return (
                        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <p className="font-semibold text-slate-700 text-sm mb-1">{type}</p>
                          {stat && <p className="text-xs text-slate-400">👥 {stat.count} sản phẩm</p>}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
              <Card>
                <SectionTitle>Kiểm Tra Loại Sản Phẩm</SectionTitle>
                <form onSubmit={handleValidate} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormGroup label="Tên Sản Phẩm" required>
                      <FormInput value={validateForm.name} onChange={e => setValidateForm(p=>({...p,name:e.target.value}))} placeholder="VD: Bàn ăn gỗ" required />
                    </FormGroup>
                    <FormGroup label="Loại" required>
                      <FormSelect value={validateForm.productType} onChange={e => setValidateForm(p=>({...p,productType:e.target.value}))}>
                        {productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </FormSelect>
                    </FormGroup>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[['width','Rộng (cm)','80'],['height','Cao (cm)','75'],['depth','Sâu (cm)','120'],['weight','KG','50'],['basePrice','Giá (VND)','5000000']].map(([k,l,ph]) => (
                      <FormGroup key={k} label={l}>
                        <FormInput type="number" value={validateForm[k]} onChange={e => setValidateForm(p=>({...p,[k]:e.target.value}))} placeholder={ph} />
                      </FormGroup>
                    ))}
                  </div>
                  {validateError && <AlertBox type="error">{validateError}</AlertBox>}
                  <div><SubmitBtn loading={validateLoading}>Kiểm Tra</SubmitBtn></div>
                  {validateResult && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-700 text-sm">
                      <p className="font-semibold mb-2">✓ Kiểm tra thành công</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Loại: {validateResult.productType}</li>
                        <li>Mô tả: {validateResult.description}</li>
                        <li>Cân nặng vận chuyển: {validateResult.estimatedShippingWeight} kg</li>
                        {validateResult.requiredAttributes?.length > 0 && <li>Thuộc tính bắt buộc: {validateResult.requiredAttributes.join(', ')}</li>}
                      </ul>
                    </div>
                  )}
                </form>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="flex flex-col gap-6">
          {notifStatus && <AlertBox type="success">{notifStatus}</AlertBox>}
          {notifError  && <AlertBox type="error">{notifError}</AlertBox>}
          <Card>
            <SectionTitle>📧 Thử Nghiệm Email</SectionTitle>
            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <FormGroup label="Địa chỉ Email" required>
                <FormInput type="email" value={emailForm.to} onChange={e => setEmailForm(p=>({...p,to:e.target.value}))} required />
              </FormGroup>
              <FormGroup label="Tiêu đề">
                <FormInput value={emailForm.subject} onChange={e => setEmailForm(p=>({...p,subject:e.target.value}))} />
              </FormGroup>
              <FormGroup label="Nội dung">
                <FormTextarea value={emailForm.body} onChange={e => setEmailForm(p=>({...p,body:e.target.value}))} rows={4} />
              </FormGroup>
              <div><SubmitBtn loading={notifLoading}>📤 Gửi Email Test</SubmitBtn></div>
            </form>
          </Card>
          <Card>
            <SectionTitle>📱 Thử Nghiệm SMS</SectionTitle>
            <form onSubmit={handleSendSms} className="flex flex-col gap-4">
              <FormGroup label="Số Điện Thoại" required>
                <FormInput type="tel" value={smsForm.phoneNumber} onChange={e => setSmsForm(p=>({...p,phoneNumber:e.target.value}))} placeholder="0901234567" required />
              </FormGroup>
              <FormGroup label="Tin Nhắn">
                <FormTextarea value={smsForm.message} onChange={e => setSmsForm(p=>({...p,message:e.target.value}))} rows={3} />
              </FormGroup>
              <div><SubmitBtn loading={notifLoading}>📤 Gửi SMS Test</SubmitBtn></div>
            </form>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminUtilities;
