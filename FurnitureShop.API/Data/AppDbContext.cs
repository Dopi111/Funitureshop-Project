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