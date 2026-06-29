// src/pages/admin/AdminChat.jsx
import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { PageHeader } from '../../components/admin/ui';

const AdminChat = () => (
  <AdminLayout>
    <PageHeader 
      title="Hỗ trợ Trực tuyến" 
      subtitle="Kênh trò chuyện chăm sóc khách hàng và phản hồi tin nhắn trực tiếp"
      breadcrumb={['Admin', 'Hỗ trợ & CSKH', 'Hỗ trợ trực tuyến']}
    />
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 bg-white rounded-2xl border border-zinc-200/80 p-8 shadow-2xs">
      <span className="text-6xl animate-bounce">💬</span>
      <h2 className="text-xl font-bold text-zinc-800 m-0">Hệ Thống Live Chat</h2>
      <p className="text-sm text-zinc-500">Tính năng hỗ trợ trực tuyến đang được kết nối với hệ thống AI CSKH — sắp ra mắt!</p>
    </div>
  </AdminLayout>
);

export default AdminChat;
