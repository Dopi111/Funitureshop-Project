using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;

namespace FurnitureShop.API.Services
{
    /// <summary>
    /// Service chứa các LINQ query thống kê nâng cao liên quan đến ProductView.
    /// Tách khỏi StatisticsService hiện có để tránh vi phạm Single Responsibility.
    /// </summary>
    public class ProductViewStatisticsService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProductViewStatisticsService> _logger;

        public ProductViewStatisticsService(
            AppDbContext db,
            ILogger<ProductViewStatisticsService> logger)
        {
            _db = db;
            _logger = logger;
        }

        /// <summary>
        /// Lấy Top N sản phẩm được xem nhiều nhất trong vòng <paramref name="days"/> ngày qua.
        ///
        /// LINQ plan:
        ///   1. Lọc ProductViews có ViewedAt >= cutoff  → sử dụng IX_ProductViews_ProductId_ViewedAt
        ///   2. GROUP BY ProductId và đếm COUNT(*)
        ///   3. JOIN với Products để lấy thông tin sản phẩm
        ///   4. LEFT JOIN với ProductImages để lấy thumbnail (IsPrimary = true)
        ///   5. ORDER BY ViewCount DESC, lấy Top N
        ///
        /// SQL Server sẽ tạo plan tương đương:
        ///   SELECT TOP(@topN) p.ProductId, p.Name, p.SKU, p.BasePrice, p.DiscountPrice,
        ///          pi.ImageUrl AS Thumbnail, COUNT(pv.Id) AS ViewCount
        ///   FROM ProductViews pv
        ///   JOIN Products p ON pv.ProductId = p.ProductId
        ///   LEFT JOIN ProductImages pi ON pi.ProductId = p.ProductId AND pi.IsPrimary = 1
        ///   WHERE pv.ViewedAt >= @cutoff AND p.IsActive = 1
        ///   GROUP BY p.ProductId, p.Name, p.SKU, p.BasePrice, p.DiscountPrice, pi.ImageUrl
        ///   ORDER BY ViewCount DESC
        /// </summary>
        /// <param name="topN">Số lượng sản phẩm trả về (mặc định 10).</param>
        /// <param name="days">Cửa sổ thời gian tính từ hiện tại về quá khứ (mặc định 7 ngày).</param>
        public async Task<List<TopViewedProductDto>> GetTopViewedProductsAsync(
            int topN = 10,
            int days = 7)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            _logger.LogInformation(
                "📊 Querying Top {TopN} viewed products in the last {Days} days (since {Cutoff:u}).",
                topN, days, cutoff);

            // ─── Bước 1: Đếm lượt xem theo từng ProductId trong khoảng thời gian ───
            // EF Core dịch thành subquery hoặc CTE tuỳ phiên bản
            var viewCountQuery =
                from pv in _db.ProductViews
                where pv.ViewedAt >= cutoff
                group pv by pv.ProductId into g
                select new
                {
                    ProductId = g.Key,
                    ViewCount = g.Count()
                };

            // ─── Bước 2: JOIN với Products + ProductImages, lọc sản phẩm active ───
            var result = await (
                from vc in viewCountQuery
                join p in _db.Products.Where(p => p.IsActive)
                    on vc.ProductId equals p.ProductId

                // LEFT OUTER JOIN: sản phẩm không có ảnh vẫn được trả về
                join pi in _db.ProductImages.Where(pi => pi.IsPrimary)
                    on p.ProductId equals pi.ProductId into piGroup
                from primaryImage in piGroup.DefaultIfEmpty()

                orderby vc.ViewCount descending

                select new TopViewedProductDto
                {
                    ProductId     = p.ProductId,
                    Name          = p.Name,
                    SKU           = p.SKU,
                    Thumbnail     = primaryImage != null ? primaryImage.ImageUrl : null,
                    BasePrice     = p.BasePrice,
                    DiscountPrice = p.DiscountPrice,
                    ViewCount     = vc.ViewCount
                }
            )
            .Take(topN)
            .AsNoTracking()  // Read-only query — không cần change tracking
            .ToListAsync();

