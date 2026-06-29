// src/pages/admin/AdminTickets.jsx — Executive Customer Support Cockpit (Tailwind v4)
import { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Badge, PageHeader } from '../../components/admin/ui';
import toast from 'react-hot-toast';

const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ── Empty removed ── */

const StatCard = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 shadow-xs flex items-start gap-4 hover:border-zinc-300 transition-all">
    <div className="w-11 h-11 rounded-xl bg-[#0D0D0D] text-[#C9A87C] flex items-center justify-center text-lg flex-shrink-0 shadow-2xs">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">{label}</span>
      <span className="text-2xl font-mono font-bold text-[#0D0D0D] block mt-1 leading-none">{value}</span>
      {sub && <span className="text-[10px] text-zinc-400 font-light mt-1 block">{sub}</span>}
    </div>
  </div>
);

const AdminTickets = () => {
  const [tickets, setTickets]     = useState([]);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('');
  const [selected, setSelected]   = useState(null);
  const [replyVal, setReplyVal]   = useState('');

  const filtered = tickets.filter(t =>
    (!statusF || t.status === statusF) &&
    (!search || t.id.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()) || t.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const sendReply = (e) => {
    e.preventDefault();
    if (!replyVal) return;
    setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, status: 'completed', updated: new Date().toISOString() } : t));
    toast.success('Đã Gửi Phản Hồi Khiếu Nại Cho Khách Hàng!');
    setSelected(null); setReplyVal('');
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Yêu Cầu Khiếu Nại" 
        subtitle="Tiếp nhận, xử lý phản hồi khiếu nại và yêu cầu bảo hành từ khách hàng"
        breadcrumb={['Admin', 'Hỗ trợ & CSKH', 'Yêu cầu khiếu nại']}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon="📥" label="Yêu Cầu Mới" value={`${tickets.filter(t=>t.status==='pending').length} Yêu cầu`} sub="Chờ nhân viên phản hồi" />
        <StatCard icon="🔄" label="Đang Xử Lý" value={`${tickets.filter(t=>t.status==='processing').length} Yêu cầu`} sub="Đang liên hệ xưởng/bảo hành" />
        <StatCard icon="✅" label="Đã Giải Quyết" value={`${tickets.filter(t=>t.status==='completed').length} Yêu cầu`} sub="Hoàn tất đóng ticket" />
        <StatCard icon="⚡" label="Thời Gian Phản Hồi" value="12 Phút" sub="Trung bình SLA" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã ticket #TK, nội dung khiếu nại, email khách..."
              className="w-full bg-white pl-10 pr-4 py-2 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black transition-all font-['Outfit']"
            />
          </div>

          <select
            value={statusF}
            onChange={e => setStatusF(e.target.value)}
            className="bg-white px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 outline-none cursor-pointer focus:border-black transition-all"
          >
            <option value="">Toàn bộ trạng thái</option>
            <option value="pending">Chờ xử lý (Mở)</option>
            <option value="processing">Đang thụ lý</option>
            <option value="completed">Đã giải quyết</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80">
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Mã Ticket</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Chủ Đề Yêu Cầu</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Khách Hàng</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Danh Mục</th>
                <th className="px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 text-center">Cập Nhật</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#C9A87C]">#{t.id}</td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-zinc-900 max-w-[320px] truncate">{t.subject}</td>
                  <td className="px-4 py-3.5 text-xs text-zinc-700">
                    <div>{t.customer}</div>
                    <div className="text-[11px] text-zinc-400 font-light">{t.email}</div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-zinc-500">{t.category}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-zinc-400 text-center">{fmtDate(t.updated)}</td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant={t.status}>{t.status === 'completed' ? 'ĐÃ GIẢI QUYẾT' : t.status === 'processing' ? 'ĐANG XỬ LÝ' : 'ĐANG CHỜ'}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setSelected(t)}
                      className="px-3 py-1 bg-[#0D0D0D] text-white rounded-lg text-[11px] font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer border-none shadow-2xs"
                    >
                      Phản hồi
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-zinc-400 font-mono">
                    CHƯA CÓ YÊU CẦU HỖ TRỢ / KHIẾU NẠI NÀO TỪ KHÁCH HÀNG
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Trả Lời Ticket */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-['Outfit'] select-none">
          <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/80">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A87C] uppercase tracking-widest block">TICKET #{selected.id}</span>
                <h3 className="m-0 text-base font-bold text-[#0D0D0D] truncate max-w-md mt-0.5">{selected.subject}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-zinc-200/60 hover:bg-zinc-300 text-zinc-700 font-bold border-none cursor-pointer">✕</button>
            </div>

            <form onSubmit={sendReply} className="p-6 space-y-4">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/60 text-xs text-zinc-600 leading-relaxed">
                <strong className="text-black block mb-1">Yêu cầu từ {selected.customer} ({selected.email}):</strong>
                "{selected.subject}"
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Nội Dung Phản Hồi Từ Quản Trị Viên</label>
                <textarea
                  rows={4}
                  value={replyVal}
                  onChange={e => setReplyVal(e.target.value)}
                  placeholder="Nhập câu trả lời chính thức hoặc phương án giải quyết khiếu nại..."
                  className="w-full p-3 rounded-xl border border-zinc-200 text-xs outline-none focus:border-black bg-white font-['Outfit'] leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 cursor-pointer">
                  Đóng
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer shadow-xs border-none">
                  Gửi Phản Hồi & Hoàn Tất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminTickets;
