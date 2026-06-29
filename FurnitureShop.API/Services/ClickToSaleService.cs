using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;

namespace FurnitureShop.API.Services
{
    /// <summary>
    /// PROMPT 3: Service thống kê tỷ lệ chuyển đổi Click → Sale.
    ///
    /// Công thức: ClicksPerSale = TotalViews / TotalUnitsSold
    /// Ý nghĩa: Cần bao nhiêu lượt click để bán được 1 đơn vị sản phẩm.
    ///   - ClicksPerSale thấp  → sản phẩm "dễ bán" (hình ảnh/mô tả thuyết phục)
    ///   - ClicksPerSale cao   → sản phẩm "khó bán" (cần cải thiện trang SP)
    ///   - ConversionRate%     → ngược lại với ClicksPerSale, dùng cho report dạng %
    /// </summary>
    public class ClickToSaleService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ClickToSaleService> _logger;

        public ClickToSaleService(AppDbContext db, ILogger<ClickToSaleService> logger)
        {
            _db     = db;
            _logger = logger;
        }

        /// <summary>
        /// Lấy báo cáo Click-to-Sale cho tất cả sản phẩm active.
        ///
        /// LINQ Strategy (2-step để tránh GROUP BY phức tạp EF dịch sai):
        ///
        /// Bước 1 — Đếm Views theo ProductId (subquery):
        ///   SELECT ProductId, COUNT(*) AS TotalViews FROM ProductViews
        ///   WHERE ViewedAt >= @cutoff
        ///   GROUP BY ProductId
        ///
        /// Bước 2 — Đếm UnitsSold theo ProductId (subquery):
        ///   SELECT ProductId, SUM(Quantity) AS TotalUnitsSold FROM OrderDetails
        ///   GROUP BY ProductId
        ///
        /// Bước 3 — JOIN cả hai với Products, tính tỷ lệ, sắp xếp:
        ///   RIGHT JOIN Products ON ... (để sản phẩm chưa bán vẫn xuất hiện)
        ///   ORDER BY ClicksPerSale ASC NULLS LAST, TotalViews DESC
        /// </summary>
        /// <param name="days">Khoảng thời gian tính views (0 = tất cả thời gian).</param>
        /// <param name="minViews">Chỉ lấy sản phẩm có ít nhất N lượt xem.</param>
        /// <param name="topN">Giới hạn kết quả (0 = không giới hạn).</param>
        public async Task<List<ClickToSaleReportDto>> GetClickToSaleReportAsync(
            int days     = 30,
            int minViews = 1,
            int topN     = 50)
        {
            var cutoff = days > 0
                ? DateTime.UtcNow.AddDays(-days)
                : DateTime.MinValue;

            _logger.LogInformation(
                "📊 Click-to-Sale report: days={Days}, minViews={MinViews}, topN={TopN}",
                days, minViews, topN);

            // ─── Bước 1: Tổng lượt xem theo ProductId ──────────────────────
            var viewsQuery =
                from pv in _db.ProductViews
                where cutoff == DateTime.MinValue || pv.ViewedAt >= cutoff
                group pv by pv.ProductId into g
                select new
                {
                    ProductId  = g.Key,
                    TotalViews = g.Count()
                };

            // ─── Bước 2: Tổng số lượng đã bán theo ProductId ───────────────
            // Chỉ tính các đơn hàng đã hoàn thành (loại bỏ đơn bị hủy)
            var salesQuery =
                from od in _db.OrderDetails
                join o in _db.Orders on od.OrderId equals o.OrderId
                where o.Status != OrderStatus.Cancelled
                group od by od.ProductId into g
                select new
                {
                    ProductId      = g.Key,
                    TotalUnitsSold = g.Sum(od => od.Quantity)
                };

            // ─── Bước 3: JOIN với Products và tính chỉ số ──────────────────
            // RIGHT JOIN từ Products để bao gồm cả SP chưa có views / chưa bán
            var rawQuery =
                from p in _db.Products.Where(p => p.IsActive)

                // LEFT JOIN views (sản phẩm chưa có view → TotalViews = 0)
                join v in viewsQuery on p.ProductId equals v.ProductId into vGroup
                from views in vGroup.DefaultIfEmpty()

                // LEFT JOIN sales (sản phẩm chưa bán → TotalUnitsSold = 0)
                join s in salesQuery on p.ProductId equals s.ProductId into sGroup
                from sales in sGroup.DefaultIfEmpty()

                let totalViews = views != null ? views.TotalViews : 0
                let totalSold  = sales != null ? sales.TotalUnitsSold : 0

                where totalViews >= minViews

                select new
                {
                    p.ProductId,
                    p.Name,
                    p.SKU,
                    TotalViews     = totalViews,
                    TotalUnitsSold = totalSold
                };

            // ─── Bước 4: Thực thi query, tính toán trên bộ nhớ ────────────
            // Tính ClicksPerSale trong C# để tránh SQL DIVISION trả lỗi
            var raw = await rawQuery
                .AsNoTracking()
                .ToListAsync();

            // Sắp xếp: dễ bán nhất trước (ClicksPerSale thấp nhất)
            // Sản phẩm có views nhưng chưa bán → xếp cuối
            var sorted = raw
                .Select(x => new
                {
                    x.ProductId,
                    x.Name,
                    x.SKU,
                    x.TotalViews,
                    x.TotalUnitsSold,
                    ClicksPerSale = x.TotalUnitsSold > 0
                        ? (double)x.TotalViews / x.TotalUnitsSold
                        : (double?)null,
                    ConversionRate = x.TotalViews > 0
                        ? (double)x.TotalUnitsSold / x.TotalViews * 100.0
                        : 0.0
                })
                // Sắp xếp: có bán → ClicksPerSale ASC; chưa bán → Views DESC
                .OrderBy(x => x.ClicksPerSale.HasValue ? 0 : 1)
                .ThenBy(x => x.ClicksPerSale ?? double.MaxValue)
                .ThenByDescending(x => x.TotalViews)
                .ToList();

            var result = sorted
                .Take(topN > 0 ? topN : int.MaxValue)
                .Select((x, index) => new ClickToSaleReportDto
                {
                    Rank                  = index + 1,
                    ProductId             = x.ProductId,
                    ProductName           = x.Name,
                    SKU                   = x.SKU,
                    TotalViews            = x.TotalViews,
                    TotalUnitsSold        = x.TotalUnitsSold,
                    ClicksPerSale         = x.ClicksPerSale.HasValue
                        ? Math.Round(x.ClicksPerSale.Value, 1)
                        : null,
                    ConversionRatePercent = Math.Round(x.ConversionRate, 2)
                })
                .ToList();

            return result;
        }

        /// <summary>
        /// Tính Click-to-Sale cho một sản phẩm cụ thể.
        /// Dùng để hiển thị trên trang admin chi tiết sản phẩm.
        /// </summary>
        public async Task<ClickToSaleReportDto?> GetClickToSaleForProductAsync(
            int productId,
            int days = 30)
        {
            var report = await GetClickToSaleReportAsync(days: days, minViews: 0, topN: 0);
            return report.FirstOrDefault(r => r.ProductId == productId);
        }
    }
}
