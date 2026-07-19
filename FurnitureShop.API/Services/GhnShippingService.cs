using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FurnitureShop.API.Services
{
    // ══════════════════════════════════════════════
    //  DTOs cho Request / Response GHN
    // ══════════════════════════════════════════════

    /// <summary>
    /// Thông số gói hàng nội thất cần truyền để tính phí GHN.
    /// Đơn vị: Weight = gram, Length/Width/Height = cm.
    /// </summary>
    public class ShippingCalculationRequest
    {
        /// <summary>Mã quận/huyện người nhận (lấy từ GHN District API).</summary>
        public int ToDistrictId { get; set; }

        /// <summary>Mã phường/xã người nhận (lấy từ GHN Ward API).</summary>
        public string ToWardCode { get; set; } = string.Empty;

        /// <summary>Tổng trọng lượng (gram). Hàng nội thất thường 5.000–200.000g.</summary>
        public int Weight { get; set; }

        /// <summary>Chiều dài cm. GHN tính volumetric weight từ L*W*H/6000.</summary>
        public int Length { get; set; }

        /// <summary>Chiều rộng cm.</summary>
        public int Width { get; set; }

        /// <summary>Chiều cao cm.</summary>
        public int Height { get; set; }

        /// <summary>Giá trị bảo hiểm hàng hoá (VND). Để 0 nếu không cần bảo hiểm.</summary>
        public int InsuranceValue { get; set; } = 0;
    }

    /// <summary>
    /// Kết quả trả về cho Frontend — sạch, không lộ cấu trúc GHN bên trong.
    /// </summary>
    public class ShippingFeeResult
    {
        public bool Success { get; set; }

        /// <summary>Tổng phí vận chuyển (VND).</summary>
        public decimal TotalFee { get; set; }

        /// <summary>Phí cước (trước khi cộng VAT, bảo hiểm).</summary>
        public decimal ServiceFee { get; set; }

        /// <summary>Ngày giao hàng dự kiến (UTC).</summary>
        public DateTime? ExpectedDeliveryDate { get; set; }

        /// <summary>Số ngày giao hàng ước tính.</summary>
        public int EstimatedDays { get; set; }

        /// <summary>Tên dịch vụ vận chuyển đã chọn.</summary>
        public string ServiceName { get; set; } = "GHN Express";

        /// <summary>Thông báo lỗi nếu có.</summary>
        public string? ErrorMessage { get; set; }
    }

    // ══════════════════════════════════════════════
    //  Internal mapping types (GHN JSON response)
    // ══════════════════════════════════════════════

    internal class GhnApiResponse<T>
    {
        [JsonPropertyName("code")]
        public int Code { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("data")]
        public T? Data { get; set; }
    }

    internal class GhnFeeData
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("service_fee")]
        public int ServiceFee { get; set; }

        [JsonPropertyName("insurance_fee")]
        public int InsuranceFee { get; set; }

        [JsonPropertyName("pick_station_fee")]
        public int PickStationFee { get; set; }

        [JsonPropertyName("coupon_value")]
        public int CouponValue { get; set; }

        [JsonPropertyName("r2s_fee")]
        public int R2sFee { get; set; }

        [JsonPropertyName("return_again")]
        public int ReturnAgain { get; set; }

        [JsonPropertyName("document_return")]
        public int DocumentReturn { get; set; }

        [JsonPropertyName("double_check")]
        public int DoubleCheck { get; set; }

        [JsonPropertyName("cod_fee")]
        public int CodFee { get; set; }

        [JsonPropertyName("pick_remote_areas_fee")]
        public int PickRemoteAreasFee { get; set; }

        [JsonPropertyName("deliver_remote_areas_fee")]
        public int DeliverRemoteAreasFee { get; set; }

        [JsonPropertyName("cod_failed_fee")]
        public int CodFailedFee { get; set; }
    }

    internal class GhnLeadTimeData
    {
        [JsonPropertyName("leadtime")]
        public long Leadtime { get; set; }

        [JsonPropertyName("order_date")]
        public long OrderDate { get; set; }
    }

    // ══════════════════════════════════════════════
    //  Service chính
    // ══════════════════════════════════════════════

    /// <summary>
    /// PROMPT 1: Tích hợp GHN API tính phí vận chuyển.
    ///
    /// Luồng hoạt động:
    ///   1. Gọi POST /shiip/public-api/v2/shipping-order/fee  → tính tiền ship
    ///   2. Gọi POST /shiip/public-api/v2/shipping-order/leadtime → tính ngày giao
    ///   3. Map kết quả sang ShippingFeeResult sạch trả về cho Frontend
    ///
    /// Tất cả lỗi (network, HTTP 4xx/5xx, parse JSON) đều được bắt
    /// và trả về ShippingFeeResult { Success=false, ErrorMessage=... }
    /// thay vì throw ra ngoài → trang checkout không bị crash.
    /// </summary>
    public class GhnShippingService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<GhnShippingService> _logger;

        // Giới hạn của GHN (cm/gram)
        private const int MaxWeight = 30_000_000; // 30 tấn
        private const int MaxDimension = 200;     // 200 cm mỗi chiều

        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public GhnShippingService(
            IHttpClientFactory httpClientFactory,
            IConfiguration config,
            ILogger<GhnShippingService> logger)
        {
            _http   = httpClientFactory.CreateClient("GHN");
            _config = config;
            _logger = logger;
        }

        /// <summary>
        /// Tính phí vận chuyển và ngày giao hàng dự kiến.
        /// </summary>
        public async Task<ShippingFeeResult> CalculateShippingFeeAsync(
            ShippingCalculationRequest request,
            CancellationToken ct = default)
        {
            try
            {
                // ─── Đọc config ───────────────────────────────────────────
                var token          = _config["GHN:Token"] ?? string.Empty;
                var shopId         = _config.GetValue<int>("GHN:ShopId");
                var fromDistrictId = _config.GetValue<int>("GHN:FromDistrictId");
                var fromWardCode   = _config["GHN:FromWardCode"] ?? string.Empty;
                var serviceTypeId  = _config.GetValue<int>("GHN:ServiceTypeId");

                if (string.IsNullOrWhiteSpace(token) || token == "YOUR_GHN_TOKEN_HERE")
                {
                    _logger.LogWarning("GHN Token chưa được cấu hình trong appsettings.json.");
                    return Fallback("GHN chưa được cấu hình. Vui lòng liên hệ quản trị viên.");
                }

                // ─── Clamp giá trị để tránh GHN trả lỗi 400 ──────────────
                var weight = Math.Clamp(request.Weight, 1, MaxWeight);
                var length = Math.Clamp(request.Length, 1, MaxDimension);
                var width  = Math.Clamp(request.Width,  1, MaxDimension);
                var height = Math.Clamp(request.Height, 1, MaxDimension);

                // ─── Bước 1: Tính phí ─────────────────────────────────────
                var feePayload = new
                {
                    service_type_id  = serviceTypeId,
                    from_district_id = fromDistrictId,
                    from_ward_code   = fromWardCode,
                    to_district_id   = request.ToDistrictId,
                    to_ward_code     = request.ToWardCode,
                    height,
                    length,
                    weight,
                    width,
                    insurance_value  = request.InsuranceValue,
                    coupon           = (string?)null
                };

                var feeResult = await PostGhnAsync<GhnFeeData>(
                    "/shiip/public-api/v2/shipping-order/fee",
                    feePayload, token, shopId, ct);

                // Nếu bước 1 thất bại → trả lỗi ngay
                if (!feeResult.Success)
                    return Fallback(feeResult.Error ?? "Không lấy được phí vận chuyển từ GHN.");

                // ─── Bước 2: Tính leadtime ────────────────────────────────
                var leadtimePayload = new
                {
                    service_id       = serviceTypeId,
                    from_district_id = fromDistrictId,
                    from_ward_code   = fromWardCode,
                    to_district_id   = request.ToDistrictId,
                    to_ward_code     = request.ToWardCode
                };

                var ltResult = await PostGhnAsync<GhnLeadTimeData>(
                    "/shiip/public-api/v2/shipping-order/leadtime",
                    leadtimePayload, token, shopId, ct);

                // ─── Bước 3: Compose kết quả ──────────────────────────────
                DateTime? expectedDate = null;
                int estimatedDays      = 3; // Mặc định 3 ngày

                if (ltResult.Success && ltResult.LeadtimeData != null)
                {
                    var leadtimeSecs = ltResult.LeadtimeData.Leadtime;
                    if (leadtimeSecs > 0)
                    {
                        expectedDate  = DateTimeOffset.FromUnixTimeSeconds(leadtimeSecs).UtcDateTime;
                        estimatedDays = Math.Max(1, (expectedDate.Value - DateTime.UtcNow).Days);
                    }
                }

                return new ShippingFeeResult
                {
                    Success              = true,
                    TotalFee             = feeResult.TotalFee,
                    ServiceFee           = feeResult.ServiceFeeValue,
                    ExpectedDeliveryDate = expectedDate,
                    EstimatedDays        = estimatedDays,
                    ServiceName          = "GHN Express"
                };
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("GHN API timeout khi tính phí vận chuyển.");
                return Fallback("Dịch vụ vận chuyển tạm thời không phản hồi. Vui lòng thử lại.");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Lỗi kết nối tới GHN API.");
                return Fallback("Không thể kết nối tới dịch vụ vận chuyển.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi không xác định khi tính phí GHN.");
                return Fallback("Có lỗi xảy ra khi tính phí vận chuyển.");
            }
        }


        // ────────────────────────────────────────────────────────────
        //  Helper: POST request tới GHN và deserialize response
        // ────────────────────────────────────────────────────────────
        private async Task<GhnCallResult> PostGhnAsync<T>(
            string path,
            object payload,
            string token,
            int shopId,
            CancellationToken ct)
        {
            var json    = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            using var request = new HttpRequestMessage(HttpMethod.Post, path)
            {
                Content = content
            };
            request.Headers.Add("Token", token);
            if (shopId > 0)
                request.Headers.Add("ShopId", shopId.ToString());

            var httpResponse = await _http.SendAsync(request, ct);
            var responseBody = await httpResponse.Content.ReadAsStringAsync(ct);

            _logger.LogDebug("GHN {Path} → HTTP {Status}: {Body}",
                path, (int)httpResponse.StatusCode, responseBody);

            if (!httpResponse.IsSuccessStatusCode)
            {
                _logger.LogWarning("GHN API lỗi HTTP {Status} tại {Path}: {Body}",
                    (int)httpResponse.StatusCode, path, responseBody);
                return GhnCallResult.Failure($"GHN API lỗi: {(int)httpResponse.StatusCode}");
            }

            var apiResponse = JsonSerializer.Deserialize<GhnApiResponse<T>>(responseBody, JsonOpts);

            if (apiResponse == null || apiResponse.Code != 200)
            {
                var msg = apiResponse?.Message ?? "Phản hồi không hợp lệ từ GHN";
                _logger.LogWarning("GHN API trả mã lỗi {Code}: {Message}", apiResponse?.Code, msg);
                return GhnCallResult.Failure(msg);
            }

            return GhnCallResult.Ok(apiResponse.Data, typeof(T));
        }

        private static ShippingFeeResult Fallback(string message) => new()
        {
            Success       = false,
            TotalFee      = 0,
            ErrorMessage  = message,
            EstimatedDays = 3
        };
    }

    // ────────────────────────────────────────────────────────────
    //  Internal result wrapper để tránh generic phức tạp
    // ────────────────────────────────────────────────────────────
    internal class GhnCallResult
    {
        public bool Success { get; private set; }
        public string? Error { get; private set; }
        public decimal TotalFee { get; private set; }
        public decimal ServiceFeeValue { get; private set; }
        public GhnLeadTimeData? LeadtimeData { get; private set; }

        public static GhnCallResult Ok(object? data, Type type)
        {
            var r = new GhnCallResult { Success = true };
            if (data is GhnFeeData fee)
            {
                r.TotalFee       = fee.Total;
                r.ServiceFeeValue = fee.ServiceFee;
            }
            else if (data is GhnLeadTimeData lt)
            {
                r.LeadtimeData = lt;
            }
            return r;
        }

        public static GhnCallResult Failure(string error) =>
            new() { Success = false, Error = error };

        // Implicit conversion để dùng như ShippingFeeResult khi cần
        public ShippingFeeResult ToShippingFeeResult() => new()
        {
            Success      = Success,
            TotalFee     = TotalFee,
            ServiceFee   = ServiceFeeValue,
            ErrorMessage = Error
        };
    }
}
