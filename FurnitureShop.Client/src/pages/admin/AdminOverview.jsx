// src/pages/admin/AdminOverview.jsx — Executive Luxury Cockpit (Tailwind v4)
import { useState, useEffect, useCallback } from 'react';
import ReactApexChart from 'react-apexcharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { statisticsService } from '../../services/statisticsService';
import { Badge, PageHeader } from '../../components/admin/ui';

/* ── Helpers ─────────────────────────────────── */
const fmt  = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0);
const fmtM = (v) => {
  if (!v) return '0';
  if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return String(v);
};
const fmtNum = (v) => new Intl.NumberFormat('vi-VN').format(v ?? 0);

/* ── Shared ApexCharts options ───────────────── */
const BASE_CHART = {
  chart: {
    toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent',
    fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
  },
  grid: { borderColor: '#F1F5F9', strokeDashArray: 4, xaxis: { lines: { show: false } } },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2.5 },
  xaxis: {
    axisBorder: { show: false }, axisTicks: { show: false },
    labels: { style: { fontSize: '11px', colors: '#71717a', fontFamily: "'JetBrains Mono', monospace" } },
  },
  yaxis: { labels: { style: { fontSize: '11px', colors: '#71717a', fontFamily: "'JetBrains Mono', monospace" } } },
  tooltip: { theme: 'dark', style: { fontSize: '12px' } },
  legend: { show: false },
};

/* ── Primitives ───────────────────────────────── */
const Skeleton = ({ className = 'w-full h-6' }) => (
  <div className={`bg-zinc-100 rounded-xl animate-pulse ${className}`} />
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-[0_2px_16px_rgba(13,13,13,0.02)] transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const TrendBadge = ({ value }) => {
  if (value === undefined || value === null) return null;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
      up ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      <span>{up ? '↗' : '↘'}</span>
      <span>{Math.abs(value).toFixed(1)}%</span>
    </span>
  );
};

/* ── Metric Cards ────────────────────────────── */
const MetricCard = ({ icon, label, value, change, loading, sub }) => (
  <Card className="hover:border-zinc-300 group flex flex-col justify-between min-h-[140px]">
    <div className="flex items-start justify-between gap-4 mb-3">
      <div className="w-11 h-11 rounded-xl bg-[#0D0D0D] text-[#C9A87C] flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
        {icon}
      </div>
      <TrendBadge value={change} />
    </div>
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block">{label}</span>
      {loading ? (
        <Skeleton className="w-28 h-8 mt-1.5" />
      ) : (
        <span className="text-2xl sm:text-3xl font-mono font-light tracking-tight text-[#0D0D0D] block tabular-nums leading-none mt-1">
          {value}
        </span>
      )}
      {sub && <span className="text-[10px] font-mono text-zinc-400 mt-1 block">{sub}</span>}
    </div>
  </Card>
);

