// src/pages/admin/AdminBehavior.jsx — Executive Customer Behavior Intelligence (Tailwind v4)
import { useState, useEffect, useCallback } from 'react';
import ReactApexChart from 'react-apexcharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { behaviorService } from '../../services/behaviorService';
import { PageHeader } from '../../components/admin/ui';

const fmtM = (v) => {
  if (v === null || v === undefined) return 'N/A';
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(Math.round(v));
};
const fmtPct = (v) => (v === null || v === undefined ? 'N/A' : `${v.toFixed(1)}%`);
const fmtSec = (v) => {
  if (v === null || v === undefined) return 'N/A';
  if (v >= 60) return `${Math.floor(v / 60)} phút ${Math.round(v % 60)}s`;
  return `${Math.round(v)}s`;
};

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
const NoData = ({ h = 'h-[220px]', message = 'KHÔNG CÓ DỮ LIỆU HÀNH VI' }) => <div className={`${h} flex items-center justify-center text-xs text-zinc-400 font-mono text-center px-4`}>{message}</div>;

const PeriodPicker = ({ value, onChange }) => (
  <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-2xs gap-1">
    {[
      { label: '7 Ngày', val: 7 },
      { label: '30 Ngày', val: 30 },
      { label: '90 Ngày', val: 90 },
    ].map(p => (
      <button
        key={p.val}
        onClick={() => onChange(p.val)}
        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${value === p.val ? 'bg-[#0D0D0D] text-white shadow-xs' : 'bg-transparent text-zinc-500 hover:text-black'}`}
      >
        {p.label}
      </button>
    ))}
  </div>
);

const StatCard = ({ icon, label, value, loading, desc }) => (
  <Card className="hover:border-zinc-300 group flex flex-col justify-between">
    <div className="flex items-start justify-between gap-4 mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 block">{label}</span>
      <div className="w-10 h-10 rounded-xl bg-zinc-100 text-[#0D0D0D] flex items-center justify-center text-lg shadow-2xs group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div>
      {loading ? <Skeleton className="w-24 h-8 mt-1" /> : <span className="text-2xl sm:text-3xl font-mono font-light tracking-tight text-[#0D0D0D] block tabular-nums leading-none">{value}</span>}
      {desc && <span className="text-[10px] text-zinc-400 mt-1.5 block font-light">{desc}</span>}
    </div>
  </Card>
);

const DailyViewsChart = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[240px]" />;
  if (!data?.length) return <NoData h="h-[240px]" message="KHÔNG CÓ DỮ LIỆU LƯỢT TRUY CẬP" />;

  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'area' },
    colors: ['#0D0D0D'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.0, stops: [0, 95] } },
    xaxis: { ...BASE_CHART.xaxis, categories: data.map(d => d.date?.slice(5) || d.date) },
    tooltip: { ...BASE_CHART.tooltip, y: { formatter: v => `${v} lượt xem` } },
  };

  return <ReactApexChart type="area" series={[{ name: 'Lượt truy cập', data: data.map(d => d.views ?? 0) }]} options={opts} height={240} width="100%" />;
};

const DwellTimeChart = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[240px]" />;
  if (!data?.length) return <NoData h="h-[240px]" message="KHÔNG CÓ DỮ LIỆU THỜI GIAN ĐỌC TRANG" />;

  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'line' },
    colors: ['#C9A87C'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { ...BASE_CHART.xaxis, categories: data.map(d => d.date?.slice(5) || d.date) },
    tooltip: { ...BASE_CHART.tooltip, y: { formatter: fmtSec } },
  };

  return <ReactApexChart type="line" series={[{ name: 'Thời gian lưu lại', data: data.map(d => d.avgDuration ?? d.duration ?? 0) }]} options={opts} height={240} width="100%" />;
};

const TopViewedChart = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[240px]" />;
  if (!data?.length) return <NoData h="h-[240px]" message="KHÔNG CÓ DỮ LIỆU SẢN PHẨM ĐƯỢC XEM" />;

  const opts = {
    ...BASE_CHART,
    chart: { ...BASE_CHART.chart, type: 'bar' },
    colors: ['#C9A87C'],
    plotOptions: { bar: { horizontal: true, borderRadius: 3, barHeight: '58%' } },
    xaxis: {
      ...BASE_CHART.xaxis,
      categories: data.slice(0, 8).map(item => item.productName || item.name || 'N/A'),
    },
    tooltip: { ...BASE_CHART.tooltip, y: { formatter: value => `${value} lượt xem` } },
  };

  return <ReactApexChart type="bar" series={[{ name: 'Lượt xem', data: data.slice(0, 8).map(item => item.totalViews ?? item.viewCount ?? 0) }]} options={opts} height={240} width="100%" />;
};

const ConversionTable = ({ data, loading }) => {
  if (loading) return <Skeleton className="w-full h-[200px]" />;
  if (!data?.length) return <NoData h="h-[200px]" message="KHÔNG CÓ DỮ LIỆU CHUYỂN ĐỔI" />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Sản Phẩm Nội Thất</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center font-mono">Lượt Xem</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center font-mono">Chốt Đơn</th>
            <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right font-mono">Tỷ Lệ Chuyển Đổi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {data.slice(0, 8).map((r, i) => {
            const views = r.totalViews ?? 0;
            const sold = r.totalUnitsSold ?? 0;
            const conv = views > 0 ? (sold / views) * 100 : 0;
            return (
              <tr key={i} className="hover:bg-zinc-50 transition-colors">
                <td className="px-4 py-3.5 text-xs font-medium text-zinc-800 truncate max-w-[260px]">{r.productName || 'N/A'}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-zinc-600 text-center">{fmtM(views)}</td>
                <td className="px-4 py-3.5 text-xs font-mono font-bold text-black text-center">{fmtM(sold)}</td>
                <td className="px-4 py-3.5 text-right font-mono font-bold">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] ${conv >= 5 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : conv >= 2 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {conv.toFixed(1)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const AdminBehavior = () => {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [topViewed, setTopViewed] = useState([]);
  const [clickData, setClickData] = useState([]);
  const [dailyViews, setDailyViews] = useState([]);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async (d) => {
    try {
      setLoading(true);
      setError('');
      const [tv, cs, dv] = await Promise.all([
        behaviorService.getTopViewed(10, d),
        behaviorService.getClickToSale(20, d),
        behaviorService.getDailyViews(d),
      ]);
      setTopViewed(Array.isArray(tv) ? tv : []);
      setClickData(Array.isArray(cs) ? cs : []);
      setDailyViews(Array.isArray(dv) ? dv : []);
    } catch (e) {
      setTopViewed([]);
      setClickData([]);
      setDailyViews([]);
      setError(e?.message || 'Không thể tải dữ liệu hành vi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(days); }, [days, fetchAll]);

  const totalViews = dailyViews.reduce((s, d) => s + (d.views ?? 0), 0);
  const avgDwell = dailyViews.length ? dailyViews.reduce((s, d) => s + (d.avgDuration ?? d.duration ?? 0), 0) / dailyViews.length : null;
  const overallConv = clickData.length
    ? (clickData.reduce((s, d) => s + (d.totalUnitsSold ?? 0), 0) / Math.max(clickData.reduce((s, d) => s + (d.totalViews ?? 0), 0), 1)) * 100
    : null;
  const topViewedName = topViewed[0]?.productName || topViewed[0]?.name || null;

  return (
    <AdminLayout>
      <PageHeader
        title="Hành Vi Khách Hàng"
        subtitle="Phân tích telemetry trải nghiệm, thời gian xem sản phẩm và bản đồ nhiệt chuyển đổi"
        breadcrumb={['Admin', 'Tổng quan', 'Hành vi khách hàng']}
      >
        <PeriodPicker value={days} onChange={setDays} />
      </PageHeader>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard icon="👁️" label="Tổng Lượt Truy Cập" value={fmtM(totalViews)} loading={loading} desc="Pageviews trên hệ thống" />
        <StatCard icon="⏱️" label="Thời Gian Lưu Lại TB" value={fmtSec(avgDwell)} loading={loading} desc="Average Dwell Time" />
        <StatCard icon="🎯" label="Tỷ Lệ Chuyển Đổi TB" value={fmtPct(overallConv)} loading={loading} desc="Conversion Rate chung" />
        <StatCard icon="🔥" label="Sản Phẩm Xem Nhiều" value={topViewedName || 'N/A'} loading={loading} desc="Dẫn đầu xu hướng tìm kiếm" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Lượt Truy Cập Theo Ngày</h3>
              <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Lưu lượng truy cập hệ thống thương mại điện tử</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <DailyViewsChart data={dailyViews} loading={loading} />
        </Card>

        <Card className="lg:col-span-1">
          <div className="border-b border-zinc-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Thời Gian Đọc Trang TB</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Tính bằng giây (Seconds)</p>
          </div>
          <DwellTimeChart data={dailyViews} loading={loading} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="border-b border-zinc-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Top Sản Phẩm Được Quan Tâm</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Top 10 mã sản phẩm có lượt xem cao nhất</p>
          </div>
          <TopViewedChart data={topViewed} loading={loading} />
        </Card>

        <Card>
          <div className="border-b border-zinc-100 pb-3 mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Phân Tích Phễu Tương Tác</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Tương quan lượt xem trên từng sản phẩm</p>
          </div>
          <ConversionTable data={clickData} loading={loading} />
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#0D0D0D] m-0">Ma Trận Tỷ Lệ Click-To-Sale</h3>
            <p className="text-[11px] text-zinc-400 m-0 mt-0.5">Đánh giá hiệu quả hiển thị của từng sản phẩm. Tỷ lệ ≥ 5% là đạt tiêu chuẩn tối ưu.</p>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold"><span className="w-2 h-2 rounded bg-emerald-500"/> ≥ 5% (Tối Ưu)</span>
            <span className="flex items-center gap-1.5 text-amber-700 font-bold"><span className="w-2 h-2 rounded bg-amber-500"/> 2% - 5% (Ổn)</span>
            <span className="flex items-center gap-1.5 text-rose-700 font-bold"><span className="w-2 h-2 rounded bg-rose-500"/> &lt; 2% (Cần chỉnh sửa)</span>
          </div>
        </div>
        <ConversionTable data={clickData} loading={loading} />
      </Card>
    </AdminLayout>
  );
};

export default AdminBehavior;
