// src/pages/admin/AdminStatistics.jsx — Executive Luxury Analytics (Tailwind v4)
import { useState, useEffect, useCallback } from 'react';
import ReactApexChart from 'react-apexcharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { statisticsService } from '../../services/statisticsService';
import { PageHeader } from '../../components/admin/ui';

const fmt = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);
const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(v ?? 0);
const fmtMaybe = (v, formatter = fmtNum) => (v === null || v === undefined ? 'N/A' : formatter(v));
const toInputDate = (d) => d.toISOString().split('T')[0];

const BASE_CHART = {
  chart: {
    toolbar: { show: false },
    zoom: { enabled: false },
    background: 'transparent',
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
    animations: { enabled: true, easing: 'easeinout', speed: 500 },
  },
  grid: { borderColor: '#F1F5F9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2.5 },
  xaxis: { axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontSize: '11px', colors: '#71717a', fontFamily: "'JetBrains Mono', monospace" } } },
  yaxis: { labels: { style: { fontSize: '11px', colors: '#71717a', fontFamily: "'JetBrains Mono', monospace" } } },
  tooltip: { theme: 'dark', style: { fontSize: '12px' } },
  legend: { show: false },
};

const Skeleton = ({ className = 'w-full h-8' }) => <div className={`bg-zinc-100 rounded-xl animate-pulse ${className}`} />;
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_2px_16px_rgba(13,13,13,0.02)] transition-all duration-300 ${className}`}>{children}</div>;
const NoData = ({ h = 'h-[200px]', message = 'KHÔNG CÓ DỮ LIỆU THỐNG KÊ' }) => <div className={`${h} flex items-center justify-center text-xs text-zinc-400 font-mono text-center px-4`}>{message}</div>;

const Sparkline = ({ data = [], color = '#0D0D0D', negative }) => {
  if (!data.length) return <div className="w-24 h-9" />;
  const opts = {
    chart: { type: 'area', sparkline: { enabled: true }, animations: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0, stops: [0, 100] } },
    colors: [negative ? '#EF4444' : color],
    tooltip: { enabled: false },
  };
  return (
    <div className="w-28 h-10 flex items-center">
      <ReactApexChart type="area" series={[{ data }]} options={opts} height={40} width={110} />
    </div>
  );
};

const MetricCard = ({ label, value, trend, trendLabel, icon, sparkData }) => (
  <Card className="hover:border-zinc-300 group flex flex-col justify-between">
    <div className="flex items-start justify-between gap-4 mb-3">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block">{label}</span>
        <span className="text-2xl sm:text-3xl font-mono font-light tracking-tight text-[#0D0D0D] block tabular-nums leading-none mt-1.5">{value}</span>
      </div>
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-zinc-100 text-[#0D0D0D] flex items-center justify-center text-lg shadow-2xs group-hover:scale-105 transition-transform flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
    <div className="flex items-end justify-between gap-2 pt-2 border-t border-zinc-100 mt-2">
      <div className="flex items-center gap-1.5">
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-mono font-bold inline-flex items-center ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span>{trend >= 0 ? '↗' : '↘'}</span>
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </span>
        )}
        {trend === null && <span className="text-xs font-mono font-bold text-zinc-400">N/A</span>}
        {trendLabel && <span className="text-[11px] text-zinc-400 font-light truncate max-w-[120px]">{trendLabel}</span>}
      </div>
      {sparkData ? <Sparkline data={sparkData} color={trend >= 0 ? '#10B981' : '#EF4444'} negative={trend < 0} /> : <div className="w-28 h-10" />}
    </div>
  </Card>
);

const RevenueStatsChart = ({ revenueByDate, loading }) => {
  if (loading) return <Skeleton className="w-full h-[300px]" />;
  if (!revenueByDate?.length) return <NoData h="h-[300px]" message="KHÔNG CÓ DỮ LIỆU DOANH THU THEO NGÀY" />;

  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'area' },
    colors: ['#0D0D0D'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.0, stops: [0, 95] } },
    xaxis: { ...BASE_CHART.xaxis, type: 'datetime', labels: { ...BASE_CHART.xaxis.labels, format: 'dd/MM' } },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#71717a' }, formatter: v => (v === null || v === undefined ? 'N/A' : fmtNum(v)) } },
    tooltip: { ...BASE_CHART.tooltip, x: { format: 'dd/MM/yyyy' }, y: { formatter: fmt } },
  };

  const series = [{ name: 'Doanh thu thực tế', data: revenueByDate.map(d => ({ x: new Date(d.date).getTime(), y: d.revenue })) }];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Biểu Đồ Xu Hướng Doanh Thu Ngày</h3>
          <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Dữ liệu phát sinh thực tế theo khung thời gian đã chọn</p>
        </div>
      </div>
      <ReactApexChart type="area" series={series} options={opts} height={280} width="100%" />
    </div>
  );
};

const OrderDonut = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[220px]" />;
  if (!data?.length) return <NoData h="h-[220px]" message="KHÔNG CÓ DỮ LIỆU TRẠNG THÁI ĐƠN HÀNG" />;

  const statusMap = {
    Pending: 'Chờ xử lý',
    Processing: 'Đang xử lý',
    Shipped: 'Đang giao',
    Completed: 'Hoàn thành',
    Cancelled: 'Đã hủy',
    Returned: 'Trả hàng',
  };

  const labels = Array.isArray(data) ? data.map(item => statusMap[item.status] || item.status) : Object.keys(data).map(status => statusMap[status] || status);
  const series = Array.isArray(data) ? data.map(item => item.count) : Object.values(data);

  if (!labels.length) return <NoData h="h-[220px]" message="KHÔNG CÓ DỮ LIỆU TRẠNG THÁI ĐƠN HÀNG" />;

  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'donut' },
    colors: ['#0D0D0D', '#C9A87C', '#10B981', '#3b82f6', '#EF4444', '#f59e0b'],
    labels,
    plotOptions: { pie: { donut: { size: '68%' } } },
    legend: { position: 'bottom', fontSize: '11px', fontFamily: "'Outfit', sans-serif" },
    tooltip: { y: { formatter: v => `${v} đơn hàng` } },
  };

  return <ReactApexChart type="donut" series={series} options={opts} height={240} width="100%" />;
};

const TopProductsTable = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[240px]" />;
  if (!data?.length) return <NoData h="h-[240px]" message="KHÔNG CÓ DỮ LIỆU SẢN PHẨM BÁN CHẠY" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[540px]">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sản Phẩm</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center font-mono">Đã Bán</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right font-mono">Doanh Thu</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.slice(0, 6).map((p, i) => (
            <tr key={i} className="hover:bg-zinc-50 transition-colors">
              <td className="px-4 py-3.5 text-xs font-medium text-zinc-800 flex items-center gap-3">
                <span className="w-6 h-6 rounded-md bg-zinc-100 font-mono font-bold text-zinc-500 flex items-center justify-center text-[11px]">{i + 1}</span>
                <span className="truncate max-w-[240px]">{p.productName || p.name || 'N/A'}</span>
              </td>
              <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#0D0D0D] text-center">{p.quantitySold ?? p.unitsSold ?? p.quantity ?? 0}</td>
              <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#C9A87C] text-right">{fmt(p.revenue ?? p.totalRevenue ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminStatistics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 364);
    return { from: toInputDate(start), to: toInputDate(end) };
  });

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const r = await statisticsService.getDashboardData(dateRange.from, dateRange.to);
      if (r.success) setData(r.data);
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const s = data?.summary || null;
  const revenueByDate = data?.revenueByDate || [];
  const topProducts = data?.topProducts || [];
  const orderStatus = data?.orderStatusDistribution || [];

  const revenueTrend = revenueByDate.length > 1
    ? ((revenueByDate[revenueByDate.length - 1].revenue - revenueByDate[0].revenue) / Math.max(revenueByDate[0].revenue, 1)) * 100
    : null;

  return (
    <AdminLayout>
      <PageHeader
        title="Phân Tích Doanh Thu"
        subtitle="Báo cáo thống kê doanh số bán hàng, đơn đặt hàng và tăng trưởng thương mại"
        breadcrumb={['Admin', 'Tổng quan', 'Phân tích doanh thu']}
      >
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-2xs">
          <input type="date" value={dateRange.from} onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))} className="text-xs font-mono text-zinc-700 bg-transparent border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-black" />
          <span className="text-zinc-400 text-xs">→</span>
          <input type="date" value={dateRange.to} onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))} className="text-xs font-mono text-zinc-700 bg-transparent border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-black" />
          <button onClick={fetchStats} className="px-4 py-1.5 rounded-xl bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer shadow-xs">
            Lọc
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard label="Doanh Thu Kỳ Này" value={fmtMaybe(s?.totalRevenue, fmt)} trend={revenueTrend} trendLabel="Từ API" icon="💰" sparkData={revenueByDate.slice(-7).map(d => d.revenue)} />
        <MetricCard label="Lợi Nhuận Gộp" value={fmtMaybe(s?.grossProfit, fmt)} trend={null} trendLabel={s?.grossProfit === undefined ? 'Chưa có dữ liệu' : 'Từ API'} icon="📈" sparkData={revenueByDate.slice(-7).map(d => d.revenue)} />
        <MetricCard label="Đơn Hàng Thành Công" value={fmtMaybe(s?.completedOrders)} trend={null} trendLabel="Từ API" icon="🛍️" sparkData={revenueByDate.slice(-7).map(d => d.orderCount ?? 0)} />
        <MetricCard label="Khách Hàng Hoạt Động" value={fmtMaybe(s?.totalCustomers)} trend={null} trendLabel="Từ API" icon="👥" sparkData={null} />
      </div>

      <Card className="mb-6">
        <RevenueStatsChart revenueByDate={revenueByDate} loading={loading} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <div className="border-b border-zinc-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Tỷ Lệ Trạng Thái Đơn</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Cơ cấu xử lý đơn hàng trên toàn hệ thống</p>
          </div>
          <OrderDonut data={orderStatus} loading={loading} />
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Top Sản Phẩm Bán Chạy</h3>
              <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Nhóm sản phẩm mang lại doanh thu cao nhất</p>
            </div>
            <a href="/admin/dashboard" className="text-xs font-semibold uppercase tracking-wider text-[#C9A87C] hover:text-black transition-colors no-underline">
              Kho sản phẩm →
            </a>
          </div>
          <TopProductsTable data={topProducts} loading={loading} />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminStatistics;
