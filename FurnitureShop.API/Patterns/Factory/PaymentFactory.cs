namespace FurnitureShop.API.Patterns.Factory
{
    // ===========================================
    // FACTORY METHOD PATTERN: Payment API
    // Hỗ trợ: Cash, PayPal, VNPay
    // ===========================================

    /// <summary>
    /// FACTORY METHOD PATTERN: Product Interface
    /// Interface chung cho tất cả phương thức thanh toán
    /// </summary>
    public interface IPaymentMethod
    {
        /// <summary>
        /// Tên phương thức thanh toán
        /// </summary>
        string PaymentName { get; }

        /// <summary>
        /// Mã phương thức thanh toán
        /// </summary>
        string PaymentCode { get; }

        /// <summary>
        /// Xử lý thanh toán
        /// </summary>
        /// <param name="amount">Số tiền cần thanh toán</param>
        /// <param name="orderId">Mã đơn hàng</param>
        /// <returns>Kết quả thanh toán</returns>
        Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId);

        /// <summary>
        /// Kiểm tra trạng thái thanh toán
        /// </summary>
        Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId);

        /// <summary>
        /// Hoàn tiền
        /// </summary>
        Task<RefundResult> RefundAsync(string transactionId, decimal amount);

        /// <summary>
        /// Validate thông tin thanh toán
        /// </summary>
        bool ValidatePaymentInfo(PaymentInfo paymentInfo);

        /// <summary>
        /// Lấy phí giao dịch (%)
        /// </summary>
        decimal GetTransactionFeePercent();

        /// <summary>
        /// Lấy URL redirect (nếu có) cho online payment
        /// </summary>
        string? GetPaymentUrl(decimal amount, string orderId, string returnUrl);
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Abstract Creator
    /// Abstract class tạo Payment Method
    /// </summary>
    public abstract class PaymentMethodCreator
    {
        /// <summary>
        /// Factory Method - được override bởi các concrete creator
        /// </summary>
        public abstract IPaymentMethod CreatePaymentMethod();

        /// <summary>
        /// Template Method - quy trình thanh toán chuẩn
        /// </summary>
        public async Task<PaymentResult> ExecutePaymentAsync(decimal amount, string orderId, PaymentInfo paymentInfo)
        {
            var paymentMethod = CreatePaymentMethod();

            // Validate payment info
            if (!paymentMethod.ValidatePaymentInfo(paymentInfo))
            {
                return new PaymentResult
                {
                    Success = false,
                    Message = "Thông tin thanh toán không hợp lệ",
                    PaymentMethod = paymentMethod.PaymentCode
                };
            }

            // Tính phí giao dịch
            var fee = amount * paymentMethod.GetTransactionFeePercent() / 100;
            var totalAmount = amount + fee;

            // Xử lý thanh toán
            var result = await paymentMethod.ProcessPaymentAsync(totalAmount, orderId);
            result.TransactionFee = fee;
            result.PaymentMethod = paymentMethod.PaymentCode;

            return result;
        }
    }

    // ===========================================
    // CONCRETE PRODUCTS
    // ===========================================

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Product - Cash Payment
    /// Thanh toán tiền mặt khi nhận hàng (COD)
    /// </summary>
    public class CashPayment : IPaymentMethod
    {
        public string PaymentName => "Thanh toán khi nhận hàng (COD)";
        public string PaymentCode => "CASH";

        public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId)
        {
            // COD: Đánh dấu đơn hàng chờ thanh toán khi giao
            await Task.Delay(100); // Simulate processing

            return new PaymentResult
            {
                Success = true,
                TransactionId = $"COD_{orderId}_{DateTime.Now:yyyyMMddHHmmss}",
                Message = "Đơn hàng sẽ được thanh toán khi nhận hàng",
                Status = PaymentStatus.Pending,
                Amount = amount
            };
        }

        public async Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId)
        {
            await Task.Delay(50);
            // COD payment is confirmed when delivery is completed
            return PaymentStatus.Pending;
        }

        public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
        {
            await Task.Delay(50);
            return new RefundResult
            {
                Success = true,
                Message = "Hoàn tiền COD đã được xử lý",
                RefundId = $"REFUND_{transactionId}"
            };
        }

        public bool ValidatePaymentInfo(PaymentInfo paymentInfo)
        {
            // COD chỉ cần địa chỉ giao hàng
            return !string.IsNullOrEmpty(paymentInfo.ShippingAddress) &&
                   !string.IsNullOrEmpty(paymentInfo.PhoneNumber);
        }

        public decimal GetTransactionFeePercent() => 0; // Miễn phí COD

        public string? GetPaymentUrl(decimal amount, string orderId, string returnUrl)
        {
            return null; // COD không cần redirect
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Product - PayPal Payment
    /// Thanh toán qua PayPal
    /// </summary>
    public class PayPalPayment : IPaymentMethod
    {
        private readonly string _clientId;
        private readonly string _clientSecret;
        private readonly bool _isSandbox;

        public PayPalPayment()
        {
            // Đọc từ config trong thực tế
            _clientId = "YOUR_PAYPAL_CLIENT_ID";
            _clientSecret = "YOUR_PAYPAL_CLIENT_SECRET";
            _isSandbox = true;
        }

        public string PaymentName => "PayPal";
        public string PaymentCode => "PAYPAL";

        public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId)
        {
            try
            {
                // Simulate PayPal API call
                await Task.Delay(500);

                // Trong thực tế: Gọi PayPal REST API
                // POST https://api.paypal.com/v2/checkout/orders
                
                var transactionId = $"PP_{Guid.NewGuid():N}";

                return new PaymentResult
                {
                    Success = true,
                    TransactionId = transactionId,
                    Message = "Thanh toán PayPal thành công",
                    Status = PaymentStatus.Completed,
                    Amount = amount,
                    PaymentUrl = GetPaymentUrl(amount, orderId, "")
                };
            }
            catch (Exception ex)
            {
                return new PaymentResult
                {
                    Success = false,
                    Message = $"Lỗi PayPal: {ex.Message}",
                    Status = PaymentStatus.Failed
                };
            }
        }

        public async Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId)
        {
            await Task.Delay(200);
            // Simulate PayPal API check
            // GET https://api.paypal.com/v2/checkout/orders/{id}
            return PaymentStatus.Completed;
        }

        public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
        {
            await Task.Delay(300);
            // POST https://api.paypal.com/v2/payments/captures/{capture_id}/refund
            return new RefundResult
            {
                Success = true,
                Message = "Hoàn tiền PayPal thành công",
                RefundId = $"PPREF_{Guid.NewGuid():N}"
            };
        }

        public bool ValidatePaymentInfo(PaymentInfo paymentInfo)
        {
            // PayPal cần email
            return !string.IsNullOrEmpty(paymentInfo.Email);
        }

        public decimal GetTransactionFeePercent() => 2.9m; // PayPal: 2.9% + fixed fee

        public string? GetPaymentUrl(decimal amount, string orderId, string returnUrl)
        {
            var baseUrl = _isSandbox 
                ? "https://www.sandbox.paypal.com/checkoutnow" 
                : "https://www.paypal.com/checkoutnow";
            
            return $"{baseUrl}?token={orderId}&amount={amount}";
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Product - VNPay Payment
    /// Thanh toán qua VNPay (Việt Nam)
    /// </summary>
    public class VNPayPayment : IPaymentMethod
    {
        private readonly string _tmnCode;
        private readonly string _hashSecret;
        private readonly string _vnpUrl;

        public VNPayPayment()
        {
            // Đọc từ config trong thực tế
            _tmnCode = "YOUR_TMN_CODE";
            _hashSecret = "YOUR_HASH_SECRET";
            _vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        }

        public string PaymentName => "VNPay";
        public string PaymentCode => "VNPAY";

        public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId)
        {
            try
            {
                await Task.Delay(300);

                // Trong thực tế: Tạo URL thanh toán VNPay
                var transactionId = $"VNP_{DateTime.Now:yyyyMMddHHmmss}_{orderId}";
                var paymentUrl = GetPaymentUrl(amount, orderId, "");

                return new PaymentResult
                {
                    Success = true,
                    TransactionId = transactionId,
                    Message = "Vui lòng hoàn tất thanh toán trên VNPay",
                    Status = PaymentStatus.Pending,
                    Amount = amount,
                    PaymentUrl = paymentUrl
                };
            }
            catch (Exception ex)
            {
                return new PaymentResult
                {
                    Success = false,
                    Message = $"Lỗi VNPay: {ex.Message}",
                    Status = PaymentStatus.Failed
                };
            }
        }

        public async Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId)
        {
            await Task.Delay(200);
            // Gọi VNPay Query API để kiểm tra
            return PaymentStatus.Completed;
        }

        public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
        {
            await Task.Delay(300);
            // VNPay Refund API
            return new RefundResult
            {
                Success = true,
                Message = "Yêu cầu hoàn tiền VNPay đã được gửi",
                RefundId = $"VNPREF_{DateTime.Now:yyyyMMddHHmmss}"
            };
        }

        public bool ValidatePaymentInfo(PaymentInfo paymentInfo)
        {
            // VNPay cần thông tin cơ bản
            return !string.IsNullOrEmpty(paymentInfo.FullName) &&
                   !string.IsNullOrEmpty(paymentInfo.PhoneNumber);
        }

        public decimal GetTransactionFeePercent() => 1.1m; // VNPay: ~1.1%

        public string? GetPaymentUrl(decimal amount, string orderId, string returnUrl)
        {
            // Trong thực tế: Tạo URL với chữ ký HMAC-SHA512
            var vnpParams = new Dictionary<string, string>
            {
                { "vnp_Version", "2.1.0" },
                { "vnp_Command", "pay" },
                { "vnp_TmnCode", _tmnCode },
                { "vnp_Amount", ((long)(amount * 100)).ToString() },
                { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") },
                { "vnp_CurrCode", "VND" },
                { "vnp_IpAddr", "127.0.0.1" },
                { "vnp_Locale", "vn" },
                { "vnp_OrderInfo", $"Thanh toan don hang {orderId}" },
                { "vnp_OrderType", "other" },
                { "vnp_ReturnUrl", returnUrl ?? "http://localhost:5000/api/payment/vnpay-return" },
                { "vnp_TxnRef", orderId }
            };

            var queryString = string.Join("&", vnpParams
                .OrderBy(x => x.Key)
                .Select(x => $"{x.Key}={Uri.EscapeDataString(x.Value)}"));

            return $"{_vnpUrl}?{queryString}";
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Product - Momo Payment
    /// Thanh toán qua Momo
    /// </summary>
    public class MomoPayment : IPaymentMethod
    {
        public string PaymentName => "Ví MoMo";
        public string PaymentCode => "MOMO";

        public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId)
        {
            await Task.Delay(200);

            var transactionId = $"MOMO_{DateTime.Now:yyyyMMddHHmmss}_{orderId}";
            var paymentUrl = GetPaymentUrl(amount, orderId, "");

            return new PaymentResult
            {
                Success = true,
                TransactionId = transactionId,
                Message = "Vui lòng hoàn tất thanh toán trên ứng dụng MoMo",
                Status = PaymentStatus.Pending,
                Amount = amount,
                PaymentUrl = paymentUrl
            };
        }

        public async Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId)
        {
            await Task.Delay(100);
            return PaymentStatus.Completed;
        }

        public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
        {
            await Task.Delay(200);
            return new RefundResult
            {
                Success = true,
                Message = "Yêu cầu hoàn tiền MoMo đã được gửi",
                RefundId = $"MOMOREF_{DateTime.Now:yyyyMMddHHmmss}"
            };
        }

        public bool ValidatePaymentInfo(PaymentInfo paymentInfo)
        {
            return !string.IsNullOrEmpty(paymentInfo.PhoneNumber);
        }

        public decimal GetTransactionFeePercent() => 1.5m; // MoMo ~1.5%

        public string? GetPaymentUrl(decimal amount, string orderId, string returnUrl)
        {
            // Trong thực tế: Tạo URL API của MoMo để redirect
            return $"https://test-payment.momo.vn/v2/gateway/pay?orderId={orderId}&amount={amount}";
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Product - Bank Transfer
    /// Chuyển khoản ngân hàng thủ công
    /// </summary>
    public class BankTransferPayment : IPaymentMethod
    {
        public string PaymentName => "Chuyển khoản ngân hàng";
        public string PaymentCode => "BANK";

        public async Task<PaymentResult> ProcessPaymentAsync(decimal amount, string orderId)
        {
            await Task.Delay(100);

            return new PaymentResult
            {
                Success = true,
                TransactionId = $"BANK_{orderId}_{DateTime.Now:yyyyMMddHHmmss}",
                Message = "Vui lòng chuyển khoản theo thông tin: Ngân hàng VCB, STK: 123456789, Tên: FURNITURE SHOP. Nội dung: Thanh toan don hang " + orderId,
                Status = PaymentStatus.Pending,
                Amount = amount
            };
        }

        public async Task<PaymentStatus> CheckPaymentStatusAsync(string transactionId)
        {
            await Task.Delay(50);
            return PaymentStatus.Pending; // Trạng thái này sẽ được admin confirm thủ công
        }

        public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
        {
            await Task.Delay(50);
            return new RefundResult
            {
                Success = false,
                Message = "Hoàn tiền chuyển khoản cần được thực hiện thủ công"
            };
        }

        public bool ValidatePaymentInfo(PaymentInfo paymentInfo)
        {
            return true; // Chuyển khoản không yêu cầu validate form thông tin đặc biệt
        }

        public decimal GetTransactionFeePercent() => 0; // Thường KH chịu phí chuyển khoản

        public string? GetPaymentUrl(decimal amount, string orderId, string returnUrl)
        {
            return null; // Không redirect, chỉ hiện thông tin
        }
    }

    // ===========================================
    // CONCRETE CREATORS
    // ===========================================

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Creator - Cash
    /// </summary>
    public class CashPaymentCreator : PaymentMethodCreator
    {
        public override IPaymentMethod CreatePaymentMethod()
        {
            return new CashPayment();
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Creator - PayPal
    /// </summary>
    public class PayPalPaymentCreator : PaymentMethodCreator
    {
        public override IPaymentMethod CreatePaymentMethod()
        {
            return new PayPalPayment();
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Creator - VNPay
    /// </summary>
    public class VNPayPaymentCreator : PaymentMethodCreator
    {
        public override IPaymentMethod CreatePaymentMethod()
        {
            return new VNPayPayment();
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Creator - Momo
    /// </summary>
    public class MomoPaymentCreator : PaymentMethodCreator
    {
        public override IPaymentMethod CreatePaymentMethod()
        {
            return new MomoPayment();
        }
    }

    /// <summary>
    /// FACTORY METHOD PATTERN: Concrete Creator - Bank Transfer
    /// </summary>
    public class BankTransferPaymentCreator : PaymentMethodCreator
    {
        public override IPaymentMethod CreatePaymentMethod()
        {
            return new BankTransferPayment();
        }
    }

    // ===========================================
    // SIMPLE FACTORY (Bonus) - Tạo Creator dựa trên code
    // ===========================================

    /// <summary>
    /// Simple Factory để tạo Payment Creator theo code
    /// </summary>
    public static class PaymentMethodFactory
    {
        /// <summary>
        /// Tạo Payment Creator theo mã phương thức thanh toán
        /// </summary>
        public static PaymentMethodCreator GetCreator(string paymentCode)
        {
            return paymentCode.ToUpper() switch
            {
                "CASH" or "COD" => new CashPaymentCreator(),
                "PAYPAL" or "PP" => new PayPalPaymentCreator(),
                "VNPAY" or "VNP" => new VNPayPaymentCreator(),
                "MOMO" => new MomoPaymentCreator(),
                "BANK" or "TRANSFER" => new BankTransferPaymentCreator(),
                _ => throw new ArgumentException($"Phương thức thanh toán không hỗ trợ: {paymentCode}")
            };
        }

        /// <summary>
        /// Lấy danh sách các phương thức thanh toán hỗ trợ
        /// </summary>
        public static List<PaymentMethodInfo> GetAvailablePaymentMethods()
        {
            return new List<PaymentMethodInfo>
            {
                new() { Code = "CASH", Name = "Thanh toán khi nhận hàng (COD)", FeePercent = 0, Icon = "cash" },
                new() { Code = "VNPAY", Name = "VNPay", FeePercent = 1.1m, Icon = "vnpay" },
                new() { Code = "PAYPAL", Name = "PayPal", FeePercent = 2.9m, Icon = "paypal" },
                new() { Code = "MOMO", Name = "Ví MoMo", FeePercent = 1.5m, Icon = "momo" },
                new() { Code = "BANK", Name = "Chuyển khoản ngân hàng", FeePercent = 0, Icon = "bank" }
            };
        }
    }

    // ===========================================
    // DTOs & Enums
    // ===========================================

    /// <summary>
    /// Trạng thái thanh toán
    /// </summary>
    public enum PaymentStatus
    {
        Pending,      // Đang chờ
        Processing,   // Đang xử lý
        Completed,    // Hoàn thành
        Failed,       // Thất bại
        Cancelled,    // Đã hủy
        Refunded      // Đã hoàn tiền
    }

    /// <summary>
    /// Kết quả thanh toán
    /// </summary>
    public class PaymentResult
    {
        public bool Success { get; set; }
        public string? TransactionId { get; set; }
        public string Message { get; set; } = string.Empty;
        public PaymentStatus Status { get; set; }
        public decimal Amount { get; set; }
        public decimal TransactionFee { get; set; }
        public string? PaymentMethod { get; set; }
        public string? PaymentUrl { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// Thông tin thanh toán từ client
    /// </summary>
    public class PaymentInfo
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? ShippingAddress { get; set; }
        public string? CardNumber { get; set; }
        public string? CardHolderName { get; set; }
        public string? ExpiryDate { get; set; }
        public string? CVV { get; set; }
    }

    /// <summary>
    /// Kết quả hoàn tiền
    /// </summary>
    public class RefundResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? RefundId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;
    }

    /// <summary>
    /// Thông tin phương thức thanh toán
    /// </summary>
    public class PaymentMethodInfo
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal FeePercent { get; set; }
        public string? Icon { get; set; }
    }
}
