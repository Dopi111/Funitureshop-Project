using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Data;
using System.Text.Json.Serialization;

namespace FurnitureShop.API.Controllers
{
    // ──────────────────────────────────────────────────────────────
    //  DTO cho request từ sendBeacon
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// Payload gửi từ navigator.sendBeacon (Content-Type: text/plain).
    /// Frontend serialize thành JSON string trước khi đặt vào Blob.
    /// </summary>
    public class UpdateDurationRequest
    {
        [JsonPropertyName("productId")]
        public int ProductId { get; set; }

        /// <summary>Số giây dừng lại đọc sản phẩm (Dwell Time).</summary>
        [JsonPropertyName("durationInSeconds")]
        public int DurationInSeconds { get; set; }

        /// <summary>
        /// ViewId trả về từ POST /api/products/{id}/view (optional).
        /// Nếu có → cập nhật đúng bản ghi; nếu không → cập nhật bản ghi mới nhất của IP.
        /// </summary>
        [JsonPropertyName("viewId")]
        public long? ViewId { get; set; }
    }

    // ──────────────────────────────────────────────────────────────
    //  Controller
    // ──────────────────────────────────────────────────────────────

    /// <summary>
    /// PROMPT 2: Nhận dữ liệu Dwell Time từ Frontend (sendBeacon).
    ///
    /// Endpoint này phải xử lý được cả 2 Content-Type:
    ///   - "application/json"      — từ fetch bình thường
    ///   - "text/plain"            — sendBeacon gửi Blob(json, {type:'text/plain'})
    ///
    /// Lý do sendBeacon dùng text/plain: browser không cho phép sendBeacon
    /// gửi Content-Type application/json (preflight CORS bị block).
    /// </summary>
    [ApiController]
    [Route("api/analytics")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AnalyticsController> _logger;

        public AnalyticsController(AppDbContext db, ILogger<AnalyticsController> logger)
        {
            _db     = db;
            _logger = logger;
        }

        /// <summary>
        /// POST /api/analytics/update-duration
        ///
        /// Nhận productId + durationInSeconds từ navigator.sendBeacon.
        /// Tìm bản ghi ProductView gần nhất theo productId + IP,
        /// sau đó UPDATE DurationSeconds.
        ///
        /// Trả về 204 No Content (sendBeacon không đọc response body).
        /// </summary>
        [HttpPost("update-duration")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateDuration(CancellationToken ct)
        {
            // ── Đọc body thủ công để hỗ trợ cả text/plain và application/json ──
            UpdateDurationRequest? req;
            try
            {
                string body;
                using (var reader = new System.IO.StreamReader(Request.Body))
                {
                    body = await reader.ReadToEndAsync(ct);
                }

                if (string.IsNullOrWhiteSpace(body))
                    return BadRequest(new { error = "Request body rỗng." });

                req = System.Text.Json.JsonSerializer.Deserialize<UpdateDurationRequest>(
                    body,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không parse được body update-duration.");
                return BadRequest(new { error = "JSON không hợp lệ." });
            }

            if (req == null || req.ProductId <= 0)
                return BadRequest(new { error = "productId không hợp lệ." });

            // Dwell Time hợp lý: 1 giây – 2 giờ (> 2h có thể là tab bỏ quên)
            var duration = Math.Clamp(req.DurationInSeconds, 1, 7_200);

            try
            {
                Models.Entities.ProductView? record = null;

                // Ưu tiên 1: tìm theo ViewId nếu Frontend truyền lên
                if (req.ViewId.HasValue && req.ViewId > 0)
                {
                    record = await _db.ProductViews
                        .FirstOrDefaultAsync(pv => pv.Id == req.ViewId.Value, ct);
                }

                // Ưu tiên 2: tìm bản ghi mới nhất của ProductId + IP trong 1 giờ qua
                if (record == null)
                {
                    var clientIp = GetClientIp();
                    var cutoff   = DateTime.UtcNow.AddHours(-1);

                    record = await _db.ProductViews
                        .Where(pv => pv.ProductId == req.ProductId
                                  && pv.IpAddress == clientIp
                                  && pv.ViewedAt  >= cutoff
                                  && pv.DurationSeconds == null)
                        .OrderByDescending(pv => pv.ViewedAt)
                        .FirstOrDefaultAsync(ct);
                }

                if (record == null)
                {
                    _logger.LogDebug(
                        "update-duration: không tìm thấy ProductView cho ProductId={Id}. Bỏ qua.",
                        req.ProductId);
                    // Vẫn trả 204 — sendBeacon không retry nên không cần báo lỗi
                    return NoContent();
                }

                record.DurationSeconds = duration;
                await _db.SaveChangesAsync(ct);

                _logger.LogDebug(
                    "✅ Dwell time cập nhật: ProductView#{ViewId} = {Secs}s",
                    record.Id, duration);

                return NoContent(); // sendBeacon không đọc body
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi cập nhật DurationSeconds cho ProductId={Id}.", req.ProductId);
                return NoContent(); // Không fail request của user vì đây là analytics
            }
        }

        // ── Helper IP ──────────────────────────────────────────────
        private string GetClientIp()
        {
            var forwarded = Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwarded))
                return forwarded.Split(',', StringSplitOptions.TrimEntries)[0];
            return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }
    }
}
