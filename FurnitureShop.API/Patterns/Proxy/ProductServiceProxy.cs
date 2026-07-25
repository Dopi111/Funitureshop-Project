using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.Repository.Contracts;
using Microsoft.Extensions.Caching.Memory;

namespace FurnitureShop.API.Patterns.Proxy
{
    /// <summary>
    /// PROXY PATTERN - Ủy nhiệm truy cập sản phẩm với Cache Layer
    ///
    /// Vấn đề: Mỗi lần Client gọi GET /api/products/{id}, hệ thống phải
    ///   truy vấn Database (kết nối mạng + I/O đĩa → chậm).
    ///   Trang chủ hiển thị 8 sản phẩm nổi bật → 8 lần query DB mỗi lần refresh.
    ///
    /// Giải pháp: ProductServiceProxy đứng "chắn" trước ProductService thật:
    ///   ┌────────────┐    ┌───────────────────────┐    ┌───────────────┐
    ///   │   Client   │ →  │ ProductServiceProxy   │ →  │ ProductService│
    ///   │(Controller)│    │ [Cache Layer]         │    │ [Real DB]     │
    ///   └────────────┘    └───────────────────────┘    └───────────────┘
    ///
    ///   - Cache HIT:  Proxy trả về ngay từ bộ nhớ (~0ms), không vào DB
    ///   - Cache MISS: Proxy gọi ProductService thật → lưu kết quả → trả về
    ///   - IncrementViewCount: Xóa cache cũ để đảm bảo dữ liệu mới nhất
    ///
    /// Lợi ích:
    ///   - Giảm tải DB đáng kể (ít nhất 10x cho sản phẩm phổ biến)
    ///   - Controller không cần biết cache tồn tại (Transparent Proxy)
    ///   - Dễ tắt/bật cache mà không sửa business logic
    /// </summary>

    // =========================================================================
    // INTERFACE: Hợp đồng chung cho cả Real Service và Proxy
    // =========================================================================
    public interface IProductService
    {
        Task<Product?> GetProductByIdAsync(int id);
        Task<List<Product>> GetFeaturedProductsAsync(int count = 8);
        Task IncrementViewCountAsync(int productId);
        Task<List<Product>> GetByCategoryAsync(int categoryId);
    }

    // =========================================================================
    // REAL SUBJECT: Service thật — truy vấn trực tiếp vào Database
    // =========================================================================
    /// <summary>
    /// ProductService: Service thật, truy vấn DB qua Repository Pattern.
    /// Không biết cache tồn tại. Chỉ tập trung vào business logic.
    /// </summary>
    public class ProductService : IProductService
    {
        private readonly IProductRepository _productRepository;
        private readonly ILogger<ProductService> _logger;

        public ProductService(IProductRepository productRepository, ILogger<ProductService> logger)
        {
            _productRepository = productRepository;
            _logger = logger;
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            _logger.LogInformation($"[ProductService] Truy vấn DB: Lấy sản phẩm ID={id}");
            return await _productRepository.GetByIdAsync(id);
        }

        public async Task<List<Product>> GetFeaturedProductsAsync(int count = 8)
        {
            _logger.LogInformation($"[ProductService] Truy vấn DB: Lấy {count} sản phẩm nổi bật");
            var products = await _productRepository.GetFeaturedProductsAsync(count);
            return products.ToList();
        }

