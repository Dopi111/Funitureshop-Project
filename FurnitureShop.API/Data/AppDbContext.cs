using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Data
{
    // SINGLETON PATTERN: DbContext được inject as Scoped service
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // DbSets
        public DbSet<Category> Categories { get; set; }
        public DbSet<Collection> Collections { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductAttribute> ProductAttributes { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<ShippingMethod> ShippingMethods { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderDetail> OrderDetails { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        public DbSet<ShoppingCart> ShoppingCarts { get; set; }
        public DbSet<CartItem> CartItems { get; set; }

        // Phase 2: Inventory & Variants
        public DbSet<ProductVariant> ProductVariants { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderDetail> PurchaseOrderDetails { get; set; }

        // ===== PRODUCT VIEW LOG =====
        public DbSet<ProductView> ProductViews { get; set; }

        // Phase 2: Marketing
        public DbSet<Coupon> Coupons { get; set; }

        // Phase 3: RBAC
        public DbSet<AuditLog> AuditLogs { get; set; }

        // Phase 5: System Settings
        public DbSet<SystemSetting> SystemSettings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // COMPOSITE PATTERN: Category self-referencing
            modelBuilder.Entity<Category>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict); // Không xóa cascade

            // Product relationships
            modelBuilder.Entity<Product>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Product>()
                .HasOne(p => p.Collection)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CollectionId)
                .OnDelete(DeleteBehavior.SetNull);

            // ProductAttribute
            modelBuilder.Entity<ProductAttribute>()
                .HasOne(pa => pa.Product)
                .WithMany(p => p.Attributes)
                .HasForeignKey(pa => pa.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProductImage
            modelBuilder.Entity<ProductImage>()
                .HasOne(pi => pi.Product)
                .WithMany(p => p.Images)
                .HasForeignKey(pi => pi.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // ProductVariant
            modelBuilder.Entity<ProductVariant>()
                .HasOne(pv => pv.Product)
                .WithMany()
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            // PurchaseOrder -> Supplier
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.Supplier)
                .WithMany()
                .HasForeignKey(po => po.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            // PurchaseOrder -> User (CreatedBy)
            modelBuilder.Entity<PurchaseOrder>()
                .HasOne(po => po.CreatedBy)
                .WithMany()
                .HasForeignKey(po => po.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // PurchaseOrderDetail
            modelBuilder.Entity<PurchaseOrderDetail>()
                .HasOne(pod => pod.PurchaseOrder)
                .WithMany(po => po.Details)
                .HasForeignKey(pod => pod.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PurchaseOrderDetail>()
                .HasOne(pod => pod.Product)
                .WithMany()
                .HasForeignKey(pod => pod.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<PurchaseOrderDetail>()
                .HasOne(pod => pod.Variant)
                .WithMany()
                .HasForeignKey(pod => pod.VariantId)
                .OnDelete(DeleteBehavior.Restrict);

            // Order relationships
            modelBuilder.Entity<Order>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Order>()
                .HasOne(o => o.ShippingMethod)
                .WithMany(sm => sm.Orders)
                .HasForeignKey(o => o.ShippingMethodId)
                .OnDelete(DeleteBehavior.SetNull);

            // OrderDetail
            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Order)
                .WithMany(o => o.OrderDetails)
                .HasForeignKey(od => od.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrderDetail>()
                .HasOne(od => od.Product)
                .WithMany(p => p.OrderDetails)
                .HasForeignKey(od => od.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Seeding SystemSettings
            var fixedDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<SystemSetting>().HasData(
                new SystemSetting { Key = "StoreName", Value = "FurnitureShop", Description = "Tên cửa hàng", UpdatedAt = fixedDate },
                new SystemSetting { Key = "Hotline", Value = "1900 1234", Description = "Số điện thoại CSKH", UpdatedAt = fixedDate },
                new SystemSetting { Key = "Address", Value = "123 Quận 1, TP.HCM", Description = "Địa chỉ Showroom", UpdatedAt = fixedDate },
                new SystemSetting { Key = "BannerUrl", Value = "https://example.com/banner.jpg", Description = "Banner Trang chủ", UpdatedAt = fixedDate },
                new SystemSetting { Key = "ReturnPolicyDays", Value = "7", Description = "Số ngày cho phép trả hàng", UpdatedAt = fixedDate }
            );

            // OrderStatusHistory
            modelBuilder.Entity<OrderStatusHistory>()
                .HasOne(osh => osh.Order)
                .WithMany(o => o.StatusHistories)
                .HasForeignKey(osh => osh.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // ShoppingCart - Mỗi user chỉ có 1 giỏ hàng
            modelBuilder.Entity<ShoppingCart>()
                .HasOne(sc => sc.User)
                .WithOne()
                .HasForeignKey<ShoppingCart>(sc => sc.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ShoppingCart>()
                .HasIndex(sc => sc.UserId)
                .IsUnique();

            // CartItem
            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Cart)
                .WithMany(c => c.Items)
                .HasForeignKey(ci => ci.CartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CartItem>()
                .HasOne(ci => ci.Product)
                .WithMany()
                .HasForeignKey(ci => ci.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            modelBuilder.Entity<Category>()
                .HasIndex(c => c.Slug)
                .IsUnique();

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.Slug)
                .IsUnique();

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.SKU);

            // ====== INDEX BỔ SUNG ĐỂ TỐI ƯU FILTER ======
            // Composite index cho query phổ biến nhất: lọc danh mục + active + sắp xếp mới nhất
            modelBuilder.Entity<Product>()
                .HasIndex(p => new { p.CategoryId, p.IsActive, p.CreatedAt })
                .HasDatabaseName("IX_Products_CategoryId_IsActive_CreatedAt");

            // Index cho lọc theo ProductType (bộ lọc loại sản phẩm)
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.ProductType)
                .HasDatabaseName("IX_Products_ProductType");

            // Index cho lọc sản phẩm nổi bật
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.IsFeatured)
                .HasDatabaseName("IX_Products_IsFeatured");

            // Index cho lọc theo giá (price range filter)
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.BasePrice)
                .HasDatabaseName("IX_Products_BasePrice");

            // Index cho lọc theo chất liệu
            modelBuilder.Entity<Product>()
                .HasIndex(p => p.Material)
                .HasDatabaseName("IX_Products_Material");

            // Index cho query đơn hàng theo user (GetUserOrders)
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.UserId)
                .HasDatabaseName("IX_Orders_UserId");

            // Index cho lọc đơn hàng theo trạng thái (Admin dashboard)
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.Status)
                .HasDatabaseName("IX_Orders_Status");

            // Index cho OrderDetail theo Product (báo cáo bán hàng)
            modelBuilder.Entity<OrderDetail>()
                .HasIndex(od => od.ProductId)
                .HasDatabaseName("IX_OrderDetails_ProductId");
            // ====== KẾT THÚC INDEX BỔ SUNG ======

            // ====== PRODUCT VIEW LOG - FLUENT API ======

            // FK: ProductView → Product (Restrict để không xóa cascade log khi xóa sản phẩm)
            modelBuilder.Entity<ProductView>()
                .HasOne(pv => pv.Product)
                .WithMany()
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // INDEX 1: Composite (ProductId, ViewedAt) — QUAN TRỌNG NHẤT
            // Tối ưu cho query thống kê: "Top 10 sản phẩm được xem nhiều nhất trong N ngày qua"
            // SQL tương đương: WHERE ViewedAt >= @cutoff GROUP BY ProductId ORDER BY COUNT(*) DESC
            modelBuilder.Entity<ProductView>()
                .HasIndex(pv => new { pv.ProductId, pv.ViewedAt })
                .HasDatabaseName("IX_ProductViews_ProductId_ViewedAt");

            // INDEX 2: ViewedAt đơn — tối ưu khi query theo khoảng thời gian toàn bảng
            // Ví dụ: DELETE log cũ hơn 90 ngày, hoặc report theo ngày/tháng
            modelBuilder.Entity<ProductView>()
                .HasIndex(pv => pv.ViewedAt)
                .HasDatabaseName("IX_ProductViews_ViewedAt");

            // INDEX 3: UserId — tra cứu lịch sử xem của một user cụ thể (nullable filtered index)
            // Filtered index chỉ đánh index các row có UserId NOT NULL, tiết kiệm không gian
            modelBuilder.Entity<ProductView>()
                .HasIndex(pv => pv.UserId)
                .HasFilter("[UserId] IS NOT NULL")
                .HasDatabaseName("IX_ProductViews_UserId_Filtered");
            // ====== KẾT THÚC PRODUCT VIEW ======

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Username unique index
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.OrderNumber)
                .IsUnique();

            // Seed Data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // =====================================================
            // IMPORTANT: Static BCrypt hash cho seed data
            // Hash này được pre-computed 1 lần để tránh lỗi 
            // PendingModelChangesWarning khi chạy Migration nhiều lần.
            // Password: "Admin@123"
            // Generated using: BCrypt.Net.BCrypt.HashPassword("Admin@123", 11)
            // =====================================================
            // Valid BCrypt hash format: $2a$[cost]$[22 chars salt][31 chars hash]
            const string ADMIN_PASSWORD_HASH = "$2a$11$Ify5IXQpdCwofnU29qjiuOVyWqe0/1GAl8teDWL05lV/jOCmLomuW";

            // Seed Admin User
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    UserId = 1,
                    Username = "admin",
                    Email = "admin@furnitures.com",
                    PasswordHash = ADMIN_PASSWORD_HASH,
                    FullName = "Administrator",
                    Role = UserRole.Admin,
                    IsActive = true,
                    CreatedAt = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc)
                }
            );

            // Seed Categories (COMPOSITE PATTERN)
            // Level 1: Rooms/Spaces (Không gian)
            // Level 2: ProductTypes (Loại sản phẩm)
            var seedDate = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Category>().HasData(
                // === LEVEL 1: ROOMS ===
                new Category { CategoryId = 1, Name = "Phòng Khách", Slug = "phong-khach", DisplayOrder = 1, ImageUrl = "/images/categories/phong-khach.jpg", Description = "Nội thất phòng khách sang trọng", CreatedAt = seedDate },
                new Category { CategoryId = 2, Name = "Phòng Ngủ", Slug = "phong-ngu", DisplayOrder = 2, ImageUrl = "/images/categories/phong-ngu.jpg", Description = "Nội thất phòng ngủ êm ái", CreatedAt = seedDate },
                new Category { CategoryId = 3, Name = "Phòng Ăn", Slug = "phong-an", DisplayOrder = 3, ImageUrl = "/images/categories/phong-an.jpg", Description = "Nội thất phòng ăn tinh tế", CreatedAt = seedDate },
                new Category { CategoryId = 10, Name = "Phòng Làm Việc", Slug = "phong-lam-viec", DisplayOrder = 4, ImageUrl = "/images/categories/phong-lam-viec.jpg", Description = "Nội thất văn phòng tại nhà", CreatedAt = seedDate },

                // === LEVEL 2: PRODUCT TYPES (Phòng Khách) ===
                new Category { CategoryId = 4, Name = "Sofa", Slug = "sofa", ParentId = 1, DisplayOrder = 1, ImageUrl = "/images/categories/sofa.jpg", Description = "Sofa các loại", CreatedAt = seedDate },
                new Category { CategoryId = 5, Name = "Bàn Trà", Slug = "ban-tra", ParentId = 1, DisplayOrder = 2, ImageUrl = "/images/categories/ban-tra.jpg", Description = "Bàn nước, bàn trà", CreatedAt = seedDate },
                new Category { CategoryId = 11, Name = "Ghế Thư Giãn", Slug = "ghe-thu-gian", ParentId = 1, DisplayOrder = 3, ImageUrl = "/images/categories/ghe-thu-gian.jpg", Description = "Ghế đọc sách, ghế nghỉ", CreatedAt = seedDate },
                new Category { CategoryId = 12, Name = "Tủ Tivi", Slug = "tu-tivi", ParentId = 1, DisplayOrder = 4, ImageUrl = "/images/categories/tu-tivi.jpg", Description = "Kệ tivi, tủ tivi", CreatedAt = seedDate },
                new Category { CategoryId = 13, Name = "Kệ Trang Trí", Slug = "ke-trang-tri", ParentId = 1, DisplayOrder = 5, ImageUrl = "/images/categories/ke-trang-tri.jpg", Description = "Kệ sách, kệ trang trí", CreatedAt = seedDate },

                // === LEVEL 2: PRODUCT TYPES (Phòng Ngủ) ===
                new Category { CategoryId = 6, Name = "Giường", Slug = "giuong", ParentId = 2, DisplayOrder = 1, ImageUrl = "/images/categories/giuong.jpg", Description = "Giường ngủ các loại", CreatedAt = seedDate },
                new Category { CategoryId = 7, Name = "Tủ Quần Áo", Slug = "tu-quan-ao", ParentId = 2, DisplayOrder = 2, ImageUrl = "/images/categories/tu-quan-ao.jpg", Description = "Tủ đựng quần áo", CreatedAt = seedDate },
                new Category { CategoryId = 14, Name = "Bàn Trang Điểm", Slug = "ban-trang-diem", ParentId = 2, DisplayOrder = 3, ImageUrl = "/images/categories/ban-trang-diem.jpg", Description = "Bàn phấn, gương", CreatedAt = seedDate },
                new Category { CategoryId = 15, Name = "Tủ Đầu Giường", Slug = "tu-dau-giuong", ParentId = 2, DisplayOrder = 4, ImageUrl = "/images/categories/tu-dau-giuong.jpg", Description = "Tab đầu giường", CreatedAt = seedDate },

                // === LEVEL 2: PRODUCT TYPES (Phòng Ăn) ===
                new Category { CategoryId = 16, Name = "Bàn Ăn", Slug = "ban-an", ParentId = 3, DisplayOrder = 1, ImageUrl = "/images/categories/ban-an.jpg", Description = "Bàn ăn các loại", CreatedAt = seedDate },
                new Category { CategoryId = 17, Name = "Ghế Ăn", Slug = "ghe-an", ParentId = 3, DisplayOrder = 2, ImageUrl = "/images/categories/ghe-an.jpg", Description = "Ghế ăn, ghế bar", CreatedAt = seedDate },
                new Category { CategoryId = 18, Name = "Tủ Rượu", Slug = "tu-ruou", ParentId = 3, DisplayOrder = 3, ImageUrl = "/images/categories/tu-ruou.jpg", Description = "Tủ rượu, tủ bày đồ", CreatedAt = seedDate },

                // === LEVEL 2: PRODUCT TYPES (Phòng Làm Việc) ===
                new Category { CategoryId = 19, Name = "Bàn Làm Việc", Slug = "ban-lam-viec", ParentId = 10, DisplayOrder = 1, ImageUrl = "/images/categories/ban-lam-viec.jpg", Description = "Bàn văn phòng, bàn máy tính", CreatedAt = seedDate },
                new Category { CategoryId = 20, Name = "Ghế Văn Phòng", Slug = "ghe-van-phong", ParentId = 10, DisplayOrder = 2, ImageUrl = "/images/categories/ghe-van-phong.jpg", Description = "Ghế xoay, ghế công thái học", CreatedAt = seedDate },
                new Category { CategoryId = 21, Name = "Tủ Hồ Sơ", Slug = "tu-ho-so", ParentId = 10, DisplayOrder = 3, ImageUrl = "/images/categories/tu-ho-so.jpg", Description = "Tủ đựng tài liệu", CreatedAt = seedDate }
            );

            // Seed Shipping Methods (STRATEGY PATTERN)
            var shippingSeedDate = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<ShippingMethod>().HasData(
                new ShippingMethod
                {
                    ShippingMethodId = 1,
                    Name = "Giao hàng nội thành",
                    Code = "LOCAL",
                    Description = "Giao hàng trong nội thành TP.HCM",
                    BaseFee = 50000,
                    FeePerKg = 5000,
                    FeePerCubicMeter = 100000,
                    ApplicableRegions = "[\"TP.HCM\"]",
                    EstimatedDeliveryDays = 1,
                    CreatedAt = shippingSeedDate
                },
                new ShippingMethod
                {
                    ShippingMethodId = 2,
                    Name = "Giao hàng liên tỉnh miền Nam",
                    Code = "REGIONAL",
                    Description = "Giao hàng các tỉnh miền Nam",
                    BaseFee = 100000,
                    FeePerKg = 8000,
                    FeePerCubicMeter = 150000,
                    EstimatedDeliveryDays = 3,
                    CreatedAt = shippingSeedDate
                },
                new ShippingMethod
                {
                    ShippingMethodId = 3,
                    Name = "Giao hàng toàn quốc",
                    Code = "NATIONAL",
                    Description = "Giao hàng toàn quốc",
                    BaseFee = 150000,
                    FeePerKg = 10000,
                    FeePerCubicMeter = 200000,
                    EstimatedDeliveryDays = 5,
                    CreatedAt = shippingSeedDate
                }
            );
            // Seed Products
            var productSeedDate = new DateTime(2026, 1, 20, 0, 0, 0, DateTimeKind.Utc);
            modelBuilder.Entity<Product>().HasData(
                new Product
                {
                    ProductId = 1,
                    Name = "Sofa Da Cao Cấp Luxury",
                    Slug = "sofa-da-cao-cap-luxury",
                    Description = "Sofa da bò thật nhập khẩu từ Ý, khung gỗ sồi chắc chắn.",
                    SKU = "SOFA-LUX-001",
                    BasePrice = 25000000,
                    StockQuantity = 10,
                    ProductType = "Sofa",
                    CategoryId = 4, // Sofa
                    Width = 220,
                    Height = 85,
                    Depth = 95,
                    Weight = 85,
                    Material = "Da bò Ý",
                    Color = "Nâu đen",
                    Brand = "LuxuryHome",
                    IsFeatured = true,
                    CreatedAt = productSeedDate
                },
                new Product
                {
                    ProductId = 2,
                    Name = "Sofa Nỉ Phong Cách Scandinavian",
                    Slug = "sofa-ni-scandinavian",
                    Description = "Sofa nỉ mềm mại, màu sắc trung tính phù hợp không gian hiện đại.",
                    SKU = "SOFA-SCA-002",
                    BasePrice = 12000000,
                    StockQuantity = 15,
                    ProductType = "Sofa",
                    CategoryId = 4, // Sofa
                    Width = 180,
                    Height = 80,
                    Depth = 85,
                    Weight = 60,
                    Material = "Nỉ cao cấp",
                    Color = "Xám nhạc",
                    Brand = "ModernLife",
                    CreatedAt = productSeedDate
                },
                new Product
                {
                    ProductId = 3,
                    Name = "Bàn Trà Gỗ Óc Chó",
                    Slug = "ban-tra-go-oc-cho",
                    Description = "Bàn trà làm từ gỗ óc chó tự nhiên, vân gỗ đẹp mắt.",
                    SKU = "TABLE-WAL-003",
                    BasePrice = 8500000,
                    StockQuantity = 20,
                    ProductType = "Table",
                    CategoryId = 5, // Bàn nước
                    Width = 120,
                    Height = 45,
                    Depth = 60,
                    Weight = 25,
                    Material = "Gỗ óc chó",
                    Color = "Tự nhiên",
                    Brand = "NatureWood",
                    IsFeatured = true,
                    CreatedAt = productSeedDate
                },
                new Product
                {
                    ProductId = 4,
                    Name = "Giường Ngủ Nệm Bọc Vải",
                    Slug = "giuong-ngu-nem-boc-vai",
                    Description = "Giường ngủ êm ái với đầu giường bọc vải nhung sang trọng.",
                    SKU = "BED-VEL-004",
                    BasePrice = 18000000,
                    StockQuantity = 5,
                    ProductType = "Bed",
                    CategoryId = 6, // Giường
                    Width = 180,
                    Height = 110,
                    Depth = 200,
                    Weight = 120,
                    Material = "Vải nhung, gỗ thông",
                    Color = "Xanh navy",
                    Brand = "SleepWell",
                    CreatedAt = productSeedDate
                },
                new Product
                {
                    ProductId = 5,
                    Name = "Tủ Quần Áo 4 Cánh Hiện Đại",
                    Slug = "tu-quan-ao-4-canh",
                    Description = "Tủ quần áo rộng rãi, thiết kế tối giản tích hợp gương soi.",
                    SKU = "WARD-MOD-005",
                    BasePrice = 15000000,
                    StockQuantity = 8,
                    ProductType = "Wardrobe",
                    CategoryId = 7, // Tủ quần áo
                    Width = 200,
                    Height = 220,
                    Depth = 60,
                    Weight = 180,
                    Material = "Gỗ công nghiệp MDF",
                    Color = "Trắng",
                    Brand = "ModernLife",
                    CreatedAt = productSeedDate
                }
            );

            // Seed Product Images
            modelBuilder.Entity<ProductImage>().HasData(
                new ProductImage { ImageId = 1, ProductId = 1, ImageUrl = "/images/products/sofa-da-cao-cap-luxury.jpg", IsPrimary = true, CreatedAt = productSeedDate },
                new ProductImage { ImageId = 2, ProductId = 2, ImageUrl = "/images/products/sofa-ni-scandinavian.jpg", IsPrimary = true, CreatedAt = productSeedDate },
                new ProductImage { ImageId = 3, ProductId = 3, ImageUrl = "/images/products/ban-tra-go-oc-cho.jpg", IsPrimary = true, CreatedAt = productSeedDate },
                new ProductImage { ImageId = 4, ProductId = 4, ImageUrl = "/images/products/giuong-ngu-nem-boc-vai.jpg", IsPrimary = true, CreatedAt = productSeedDate },
                new ProductImage { ImageId = 5, ProductId = 5, ImageUrl = "/images/products/tu-quan-ao-4-canh.jpg", IsPrimary = true, CreatedAt = productSeedDate }
            );

            // Seed Product Attributes
            modelBuilder.Entity<ProductAttribute>().HasData(
                new ProductAttribute { AttributeId = 1, ProductId = 1, AttributeName = "Bảo hành", AttributeValue = "24 tháng", CreatedAt = productSeedDate },
                new ProductAttribute { AttributeId = 2, ProductId = 1, AttributeName = "Độ cứng", AttributeValue = "Vừa phải", CreatedAt = productSeedDate },
                new ProductAttribute { AttributeId = 3, ProductId = 4, AttributeName = "Kích thước đệm", AttributeValue = "1m8 x 2m", CreatedAt = productSeedDate }
            );
        }
    }
}