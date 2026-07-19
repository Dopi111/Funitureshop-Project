import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { Badge, PageHeader } from '../../components/admin/ui';
import apiService from '../../services/apiService';

const fmtTime = (value) => value ? new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '';

const AdminChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadChat = async () => {
    setLoading(true);
    const res = await apiService.request('/admin-operations/chat', { method: 'GET' });
    if (res.success) {
      setConversations(res.data || []);
      setSelectedId(current => current || res.data?.[0]?.id || null);
    } else toast.error(res.message || 'Không thể tải hội thoại');
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    apiService.request('/admin-operations/chat', { method: 'GET' }).then(res => {
      if (!active) return;
      if (res.success) {
        setConversations(res.data || []);
        setSelectedId(res.data?.[0]?.id || null);
      } else toast.error(res.message || 'Không thể tải hội thoại');
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const selected = conversations.find(item => item.id === selectedId);
  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selected || !message.trim()) return;
    const res = await apiService.request(`/admin-operations/chat/${selected.id}/messages`, {
      method: 'POST', body: JSON.stringify({ message: message.trim() })
    });
    if (res.success) {
      setConversations(prev => prev.map(item => item.id === selected.id ? res.data : item));
      setMessage('');
    } else toast.error(res.message || 'Không thể gửi tin nhắn');
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Hỗ Trợ Trực Tuyến"
        subtitle="Theo dõi hội thoại khách hàng và phản hồi trực tiếp từ khu vực quản trị"
        breadcrumb={['Admin', 'Hỗ trợ & CSKH', 'Hỗ trợ trực tuyến']}
      >
        <button onClick={loadChat} className="px-4 py-2 rounded-xl bg-[#0D0D0D] text-white text-xs font-semibold border-none cursor-pointer">Làm mới</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[620px] bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        <aside className="border-b lg:border-b-0 lg:border-r border-zinc-200 bg-zinc-50/60 max-h-[260px] lg:max-h-none overflow-y-auto">
          <div className="px-4 py-3 border-b border-zinc-200 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-500">
            {conversations.length} cuộc hội thoại
          </div>
          {conversations.map(item => (
            <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full p-4 border-none border-b border-zinc-200 text-left cursor-pointer transition-colors ${selectedId === item.id ? 'bg-white' : 'bg-transparent hover:bg-white/70'}`}>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-zinc-900 truncate">{item.customer}</strong>
                {item.unread > 0 && <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center">{item.unread}</span>}
              </div>
              <div className="text-[11px] text-zinc-500 mt-1 truncate">{item.messages?.at(-1)?.message}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant={item.status === 'active' ? 'processing' : 'pending'}>{item.status === 'active' ? 'ĐANG CHAT' : 'CHỜ TRẢ LỜI'}</Badge>
                <span className="text-[10px] font-mono text-zinc-400">{fmtTime(item.updatedAt)}</span>
              </div>
            </button>
          ))}
          {!loading && conversations.length === 0 && <p className="p-5 text-xs text-zinc-400">Chưa có cuộc hội thoại.</p>}
        </aside>

        <section className="flex flex-col min-w-0">
          {selected ? (
            <>
              <header className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-3">
                <div>
                  <h2 className="m-0 text-base font-bold text-zinc-900">{selected.customer}</h2>
                  <p className="m-0 mt-1 text-xs text-zinc-500">{selected.email} · #{selected.id}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Đang trực tuyến</span>
              </header>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[radial-gradient(circle_at_top_right,#f5efe6,transparent_40%)]">
                {selected.messages?.map((item, index) => {
                  const admin = item.sender !== 'Khách hàng';
                  return <div key={`${item.createdAt}-${index}`} className={`flex ${admin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${admin ? 'bg-[#0D0D0D] text-white rounded-br-md' : 'bg-white border border-zinc-200 text-zinc-800 rounded-bl-md'}`}>
                      <div>{item.message}</div>
                      <div className={`mt-1.5 text-[10px] font-mono ${admin ? 'text-zinc-400' : 'text-zinc-400'}`}>{item.sender} · {fmtTime(item.createdAt)}</div>
                    </div>
                  </div>;
                })}
              </div>
              <form onSubmit={sendMessage} className="p-4 border-t border-zinc-200 flex gap-3 bg-white">
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Nhập phản hồi cho khách hàng..." className="flex-1 resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-black" />
                <button type="submit" className="px-5 rounded-xl bg-[#C9A87C] text-black text-xs font-bold uppercase tracking-wider border-none cursor-pointer hover:bg-[#0D0D0D] hover:text-white transition-colors">Gửi</button>
              </form>
            </>
          ) : <div className="flex-1 flex items-center justify-center text-sm text-zinc-400">{loading ? 'Đang tải hội thoại...' : 'Chọn một hội thoại để bắt đầu hỗ trợ'}</div>}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminChat;
