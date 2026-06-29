// src/components/admin/AdminLayout.jsx
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { Toaster } from 'react-hot-toast';
import { useSignalR } from '../../hooks/useSignalR';
import '../../styles/admin.css';

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  useSignalR();

  return (
    <div className="admin-layout flex min-h-screen bg-[#F8F9FA] text-[#0D0D0D] font-['Outfit'] relative w-full selection:bg-[#C9A87C] selection:text-white">
      <AdminSidebar collapsed={collapsed} />
      <div
        className={`flex flex-col flex-1 min-h-screen transition-all duration-300 ease-in-out min-w-0 w-0 overflow-hidden ${
          collapsed ? 'ml-[76px]' : 'ml-[260px]'
        }`}
      >
        <AdminHeader onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="flex-1 p-6 md:p-8 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto w-full animate-fade-up">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </div>
  );
};

export default AdminLayout;