            return result;
        }

        /// <summary>
        /// Lấy số lượt xem của một sản phẩm cụ thể trong N ngày qua.
        /// Hữu ích để hiển thị trên trang chi tiết sản phẩm.
        /// </summary>
        public async Task<int> GetViewCountForProductAsync(int productId, int days = 7)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            return await _db.ProductViews
                .Where(pv => pv.ProductId == productId && pv.ViewedAt >= cutoff)
                .CountAsync();
        }

        /// <summary>
        /// Báo cáo Click-to-Sale: tỷ lệ chuyển đổi từ lượt xem sang đơn hàng.
        /// Chỉ tính đơn hàng có status Completed.
        /// </summary>
        public async Task<List<ClickToSaleReportDto>> GetClickToSaleReportAsync(
            int topN = 20,
            int days = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            // Đếm views trong khoảng thời gian
            var viewCounts = await _db.ProductViews
                .Where(pv => pv.ViewedAt >= cutoff)
                .GroupBy(pv => pv.ProductId)
                .Select(g => new { ProductId = g.Key, Views = g.Count() })
                .ToListAsync();

            // Đếm units sold từ completed orders
            var soldCounts = await _db.OrderDetails
                .Where(od => od.Order.Status == Models.OrderStatus.Completed
                          && od.Order.CreatedAt >= cutoff)
                .GroupBy(od => od.ProductId)
                .Select(g => new { ProductId = g.Key, UnitsSold = g.Sum(x => x.Quantity) })
                .ToListAsync();

            var soldDict = soldCounts.ToDictionary(x => x.ProductId, x => x.UnitsSold);

            var products = await _db.Products
                .Where(p => p.IsActive)
                .Select(p => new { p.ProductId, p.Name, p.SKU })
                .ToListAsync();

            var productDict = products.ToDictionary(p => p.ProductId);

            var report = viewCounts
                .Where(vc => productDict.ContainsKey(vc.ProductId))
                .Select((vc, idx) =>
                {
                    var sold = soldDict.TryGetValue(vc.ProductId, out var s) ? s : 0;
                    var p = productDict[vc.ProductId];
                    return new ClickToSaleReportDto
                    {
                        ProductId = vc.ProductId,
                        ProductName = p.Name,
                        SKU = p.SKU,
                        TotalViews = vc.Views,
                        TotalUnitsSold = sold,
                        ClicksPerSale = sold > 0 ? (double)vc.Views / sold : null,
                        ConversionRatePercent = vc.Views > 0 ? (double)sold / vc.Views * 100 : 0,
                    };
                })
                .OrderByDescending(x => x.TotalViews)
                .Take(topN)
                .Select((x, i) => { x.Rank = i + 1; return x; })
                .ToList();

            return report;
        }

        /// <summary>
        /// Thống kê tổng hợp lượt xem theo ngày (tất cả sản phẩm) trong N ngày qua.
        /// </summary>
        public async Task<List<object>> GetDailyViewsTotalAsync(int days = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            var data = await _db.ProductViews
                .Where(pv => pv.ViewedAt >= cutoff)
                .GroupBy(pv => pv.ViewedAt.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Views = g.Count(),
                    UniqueIps = g.Select(x => x.IpAddress).Distinct().Count(),
                    AvgDuration = g.Average(x => (double?)x.DurationSeconds) ?? 0,
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            return data.Cast<object>().ToList();
        }

        /// <summary>
        /// Thống kê lượt xem theo ngày cho một sản phẩm (dùng cho biểu đồ).
        /// </summary>
        public async Task<Dictionary<DateOnly, int>> GetDailyViewsAsync(
            int productId,
            int days = 30)
        {
            var cutoff = DateTime.UtcNow.AddDays(-days);

            var raw = await _db.ProductViews
                .Where(pv => pv.ProductId == productId && pv.ViewedAt >= cutoff)
                .GroupBy(pv => pv.ViewedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .AsNoTracking()
                .ToListAsync();

            return raw.ToDictionary(
                x => DateOnly.FromDateTime(x.Date),
                x => x.Count);
        }
    }
}
