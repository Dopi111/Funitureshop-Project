using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Prototype
{
    /// <summary>
    /// PROTOTYPE PATTERN - Nhân bản sản phẩm nội thất
    ///
    /// Vấn đề: Admin muốn tạo sản phẩm mới từ sản phẩm mẫu có sẵn.
    ///   Ví dụ: "Sofa Da 3 Chỗ" → "Sofa Da 2 Chỗ":
    ///   Giữ lại: Material="Da bò thật", Brand="VIFA", Color="Nâu đen", CategoryId=5
    ///   Chỉ thay: Name, Width, BasePrice
    ///
    ///   Nếu không dùng Prototype, Admin phải nhập lại toàn bộ 20+ trường từ đầu.
    ///
    /// Giải pháp: ProductSnapshot thực hiện Deep Clone (sao chép độc lập)
    ///   từ sản phẩm gốc. ProductPrototypeRegistry lưu các template phổ biến
    ///   để clone nhanh chỉ bằng tên key.
    ///
    /// Lợi ích:
    ///   - Tạo sản phẩm mới cực nhanh từ template có sẵn
    ///   - Clone độc lập: Thay đổi bản sao không ảnh hưởng bản gốc
    ///   - Tránh tái tạo đối tượng tốn kém
    /// </summary>

    // =========================================================================
    // INTERFACE: Giao diện cho mọi đối tượng có thể nhân bản
    // =========================================================================
    public interface IProductPrototype
    {
        /// <summary>Tạo bản sao độc lập (Deep Clone) — thay đổi bản sao không ảnh hưởng gốc</summary>
        ProductSnapshot Clone();
    }

    // =========================================================================
    // CONCRETE PROTOTYPE: Snapshot toàn bộ thuộc tính sản phẩm
    // =========================================================================
    /// <summary>
    /// ProductSnapshot: Bản chụp (snapshot) toàn bộ thông tin sản phẩm.
    /// Không dùng EF Entity trực tiếp để tránh tracking và side effects.
    /// Clone() tạo bản sao hoàn toàn độc lập.
    /// </summary>
    public class ProductSnapshot : IProductPrototype
    {
        // Định danh template trong Registry
        public string TemplateKey { get; set; } = string.Empty;
        public string TemplateDescription { get; set; } = string.Empty;

        // === Thông tin cơ bản ===
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? SKU { get; set; }
        public decimal BasePrice { get; set; }
        public decimal? DiscountPrice { get; set; }
        public int StockQuantity { get; set; }
        public int CategoryId { get; set; }
        public string ProductType { get; set; } = "Furniture";

        // === Kích thước (quan trọng cho nội thất) ===
        public decimal? Width { get; set; }
        public decimal? Height { get; set; }
        public decimal? Depth { get; set; }
        public decimal? Weight { get; set; }

        // === Thông tin vật liệu và thương hiệu ===
        public string? Material { get; set; }
        public string? Color { get; set; }
        public string? Brand { get; set; }

        // === Trạng thái ===
        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;

        // === Danh sách ảnh (Deep Clone — List mới hoàn toàn) ===
        public List<string> ImageUrls { get; set; } = new();

        /// <summary>
        /// DEEP CLONE: Tạo bản sao độc lập hoàn toàn.
        /// MemberWiseClone() chỉ là Shallow Clone (copy tham chiếu List).
        /// Chúng ta cần tạo List mới để thực sự độc lập.
        /// </summary>
        public ProductSnapshot Clone()
        {
            return new ProductSnapshot
            {
                // Key mới cho bản clone (tránh trùng với gốc)
                TemplateKey = string.Empty,
                TemplateDescription = string.Empty,

                // Deep clone toàn bộ thuộc tính giá trị
                Name = this.Name + " (Bản sao)",
                Description = this.Description,
                SKU = null, // SKU phải là duy nhất - để trống để tự sinh
                BasePrice = this.BasePrice,
                DiscountPrice = this.DiscountPrice,
                StockQuantity = 0,   // Bản clone bắt đầu với tồn kho = 0
                CategoryId = this.CategoryId,
                ProductType = this.ProductType,
                Width = this.Width,
                Height = this.Height,
                Depth = this.Depth,
                Weight = this.Weight,
                Material = this.Material,
                Color = this.Color,
                Brand = this.Brand,
                IsFeatured = false,  // Bản clone chưa được featured
                IsActive = false,    // Bản clone mặc định ẩn, admin cần duyệt lại

                // Deep clone List ảnh (tạo List hoàn toàn mới)
                ImageUrls = new List<string>(this.ImageUrls)
            };
        }

        /// <summary>Tạo ProductSnapshot từ Product Entity của EF Core</summary>
        public static ProductSnapshot FromProduct(Product product)
        {
            return new ProductSnapshot
            {
                Name = product.Name,
                Description = product.Description,
                SKU = product.SKU,
                BasePrice = product.BasePrice,
                DiscountPrice = product.DiscountPrice,
                StockQuantity = product.StockQuantity,
                CategoryId = product.CategoryId,
                ProductType = product.ProductType,
                Width = product.Width,
                Height = product.Height,
                Depth = product.Depth,
                Weight = product.Weight,
                Material = product.Material,
                Color = product.Color,
                Brand = product.Brand,
                IsFeatured = product.IsFeatured,
                IsActive = product.IsActive,
                ImageUrls = product.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>()
            };
        }

        /// <summary>Tạo Product Entity mới từ Snapshot để lưu vào DB</summary>
        public Product ToProduct()
        {
            return new Product
            {
                Name = this.Name,
                Description = this.Description,
                SKU = this.SKU,
                BasePrice = this.BasePrice,
                DiscountPrice = this.DiscountPrice,
                StockQuantity = this.StockQuantity,
                CategoryId = this.CategoryId,
                ProductType = this.ProductType,
                Width = this.Width,
                Height = this.Height,
                Depth = this.Depth,
                Weight = this.Weight,
                Material = this.Material,
                Color = this.Color,
                Brand = this.Brand,
                IsFeatured = this.IsFeatured,
                IsActive = this.IsActive,
                CreatedAt = DateTime.UtcNow
            };
        }
    }

    // =========================================================================
    // PROTOTYPE REGISTRY: Kho lưu trữ các template sản phẩm mẫu
    // =========================================================================
    /// <summary>
    /// ProductPrototypeRegistry: Quản lý danh sách template sản phẩm.
    /// Admin đăng ký template 1 lần, sau đó clone() bất cứ lúc nào
    /// chỉ bằng tên key mà không cần khởi tạo lại từ đầu.
    ///
    /// Kết hợp với Singleton Pattern: Registry chỉ có 1 instance
    /// dùng chung cho toàn bộ ứng dụng trong 1 request scope.
    /// </summary>
    public class ProductPrototypeRegistry
    {
        // Kho lưu trữ các template theo key
        private readonly Dictionary<string, ProductSnapshot> _templates = new();

        /// <summary>Đăng ký 1 template sản phẩm mẫu vào Registry</summary>
        public void Register(string key, ProductSnapshot snapshot)
        {
            snapshot.TemplateKey = key;
            _templates[key] = snapshot;
        }

        /// <summary>Nhân bản sản phẩm từ template theo key, trả về bản sao độc lập</summary>
        /// <exception cref="KeyNotFoundException">Nếu không tìm thấy template</exception>
        public ProductSnapshot Clone(string key)
        {
            if (!_templates.TryGetValue(key, out var template))
                throw new KeyNotFoundException($"Không tìm thấy template sản phẩm với key '{key}'. Các template hiện có: {string.Join(", ", _templates.Keys)}");

            return template.Clone();
        }

        /// <summary>Kiểm tra template có tồn tại trong Registry không</summary>
        public bool Contains(string key) => _templates.ContainsKey(key);

        /// <summary>Lấy danh sách tất cả templates đã đăng ký</summary>
        public IReadOnlyDictionary<string, ProductSnapshot> GetAllTemplates()
            => _templates.AsReadOnly();

        /// <summary>Xóa 1 template khỏi Registry</summary>
        public bool Remove(string key) => _templates.Remove(key);

        /// <summary>Số lượng template hiện có trong Registry</summary>
        public int Count => _templates.Count;
    }

    // =========================================================================
    // REQUEST/RESPONSE DTOs cho Clone Endpoint
    // =========================================================================
    public class CloneProductRequest
    {
        /// <summary>Tên mới cho sản phẩm nhân bản (để trống = tự thêm hậu tố "Bản sao")</summary>
        public string? NewName { get; set; }

        /// <summary>Giá bán mới (để trống = giữ nguyên giá gốc)</summary>
        public decimal? NewBasePrice { get; set; }

        /// <summary>Màu sắc mới (để trống = giữ nguyên màu gốc)</summary>
        public string? NewColor { get; set; }
    }

    public class CloneProductResponse
    {
        public bool IsSuccess { get; set; }
        public string? Message { get; set; }
        public int? NewProductId { get; set; }
        public string? NewProductName { get; set; }
        public int ClonedFromProductId { get; set; }
    }
}