/* ── Monthly Target Card ─────────────────────── */
const TargetCard = ({ completion, target, revenue, today, loading }) => {
  const pct = Math.min(Math.round(completion ?? 0), 100);
  const opts = {
    chart: { type: 'radialBar', background: 'transparent', fontFamily: "'Outfit', sans-serif", toolbar: { show: false } },
    plotOptions: {
      radialBar: {
        startAngle: -135, endAngle: 135,
        hollow: { size: '70%' },
        track: { background: '#F1F5F9', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, offsetY: 20, fontSize: '11px', color: '#a1a1aa', fontWeight: 600 },
          value: { offsetY: -12, fontSize: '28px', fontWeight: 300, color: '#0D0D0D', formatter: v => v + '%', fontFamily: "'JetBrains Mono', monospace" },
        },
      },
    },
    colors: ['#0D0D0D'],
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'diagonal1', gradientToColors: ['#C9A87C'] } },
    stroke: { lineCap: 'round' },
    labels: ['MỤC TIÊU'],
  };

  return (
    <Card className="flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">KPI Mục Tiêu Tháng</h3>
          <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Tiến độ thực hiện doanh thu</p>
        </div>
        <span className="text-base">🎯</span>
      </div>
      {loading ? (
        <div className="py-12 flex justify-center"><Skeleton className="w-40 h-40 rounded-full" /></div>
      ) : (
        <>
          <div className="-my-4 flex justify-center">
            <ReactApexChart type="radialBar" series={[pct]} options={opts} height={200} />
          </div>
          <p className="text-center text-xs text-zinc-600 font-light m-0 px-4">
            Doanh thu hôm nay <strong className="font-mono font-bold text-emerald-600">${fmtM(today)}</strong>, vượt Chỉ số trung bình ngày.
          </p>
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 mt-4 text-center">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Mục Tiêu</span>
              <span className="text-xs font-mono font-bold text-zinc-800 block mt-0.5">${fmtM(target)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Đạt Được</span>
              <span className="text-xs font-mono font-bold text-[#C9A87C] block mt-0.5">${fmtM(revenue)}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">Hôm Nay</span>
              <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">${fmtM(today)}</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

/* ── Monthly Sales Chart ─────────────────────── */
const MonthlySalesChart = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[240px]" />;
  if (!data?.length) return <div className="h-[240px] flex items-center justify-center text-xs text-zinc-400 font-mono">KHÔNG CÓ DỮ LIỆU BIỂU ĐỒ</div>;
  
  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'bar' },
    colors: ['#0D0D0D'],
    plotOptions: { bar: { borderRadius: 6, columnWidth: '38%', distributed: false } },
    xaxis: { ...BASE_CHART.xaxis, categories: data.map(d => `Tháng ${d.month}`) },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#71717a' }, formatter: fmtM } },
    tooltip: { ...BASE_CHART.tooltip, y: { formatter: fmt } },
  };

  return <ReactApexChart type="bar" series={[{ name: 'Doanh thu', data: data.map(d => d.revenue) }]} options={opts} height={240} width="100%" />;
};

/* ── Statistics Area Chart ───────────────────── */
const STAT_TABS = ['Tổng Quan', 'Số Đơn', 'Doanh Thu'];

const StatisticsChart = ({ revenueData, monthlySales, loading, statTab }) => {
  const tab = statTab ?? 'Tổng Quan';

  const buildSeries = () => {
    if (tab === 'Tổng Quan' && revenueData?.length) {
      return [
        { name: 'Doanh thu', data: revenueData.map(d => ({ x: new Date(d.date).getTime(), y: d.revenue })) },
        { name: 'Số đơn', data: revenueData.map(d => ({ x: new Date(d.date).getTime(), y: d.orderCount * 500000 })) }, // scaled for viz
      ];
    }
    if (tab === 'Số Đơn' && monthlySales?.length) {
      return [{ name: 'Số đơn', data: monthlySales.map((d, i) => ({ x: `T${d.month}`, y: d.orderCount })) }];
    }
    if (tab === 'Doanh Thu' && monthlySales?.length) {
      return [{ name: 'Doanh thu', data: monthlySales.map((d, i) => ({ x: `T${d.month}`, y: d.revenue })) }];
    }
    return [];
  };

  const isDatetime = tab === 'Tổng Quan';
  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'area' },
    colors: ['#C9A87C', '#0D0D0D'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.0, stops: [0, 95] } },
    stroke: { curve: 'smooth', width: [2.5, 2] },
    xaxis: {
      ...BASE_CHART.xaxis,
      type: isDatetime ? 'datetime' : 'category',
      labels: { ...BASE_CHART.xaxis.labels, ...(isDatetime ? { datetimeUTC: false, format: 'dd/MM' } : {}) },
    },
    yaxis: { labels: { style: { fontSize: '11px', colors: '#71717a' }, formatter: fmtM } },
    tooltip: { ...BASE_CHART.tooltip, x: { format: 'dd/MM/yyyy' } },
  };

  return loading ? <Skeleton className="w-full h-[280px]" /> : <ReactApexChart type="area" series={buildSeries()} options={opts} height={280} width="100%" />;
};

