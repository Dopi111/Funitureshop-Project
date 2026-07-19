using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        var admin = await context.Users.FirstAsync(u => u.Role == UserRole.Admin || u.Role == UserRole.SuperAdmin);
        if (!await context.Users.AnyAsync(u => u.Role == UserRole.Customer))
        {
            var password = BCrypt.Net.BCrypt.HashPassword("Customer@123");
            context.Users.AddRange(
                NewCustomer("minhanh", "minhanh@example.com", "Nguyễn Minh Anh", "0909123456", password, 80),
                NewCustomer("giahuy", "giahuy@example.com", "Trần Gia Huy", "0918234567", password, 55),
                NewCustomer("hoanglan", "hoanglan@example.com", "Lê Hoàng Lan", "0933345678", password, 30),
                NewCustomer("quocbao", "quocbao@example.com", "Phạm Quốc Bảo", "0987456789", password, 12)
            );
            await context.SaveChangesAsync();
        }

        if (!await context.Suppliers.AnyAsync())
        {
            context.Suppliers.AddRange(
                new Supplier { Name = "Nội thất Minh Long", Phone = "028 7300 1001", Email = "sales@minhlong.vn", Address = "Bình Dương", Notes = "Gỗ tự nhiên và sofa" },
                new Supplier { Name = "Gỗ Việt Premium", Phone = "028 7300 1002", Email = "contact@goviet.vn", Address = "Đồng Nai", Notes = "Bàn ghế gỗ cao cấp" },
                new Supplier { Name = "Modern Living", Phone = "028 7300 1003", Email = "hello@modernliving.vn", Address = "TP. Hồ Chí Minh", Notes = "Nội thất hiện đại" }
            );
            await context.SaveChangesAsync();
        }

        var products = await context.Products.OrderBy(p => p.ProductId).Take(5).ToListAsync();
        var customers = await context.Users.Where(u => u.Role == UserRole.Customer).OrderBy(u => u.UserId).ToListAsync();
        var shippingMethods = await context.ShippingMethods.OrderBy(s => s.DisplayOrder).ToListAsync();
        if (!await context.Orders.AnyAsync() && products.Count > 0 && customers.Count > 0)
        {
            var statuses = new[]
            {
                OrderStatus.Completed, OrderStatus.Completed, OrderStatus.Completed, OrderStatus.Completed,
                OrderStatus.Shipped, OrderStatus.Processing, OrderStatus.Pending, OrderStatus.Completed,
                OrderStatus.Cancelled, OrderStatus.Completed, OrderStatus.ReturnRequested, OrderStatus.Pending
            };

            for (var i = 0; i < statuses.Length; i++)
            {
                var customer = customers[i % customers.Count];
                var product = products[i % products.Count];
                var quantity = i % 3 + 1;
                var createdAt = DateTime.UtcNow.AddDays(-(i * 5 + 1));
                var shipping = shippingMethods.Count > 0 ? shippingMethods[i % shippingMethods.Count] : null;
                var subTotal = product.BasePrice * quantity;
                var status = statuses[i];
                var order = new Order
                {
                    OrderNumber = $"ORD{DateTime.UtcNow:yyyyMMdd}{i + 1:000}",
                    UserId = customer.UserId,
                    Status = status,
                    ShippingFullName = customer.FullName,
                    ShippingPhone = customer.PhoneNumber ?? "0900000000",
                    ShippingAddress = $"{12 + i} Nguyễn Văn Linh",
                    ShippingWard = "Phường Tân Phong",
                    ShippingDistrict = "Quận 7",
                    ShippingCity = "TP. Hồ Chí Minh",
                    ShippingMethodId = shipping?.ShippingMethodId,
                    ShippingFee = shipping?.BaseFee ?? 100000,
                    SubTotal = subTotal,
                    TotalAmount = subTotal + (shipping?.BaseFee ?? 100000),
                    PaymentMethod = i % 2 == 0 ? "COD" : "VNPay",
                    IsPaid = status is OrderStatus.Completed or OrderStatus.Shipped,
                    PaidAt = status is OrderStatus.Completed or OrderStatus.Shipped ? createdAt.AddHours(1) : null,
                    ProcessedAt = status >= OrderStatus.Processing && status != OrderStatus.Cancelled ? createdAt.AddHours(4) : null,
                    ShippedAt = status is OrderStatus.Shipped or OrderStatus.Completed ? createdAt.AddDays(1) : null,
                    CompletedAt = status == OrderStatus.Completed ? createdAt.AddDays(3) : null,
                    CancelledAt = status == OrderStatus.Cancelled ? createdAt.AddHours(8) : null,
                    CreatedAt = createdAt,
                    Notes = i % 3 == 0 ? "Gọi trước khi giao" : null
                };
                order.OrderDetails.Add(new OrderDetail
                {
                    ProductId = product.ProductId,
                    ProductName = product.Name,
                    ProductSKU = product.SKU,
                    UnitPrice = product.DiscountPrice ?? product.BasePrice,
                    Quantity = quantity,
                    TotalPrice = (product.DiscountPrice ?? product.BasePrice) * quantity,
                    CreatedAt = createdAt
                });
                context.Orders.Add(order);
            }
            await context.SaveChangesAsync();
        }

        if (!await context.PurchaseOrders.AnyAsync() && products.Count > 0)
        {
            var suppliers = await context.Suppliers.Take(2).ToListAsync();
            foreach (var supplier in suppliers)
            {
                var product = products[supplier.SupplierId % products.Count];
                var po = new PurchaseOrder
                {
                    POCode = $"PO{DateTime.UtcNow:yyyyMMdd}{supplier.SupplierId:000}",
                    SupplierId = supplier.SupplierId,
                    Status = supplier.SupplierId % 2 == 0 ? "Pending" : "Completed",
                    Notes = "Phiếu nhập dữ liệu demo",
                    CreatedById = admin.UserId,
                    TotalAmount = product.BasePrice * 0.55m * 10,
                    CreatedAt = DateTime.UtcNow.AddDays(-supplier.SupplierId * 4)
                };
                po.Details.Add(new PurchaseOrderDetail
                {
                    ProductId = product.ProductId,
                    Quantity = 10,
                    UnitPrice = product.BasePrice * 0.55m,
                    TotalPrice = product.BasePrice * 0.55m * 10
                });
                context.PurchaseOrders.Add(po);
            }
        }

        if (!await context.Coupons.AnyAsync())
        {
            context.Coupons.AddRange(
                new Coupon { Code = "LUANAN20", Description = "Giảm 20% cho dữ liệu demo luận án", DiscountPercentage = 20, MaxDiscountAmount = 2000000, MinOrderAmount = 5000000, StartDate = DateTime.UtcNow.AddDays(-10), EndDate = DateTime.UtcNow.AddDays(60), UsageLimit = 100, UsedCount = 17 },
                new Coupon { Code = "FREESHIP", Description = "Ưu đãi phí vận chuyển", DiscountPercentage = 10, MaxDiscountAmount = 500000, MinOrderAmount = 2000000, StartDate = DateTime.UtcNow.AddDays(-5), EndDate = DateTime.UtcNow.AddDays(30), UsageLimit = 50, UsedCount = 8 }
            );
        }

        if (!await context.ProductViews.AnyAsync() && products.Count > 0)
        {
            var random = new Random(2026);
            for (var i = 0; i < 160; i++)
            {
                context.ProductViews.Add(new ProductView
                {
                    ProductId = products[random.Next(products.Count)].ProductId,
                    UserId = i % 4 == 0 && customers.Count > 0 ? customers[i % customers.Count].UserId.ToString() : null,
                    IpAddress = $"192.168.1.{20 + i % 80}",
                    ViewedAt = DateTime.UtcNow.AddHours(-random.Next(1, 24 * 30)),
                    DurationSeconds = random.Next(25, 420)
                });
            }
        }

        if (!await context.AuditLogs.AnyAsync())
        {
            context.AuditLogs.AddRange(
                new AuditLog { UserId = admin.UserId, Username = admin.Username, Action = "LOGIN", EntityName = "User", EntityId = admin.UserId, Details = "Admin signed in", CreatedAt = DateTime.UtcNow.AddMinutes(-20) },
                new AuditLog { UserId = admin.UserId, Username = admin.Username, Action = "UPDATE_ORDER", EntityName = "Order", EntityId = 1, Details = "Confirmed demo order", CreatedAt = DateTime.UtcNow.AddHours(-3) },
                new AuditLog { UserId = admin.UserId, Username = admin.Username, Action = "CREATE_PRODUCT", EntityName = "Product", EntityId = products.FirstOrDefault()?.ProductId, Details = "Created demo product", CreatedAt = DateTime.UtcNow.AddDays(-1) }
            );
        }

        await context.SaveChangesAsync();
    }

    private static User NewCustomer(string username, string email, string fullName, string phone, string passwordHash, int daysAgo) => new()
    {
        Username = username,
        Email = email,
        FullName = fullName,
        PhoneNumber = phone,
        PasswordHash = passwordHash,
        Role = UserRole.Customer,
        IsActive = true,
        Address = "TP. Hồ Chí Minh",
        CreatedAt = DateTime.UtcNow.AddDays(-daysAgo)
    };
}
