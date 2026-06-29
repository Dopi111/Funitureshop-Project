import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { PageHeader, Btn } from '../../components/admin/ui';

const AdminSettings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const r = await fetch('/api/settings/details', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (r.ok) {
        const data = await r.json();
        if (data && data.success && Array.isArray(data.data)) {
          const mapped = {};
          data.data.forEach(s => mapped[s.key] = s.value);
          setSettings(mapped);
          return;
        }
      }
      // Fallback if details endpoint requires auth or returns non-array
      const r2 = await fetch('/api/settings');
      if (r2.ok) {
        const data2 = await r2.json();
        if (data2 && data2.success && data2.data) {
          setSettings(data2.data);
          return;
        }
      }
      setSettings({});
    } catch {
      toast.error('Lỗi tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (key, val) => {
    try {
      setSaving(true);
      const r = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ value: val })
      });
      const data = await r.json();
      if (data.success) {
        toast.success(`Đã cập nhật ${key}`);
      } else {
        toast.error(data.message || 'Lỗi cập nhật');
      }
    } catch {
      toast.error('Lỗi cập nhật cấu hình');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <AdminLayout><div className="p-8">Đang tải cấu hình...</div></AdminLayout>;

  return (
    <AdminLayout>
      <PageHeader 
        title="Cấu hình hệ thống" 
        subtitle="Quản lý tham số hoạt động, thông tin cửa hàng và thiết lập chung"
        breadcrumb={['Admin', 'Hệ thống', 'Cấu hình hệ thống']}
      />
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-4xl">
        <h2 className="text-lg font-bold text-slate-800 mb-6 border-b pb-4">Thông tin Cửa hàng</h2>
        
        <div className="grid grid-cols-1 gap-6">
          <SettingItem 
            label="Tên cửa hàng (StoreName)" 
            val={settings.StoreName} 
            onSave={(v) => handleSave('StoreName', v)}
            onChange={(v) => handleChange('StoreName', v)}
            saving={saving}
          />
          <SettingItem 
            label="Số điện thoại CSKH (Hotline)" 
            val={settings.Hotline} 
            onSave={(v) => handleSave('Hotline', v)}
            onChange={(v) => handleChange('Hotline', v)}
            saving={saving}
          />
          <SettingItem 
            label="Địa chỉ Showroom (Address)" 
            val={settings.Address} 
            onSave={(v) => handleSave('Address', v)}
            onChange={(v) => handleChange('Address', v)}
            saving={saving}
          />
          <SettingItem 
            label="Đường dẫn Banner Trang Chủ (BannerUrl)" 
            val={settings.BannerUrl} 
            onSave={(v) => handleSave('BannerUrl', v)}
            onChange={(v) => handleChange('BannerUrl', v)}
            saving={saving}
          />
          <SettingItem 
            label="Số ngày cho phép trả hàng (ReturnPolicyDays)" 
            val={settings.ReturnPolicyDays} 
            type="number"
            onSave={(v) => handleSave('ReturnPolicyDays', v)}
            onChange={(v) => handleChange('ReturnPolicyDays', v)}
            saving={saving}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

const SettingItem = ({ label, val, onChange, onSave, saving, type = "text" }) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="flex gap-3">
        <input 
          type={type} 
          value={val || ''} 
          onChange={(e) => onChange(e.target.value)} 
          className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Btn onClick={() => onSave(val)} disabled={saving}>Lưu</Btn>
      </div>
    </div>
  );
};

export default AdminSettings;
