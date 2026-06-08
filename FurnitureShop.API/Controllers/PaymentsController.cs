using FurnitureShop.API.Patterns.Factory;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    /// <summary>
    /// Controller Payment API sử dụng Factory Method Pattern
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        // SINGLETON PATTERN: Logger Service
        private readonly ILoggerService _logger = LoggerService.Instance;
        private readonly AppDbContext _context;

        public PaymentsController(AppDbContext context)
        {
            _context = context;
            _logger.LogInfo($"PaymentsController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        /// <summary>
        /// Lấy danh sách phương thức thanh toán hỗ trợ
        /// </summary>
        [HttpGet("methods")]
        public IActionResult GetPaymentMethods()
        {
            _logger.LogInfo("Getting available payment methods");
            var methods = PaymentMethodFactory.GetAvailablePaymentMethods();
            return Ok(new { success = true, data = methods });
        }

        /// <summary>
        /// Xử lý thanh toán - FACTORY METHOD PATTERN
        /// </summary>
        [HttpPost("process")]
        public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentRequest request)
        {
            try
            {
                _logger.LogInfo($"Processing payment: Method={request.PaymentMethod}, OrderId={request.OrderId}, Amount={request.Amount}");

                // FACTORY METHOD: Tạo Payment Creator theo method code
                var creator = PaymentMethodFactory.GetCreator(request.PaymentMethod);

                // Tạo PaymentInfo từ request
                var paymentInfo = new PaymentInfo
                {
                    FullName = request.FullName,
                    Email = request.Email,
                    PhoneNumber = request.PhoneNumber,
                    ShippingAddress = request.ShippingAddress
                };

                // TEMPLATE METHOD: Execute payment qua Creator
                var result = await creator.ExecutePaymentAsync(
                    request.Amount,
                    request.OrderId,
                    paymentInfo
                );

                if (result.Success)
                {
                    _logger.LogInfo($"Payment successful: TransactionId={result.TransactionId}");
                }
                else
                {
                    _logger.LogWarning($"Payment failed: {result.Message}");
                }

                return Ok(new { success = result.Success, data = result });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning($"Invalid payment method: {ex.Message}");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError("Payment processing error", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi xử lý thanh toán" });
            }
        }

        /// <summary>
        /// Kiểm tra trạng thái thanh toán
        /// </summary>
        [HttpGet("status/{transactionId}")]
        public async Task<IActionResult> CheckPaymentStatus(string transactionId, [FromQuery] string paymentMethod)
        {
            try
            {
                _logger.LogInfo($"Checking payment status: TransactionId={transactionId}");

                var creator = PaymentMethodFactory.GetCreator(paymentMethod);
                var payment = creator.CreatePaymentMethod();
                var status = await payment.CheckPaymentStatusAsync(transactionId);

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        transactionId,
                        status = status.ToString(),
                        paymentMethod = payment.PaymentCode
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error checking payment status", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// Hoàn tiền
        /// </summary>
        [HttpPost("refund")]
        public async Task<IActionResult> RefundPayment([FromBody] RefundRequest request)
        {
            try
            {
                _logger.LogInfo($"Processing refund: TransactionId={request.TransactionId}, Amount={request.Amount}");

                var creator = PaymentMethodFactory.GetCreator(request.PaymentMethod);
                var payment = creator.CreatePaymentMethod();
                var result = await payment.RefundAsync(request.TransactionId, request.Amount);

                if (result.Success)
                {
                    _logger.LogInfo($"Refund successful: RefundId={result.RefundId}");
                }

                return Ok(new { success = result.Success, data = result });
            }
            catch (Exception ex)
            {
                _logger.LogError("Refund processing error", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra khi hoàn tiền" });
            }
        }

        /// <summary>
        /// Lấy URL thanh toán (cho VNPay, PayPal)
        /// </summary>
        [HttpPost("create-payment-url")]
        public IActionResult CreatePaymentUrl([FromBody] CreatePaymentUrlRequest request)
        {
            try
            {
                _logger.LogInfo($"Creating payment URL: Method={request.PaymentMethod}, OrderId={request.OrderId}");

                var creator = PaymentMethodFactory.GetCreator(request.PaymentMethod);
                var payment = creator.CreatePaymentMethod();
                var url = payment.GetPaymentUrl(request.Amount, request.OrderId, request.ReturnUrl);

                if (string.IsNullOrEmpty(url))
                {
                    return Ok(new
                    {
                        success = true,
                        data = new { requiresRedirect = false, message = "Phương thức này không cần redirect" }
                    });
                }

                return Ok(new
                {
                    success = true,
                    data = new { requiresRedirect = true, paymentUrl = url }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error creating payment URL", ex);
                return StatusCode(500, new { success = false, message = "Có lỗi xảy ra" });
            }
        }

        /// <summary>
        /// VNPay Return URL (callback sau khi thanh toán)
        /// </summary>
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VNPayReturn([FromQuery] Dictionary<string, string> vnpayParams)
        {
            _logger.LogInfo("VNPay callback received");

            // Trong thực tế: Verify checksum và update order status
            var responseCode = vnpayParams.GetValueOrDefault("vnp_ResponseCode", "99");
            var txnRef = vnpayParams.GetValueOrDefault("vnp_TxnRef", "");

            if (responseCode == "00")
            {
                var order = await _context.Orders
                    .FirstOrDefaultAsync(o => o.OrderNumber == txnRef || o.OrderId.ToString() == txnRef);

                if (order != null)
                {
                    order.IsPaid = true;
                    order.PaidAt = DateTime.UtcNow;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                _logger.LogInfo($"VNPay payment successful: TxnRef={txnRef}");
                return Redirect($"/payment-success?orderId={txnRef}");
            }

            _logger.LogWarning($"VNPay payment failed: ResponseCode={responseCode}");
            return Redirect($"/payment-failed?orderId={txnRef}&code={responseCode}");
        }
    }

    // ===========================================
    // Request DTOs
    // ===========================================

    public class ProcessPaymentRequest
    {
        public string PaymentMethod { get; set; } = "CASH";
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ShippingAddress { get; set; }
    }

    public class RefundRequest
    {
        public string TransactionId { get; set; } = string.Empty;
        public string PaymentMethod { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }

    public class CreatePaymentUrlRequest
    {
        public string PaymentMethod { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string ReturnUrl { get; set; } = string.Empty;
    }
}
