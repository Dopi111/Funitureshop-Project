using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/statistics")]
    // [Authorize(Roles = "Admin")]
    public class StatisticsController : ControllerBase
    {
        private readonly StatisticsService _statisticsService;
        private readonly ClickToSaleService _clickToSaleService;
        private readonly AppDbContext _db;

        public StatisticsController(
            StatisticsService statisticsService,
            ClickToSaleService clickToSaleService,
            AppDbContext db)
        {
            _statisticsService  = statisticsService;
            _clickToSaleService = clickToSaleService;
            _db                 = db;
        }

        /// <summary>
        /// GET /api/statistics/dashboard
        /// Get complete dashboard data with all statistics.
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            try
            {
                var dashboardData = await _statisticsService.GetDashboardDataAsync();
                return Ok(new { success = true, data = dashboardData });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// GET /api/statistics/click-to-sale?days=30&amp;minViews=5&amp;topN=50
        ///
        /// Báo cáo tỷ lệ chuyển đổi Click → Sale.
        /// Kết quả sắp xếp từ sản phẩm DỄ BÁN NHẤT (ClicksPerSale thấp)
        /// đến KHÓ BÁN NHẤT, giúp team marketing ưu tiên cải thiện đúng chỗ.
        /// </summary>
        [HttpGet("click-to-sale")]
        public async Task<IActionResult> GetClickToSaleReport(
            [FromQuery] int days     = 30,
            [FromQuery] int minViews = 1,
            [FromQuery] int topN     = 50)
        {
            if (days     < 0 || days > 365) days = 30;
            if (minViews < 0)  minViews = 1;
            if (topN     <= 0 || topN > 200) topN = 50;

            try
            {
                var report = await _clickToSaleService.GetClickToSaleReportAsync(days, minViews, topN);

                return Ok(new
                {
                    success       = true,
                    period        = days > 0 ? $"Last {days} days" : "All time",
                    minViews,
                    generatedAt   = DateTime.UtcNow,
                    totalProducts = report.Count,
                    data          = report
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        /// <summary>
        /// GET /api/statistics/dwell-time?days=7
        ///
        /// Thống kê thời gian đọc trung bình (Dwell Time) theo sản phẩm.
        /// Dwell Time cao = khách đọc kỹ = nội dung thuyết phục.
        /// </summary>
        [HttpGet("dwell-time")]
        public async Task<IActionResult> GetDwellTimeStats([FromQuery] int days = 7)
        {
            if (days <= 0 || days > 365) days = 7;

            try
            {
                var cutoff = DateTime.UtcNow.AddDays(-days);

                var stats = await _db
                    .Set<Models.Entities.ProductView>()
                    .Where(pv => pv.ViewedAt >= cutoff && pv.DurationSeconds != null)
                    .GroupBy(pv => new { pv.ProductId, pv.Product.Name })
                    .Select(g => new
                    {
                        ProductId       = g.Key.ProductId,
                        ProductName     = g.Key.Name,
                        AvgDwellSeconds = (int)g.Average(pv => (double)pv.DurationSeconds!.Value),
                        MaxDwellSeconds = g.Max(pv => pv.DurationSeconds!.Value),
                        SampleCount     = g.Count()
                    })
                    .OrderByDescending(x => x.AvgDwellSeconds)
                    .Take(50)
                    .ToListAsync();

                return Ok(new
                {
                    success     = true,
                    period      = $"Last {days} days",
                    generatedAt = DateTime.UtcNow,
                    data        = stats
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