        public async Task IncrementViewCountAsync(int productId)
        {
            _logger.LogInformation($"[ProductService] Tăng lượt xem cho sản phẩm ID={productId}");
            var product = await _productRepository.GetByIdAsync(productId);
            if (product != null)
            {
                product.ViewCount++;
                product.UpdatedAt = DateTime.UtcNow;
                await _productRepository.UpdateAsync(product);
            }
        }

        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            _logger.LogInformation($"[ProductService] Truy vấn DB: Lấy sản phẩm theo danh mục ID={categoryId}");
            var products = await _productRepository.GetByCategoryAsync(categoryId);
            return products.ToList();
        }
    }

    // =========================================================================
    // PROXY SUBJECT: Lớp Ủy nhiệm — thêm Cache Layer trước Real Service
    // =========================================================================
    /// <summary>
    /// ProductServiceProxy: Proxy trong suốt (Transparent Proxy).
    /// Implement cùng interface IProductService → Controller không biết đây là Proxy.
    /// Thêm 2 chức năng không liên quan đến business logic:
    ///   1. Caching (IMemoryCache): Giảm truy vấn DB
    ///   2. Logging thời gian phản hồi: Phát hiện bottleneck
    /// </summary>
    public class ProductServiceProxy : IProductService
    {
        // Service thật bên dưới (Real Subject)
        private readonly IProductService _realService;

        // Cache bộ nhớ nội bộ
        private readonly IMemoryCache _cache;
        private readonly ILogger<ProductServiceProxy> _logger;

        // Thời gian sống của cache
        private static readonly TimeSpan ProductCacheTTL = TimeSpan.FromMinutes(10);  // Cache chi tiết sản phẩm: 10 phút
        private static readonly TimeSpan FeaturedCacheTTL = TimeSpan.FromMinutes(5);  // Cache sản phẩm nổi bật: 5 phút
        private static readonly TimeSpan CategoryCacheTTL = TimeSpan.FromMinutes(15); // Cache theo danh mục: 15 phút

        // Prefix key cache để tránh trùng key
        private const string ProductCachePrefix = "product:";
        private const string FeaturedCacheKey = "products:featured";
        private const string CategoryCachePrefix = "products:category:";

        public ProductServiceProxy(
            IProductService realService,
            IMemoryCache cache,
            ILogger<ProductServiceProxy> logger)
        {
            _realService = realService;
            _cache = cache;
            _logger = logger;
        }

        /// <summary>
        /// Lấy sản phẩm theo ID với Cache-First strategy.
        /// Cache HIT (~0ms) → Trả về ngay.
        /// Cache MISS → Gọi DB, lưu cache, trả kết quả.
        /// </summary>
        public async Task<Product?> GetProductByIdAsync(int id)
        {
            var cacheKey = $"{ProductCachePrefix}{id}";

            // [CACHE HIT] Kiểm tra cache trước
            if (_cache.TryGetValue(cacheKey, out Product? cachedProduct))
            {
                _logger.LogInformation($"[Proxy] Cache HIT: Sản phẩm ID={id} — Không cần truy vấn DB");
                return cachedProduct;
            }

            // [CACHE MISS] Gọi service thật vào DB
            _logger.LogInformation($"[Proxy] Cache MISS: Sản phẩm ID={id} — Đang truy vấn DB...");
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            var product = await _realService.GetProductByIdAsync(id);

            stopwatch.Stop();
            _logger.LogInformation($"[Proxy] DB Query hoàn tất trong {stopwatch.ElapsedMilliseconds}ms");

            // Lưu vào cache nếu tìm thấy sản phẩm hợp lệ
            if (product != null && product.IsActive)
            {
                _cache.Set(cacheKey, product, new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ProductCacheTTL,
                    // Khi cache bị loại bỏ, ghi log để theo dõi
                    PostEvictionCallbacks = {
                        new PostEvictionCallbackRegistration
                        {
                            EvictionCallback = (key, value, reason, state) =>
                                _logger.LogDebug($"[Proxy] Cache đã hết hạn: {key}, Lý do: {reason}")
                        }
                    }
                });
                _logger.LogInformation($"[Proxy] Đã lưu sản phẩm ID={id} vào Cache (TTL: {ProductCacheTTL.TotalMinutes} phút)");
            }

            return product;
        }

        /// <summary>
        /// Lấy danh sách sản phẩm nổi bật với Cache-First strategy.
        /// Toàn bộ list được cache dưới 1 key duy nhất.
        /// </summary>
        public async Task<List<Product>> GetFeaturedProductsAsync(int count = 8)
        {
            var cacheKey = $"{FeaturedCacheKey}:{count}";

            // [CACHE HIT]
            if (_cache.TryGetValue(cacheKey, out List<Product>? cachedList))
            {
                _logger.LogInformation($"[Proxy] Cache HIT: {cachedList!.Count} sản phẩm nổi bật từ Cache");
                return cachedList!;
            }

            // [CACHE MISS] Gọi DB
            _logger.LogInformation($"[Proxy] Cache MISS: Đang lấy {count} sản phẩm nổi bật từ DB...");
            var products = await _realService.GetFeaturedProductsAsync(count);

            // Lưu vào cache nếu có dữ liệu
            if (products.Any())
            {
                _cache.Set(cacheKey, products, FeaturedCacheTTL);
                _logger.LogInformation($"[Proxy] Đã lưu {products.Count} sản phẩm nổi bật vào Cache (TTL: {FeaturedCacheTTL.TotalMinutes} phút)");
            }

            return products;
        }

        /// <summary>
        /// Tăng lượt xem sản phẩm — Pass-through (không cache) và xóa cache cũ.
        /// Cần xóa cache để lần sau lấy ViewCount mới nhất từ DB.
        /// </summary>
        public async Task IncrementViewCountAsync(int productId)
        {
            // Gọi trực tiếp service thật (ViewCount phải cập nhật DB ngay lập tức)
            await _realService.IncrementViewCountAsync(productId);

            // Xóa cache sản phẩm này để lần sau fetch dữ liệu mới nhất từ DB
            var cacheKey = $"{ProductCachePrefix}{productId}";
            _cache.Remove(cacheKey);
            _logger.LogInformation($"[Proxy] Đã xóa cache sản phẩm ID={productId} sau khi tăng lượt xem");
        }

        /// <summary>
        /// Lấy sản phẩm theo danh mục với Cache-First strategy.
        /// </summary>
        public async Task<List<Product>> GetByCategoryAsync(int categoryId)
        {
            var cacheKey = $"{CategoryCachePrefix}{categoryId}";

            // [CACHE HIT]
            if (_cache.TryGetValue(cacheKey, out List<Product>? cachedList))
            {
                _logger.LogInformation($"[Proxy] Cache HIT: Danh mục ID={categoryId} — {cachedList!.Count} sản phẩm từ Cache");
                return cachedList!;
            }

            // [CACHE MISS] Gọi DB
            _logger.LogInformation($"[Proxy] Cache MISS: Đang lấy sản phẩm danh mục ID={categoryId} từ DB...");
            var products = await _realService.GetByCategoryAsync(categoryId);

            if (products.Any())
            {
                _cache.Set(cacheKey, products, CategoryCacheTTL);
                _logger.LogInformation($"[Proxy] Đã lưu {products.Count} sản phẩm danh mục ID={categoryId} vào Cache");
            }

            return products;
        }

        /// <summary>
        /// Xóa thủ công toàn bộ cache sản phẩm (dùng khi Admin cập nhật sản phẩm).
        /// </summary>
        public void InvalidateProductCache(int productId)
        {
            _cache.Remove($"{ProductCachePrefix}{productId}");
            _cache.Remove(FeaturedCacheKey);
            _logger.LogInformation($"[Proxy] Đã xóa cache sản phẩm ID={productId} và cache Featured");
        }
    }
}