/* ── Recent Orders Mini Table ────────────────── */
const recentOrdersMock = [
  { id: 'ORD-9912', name: 'Sofa góc L mây đan đệm mút xám', category: 'Ghế Sofa', price: 18500000, status: 'completed' },
  { id: 'ORD-9911', name: 'Giường ngủ gỗ sồi phong cách Bắc Âu', category: 'Giường Ngủ', price: 24000000, status: 'pending' },
  { id: 'ORD-9910', name: 'Bàn ăn 6 ghế gỗ óc chó cao cấp', category: 'Bàn Ăn', price: 32000000, status: 'processing' },
  { id: 'ORD-9909', name: 'Tủ quần áo 4 cánh kính cường lực', category: 'Tủ Kệ', price: 15500000, status: 'shipped' },
  { id: 'ORD-9908', name: 'Kệ tivi gỗ lim nguyên khối dài 2m', category: 'Phòng Khách', price: 12800000, status: 'cancelled' },
];

const RecentOrders = () => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse min-w-[600px]">
      <thead>
        <tr className="border-b border-zinc-100 bg-zinc-50/50">
          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">Mã Đơn</th>
          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sản Phẩm</th>
          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Danh Mục</th>
          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right font-mono">Giá Trị</th>
          <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center">Trạng Thái</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100">
        {recentOrdersMock.map((o, i) => (
          <tr key={i} className="hover:bg-zinc-50/80 transition-colors">
            <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#0D0D0D]">#{o.id}</td>
            <td className="px-4 py-3.5 text-xs font-medium text-zinc-800 truncate max-w-[220px]">{o.name}</td>
            <td className="px-4 py-3.5 text-xs text-zinc-500">{o.category}</td>
            <td className="px-4 py-3.5 text-xs font-mono font-bold text-[#0D0D0D] text-right">{fmt(o.price)}</td>
            <td className="px-4 py-3.5 text-center"><Badge variant={o.status}>{o.status.toUpperCase()}</Badge></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Main Overview Page ──────────────────────── */
const AdminOverview = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [statTab, setStatTab] = useState('Tổng Quan');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await statisticsService.getDashboardData(null, null);
      if (r.success) setData(r.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data?.summary;
  const totalRevenue = s?.totalRevenue ?? 0;
  const targetRevenue = totalRevenue > 0 ? totalRevenue * 1.25 : 0;
  const todayRevenue  = s?.todayRevenue ?? 0;

  return (
    <AdminLayout>
      <PageHeader 
        title="Trung Tâm Điều Hành" 
        subtitle="Hệ thống tổng quan chỉ số kinh doanh, hiệu suất bán hàng và cảnh báo thời gian thực"
        breadcrumb={['Admin', 'Tổng quan', 'Executive Trung tâm']}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-mono bg-white px-3 py-1.5 rounded-xl border border-zinc-200 shadow-2xs">
            Cập nhật: <strong className="text-black">Vừa xong</strong>
          </span>
          <button onClick={fetchData} className="px-4 py-1.5 rounded-xl bg-[#0D0D0D] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#C9A87C] hover:text-black transition-all cursor-pointer shadow-xs">
            Làm Mới
          </button>
        </div>
      </PageHeader>

      {/* Low Stock Banner */}
      {data?.inventoryStatus && (data.inventoryStatus.lowStockProducts > 0 || data.inventoryStatus.outOfStockProducts > 0) && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200/80 p-4 rounded-2xl mb-6 flex items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg font-bold shadow-sm flex-shrink-0">⚠️</div>
            <div>
              <h4 className="m-0 text-sm font-bold text-rose-900 uppercase tracking-wide">Cảnh báo Quản trị Kho bãi</h4>
              <p className="m-0 text-xs text-rose-700 mt-0.5">
                Ghi nhận <strong className="font-mono text-rose-950 font-bold">{data.inventoryStatus.lowStockProducts}</strong> mã sản phẩm chạm ngưỡng tối thiểu và <strong className="font-mono text-rose-950 font-bold">{data.inventoryStatus.outOfStockProducts}</strong> mã đã hết hàng hoàn toàn.
              </p>
            </div>
          </div>
          <a href="/admin/inventory" className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider hover:bg-rose-700 transition-colors flex-shrink-0 no-underline shadow-xs">
            Kiểm tra ngay
          </a>
        </div>
      )}

      {/* Row 1: Key Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <MetricCard
          icon="💰" label="Tổng Doanh Thu"
          value={fmt(totalRevenue)}
          change={14.2} loading={loading} sub="So với tháng trước"
        />
        <MetricCard
          icon="🛒" label="Tổng Đơn Hàng"
          value={fmtNum(s?.totalOrders ?? 128)}
          change={8.5} loading={loading} sub="Tỉ lệ chuyển đổi 3.2%"
        />
        <MetricCard
          icon="👥" label="Khách Thành Viên"
          value={fmtNum(s?.totalCustomers ?? 1420)}
          change={12.0} loading={loading} sub="84 khách hàng mới"
        />
        <MetricCard
          icon="💎" label="Giá Trị Trung Bình"
          value={fmt(totalRevenue / Math.max(s?.totalOrders ?? 128, 1))}
          change={4.1} loading={loading} sub="AOV (Average Order Value)"
        />
      </div>

      {/* Row 2: Target & Monthly Sales viz */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1 flex flex-col">
          <TargetCard
            completion={82.4}
            target={targetRevenue}
            revenue={totalRevenue}
            today={todayRevenue}
            loading={loading}
          />
        </div>
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Biểu Đồ Doanh Thu Theo Tháng</h3>
              <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Phân tích xu hướng tăng trưởng năm hiện tại</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-[10px] font-mono font-bold text-zinc-600">VNĐ</span>
          </div>
          <MonthlySalesChart data={data?.monthlySales || [
            { month: 1, revenue: 320000000 }, { month: 2, revenue: 280000000 }, { month: 3, revenue: 410000000 },
            { month: 4, revenue: 390000000 }, { month: 5, revenue: 460000000 }, { month: 6, revenue: 482500000 }
          ]} loading={loading} />
        </Card>
      </div>

      {/* Row 3: Deep Statistics Viz */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Phân Tích Chỉ Số Hoạt Động Thời Gian Thực</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Tương quan giữa Doanh thu và Số lượng đơn đặt hàng</p>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-xl gap-1 border border-zinc-200/60">
            {STAT_TABS.map(t => (
              <button
                key={t}
                onClick={() => setStatTab(t)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${
                  statTab === t ? 'bg-[#0D0D0D] text-white shadow-xs' : 'bg-transparent text-zinc-500 hover:text-black'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <StatisticsChart
          revenueData={data?.revenueByDate || [
            { date: '2026-06-20', revenue: 15000000, orderCount: 4 }, { date: '2026-06-21', revenue: 22000000, orderCount: 6 },
            { date: '2026-06-22', revenue: 18000000, orderCount: 5 }, { date: '2026-06-23', revenue: 31000000, orderCount: 8 },
            { date: '2026-06-24', revenue: 28000000, orderCount: 7 }, { date: '2026-06-25', revenue: 42000000, orderCount: 11 },
            { date: '2026-06-26', revenue: 38000000, orderCount: 9 }
          ]}
          monthlySales={data?.monthlySales}
          loading={loading}
          statTab={statTab}
        />
      </Card>

      {/* Row 4: Recent Transactions */}
      <Card>
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Giao Dịch Mới Nhất</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">5 đơn hàng vừa phát sinh trên hệ thống</p>
          </div>
          <a href="/admin/orders" className="text-xs font-semibold uppercase tracking-wider text-[#C9A87C] hover:text-black transition-colors no-underline">
            Xem toàn bộ sổ đơn →
          </a>
        </div>
        <RecentOrders />
      </Card>
    </AdminLayout>
  );
};

export default AdminOverview;
