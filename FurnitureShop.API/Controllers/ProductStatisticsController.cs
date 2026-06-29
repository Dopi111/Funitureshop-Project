using Microsoft.AspNetCore.Mvc;
using FurnitureShop.API.Services;

namespace FurnitureShop.API.Controllers
{
    /// <summary>
    /// Controller cung cấp các endpoint thống kê nâng cao dựa trên dữ liệu ProductView.
    /// </summary>
    [ApiController]
    [Route("api/statistics/products")]
    public class ProductStatisticsController : ControllerBase
    {
        private readonly ProductViewStatisticsService _statsService;

        public ProductStatisticsController(ProductViewStatisticsService statsService)
        {
            _statsService = statsService;
        }

        /// <summary>
        /// GET /api/statistics/products/top-viewed?topN=10&amp;days=7
        /// Trả về Top N sản phẩm được xem nhiều nhất trong vòng N ngày.
        /// </summary>
        [HttpGet("top-viewed")]
        public async Task<IActionResult> GetTopViewed(
            [FromQuery] int topN = 10,
            [FromQuery] int days = 7)
        {
            if (topN <= 0 || topN > 100) topN = 10;
            if (days  <= 0 || days > 365) days = 7;

            var result = await _statsService.GetTopViewedProductsAsync(topN, days);

            return Ok(new
            {
                period   = $"Last {days} days",
                topN     = topN,
                generatedAt = DateTime.UtcNow,
                data     = result
            });
        }

        /// <summary>
        /// GET /api/statistics/products/{id}/daily-views?days=30
        /// Trả về số lượt xem theo ngày của một sản phẩm (dùng cho biểu đồ).
        /// </summary>
        [HttpGet("{id:int}/daily-views")]
        public async Task<IActionResult> GetDailyViews(
            [FromRoute] int id,
            [FromQuery] int days = 30)
        {
            if (id <= 0)  return BadRequest("ProductId không hợp lệ.");
            if (days <= 0 || days > 365) days = 30;

            var data = await _statsService.GetDailyViewsAsync(id, days);
            var total = await _statsService.GetViewCountForProductAsync(id, days);

            return Ok(new
            {
                productId   = id,
                period      = $"Last {days} days",
                totalViews  = total,
                dailyBreakdown = data
            });
        }
        /// <summary>
        /// GET /api/statistics/products/click-to-sale?topN=20&amp;days=30
        /// Báo cáo tỷ lệ chuyển đổi click → mua hàng.
        /// </summary>
        [HttpGet("click-to-sale")]
        public async Task<IActionResult> GetClickToSaleReport(
            [FromQuery] int topN = 20,
            [FromQuery] int days = 30)
        {
            if (topN <= 0 || topN > 100) topN = 20;
            if (days <= 0 || days > 365) days = 30;

            var result = await _statsService.GetClickToSaleReportAsync(topN, days);
            return Ok(new { period = $"Last {days} days", topN, generatedAt = DateTime.UtcNow, data = result });
        }

        /// <summary>
        /// GET /api/statistics/products/daily-views-total?days=30
        /// Tổng lượt xem tất cả sản phẩm theo ngày.
        /// </summary>
        [HttpGet("daily-views-total")]
        public async Task<IActionResult> GetDailyViewsTotal([FromQuery] int days = 30)
        {
            if (days <= 0 || days > 365) days = 30;
            var data = await _statsService.GetDailyViewsTotalAsync(days);
            return Ok(new { period = $"Last {days} days", generatedAt = DateTime.UtcNow, data });
        }
    }
}
