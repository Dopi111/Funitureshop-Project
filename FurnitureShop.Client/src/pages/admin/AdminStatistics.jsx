import React, { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { statisticsService } from '../../services/statisticsService';
import '../../index.css';
import '../../styles/Statistics.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtM = (v) => v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v;

// Preset ranges
const PRESETS = [
    { label: '7 ngày', days: 7 },
    { label: '30 ngày', days: 30 },
    { label: '90 ngày', days: 90 },
    { label: 'Năm nay', key: 'year' },
    { label: 'Tất cả', key: 'all' },
];

const toInputDate = (d) => d.toISOString().split('T')[0];

const SummaryCard = ({ title, value, color, icon }) => (
    <div className="stat-card">
        <div className="stat-card-icon" style={{ background: color + '20', color }}>{icon}</div>
        <div className="stat-card-info">
            <p className="stat-card-title">{title}</p>
            <p className="stat-card-value" style={{ color }}>{value}</p>
        </div>
    </div>
);

const AdminStatistics = () => {
    const today = toInputDate(new Date());
    const ago30 = toInputDate(new Date(Date.now() - 30 * 86400000));

    const [startDate, setStartDate] = useState(ago30);
    const [endDate, setEndDate] = useState(today);
    const [activePreset, setActivePreset] = useState('30 ngày');
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (from, to) => {
        try {
            setLoading(true);
            setError(null);
            const response = await statisticsService.getDashboardData(from || null, to || null);
            if (response.success) {
                setDashboardData(response.data);
            } else {
                setError('Không thể tải dữ liệu thống kê');
            }
        } catch (err) {
            setError('Lỗi: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData(startDate, endDate);
    }, []);

    const applyPreset = (preset) => {
        setActivePreset(preset.label);
        let from, to;
        to = today;
        if (preset.days) {
            from = toInputDate(new Date(Date.now() - preset.days * 86400000));
        } else if (preset.key === 'year') {
            from = `${new Date().getFullYear()}-01-01`;
        } else {
            from = '';
            to = '';
        }
        setStartDate(from);
        setEndDate(to);
        fetchData(from || null, to || null);
    };

    const handleApply = () => {
        setActivePreset('');
        fetchData(startDate || null, endDate || null);
    };

    const handleReset = () => {
        setStartDate(ago30);
        setEndDate(today);
        setActivePreset('30 ngày');
        fetchData(ago30, today);
    };

    const renderBody = () => {
        if (loading) return <div className="admin-loading"><p>Đang tải dữ liệu...</p></div>;
        if (error) return <div className="admin-error"><p>⚠️ {error}</p></div>;
        if (!dashboardData) return null;

        const {
            summary, orderStatusDistribution, revenueByDate,
            topProducts, categoryPerformance, productTypes,
            shippingMethods, userActivity, inventoryStatus,
            orderCompletion, monthlySales
        } = dashboardData;

        return (
            <>
                {/* Summary Cards */}
                <div className="stat-cards-grid">
                    <SummaryCard title="Tổng đơn hàng" value={summary.totalOrders} color="#0088FE" icon="🛒" />
                    <SummaryCard title="Doanh thu" value={fmt(summary.totalRevenue)} color="#00C49F" icon="💰" />
                    <SummaryCard title="Khách hàng" value={summary.totalCustomers} color="#8884D8" icon="👥" />
                    <SummaryCard title="Sản phẩm" value={summary.totalProducts} color="#FFBB28" icon="📦" />
                    <SummaryCard title="Giá trị TB/đơn" value={fmt(summary.averageOrderValue)} color="#82CA9D" icon="📈" />
                    <SummaryCard title="Đơn chờ xử lý" value={summary.pendingOrders} color="#FF8042" icon="⏳" />
                </div>

                {/* Row 1: Revenue + Order Status */}
                <div className="stat-charts-row">
                    <div className="stat-chart-box stat-chart-wide">
                        <h3>Doanh thu theo ngày</h3>
                        {revenueByDate?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={revenueByDate}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => fmt(v)} labelFormatter={(d) => new Date(d).toLocaleDateString('vi-VN')} />
                                    <Line type="monotone" dataKey="revenue" stroke="#0088FE" strokeWidth={2} dot={false} name="Doanh thu" />
                                    <Line type="monotone" dataKey="orderCount" stroke="#FF8042" strokeWidth={1.5} dot={false} name="Số đơn" yAxisId={0} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Không có đơn hoàn thành trong khoảng này</p>}
                    </div>

                    <div className="stat-chart-box">
                        <h3>Trạng thái đơn hàng</h3>
                        {orderStatusDistribution?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={orderStatusDistribution} cx="50%" cy="50%" outerRadius={85}
                                        dataKey="count" nameKey="status" label={({ status, count }) => `${status}: ${count}`} labelLine={false}>
                                        {orderStatusDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v} đơn`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Không có dữ liệu</p>}
                    </div>
                </div>

                {/* Row 2: Monthly + Top Products */}
                <div className="stat-charts-row">
                    <div className="stat-chart-box">
                        <h3>Doanh thu theo tháng</h3>
                        {monthlySales?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={monthlySales}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, name) => name === 'Doanh thu' ? fmt(v) : v} labelFormatter={(m) => `Tháng ${m}`} />
                                    <Bar dataKey="revenue" fill="#82CA9D" name="Doanh thu" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="orderCount" fill="#8884D8" name="Số đơn" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Không có dữ liệu</p>}
                    </div>

                    <div className="stat-chart-box stat-chart-wide">
                        <h3>Top 10 sản phẩm bán chạy</h3>
                        {topProducts?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="productName" width={130} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => `${v} sản phẩm`} />
                                    <Bar dataKey="quantitySold" fill="#8884D8" name="Đã bán" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Chưa có đơn hàng</p>}
                    </div>
                </div>

                {/* Row 3: Category + Shipping */}
                <div className="stat-charts-row">
                    <div className="stat-chart-box stat-chart-wide">
                        <h3>Doanh thu theo danh mục</h3>
                        {categoryPerformance?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={categoryPerformance}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="categoryName" angle={-25} textAnchor="end" height={55} tick={{ fontSize: 11 }} />
                                    <YAxis tickFormatter={fmtM} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => fmt(v)} />
                                    <Bar dataKey="totalSales" fill="#FFBB28" name="Doanh thu" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Không có dữ liệu</p>}
                    </div>

                    <div className="stat-chart-box">
                        <h3>Phương thức giao hàng</h3>
                        {shippingMethods?.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={shippingMethods} cx="50%" cy="50%" outerRadius={85}
                                        dataKey="usageCount" nameKey="shippingMethodName"
                                        label={({ shippingMethodName, usageCount }) => `${shippingMethodName}: ${usageCount}`} labelLine={false}>
                                        {shippingMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => `${v} đơn`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="no-data">Không có dữ liệu</p>}
                    </div>
                </div>

                {/* Info Tables */}
                <div className="stat-tables-row">
                    <div className="stat-info-box">
                        <h3>👥 Người dùng</h3>
                        {userActivity && (
                            <table className="stat-info-table"><tbody>
                                <tr><td>Tổng đăng ký</td><td className="val">{userActivity.totalRegisteredUsers}</td></tr>
                                <tr><td>Đang hoạt động</td><td className="val">{userActivity.activeUsers}</td></tr>
                                <tr><td>Mới tháng này</td><td className="val green">{userActivity.newUsersThisMonth}</td></tr>
                                <tr><td>Có đơn hàng</td><td className="val">{userActivity.usersWithOrders}</td></tr>
                            </tbody></table>
                        )}
                    </div>

                    <div className="stat-info-box">
                        <h3>📦 Kho hàng</h3>
                        {inventoryStatus && (
                            <table className="stat-info-table"><tbody>
                                <tr><td>Sắp hết (≤10)</td><td className="val orange">{inventoryStatus.lowStockProducts}</td></tr>
                                <tr><td>Hết hàng</td><td className="val red">{inventoryStatus.outOfStockProducts}</td></tr>
                                <tr><td>Giá trị tồn</td><td className="val">{fmt(inventoryStatus.totalInventoryValue)}</td></tr>
                            </tbody></table>
                        )}
                    </div>

                    <div className="stat-info-box">
                        <h3>✅ Hoàn thành đơn</h3>
                        {orderCompletion && (
                            <table className="stat-info-table"><tbody>
                                <tr><td>Thời gian TB (ngày)</td><td className="val">{orderCompletion.averageCompletionTime.toFixed(1)}</td></tr>
                                <tr><td>Hoàn thành tháng này</td><td className="val green">{orderCompletion.completedOrdersThisMonth}</td></tr>
                                <tr><td>Tỷ lệ hoàn thành</td><td className="val">{orderCompletion.completionRate.toFixed(1)}%</td></tr>
                            </tbody></table>
                        )}
                    </div>

                    <div className="stat-info-box">
                        <h3>🛋️ Loại sản phẩm</h3>
                        {productTypes?.length > 0 ? (
                            <table className="stat-info-table">
                                <thead><tr><th>Loại</th><th>SL</th><th>Đã bán</th></tr></thead>
                                <tbody>
                                    {productTypes.map((pt, i) => (
                                        <tr key={i}>
                                            <td>{pt.productType}</td>
                                            <td className="val">{pt.count}</td>
                                            <td className="val green">{pt.totalSold}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="no-data">Không có dữ liệu</p>}
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="admin-layout">
            <AdminSidebar />
            <main className="admin-main">
                <div className="admin-header">
                    <h1>📊 Thống kê</h1>
                </div>

                {/* Filter Bar */}
                <div className="stat-filter-bar">
                    <div className="stat-filter-presets">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                className={`stat-preset-btn ${activePreset === p.label ? 'active' : ''}`}
                                onClick={() => applyPreset(p)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div className="stat-filter-custom">
                        <label>Từ</label>
                        <input type="date" value={startDate} max={endDate || today}
                            onChange={e => { setStartDate(e.target.value); setActivePreset(''); }} />
                        <label>Đến</label>
                        <input type="date" value={endDate} min={startDate} max={today}
                            onChange={e => { setEndDate(e.target.value); setActivePreset(''); }} />
                        <button className="btn btn-primary stat-apply-btn" onClick={handleApply}>
                            Áp dụng
                        </button>
                        <button className="btn btn-outline stat-apply-btn" onClick={handleReset}>
                            Đặt lại
                        </button>
                    </div>
                </div>

                {renderBody()}
            </main>
        </div>
    );
};

export default AdminStatistics;
