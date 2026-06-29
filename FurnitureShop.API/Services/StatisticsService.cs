using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using System.Threading.Tasks;

namespace FurnitureShop.API.Services
{
    public class StatisticsService
    {
        private readonly AppDbContext _context;
        private readonly IMemoryCache _cache;
        public const string DashboardCacheKey = "DashboardData_Cache";

        public StatisticsService(AppDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        // ================= DASHBOARD =================
        public async Task<DashboardDataDto> GetDashboardDataAsync()
        {
            return await _cache.GetOrCreateAsync(DashboardCacheKey, async entry =>
            {
                // Set cache options
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                
                try
            {
                return new DashboardDataDto
                {
                    Summary = await GetSummaryAsync(),
                    OrderStatusDistribution = await GetOrderStatusDistributionAsync(),
                    RevenueByDate = await GetRevenueByDateAsync(30),
                    TopProducts = await GetTopProductsAsync(10),
                    CategoryPerformance = await GetCategoryPerformanceAsync(),
                    ProductTypes = await GetProductTypeStatisticsAsync(),
                    ShippingMethods = await GetShippingMethodUsageAsync(),
                    UserActivity = await GetUserActivityAsync(),
                    InventoryStatus = await GetInventoryStatusAsync(),
                    OrderCompletion = await GetOrderCompletionStatsAsync(),
                    MonthlySales = await GetMonthlySalesAsync(12)
                };
                }
                catch (Exception ex)
                {
                    throw new Exception("Dashboard error: " + ex.Message, ex);
                }
            });
        }

        // ================= SUMMARY =================
        private async Task<DashboardSummaryDto> GetSummaryAsync()
        {
            var totalOrders = await _context.Orders.CountAsync();

            var totalRevenue = await _context.Orders
                .Where(o => o.Status == OrderStatus.Completed)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var totalCustomers = await _context.Users
                .Where(u => u.Role == UserRole.Customer)
                .CountAsync();

            var totalProducts = await _context.Products
                .Where(p => p.IsActive)
                .CountAsync();

            var pendingOrders = await _context.Orders
                .Where(o => o.Status == OrderStatus.Pending)
                .CountAsync();

            // Calculate COGS (Cost of Goods Sold)
            // 1. Get average purchase price for each product
            var productCosts = await _context.PurchaseOrderDetails
                .GroupBy(pod => pod.ProductId)
                .Select(g => new { ProductId = g.Key, AvgCost = g.Average(pod => pod.UnitPrice) })
                .ToDictionaryAsync(x => x.ProductId, x => x.AvgCost);

            // 2. Get all sold items
            var soldItems = await _context.OrderDetails
                .Where(od => od.Order.Status == OrderStatus.Completed)
                .Select(od => new { od.ProductId, od.Quantity })
                .ToListAsync();

            decimal totalCost = 0;
            foreach(var item in soldItems)
            {
                var cost = productCosts.ContainsKey(item.ProductId) ? productCosts[item.ProductId] : 0;
                totalCost += cost * item.Quantity;
            }

            decimal grossProfit = totalRevenue - totalCost;

            return new DashboardSummaryDto
            {
                TotalOrders = totalOrders,
                TotalRevenue = totalRevenue,
                TotalCost = totalCost,
                GrossProfit = grossProfit,
                TotalCustomers = totalCustomers,
                TotalProducts = totalProducts,
                AverageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0,
                PendingOrders = pendingOrders
            };
        }

        // ================= ORDER STATUS =================
        private async Task<List<OrderStatusDistributionDto>> GetOrderStatusDistributionAsync()
        {
            var totalOrders = await _context.Orders.CountAsync();

            return await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new OrderStatusDistributionDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count(),
                    Percentage = totalOrders > 0 ? (g.Count() * 100.0m) / totalOrders : 0
                })
                .ToListAsync();
        }

