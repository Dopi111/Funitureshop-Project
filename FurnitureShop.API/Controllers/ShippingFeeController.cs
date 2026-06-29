using Microsoft.AspNetCore.Mvc;
using FurnitureShop.API.Services;
using ShippingReq = FurnitureShop.API.Services.ShippingCalculationRequest;
using ShippingRes = FurnitureShop.API.Services.ShippingFeeResult;

namespace FurnitureShop.API.Controllers
{
    /// <summary>
    /// Controller expose endpoint tính phí ship GHN từ trang Checkout.
    /// </summary>
    [ApiController]
    [Route("api/shipping")]
    public class ShippingFeeController : ControllerBase
    {
        private readonly GhnShippingService _ghnService;
        private readonly ILogger<ShippingFeeController> _logger;

        public ShippingFeeController(
            GhnShippingService ghnService,
            ILogger<ShippingFeeController> logger)
        {
            _ghnService = ghnService;
            _logger     = logger;
        }

        /// <summary>
        /// POST /api/shipping/calculate-fee
        /// Tính phí vận chuyển GHN dựa trên địa chỉ + thông số hàng hoá trong giỏ.
        ///
        /// Body JSON:
        /// {
        ///   "toDistrictId": 1454,
        ///   "toWardCode": "21204",
        ///   "weight": 85000,
        ///   "length": 220,
        ///   "width": 95,
        ///   "height": 85,
        ///   "insuranceValue": 25000000
        /// }
        /// </summary>
        [HttpPost("calculate-fee")]
        [ProducesResponseType(typeof(ShippingRes), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CalculateFee(
            [FromBody] ShippingReq request,
            CancellationToken ct)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.ToDistrictId <= 0)
                return BadRequest(new { error = "ToDistrictId không hợp lệ." });

            if (string.IsNullOrWhiteSpace(request.ToWardCode))
                return BadRequest(new { error = "ToWardCode không được để trống." });

            _logger.LogInformation(
                "Tính phí GHN → District={DistrictId}, Weight={Weight}g, Size={L}x{W}x{H}cm",
                request.ToDistrictId, request.Weight,
                request.Length, request.Width, request.Height);

            var result = await _ghnService.CalculateShippingFeeAsync(request, ct);

            // Luôn trả 200 OK — Frontend tự xử lý theo result.success
            return Ok(result);
        }

        /// <summary>
        /// GET /api/shipping/ghn/districts?provinceId=202
        /// Proxy lấy danh sách quận/huyện từ GHN (tránh CORS từ Frontend).
        /// </summary>
        [HttpGet("ghn/districts")]
        public async Task<IActionResult> GetDistricts(
            [FromQuery] int provinceId,
            CancellationToken ct)
        {
            if (provinceId <= 0)
                return BadRequest(new { error = "ProvinceId không hợp lệ." });

            try
            {
                var token = HttpContext.RequestServices
                    .GetRequiredService<IConfiguration>()["GHN:Token"];

                using var http = HttpContext.RequestServices
                    .GetRequiredService<IHttpClientFactory>()
                    .CreateClient("GHN");

                using var req = new HttpRequestMessage(
                    HttpMethod.Get,
                    $"/shiip/public-api/master-data/district?province_id={provinceId}");
                req.Headers.Add("Token", token);

                var resp = await http.SendAsync(req, ct);
                var body = await resp.Content.ReadAsStringAsync(ct);

                return Content(body, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi lấy danh sách quận/huyện GHN.");
                return StatusCode(503, new { error = "Không thể lấy danh sách quận/huyện." });
            }
        }
    }
}
