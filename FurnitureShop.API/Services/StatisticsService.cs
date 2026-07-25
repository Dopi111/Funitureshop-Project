using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using System.Globalization;

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
        public async Task<DashboardDataDto> GetDashboardDataAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            if (startDate.HasValue || endDate.HasValue)
                return await BuildDashboardAsync(startDate, endDate);

            // CS8603 fix: GetOrCreateAsync<T> trả về T? (nullable), dùng ?? new() để đảm bảo non-null
            return await _cache.GetOrCreateAsync(DashboardCacheKey, async entry =>
            {
                // Set cache options
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15);
                
                try
            {
                return await BuildDashboardAsync(null, null);
                }
                catch (Exception ex)
                {
                    throw new Exception("Dashboard error: " + ex.Message, ex);
                }
            }) ?? new DashboardDataDto();
        }


        private async Task<DashboardDataDto> BuildDashboardAsync(DateTime? startDate, DateTime? endDate)
        {
            return new DashboardDataDto
            {
                Summary = await GetSummaryAsync(startDate, endDate),
                OrderStatusDistribution = await GetOrderStatusDistributionAsync(startDate, endDate),
                RevenueByDate = await GetRevenueByDateAsync(startDate ?? DateTime.Now.AddDays(-30), endDate ?? DateTime.Now),
                TopProducts = await GetTopProductsAsync(10, startDate, endDate),
                CategoryPerformance = await GetCategoryPerformanceAsync(),
                ProductTypes = await GetProductTypeStatisticsAsync(),
                ShippingMethods = await GetShippingMethodUsageAsync(),
                UserActivity = await GetUserActivityAsync(),
                InventoryStatus = await GetInventoryStatusAsync(),
                OrderCompletion = await GetOrderCompletionStatsAsync(),
                MonthlySales = await GetMonthlySalesAsync(12),
                RecentOrders = await GetRecentOrdersAsync(5),
                TargetRevenue = await GetTargetRevenueAsync()
            };
        }

        // ================= SUMMARY =================
        private async Task<DashboardSummaryDto> GetSummaryAsync(DateTime? startDate, DateTime? endDate)
        {
            var orderQuery = _context.Orders.AsQueryable();
            if (startDate.HasValue) orderQuery = orderQuery.Where(o => o.CreatedAt >= startDate.Value);
            if (endDate.HasValue) orderQuery = orderQuery.Where(o => o.CreatedAt < endDate.Value.Date.AddDays(1));
            var totalOrders = await orderQuery.CountAsync();
            var completedOrders = await orderQuery.CountAsync(o => o.Status == OrderStatus.Completed);

            var totalRevenue = await orderQuery
                .Where(o => o.IsPaid
                    || o.Status == OrderStatus.Processing
                    || o.Status == OrderStatus.Shipped
                    || o.Status == OrderStatus.Completed)
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var revenueOrderCount = await orderQuery.CountAsync(o => o.IsPaid
                || o.Status == OrderStatus.Processing
                || o.Status == OrderStatus.Shipped
                || o.Status == OrderStatus.Completed);

            var totalCustomers = await _context.Users
                .Where(u => u.Role == UserRole.Customer)
                .CountAsync();

            var totalProducts = await _context.Products
                .Where(p => p.IsActive)
                .CountAsync();

            var pendingOrders = await orderQuery
                .Where(o => o.Status == OrderStatus.Pending)
                .CountAsync();

            // Cost price falls back to the weighted average of completed purchase orders.
            var productCosts = await _context.PurchaseOrderDetails
                .Where(pod => pod.PurchaseOrder.Status == "Completed")
                .GroupBy(pod => pod.ProductId)
                .Select(g => new
                {
                    ProductId = g.Key,
                    AvgCost = g.Sum(pod => pod.TotalPrice) / g.Sum(pod => pod.Quantity)
                })
                .ToDictionaryAsync(x => x.ProductId, x => x.AvgCost);

            var soldItemsQuery = _context.OrderDetails
                .Where(od => od.Order.IsPaid
                    || od.Order.Status == OrderStatus.Processing
                    || od.Order.Status == OrderStatus.Shipped
                    || od.Order.Status == OrderStatus.Completed)
                .AsQueryable();
            if (startDate.HasValue) soldItemsQuery = soldItemsQuery.Where(od => od.Order.CreatedAt >= startDate.Value);
            if (endDate.HasValue) soldItemsQuery = soldItemsQuery.Where(od => od.Order.CreatedAt < endDate.Value.Date.AddDays(1));
            var soldItems = await soldItemsQuery
                .Select(od => new { od.ProductId, od.Quantity, od.Product.CostPrice })
                .ToListAsync();

            decimal totalCost = 0;
            var hasMissingCost = false;
            foreach(var item in soldItems)
            {
                var cost = item.CostPrice;
                if (!cost.HasValue && productCosts.TryGetValue(item.ProductId, out var purchaseCost))
                    cost = purchaseCost;
                if (!cost.HasValue)
                {
                    hasMissingCost = true;
                    continue;
                }
                totalCost += cost.Value * item.Quantity;
            }

            decimal? totalCostResult = hasMissingCost ? null : totalCost;
            decimal? grossProfit = totalCostResult.HasValue ? totalRevenue - totalCostResult.Value : null;

            return new DashboardSummaryDto
            {
                TotalOrders = totalOrders,
                CompletedOrders = completedOrders,
                TotalRevenue = totalRevenue,
                TotalCost = totalCostResult,
                GrossProfit = grossProfit,
                TotalCustomers = totalCustomers,
                TotalProducts = totalProducts,
                AverageOrderValue = revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0,
                PendingOrders = pendingOrders
            };
        }

        // ================= ORDER STATUS =================
        private async Task<List<OrderStatusDistributionDto>> GetOrderStatusDistributionAsync(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.Orders.AsQueryable();
            if (startDate.HasValue) query = query.Where(o => o.CreatedAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(o => o.CreatedAt < endDate.Value.Date.AddDays(1));
            var totalOrders = await query.CountAsync();

            return await query
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
        private async Task<List<RevenueByDateDto>> GetRevenueByDateAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Orders
                .Where(o => o.CreatedAt >= startDate
                    && o.CreatedAt < endDate.Date.AddDays(1)
                    && (o.IsPaid
                        || o.Status == OrderStatus.Processing
                        || o.Status == OrderStatus.Shipped
                        || o.Status == OrderStatus.Completed))
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
        private async Task<List<TopProductDto>> GetTopProductsAsync(int top, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.OrderDetails
                .Where(x => x.Order.IsPaid
                    || x.Order.Status == OrderStatus.Processing
                    || x.Order.Status == OrderStatus.Shipped
                    || x.Order.Status == OrderStatus.Completed)
                .AsQueryable();
            if (startDate.HasValue) query = query.Where(x => x.Order.CreatedAt >= startDate.Value);
            if (endDate.HasValue) query = query.Where(x => x.Order.CreatedAt < endDate.Value.Date.AddDays(1));
            return await query
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

        private async Task<List<RecentOrderDto>> GetRecentOrdersAsync(int count)
        {
            return await _context.Orders
                .OrderByDescending(o => o.CreatedAt)
                .Take(count)
                .Select(o => new RecentOrderDto
                {
                    OrderId = o.OrderId,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.ShippingFullName,
                    Status = o.Status.ToString(),
                    TotalAmount = o.TotalAmount,
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();
        }

        private async Task<decimal?> GetTargetRevenueAsync()
        {
            var value = await _context.SystemSettings
                .AsNoTracking()
                .Where(s => s.Key == "Kpi.MonthlyTargetRevenue")
                .Select(s => s.Value)
                .FirstOrDefaultAsync();

            return decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var target)
                ? target
                : null;
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
                .ThenInclude(od => od.Order)
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
                    TotalSales = orderDetails.Where(x => IsRevenueOrder(x.Order)).Sum(x => x.TotalPrice),
                    AveragePrice = categoryProducts.Any()
                        ? categoryProducts.Average(p => p.BasePrice)
                        : 0,
                    TotalQuantitySold = orderDetails.Where(x => IsRevenueOrder(x.Order)).Sum(x => x.Quantity)
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
                .ThenInclude(od => od.Order)
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
                                .Where(x => IsRevenueOrder(x.Order))
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
                TotalInventoryValue = await _context.Products.SumAsync(p => (p.CostPrice ?? 0) * p.StockQuantity)
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
            var firstMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(-(months - 1));
            var grouped = await _context.Orders
                .Where(o => o.CreatedAt >= firstMonth
                    && (o.IsPaid
                        || o.Status == OrderStatus.Processing
                        || o.Status == OrderStatus.Shipped
                        || o.Status == OrderStatus.Completed))
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new MonthlySalesDto
                {
                    Month = g.Key.Month,
                    Year = g.Key.Year,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .ToListAsync();

            return Enumerable.Range(0, months)
                .Select(offset => firstMonth.AddMonths(offset))
                .Select(month => grouped.FirstOrDefault(x => x.Year == month.Year && x.Month == month.Month)
                    ?? new MonthlySalesDto { Month = month.Month, Year = month.Year })
                .ToList();
        }

        private static bool IsRevenueOrder(Order order) => order.IsPaid
            || order.Status == OrderStatus.Processing
            || order.Status == OrderStatus.Shipped
            || order.Status == OrderStatus.Completed;
    }
}
