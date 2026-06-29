using Microsoft.AspNetCore.Mvc;
using FurnitureShop.API.Services;
using System.Security.Claims;

namespace FurnitureShop.API.Controllers
{
    /// <summary>
    /// Controller xử lý việc tracking lượt xem sản phẩm.
    /// 
    /// Luồng hoạt động:
    ///   POST /api/products/{id}/view
    ///     → Lấy IP + UserId từ HttpContext
    ///     → TryEnqueue vào Channel (cực nhanh, non-blocking)
    ///     → Trả về 202 Accepted ngay lập tức
    ///     → BackgroundService sẽ bulk-insert vào DB sau
    /// </summary>
    [ApiController]
    [Route("api/products")]
    public class ProductViewsController : ControllerBase
    {
        private readonly ProductViewBackgroundService _backgroundService;
        private readonly ILogger<ProductViewsController> _logger;

        public ProductViewsController(
            ProductViewBackgroundService backgroundService,
            ILogger<ProductViewsController> logger)
        {
            _backgroundService = backgroundService;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/products/{id}/view
        /// Ghi lại lượt xem sản phẩm. Trả về ngay, việc lưu DB chạy nền.
        /// </summary>
        [HttpPost("{id:int}/view")]
        [ProducesResponseType(StatusCodes.Status202Accepted)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
        public IActionResult TrackView([FromRoute] int id)
        {
            if (id <= 0)
                return BadRequest(new { error = "ProductId không hợp lệ." });

            var ip      = GetClientIpAddress();
            var userId  = GetCurrentUserId();
            var viewedAt = DateTime.UtcNow;

            var evt = new ProductViewEvent(id, userId, ip, viewedAt);

            // TryEnqueue là NON-BLOCKING — ghi vào in-memory channel và trả về ngay
            if (!_backgroundService.TryEnqueue(evt))
            {
                // Channel đầy (traffic quá lớn) — log warning nhưng không fail request
                _logger.LogWarning(
                    "⚠️ ProductView channel full. Dropping view event for ProductId={ProductId}.", id);
            }

            // 202 Accepted: "Chúng tôi đã nhận, sẽ xử lý sau"
            return Accepted(new { message = "View tracked.", productId = id });
        }

        // ──────────────────────────────────────────────
        //  Helper: Lấy IP thực của client (qua proxy / load balancer)
        // ──────────────────────────────────────────────
        private string GetClientIpAddress()
        {
            // Kiểm tra X-Forwarded-For trước (Nginx, CloudFront, v.v.)
            var forwardedFor = HttpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedFor))
            {
                // Header có thể chứa nhiều IP: "client, proxy1, proxy2"
                var firstIp = forwardedFor.Split(',', StringSplitOptions.TrimEntries).FirstOrDefault();
                if (!string.IsNullOrEmpty(firstIp))
                    return firstIp;
            }

            // Fallback về RemoteIpAddress từ TCP connection
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        // ──────────────────────────────────────────────
        //  Helper: Lấy UserId từ JWT Claims (nullable)
        // ──────────────────────────────────────────────
        private string? GetCurrentUserId()
        {
            // Trả về null nếu khách chưa đăng nhập (không có JWT token)
            return User.Identity?.IsAuthenticated == true
                ? User.FindFirstValue(ClaimTypes.NameIdentifier)
                : null;
        }
    }
}
