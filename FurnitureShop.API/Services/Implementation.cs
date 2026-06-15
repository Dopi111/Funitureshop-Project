using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.Patterns.State;
using FurnitureShop.API.Patterns.Composite;
using FurnitureShop.API.Data;
using FurnitureShop.API.Patterns.Repository.Contracts;
using FurnitureShop.API.Models;

namespace FurnitureShop.API.Services
{
    // SINGLETON PATTERN: Email Service
    public class EmailService : IEmailService
    {
        private readonly ILogger<EmailService> _logger;

        public EmailService(ILogger<EmailService> logger)
        {
            _logger = logger;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            // Simulate email sending
            await Task.Delay(100);
            
            _logger.LogInformation($"Email sent to {to}: {subject}");
            
            // TODO: Integrate with real email service (SendGrid, AWS SES, etc.)
            // await SendGridClient.SendEmailAsync(...);
        }
    }

    // SINGLETON PATTERN: SMS Service
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;

        public SmsService(ILogger<SmsService> logger)
        {
            _logger = logger;
        }

        public async Task SendSmsAsync(string phoneNumber, string message)
        {
            // Simulate SMS sending
            await Task.Delay(50);
            
            _logger.LogInformation($"SMS sent to {phoneNumber}: {message}");
            
            // TODO: Integrate with SMS service (Twilio, etc.)
        }
    }

    // SINGLETON PATTERN: Inventory Service
    public class InventoryService : IInventoryService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<InventoryService> _logger;

        public InventoryService(AppDbContext context, ILogger<InventoryService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task DecreaseStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null)
            {
                product.StockQuantity -= quantity;
                product.UpdatedAt = DateTime.UtcNow;
                
                if (product.StockQuantity < 0)
                {
                    _logger.LogWarning($"Product {productId} stock went negative: {product.StockQuantity}");
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"Decreased stock for Product {productId}: -{quantity}");
            }
        }

        public async Task IncreaseStockAsync(int productId, int quantity)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product != null)
            {
                product.StockQuantity += quantity;
                product.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation($"Increased stock for Product {productId}: +{quantity}");
            }
        }
    }

    // Product Service với Design Patterns
    public class ProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _logger = logger;
        }

        public async Task<List<Product>> GetFeaturedProductsAsync(int count = 8)
        {
            var featuredProducts = await _productRepository.GetFeaturedProductsAsync(count);
            return featuredProducts.ToList();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _productRepository.GetByIdAsync(id);
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return products.ToList();
        }

        public async Task IncrementViewCountAsync(int productId)
        {
            var product = await _productRepository.GetByIdAsync(productId);
            if (product != null)
            {
                product.ViewCount++;
                product.UpdatedAt = DateTime.UtcNow;
                await _productRepository.UpdateAsync(product);
            }
        }
    }

    // Order Service with State Pattern
    public class OrderService
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly OrderNotifier _orderNotifier;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            IOrderRepository orderRepository,
            IUnitOfWork unitOfWork,
            IEmailService emailService,
            ISmsService smsService,
            IInventoryService inventoryService,
            ILogger<OrderService> logger)
        {
            _orderRepository = orderRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;

            // Setup Observer Pattern
            _orderNotifier = new OrderNotifier();
            _orderNotifier.Attach(new EmailNotificationObserver(emailService));
            _orderNotifier.Attach(new SmsNotificationObserver(smsService));
            _orderNotifier.Attach(new InventoryObserver(inventoryService));
            _orderNotifier.Attach(new AnalyticsObserver());
        }

        public async Task<Order?> GetOrderByIdAsync(int orderId)
        {
            return await _orderRepository.GetByIdAsync(orderId);
        }

        public async Task<List<Order>> GetOrdersByUserAsync(int userId)
        {
            var orders = await _orderRepository.GetByUserAsync(userId);
            return orders.ToList();
        }

        // STATE PATTERN: Chuyển trạng thái đơn hàng
        public async Task<bool> TransitionOrderStateAsync(
            int orderId,
            string? notes = null,
            string? changedBy = null)
        {
            var order = await GetOrderByIdAsync(orderId);
            if (order == null) return false;

            var oldStatus = order.Status;
            
            // Sử dụng State Pattern
            var stateContext = new OrderStateContext(order);
            var success = await stateContext.TransitionToNextStateAsync(notes, changedBy);

            if (success)
            {
                await _unitOfWork.CompleteAsync();
                
                // Notify observers
                await _orderNotifier.NotifyAsync(order, oldStatus, order.Status);
                
                _logger.LogInformation($"Order {order.OrderNumber} transitioned: {oldStatus} → {order.Status}");
            }

            return success;
        }

        public async Task<bool> CancelOrderAsync(int orderId, string? reason = null, string? changedBy = null)
        {
            var order = await GetOrderByIdAsync(orderId);
            if (order == null) return false;

            var oldStatus = order.Status;
            
            var stateContext = new OrderStateContext(order);
            var success = await stateContext.CancelOrderAsync(reason, changedBy);

            if (success)
            {
                await _unitOfWork.CompleteAsync();
                await _orderNotifier.NotifyAsync(order, oldStatus, order.Status);
                _logger.LogInformation($"Order {order.OrderNumber} cancelled");
            }

            return success;
        }
    }

    // Category Service with Composite Pattern
    public class CategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<List<Category>> GetAllCategoriesAsync()
        {
            var categories = await _categoryRepository.FindAsync(c => c.IsActive);
            return categories
                .OrderBy(c => c.DisplayOrder)
                .ToList();
        }

        public async Task<List<Category>> GetRootCategoriesAsync()
        {
            var rootCategories = await _categoryRepository.GetRootCategoriesAsync();
            return rootCategories.ToList();
        }

        // COMPOSITE PATTERN: Build category tree
        public async Task<DTOs.CategoryTreeDto> GetCategoryTreeAsync()
        {
            var allCategories = await GetAllCategoriesAsync();

            var rootNode = CategoryTreeBuilder.BuildTree(allCategories);
            var lookup = allCategories.ToDictionary(c => c.CategoryId, c => c);

            return BuildCategoryTreeDtoFromComponent(rootNode, lookup);
        }

        private DTOs.CategoryTreeDto BuildCategoryTreeDtoFromComponent(
            ICategoryComponent component,
            Dictionary<int, Category> lookup)
        {
            var id = component.GetId();
            lookup.TryGetValue(id, out var category);

            var dto = new DTOs.CategoryTreeDto
            {
                CategoryId = id,
                Name = component.GetName(),
                Slug = category?.Slug,
                ProductCount = component.GetProductCount()
            };

            foreach (var child in component.GetChildren())
            {
                var childDto = BuildCategoryTreeDtoFromComponent(child, lookup);
                dto.Children.Add(childDto);
            }

            return dto;
        }
    }
}