        // ================= REVENUE =================
        private async Task<List<RevenueByDateDto>> GetRevenueByDateAsync(int days)
        {
            var startDate = DateTime.Now.AddDays(-days);

            return await _context.Orders
                .Where(o => o.CreatedAt >= startDate && o.Status == OrderStatus.Completed)
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new RevenueByDateDto
                {
                    Date = g.Key,
                    Revenue = g.Sum(x => x.TotalAmount),
                    OrderCount = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToListAsync();
        }

        // ================= TOP PRODUCTS (SAFE) =================
        private async Task<List<TopProductDto>> GetTopProductsAsync(int top)
        {
            return await _context.OrderDetails
                .GroupBy(x => new { x.ProductId, x.ProductName })
                .Select(g => new TopProductDto
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.ProductName ?? "Unknown",
                    QuantitySold = g.Sum(x => x.Quantity),
                    Revenue = g.Sum(x => x.TotalPrice)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(top)
                .ToListAsync();
        }

        // ================= CATEGORY PERFORMANCE (FIXED - NO INCLUDE CRASH) =================
        private async Task<List<CategoryPerformanceDto>> GetCategoryPerformanceAsync()
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .ToListAsync();

            var products = await _context.Products
                .Where(p => p.IsActive)
                .Include(p => p.OrderDetails)
                .ToListAsync();

            var result = categories.Select(c =>
            {
                var categoryProducts = products
                    .Where(p => p.CategoryId == c.CategoryId)
                    .ToList();

                var orderDetails = categoryProducts
                    .SelectMany(p => p.OrderDetails ?? new List<OrderDetail>())
                    .ToList();

                return new CategoryPerformanceDto
                {
                    CategoryId = c.CategoryId,
                    CategoryName = c.Name,
                    ProductCount = categoryProducts.Count,
                    TotalSales = orderDetails.Sum(x => x.TotalPrice),
                    AveragePrice = categoryProducts.Any()
                        ? categoryProducts.Average(p => p.BasePrice)
                        : 0,
                    TotalQuantitySold = orderDetails.Sum(x => x.Quantity)
                };
            })
            .OrderByDescending(x => x.TotalSales)
            .ToList();

            return result;
        }

        // ================= PRODUCT TYPE =================
        private async Task<List<ProductTypeStatisticsDto>> GetProductTypeStatisticsAsync()
        {
            var products = await _context.Products
                .Where(p => p.IsActive)
                .Include(p => p.OrderDetails)
                .ToListAsync();

            return products
                .GroupBy(p => p.ProductType)
                .Select(g => new ProductTypeStatisticsDto
                {
                    ProductType = g.Key,
                    Count = g.Count(),
                    MinPrice = g.Min(x => x.BasePrice),
                    MaxPrice = g.Max(x => x.BasePrice),
                    AveragePrice = g.Average(x => x.BasePrice),
                    TotalSold = g.SelectMany(x => x.OrderDetails ?? new List<OrderDetail>())
                                .Sum(x => x.Quantity)
                })
                .ToList();
        }

        // ================= SHIPPING =================
        private async Task<List<ShippingMethodUsageDto>> GetShippingMethodUsageAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.ShippingMethod)
                .ToListAsync();

            return orders
                .Where(o => o.ShippingMethod != null)
                .GroupBy(o => o.ShippingMethod!.Name)
                .Select(g => new ShippingMethodUsageDto
                {
                    ShippingMethodName = g.Key,
                    UsageCount = g.Count(),
                    TotalShippingFees = g.Sum(x => x.ShippingFee),
                    AverageShippingFee = g.Average(x => x.ShippingFee)
                })
                .ToList();
        }

        // ================= USER ACTIVITY =================
        private async Task<UserActivityDto> GetUserActivityAsync()
        {
            var now = DateTime.Now;

            return new UserActivityDto
            {
                TotalRegisteredUsers = await _context.Users.CountAsync(),
                ActiveUsers = await _context.Users.CountAsync(u => u.IsActive),
                NewUsersThisMonth = await _context.Users.CountAsync(u =>
                    u.CreatedAt.Month == now.Month && u.CreatedAt.Year == now.Year),
                UsersWithOrders = await _context.Users.CountAsync(u => u.Orders.Any())
            };
        }

        // ================= INVENTORY =================
        private async Task<InventoryStatusDto> GetInventoryStatusAsync()
        {
            const int lowStock = 10;

            return new InventoryStatusDto
            {
                LowStockProducts = await _context.Products.CountAsync(p => p.StockQuantity > 0 && p.StockQuantity <= lowStock),
                OutOfStockProducts = await _context.Products.CountAsync(p => p.StockQuantity == 0),
                TotalInventoryValue = await _context.Products.SumAsync(p => p.BasePrice * p.StockQuantity)
            };
        }

        // ================= ORDER COMPLETION =================
        private async Task<OrderCompletionStatsDto> GetOrderCompletionStatsAsync()
        {
            var completed = await _context.Orders
                .Where(o => o.Status == OrderStatus.Completed && o.CompletedAt != null)
                .ToListAsync();

            var now = DateTime.Now;

            return new OrderCompletionStatsDto
            {
                CompletedOrdersThisMonth = completed.Count(o =>
                    o.CompletedAt!.Value.Month == now.Month &&
                    o.CompletedAt!.Value.Year == now.Year),

                CompletionRate = await _context.Orders.AnyAsync()
                    ? (decimal)completed.Count * 100 / await _context.Orders.CountAsync()
                    : 0,

                AverageCompletionTime = completed.Any()
                    ? completed.Average(o => (o.CompletedAt!.Value - o.CreatedAt).TotalDays)
                    : 0
            };
        }

        // ================= MONTHLY SALES =================
        private async Task<List<MonthlySalesDto>> GetMonthlySalesAsync(int months)
        {
            var result = new List<MonthlySalesDto>();

            for (int i = months - 1; i >= 0; i--)
            {
                var date = DateTime.Now.AddMonths(-i);

                var orders = await _context.Orders
                    .Where(o => o.CreatedAt.Month == date.Month &&
                                o.CreatedAt.Year == date.Year &&
                                o.Status == OrderStatus.Completed)
                    .ToListAsync();

                result.Add(new MonthlySalesDto
                {
                    Month = date.Month,
                    Year = date.Year,
                    OrderCount = orders.Count,
                    Revenue = orders.Sum(x => x.TotalAmount)
                });
            }

            return result;
        }
    }
}