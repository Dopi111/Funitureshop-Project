using FurnitureShop.API.DTOs;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace FurnitureShop.API.Controllers
{
   [ApiController]
[Route("api/statistics")]
// [Authorize(Roles = "Admin")]
public class StatisticsController : ControllerBase
    {
        private readonly StatisticsService _statisticsService;

        public StatisticsController(StatisticsService statisticsService)
        {
            _statisticsService = statisticsService;
        }

        /// <summary>
        /// Get complete dashboard data with all statistics
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
    }
}
