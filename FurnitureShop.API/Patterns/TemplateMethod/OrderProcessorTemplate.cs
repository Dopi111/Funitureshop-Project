using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using FurnitureShop.API.Data;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.TemplateMethod
{
    /// <summary>
    /// TEMPLATE METHOD PATTERN - Khuôn mẫu xử lý đơn hàng nội thất
    ///
    /// Vấn đề: Mỗi loại đơn hàng nội thất có quy trình xử lý khác nhau:
    ///   - Đơn hàng tiêu chuẩn: Giao hàng nhanh
    ///   - Đơn hàng theo yêu cầu: Cần xác nhận bản vẽ thiết kế, đặt cọc trước
    ///   - Đơn hàng cần lắp đặt: Cần đặt lịch lắp đặt sau khi giao hàng
    ///
    /// Giải pháp: Lớp cha định nghĩa "bộ khung" (Template) quy trình cố định.
    ///   Các lớp con chỉ ghi đè (override) những bước có logic khác biệt.
    ///
    /// Lợi ích:
    ///   - Tái sử dụng code: Các bước chung chỉ viết 1 lần ở lớp cha
    ///   - Dễ mở rộng: Thêm loại đơn hàng mới mà không sửa bộ khung
    ///   - Đảm bảo thứ tự bước: Mọi loại đơn đều đi qua đúng 6 bước
    /// </summary>
    public abstract class OrderProcessorTemplate
    {
        protected readonly AppDbContext _context;
        protected readonly ILogger _logger;

        // Kết quả xử lý đơn hàng trả về sau khi ProcessOrder() hoàn tất
        protected OrderProcessResult Result { get; set; } = new();

        protected OrderProcessorTemplate(AppDbContext context, ILogger logger)
        {
            _context = context;
            _logger = logger;
        }

        // =====================================================================
        // [TEMPLATE METHOD] - Bộ khung quy trình cố định, KHÔNG được ghi đè
        // Đây chính là "Template Method" - định nghĩa thứ tự các bước bắt buộc
        // =====================================================================
        public async Task<OrderProcessResult> ProcessOrderAsync(CreateOrderContext context)
        {
            _logger.LogInformation($"[{GetType().Name}] Bắt đầu xử lý đơn hàng...");

            // BƯỚC 1: Xác thực đơn hàng (logic khác nhau theo loại)
            await ValidateOrderAsync(context);
            if (!Result.IsSuccess) return Result;

            // BƯỚC 2: Kiểm tra tồn kho (CHUNG - mọi loại đều như nhau)
            await CheckInventoryAsync(context);
            if (!Result.IsSuccess) return Result;

            // BƯỚC 3: Tính phí vận chuyển (logic khác nhau theo loại)
            await CalculateShippingAsync(context);

            // BƯỚC 4: Áp dụng mã giảm giá nếu có (CHUNG - mọi loại đều như nhau)
            await ApplyCouponAsync(context);

            // BƯỚC 5: Tạo bản ghi đơn hàng vào DB (CHUNG - mọi loại đều như nhau)
            await CreateOrderRecordAsync(context);
            if (!Result.IsSuccess) return Result;

            // BƯỚC 6: Gửi email xác nhận (CHUNG - mọi loại đều như nhau)
            await SendConfirmationEmailAsync(context);

            _logger.LogInformation($"[{GetType().Name}] Hoàn tất xử lý đơn hàng #{Result.OrderNumber}");
            return Result;
        }

        // =====================================================================
        // [ABSTRACT STEPS] - Các bước BẮT BUỘC lớp con phải tự định nghĩa
        // =====================================================================

        /// <summary>Bước 1: Xác thực đơn hàng - mỗi loại đơn có quy tắc riêng</summary>
        protected abstract Task ValidateOrderAsync(CreateOrderContext context);

        /// <summary>Bước 3: Tính phí ship - mỗi loại đơn có cách tính riêng</summary>
        protected abstract Task CalculateShippingAsync(CreateOrderContext context);

        // =====================================================================
        // [CONCRETE STEPS] - Các bước CHUNG cho mọi loại đơn hàng
        // Lớp con có thể ghi đè nếu cần thiết (không bắt buộc)
        // =====================================================================

        /// <summary>Bước 2: Kiểm tra tồn kho - logic giống nhau cho mọi loại đơn</summary>
        protected virtual async Task CheckInventoryAsync(CreateOrderContext context)
        {
            _logger.LogInformation("Kiểm tra tồn kho...");
            foreach (var item in context.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                {
                    Result.IsSuccess = false;
                    Result.ErrorMessage = $"Sản phẩm ID={item.ProductId} không tồn tại.";
                    return;
                }
                if (product.StockQuantity < item.Quantity)
                {
                    Result.IsSuccess = false;
                    Result.ErrorMessage = $"Sản phẩm '{product.Name}' chỉ còn {product.StockQuantity} cái trong kho.";
                    return;
                }
            }
            _logger.LogInformation("Tồn kho đủ. Tiếp tục xử lý...");
        }

        /// <summary>Bước 4: Áp dụng mã giảm giá - logic giống nhau cho mọi loại đơn</summary>
        protected virtual async Task ApplyCouponAsync(CreateOrderContext context)
        {
            if (string.IsNullOrEmpty(context.CouponCode)) return;

            _logger.LogInformation($"Áp dụng mã giảm giá: {context.CouponCode}");
            var coupon = await _context.Coupons
                .FirstOrDefaultAsync(c => c.Code == context.CouponCode 
                                       && c.IsActive 
                                       && c.EndDate > DateTime.UtcNow);

            if (coupon != null)
            {
                // Tính giảm giá theo phần trăm (DiscountPercentage)
                var discountAmount = context.SubTotal * coupon.DiscountPercentage / 100;

                // Áp dụng giới hạn giảm giá tối đa nếu có
                if (coupon.MaxDiscountAmount.HasValue && discountAmount > coupon.MaxDiscountAmount.Value)
                    discountAmount = coupon.MaxDiscountAmount.Value;

                Result.DiscountAmount = discountAmount;
                _logger.LogInformation($"Giảm giá {Result.DiscountAmount:C} từ coupon '{coupon.Code}' ({coupon.DiscountPercentage}%)");
            }
        }


        /// <summary>Bước 5: Tạo bản ghi đơn hàng trong Database</summary>
        protected virtual async Task CreateOrderRecordAsync(CreateOrderContext context)
        {
            try
            {
                _logger.LogInformation("Tạo đơn hàng trong Database...");
                var order = new Order
                {
                    OrderNumber = $"ORD{DateTime.UtcNow:yyyyMMddHHmmss}",
                    UserId = context.UserId,
                    ShippingFullName = context.ShippingFullName,
                    ShippingPhone = context.ShippingPhone,
                    ShippingAddress = context.ShippingAddress,
                    ShippingFee = Result.ShippingFee,
                    SubTotal = context.SubTotal,
                    TotalAmount = context.SubTotal + Result.ShippingFee - Result.DiscountAmount,
                    Notes = context.Notes,
                    PaymentMethod = context.PaymentMethod,
                    Status = OrderStatus.Pending,
                    RequireInstallation = context.RequireInstallation,
                    InstallationFee = Result.InstallationFee,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                Result.OrderId = order.OrderId;
                Result.OrderNumber = order.OrderNumber;
                Result.TotalAmount = order.TotalAmount;
                Result.IsSuccess = true;

                _logger.LogInformation($"Đơn hàng #{order.OrderNumber} đã được tạo thành công.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tạo đơn hàng.");
                Result.IsSuccess = false;
                Result.ErrorMessage = "Lỗi hệ thống khi tạo đơn hàng. Vui lòng thử lại.";
            }
        }

        /// <summary>Bước 6: Gửi email xác nhận - logic giống nhau cho mọi loại đơn</summary>
        protected virtual async Task SendConfirmationEmailAsync(CreateOrderContext context)
        {
            // Placeholder — tích hợp với EmailService thực tế
            _logger.LogInformation($"Email xác nhận đơn hàng #{Result.OrderNumber} đã được gửi tới {context.Email}");
            await Task.CompletedTask;
        }
    }

    // =========================================================================
    // CONCRETE CLASS 1: Đơn hàng nội thất tiêu chuẩn (có sẵn trong kho)
    // =========================================================================
    /// <summary>
    /// Xử lý đơn hàng tiêu chuẩn: Sản phẩm có sẵn trong kho, giao hàng thông thường.
    /// - Xác thực: Chỉ kiểm tra thông tin giao hàng cơ bản
    /// - Phí ship: Tính theo trọng lượng và khoảng cách
    /// </summary>
    public class StandardOrderProcessor : OrderProcessorTemplate
    {
        public StandardOrderProcessor(AppDbContext context, ILogger<StandardOrderProcessor> logger)
            : base(context, logger) { }

        protected override async Task ValidateOrderAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Standard] Xác thực đơn hàng tiêu chuẩn...");

            if (string.IsNullOrWhiteSpace(context.ShippingAddress))
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Địa chỉ giao hàng không được để trống.";
                return;
            }
            if (context.Items == null || !context.Items.Any())
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Đơn hàng phải có ít nhất 1 sản phẩm.";
                return;
            }

            Result.IsSuccess = true;
            await Task.CompletedTask;
        }

        protected override async Task CalculateShippingAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Standard] Tính phí vận chuyển tiêu chuẩn...");

            // Phí ship tiêu chuẩn: 30,000đ, miễn phí nếu đơn trên 5 triệu
            Result.ShippingFee = context.SubTotal >= 5_000_000 ? 0 : 30_000;
            _logger.LogInformation($"Phí ship: {Result.ShippingFee:C}");
            await Task.CompletedTask;
        }
    }

    // =========================================================================
    // CONCRETE CLASS 2: Đơn hàng nội thất thiết kế theo yêu cầu
    // =========================================================================
    /// <summary>
    /// Xử lý đơn nội thất customized: Sản phẩm được sản xuất theo yêu cầu riêng.
    /// - Xác thực: Yêu cầu thêm file bản vẽ thiết kế và đặt cọc tối thiểu 30%
    /// - Phí ship: Cộng thêm phụ phí vận chuyển đồ cồng kềnh
    /// </summary>
    public class CustomFurnitureOrderProcessor : OrderProcessorTemplate
    {
        public CustomFurnitureOrderProcessor(AppDbContext context, ILogger<CustomFurnitureOrderProcessor> logger)
            : base(context, logger) { }

        protected override async Task ValidateOrderAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Custom] Xác thực đơn hàng nội thất theo yêu cầu...");

            // Đơn hàng custom: Bắt buộc phải có ghi chú yêu cầu thiết kế
            if (string.IsNullOrWhiteSpace(context.Notes))
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Đơn hàng theo yêu cầu phải ghi rõ yêu cầu thiết kế trong phần ghi chú.";
                return;
            }

            // Đơn hàng custom: Giá trị đơn hàng tối thiểu 2 triệu
            if (context.SubTotal < 2_000_000)
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Giá trị đơn hàng theo yêu cầu tối thiểu là 2,000,000đ.";
                return;
            }

            Result.IsSuccess = true;
            Result.AdditionalNotes = "Đơn hàng theo yêu cầu: Thời gian sản xuất 7-14 ngày. Sẽ liên hệ xác nhận thiết kế trước khi sản xuất.";
            await Task.CompletedTask;
        }

        protected override async Task CalculateShippingAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Custom] Tính phí vận chuyển đồ nội thất cồng kềnh...");

            // Nội thất theo yêu cầu: Phí ship cao hơn do kích thước và trọng lượng đặc biệt
            decimal baseShipping = 80_000;
            decimal bulkyFee = 50_000; // Phụ phí đồ cồng kềnh
            Result.ShippingFee = baseShipping + bulkyFee;
            _logger.LogInformation($"Phí ship nội thất cồng kềnh: {Result.ShippingFee:C}");
            await Task.CompletedTask;
        }
    }

    // =========================================================================
    // CONCRETE CLASS 3: Đơn hàng nội thất cần lắp đặt tại nhà
    // =========================================================================
    /// <summary>
    /// Xử lý đơn hàng có dịch vụ lắp đặt: Kỹ thuật viên đến lắp ráp tại nhà khách.
    /// - Xác thực: Kiểm tra địa chỉ lắp đặt trong phạm vi phục vụ
    /// - Phí ship: Cộng thêm phí lắp đặt dựa trên số lượng món đồ
    /// </summary>
    public class AssemblyRequiredOrderProcessor : OrderProcessorTemplate
    {
        public AssemblyRequiredOrderProcessor(AppDbContext context, ILogger<AssemblyRequiredOrderProcessor> logger)
            : base(context, logger) { }

        protected override async Task ValidateOrderAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Assembly] Xác thực đơn hàng cần lắp đặt...");

            if (!context.RequireInstallation)
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Loại đơn hàng này bắt buộc phải có dịch vụ lắp đặt.";
                return;
            }
            if (string.IsNullOrWhiteSpace(context.ShippingAddress))
            {
                Result.IsSuccess = false;
                Result.ErrorMessage = "Địa chỉ lắp đặt không được để trống.";
                return;
            }

            Result.IsSuccess = true;
            Result.AdditionalNotes = "Dịch vụ lắp đặt: Kỹ thuật viên sẽ liên hệ đặt lịch trong vòng 24h sau khi giao hàng.";
            await Task.CompletedTask;
        }

        protected override async Task CalculateShippingAsync(CreateOrderContext context)
        {
            _logger.LogInformation("[Assembly] Tính phí giao hàng + lắp đặt...");

            // Phí giao hàng cơ bản
            Result.ShippingFee = 50_000;

            // Phí lắp đặt: 100,000đ/món đồ
            int totalItems = context.Items.Sum(i => i.Quantity);
            Result.InstallationFee = totalItems * 100_000;

            _logger.LogInformation($"Phí ship: {Result.ShippingFee:C}, Phí lắp đặt: {Result.InstallationFee:C}");
            await Task.CompletedTask;
        }
    }

    // =========================================================================
    // CONTEXT & RESULT DTOs
    // =========================================================================

    /// <summary>Dữ liệu đầu vào cho quy trình xử lý đơn hàng</summary>
    public class CreateOrderContext
    {
        public int UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string ShippingFullName { get; set; } = string.Empty;
        public string ShippingPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string? CouponCode { get; set; }
        public string? Notes { get; set; }
        public string PaymentMethod { get; set; } = "COD";
        public bool RequireInstallation { get; set; } = false;
        public decimal SubTotal { get; set; }
        public List<OrderItemContext> Items { get; set; } = new();
        /// <summary>Loại đơn hàng: "standard" | "custom" | "assembly"</summary>
        public string OrderType { get; set; } = "standard";
    }

    public class OrderItemContext
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    /// <summary>Kết quả trả về sau khi xử lý đơn hàng</summary>
    public class OrderProcessResult
    {
        public bool IsSuccess { get; set; } = true;
        public string? ErrorMessage { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal ShippingFee { get; set; }
        public decimal InstallationFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal TotalAmount { get; set; }
        public string? AdditionalNotes { get; set; }
    }

    // =========================================================================
    // FACTORY METHOD để tạo OrderProcessor phù hợp với loại đơn
    // =========================================================================
    /// <summary>
    /// Factory tạo ra OrderProcessor đúng loại dựa trên OrderType.
    /// Phối hợp Template Method + Factory Method Pattern.
    /// </summary>
    public static class OrderProcessorFactory
    {
        public static OrderProcessorTemplate Create(string orderType, AppDbContext context, IServiceProvider serviceProvider)
        {
            return orderType.ToLower() switch
            {
                "custom"   => new CustomFurnitureOrderProcessor(context, serviceProvider.GetRequiredService<ILogger<CustomFurnitureOrderProcessor>>()),
                "assembly" => new AssemblyRequiredOrderProcessor(context, serviceProvider.GetRequiredService<ILogger<AssemblyRequiredOrderProcessor>>()),
                _          => new StandardOrderProcessor(context, serviceProvider.GetRequiredService<ILogger<StandardOrderProcessor>>())
            };
        }
    }
}
