using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.Builder;
using FurnitureShop.API.Patterns.Decorator;
using FurnitureShop.API.Patterns.Strategy;
using FurnitureShop.API.Patterns.State;
using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Data;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.Facade
{
    // FACADE PATTERN: Simplified interface for complex checkout process
    public class CheckoutFacade
    {
        private readonly AppDbContext _context;
        private readonly IInventoryService _inventoryService;
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;
        private readonly ShippingCalculator _shippingCalculator;
        private readonly OrderNotifier _orderNotifier;

        public CheckoutFacade(
            AppDbContext context,
            IInventoryService inventoryService,
            IEmailService emailService,
            ISmsService smsService)
        {
            _context = context;
            _inventoryService = inventoryService;
            _emailService = emailService;
            _smsService = smsService;

            // Setup Strategy Pattern - Shipping Calculator
            _shippingCalculator = new ShippingCalculator();

            // Setup Observer Pattern - Order Notifications
            _orderNotifier = new OrderNotifier();
            _orderNotifier.Attach(new EmailNotificationObserver(_emailService));
            _orderNotifier.Attach(new SmsNotificationObserver(_smsService));
            _orderNotifier.Attach(new InventoryObserver(_inventoryService));
            _orderNotifier.Attach(new AnalyticsObserver());
        }

        // FACADE PATTERN: Single method để xử lý toàn bộ checkout process
        public async Task<CheckoutResult> ProcessCheckoutAsync(CreateOrderRequest request)
        {
            var result = new CheckoutResult();

            try
            {
                // 1. Validate User
                var user = await _context.Users.FindAsync(request.UserId);
                if (user == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "User not found";
                    return result;
                }

                // 2. Validate & Load Products
                var products = new List<(Product product, int quantity, List<ProductAttribute> attrs)>();
                foreach (var item in request.Items)
                {
                    var product = await _context.Products
                        .Include(p => p.Attributes)
                        .FirstOrDefaultAsync(p => p.ProductId == item.ProductId);

                    if (product == null)
                    {
                        result.Success = false;
                        result.ErrorMessage = $"Product {item.ProductId} not found";
                        return result;
                    }

                    // Check stock
                    if (product.StockQuantity < item.Quantity)
                    {
                        result.Success = false;
                        result.ErrorMessage = $"Insufficient stock for {product.Name}";
                        return result;
                    }

                    // Load selected attributes
                    var selectedAttrs = product.Attributes
                        .Where(a => item.SelectedAttributeIds.Contains(a.AttributeId))
                        .ToList();

                    products.Add((product, item.Quantity, selectedAttrs));
                }

                // 3. Calculate Shipping Fee using STRATEGY PATTERN
                var shippingContext = await BuildShippingContextAsync(products, request.ShippingInfo);
                await LoadShippingStrategiesAsync();
                
                var (shippingFee, selectedStrategy) = _shippingCalculator.CalculateBestShippingFee(shippingContext);
                
                if (selectedStrategy == null)
                {
                    result.Success = false;
                    result.ErrorMessage = "No shipping method available for your location";
                    return result;
                }

                // 4. Build Order using BUILDER PATTERN
                // Tính thuế từng item qua Decorator để truyền vào WithTax()
                decimal totalTax = 0;
                foreach (var (product, quantity, attrs) in products)
                {
                    var taxBuilder = new DecoratedProductBuilder(product)
                        .WithAttributes(attrs.Any() ? attrs : new List<ProductAttribute>())
                        .WithTax(10);
                    var taxBreakdown = taxBuilder.GetPriceBreakdown();
                    totalTax += taxBreakdown.TaxAmount * quantity;
                }

                var orderBuilder = new OrderBuilder()
                    .ForUser(user.UserId, user)
                    .WithShippingInfo(
                        request.ShippingInfo.FullName,
                        request.ShippingInfo.Phone,
                        request.ShippingInfo.Address,
                        request.ShippingInfo.City,
                        request.ShippingInfo.District,
                        request.ShippingInfo.Ward)
                    .WithShippingMethod(request.ShippingMethodId ?? 1, shippingFee)
                    .WithTax(totalTax)
                    .WithPaymentMethod(request.PaymentMethod)
                    .WithNotes(request.Notes);

                // Add products with DECORATOR PATTERN for pricing
                foreach (var (product, quantity, attrs) in products)
                {
                    orderBuilder.AddProduct(product, quantity, attrs.Any() ? attrs : null);
                }

                var order = orderBuilder.Build();

                // 5. Save Order to Database
                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // 6. Notify Observers (OBSERVER PATTERN)
                await _orderNotifier.NotifyAsync(order, OrderStatus.Pending, OrderStatus.Pending);

                // 7. Return Success Result
                result.Success = true;
                result.Order = order;
                result.OrderId = order.OrderId;
                result.OrderNumber = order.OrderNumber;
                result.TotalAmount = order.TotalAmount;

                Console.WriteLine($"\n✅ Checkout completed successfully!");
                Console.WriteLine($"   Order: {order.OrderNumber}");
                Console.WriteLine($"   Total: {order.TotalAmount:N0}đ");

                return result;
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.ErrorMessage = $"Checkout failed: {ex.Message}";
                Console.WriteLine($"\n❌ Checkout failed: {ex.Message}");
                return result;
            }
        }

        // FACADE PATTERN: Tính chi tiết giá sản phẩm (giá gốc → decorators → giảm giá → thuế → phí ship)
        public async Task<OrderPriceBreakdown> CalculatePriceBreakdownAsync(PriceCalculationRequest request)
        {
            var result = new OrderPriceBreakdown();

            // 1. Load products & build per-item breakdown
            var productsForShipping = new List<(Product product, int qty, List<ProductAttribute> attrs)>();

            foreach (var item in request.Items)
            {
                var product = await _context.Products
                    .Include(p => p.Attributes)
                    .FirstOrDefaultAsync(p => p.ProductId == item.ProductId);

                if (product == null) continue;

                var selectedAttrs = product.Attributes
                    .Where(a => item.SelectedAttributeIds.Contains(a.AttributeId))
                    .ToList();

                var builder = new DecoratedProductBuilder(product)
                    .WithAttributes(selectedAttrs);

                if (request.DiscountPercent > 0)
                    builder.WithDiscount(request.DiscountPercent, request.DiscountLabel ?? "Khuyến mãi");

                if (request.ApplyTax)
                    builder.WithTax(request.TaxPercent);

                var breakdown = builder.GetPriceBreakdown();

                result.Items.Add(new ItemPriceBreakdown
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    Quantity = item.Quantity,
                    OriginalPrice = breakdown.OriginalPrice,
                    ProductDiscountAmount = breakdown.ProductDiscountAmount,
                    PriceAfterProductDiscount = breakdown.PriceAfterProductDiscount,
                    AttributesAdjustment = breakdown.AttributesAdjustment,
                    PriceAfterAttributes = breakdown.PriceAfterAttributes,
                    AdditionalDiscountPercent = breakdown.AdditionalDiscountPercent,
                    AdditionalDiscountAmount = breakdown.AdditionalDiscountAmount,
                    AdditionalDiscountLabel = breakdown.AdditionalDiscountLabel,
                    PriceAfterDiscount = breakdown.PriceAfterDiscount,
                    TaxPercent = breakdown.TaxPercent,
                    TaxAmount = breakdown.TaxAmount,
                    FinalUnitPrice = breakdown.FinalUnitPrice,
                    LineTotal = breakdown.FinalUnitPrice * item.Quantity
                });

                productsForShipping.Add((product, item.Quantity, selectedAttrs));
            }

            // 2. Tính phí vận chuyển
            if (request.ShippingInfo != null)
            {
                var shippingContext = await BuildShippingContextAsync(productsForShipping, request.ShippingInfo);
                await LoadShippingStrategiesAsync();
                var (shippingFee, _) = _shippingCalculator.CalculateBestShippingFee(shippingContext);
                result.ShippingFee = shippingFee;
            }

            // 3. Tổng hợp
            result.SubTotal = result.Items.Sum(i => i.FinalUnitPrice * i.Quantity);
            result.TotalDiscount = result.Items.Sum(i => (i.ProductDiscountAmount + i.AdditionalDiscountAmount) * i.Quantity);
            result.TotalTax = result.Items.Sum(i => i.TaxAmount * i.Quantity);
            result.TotalAmount = result.SubTotal + result.ShippingFee;

            Console.WriteLine($"\n💰 Price Breakdown Summary:");
            Console.WriteLine($"   SubTotal:  {result.SubTotal:N0}đ");
            Console.WriteLine($"   Discount:  -{result.TotalDiscount:N0}đ");
            Console.WriteLine($"   Tax:       +{result.TotalTax:N0}đ");
            Console.WriteLine($"   Shipping:  +{result.ShippingFee:N0}đ");
            Console.WriteLine($"   Total:     {result.TotalAmount:N0}đ");

            return result;
        }

        // FACADE PATTERN: Calculate shipping fee preview
        public async Task<List<ShippingOptionDto>> GetShippingOptionsAsync(
            List<int> productIds,
            ShippingInfoDto shippingInfo)
        {
            // Load products
            var products = await _context.Products
                .Where(p => productIds.Contains(p.ProductId))
                .ToListAsync();

            var productsWithQty = products.Select(p => (p, 1, new List<ProductAttribute>())).ToList();

            // Build context
            var context = await BuildShippingContextAsync(productsWithQty, shippingInfo);

            // Load strategies
            await LoadShippingStrategiesAsync();

            // Get all options
            var options = _shippingCalculator.GetAllAvailableOptions(context);

            return options.Select(opt => new ShippingOptionDto
            {
                Name = opt.strategy.GetStrategyName(),
                Fee = opt.fee,
                EstimatedDays = opt.strategy.GetEstimatedDeliveryDays()
            }).ToList();
        }

        private async Task<ShippingContext> BuildShippingContextAsync(
            List<(Product product, int qty, List<ProductAttribute> attrs)> products,
            ShippingInfoDto shippingInfo)
        {
            var context = new ShippingContext
            {
                DestinationCity = shippingInfo.City ?? "",
                DestinationDistrict = shippingInfo.District ?? "",
                ItemCount = products.Count
            };

            foreach (var (product, qty, _) in products)
            {
                context.TotalWeight += (product.Weight ?? 0) * qty;
                context.TotalVolume += product.CalculateVolume() * qty;
            }

            // Giả định khoảng cách dựa trên thành phố
            context.Distance = EstimateDistance(shippingInfo.City ?? "");

            return context;
        }

        private async Task LoadShippingStrategiesAsync()
        {
            // Fix: xóa strategies cũ trước khi thêm mới, tránh accumulate qua nhiều lần gọi
            _shippingCalculator.Clear();

            var methods = await _context.ShippingMethods
                .Where(sm => sm.IsActive)
                .ToListAsync();

            var local = methods.FirstOrDefault(m => m.Code == "LOCAL");
            if (local != null)
            {
                _shippingCalculator.AddStrategy(new LocalShippingStrategy(local));
            }

            var regional = methods.FirstOrDefault(m => m.Code == "REGIONAL");
            if (regional != null)
            {
                _shippingCalculator.AddStrategy(new RegionalShippingStrategy(regional));
            }

            var national = methods.FirstOrDefault(m => m.Code == "NATIONAL");
            if (national != null)
            {
                _shippingCalculator.AddStrategy(new NationalShippingStrategy(national));
            }
        }

        private decimal EstimateDistance(string city)
        {
            // Simplified distance estimation from HCM
            return city.ToLower() switch
            {
                var c when c.Contains("hcm") || c.Contains("ho chi minh") => 10,
                var c when c.Contains("binh duong") || c.Contains("binh dương") => 40,
                var c when c.Contains("dong nai") || c.Contains("đồng nai") => 50,
                var c when c.Contains("long an") || c.Contains("long an") => 55,
                var c when c.Contains("ba ria") || c.Contains("ba rịa") => 80,
                var c when c.Contains("vung tau") || c.Contains("vũng tàu") => 120,
                var c when c.Contains("tien giang") || c.Contains("tiền giang") => 90,
                var c when c.Contains("ben tre") || c.Contains("bến tre") => 130,
                var c when c.Contains("can tho") || c.Contains("cần thơ") => 180,
                var c when c.Contains("an giang") || c.Contains("an giáng") => 250,
                _ => 500 // Vùng xa khác
            };
        }
    }

    // Result DTOs
    public class CheckoutResult
    {
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public Order? Order { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
    }

    public class ShippingOptionDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal Fee { get; set; }
        public int EstimatedDays { get; set; }
    }

    // Request tính giá chi tiết
    public class PriceCalculationRequest
    {
        public List<OrderItemDto> Items { get; set; } = new();
        public decimal DiscountPercent { get; set; } = 0;        // % giảm giá thêm (coupon…)
        public string? DiscountLabel { get; set; }
        public bool ApplyTax { get; set; } = false;
        public decimal TaxPercent { get; set; } = 10;            // VAT mặc định 10%
        public ShippingInfoDto? ShippingInfo { get; set; }       // Null = bỏ qua phí ship
    }

    // Chi tiết giá một dòng sản phẩm trong đơn
    public class ItemPriceBreakdown
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal OriginalPrice { get; set; }              // Giá gốc
        public decimal ProductDiscountAmount { get; set; }      // Giảm giá sẵn trên SP
        public decimal PriceAfterProductDiscount { get; set; }  // = DiscountPrice / BasePrice
        public decimal AttributesAdjustment { get; set; }       // Phụ phí attributes (màu, chất liệu…)
        public decimal PriceAfterAttributes { get; set; }       // Sau cộng attributes
        public decimal AdditionalDiscountPercent { get; set; }  // % giảm thêm
        public decimal AdditionalDiscountAmount { get; set; }   // Tiền giảm thêm
        public string AdditionalDiscountLabel { get; set; } = "";
        public decimal PriceAfterDiscount { get; set; }         // Sau tất cả giảm giá
        public decimal TaxPercent { get; set; }                 // % thuế
        public decimal TaxAmount { get; set; }                  // Tiền thuế
        public decimal FinalUnitPrice { get; set; }             // Đơn giá cuối
        public decimal LineTotal { get; set; }                  // FinalUnitPrice × Quantity
    }

    // Tổng hợp giá cả đơn hàng
    public class OrderPriceBreakdown
    {
        public List<ItemPriceBreakdown> Items { get; set; } = new();
        public decimal SubTotal { get; set; }       // Tổng tiền hàng (sau mọi giảm giá + thuế)
        public decimal TotalDiscount { get; set; }  // Tổng tiền đã giảm
        public decimal TotalTax { get; set; }        // Tổng thuế
        public decimal ShippingFee { get; set; }     // Phí vận chuyển
        public decimal TotalAmount { get; set; }     // Tổng thanh toán
    }
}