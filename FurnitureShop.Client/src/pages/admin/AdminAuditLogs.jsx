import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';
import { PageHeader, TableCard, Table, Thead, Th, Td, TableState, Pagination, Filters, SearchInput, FilterSelect } from '../../components/admin/ui';
import apiClient from '../../utils/apiClient';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 20;

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [expandedLogId, setExpandedLogId] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, [page]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get(`/auditlogs?page=${page}&pageSize=${pageSize}`);
            if (res.success) {
                setLogs(res.data || []);
                setTotalPages(res.totalPages || 1);
            }
        } catch (error) {
            toast.error('Lỗi khi tải nhật ký hoạt động');
        } finally {
            setLoading(false);
        }
    };

    // Relative time calculation
    const getRelativeTime = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 7) return `${diffDay} ngày trước`;
        return past.toLocaleDateString('vi-VN');
    };

    // Action color & styling mapping
    const getActionStyle = (action = '') => {
        const act = action.toUpperCase();
        if (act.includes('CREATE') || act.includes('POST') || act.includes('ADD') || act.includes('INSERT')) {
            return { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', border: 'border-l-emerald-500' };
        }
        if (act.includes('UPDATE') || act.includes('PUT') || act.includes('EDIT') || act.includes('MODIFY')) {
            return { badge: 'bg-amber-50 text-amber-700 border-amber-200', border: 'border-l-amber-500' };
        }
        if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('DESTROY')) {
            return { badge: 'bg-rose-50 text-rose-700 border-rose-200', border: 'border-l-rose-500' };
        }
        if (act.includes('LOGIN') || act.includes('LOGOUT') || act.includes('AUTH')) {
            return { badge: 'bg-sky-50 text-sky-700 border-sky-200', border: 'border-l-sky-500' };
        }
        return { badge: 'bg-zinc-100 text-zinc-600 border-zinc-200', border: 'border-l-zinc-300' };
    };

    // Filter logs client-side based on search term & action dropdown
    const filteredLogs = logs.filter(log => {
        const matchesAction = selectedAction ? (log.action || '').toUpperCase().includes(selectedAction) : true;
        const matchesSearch = searchTerm ? (
            (log.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.entityName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
        ) : true;
        return matchesAction && matchesSearch;
    });

    const toggleExpand = (logId) => {
        setExpandedLogId(prev => prev === logId ? null : logId);
    };

    const formatDetails = (details) => {
        if (!details) return 'Không có thông tin chi tiết.';
        try {
            const parsed = JSON.parse(details);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return details;
        }
    };

    return (
        <AdminLayout>
            <PageHeader 
                title="Nhật ký Hoạt động" 
                subtitle="Giám sát mọi thao tác và sự kiện trên hệ thống theo thời gian thực"
                breadcrumb={['Admin', 'Hệ thống', 'Nhật ký hoạt động']}
            >
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE AUDIT
                    </span>
                    <button 
                        onClick={() => fetchLogs()} 
                        className="p-2 bg-white border border-zinc-200 rounded-xl text-zinc-600 hover:text-black hover:bg-zinc-50 transition-all cursor-pointer shadow-2xs"
                        title="Làm mới dữ liệu"
                    >
                        🔄
                    </button>
                </div>
            </PageHeader>

            <Filters>
                <SearchInput 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    placeholder="Tìm tài khoản, đối tượng, chi tiết thao tác..." 
                />
                <FilterSelect 
                    value={selectedAction} 
                    onChange={e => setSelectedAction(e.target.value)} 
                    placeholder="Tất cả hành động"
                    options={[
                        { value: 'CREATE', label: 'Thêm mới (CREATE)' },
                        { value: 'UPDATE', label: 'Cập nhật (UPDATE)' },
                        { value: 'DELETE', label: 'Xóa (DELETE)' },
                        { value: 'LOGIN', label: 'Đăng nhập / Xác thực' }
                    ]} 
                />
            </Filters>

            <TableCard>
                <Table>
                    <Thead>
                        <tr>
                            <Th>Thời gian</Th>
                            <Th>Người thao tác</Th>
                            <Th>Hành động</Th>
                            <Th>Đối tượng</Th>
                            <Th>Tóm tắt chi tiết</Th>
                            <Th align="center">Mở rộng</Th>
                        </tr>
                    </Thead>
                    <tbody>
                        {loading ? (
                            <TableState type="loading" colSpan={6} message="Đang tải nhật ký hoạt động..." />
                        ) : filteredLogs.length === 0 ? (
                            <TableState type="empty" colSpan={6} message="Không tìm thấy nhật ký hoạt động nào phù hợp" />
                        ) : (
                            filteredLogs.map(log => {
                                const style = getActionStyle(log.action);
                                const isExpanded = expandedLogId === log.logId;
                                const firstChar = (log.username || 'S')[0].toUpperCase();

                                return (
                                    <React.Fragment key={log.logId || Math.random()}>
                                        <tr 
                                            onClick={() => toggleExpand(log.logId)}
                                            className={`border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors cursor-pointer border-l-4 ${style.border} ${isExpanded ? 'bg-zinc-50/90' : ''}`}
                                        >
                                            <Td className="whitespace-nowrap">
                                                <div className="font-semibold text-zinc-800">{getRelativeTime(log.createdAt)}</div>
                                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                </div>
                                            </Td>
                                            <Td>
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                                        {firstChar}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-zinc-900">{log.username || 'System'}</div>
                                                        <div className="text-[11px] text-zinc-400 font-mono">ID: {log.userId || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </Td>
                                            <Td>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wide border ${style.badge}`}>
                                                    {log.action}
                                                </span>
                                            </Td>
                                            <Td>
                                                <div className="font-medium text-zinc-800">{log.entityName || '-'}</div>
                                                {log.entityId && (
                                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-mono">
                                                        #{log.entityId}
                                                    </span>
                                                )}
                                            </Td>
                                            <Td>
                                                <div className="text-xs text-zinc-600 max-w-md truncate font-light">
                                                    {log.details || '-'}
                                                </div>
                                            </Td>
                                            <Td align="center">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-zinc-500 transition-transform duration-200 text-xs ${isExpanded ? 'rotate-180 bg-[#0D0D0D] text-white' : ''}`}>
                                                    ▼
                                                </span>
                                            </Td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-zinc-900/95 text-zinc-100 border-b border-zinc-800 animate-fade-in">
                                                <Td colSpan={6} className="!p-6 !border-none">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800 pb-2">
                                                            <span className="font-mono uppercase tracking-wider font-bold text-[#C9A87C]">
                                                                ⚡ Thông tin payload chi tiết (Log ID: #{log.logId})
                                                            </span>
                                                            <span className="font-mono text-[11px]">{new Date(log.createdAt).toISOString()}</span>
                                                        </div>
                                                        <pre className="p-3 bg-black/50 rounded-xl overflow-x-auto text-xs font-mono text-emerald-400 leading-relaxed max-h-60 selection:bg-[#C9A87C] selection:text-black border border-zinc-800/80">
                                                            {formatDetails(log.details)}
                                                        </pre>
                                                    </div>
                                                </Td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </Table>

                {totalPages > 1 && (
                    <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPage={setPage}
                        onPrev={() => setPage(p => Math.max(1, p - 1))}
                        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                    />
                )}
            </TableCard>
        </AdminLayout>
    );
}
