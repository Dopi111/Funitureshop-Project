using System;
using System.Collections.Generic;

namespace FurnitureShop.API.DTOs
{
    // Dashboard Summary Statistics
    public class DashboardSummaryDto
    {
        public int TotalOrders { get; set; }
        public int CompletedOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal? TotalCost { get; set; }     // Null khi sản phẩm bán ra chưa có giá vốn
        public decimal? GrossProfit { get; set; }   // Null khi chưa đủ dữ liệu giá vốn
        public int TotalCustomers { get; set; }
        public int TotalProducts { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int PendingOrders { get; set; }
    }

    // Order Status Distribution
    public class OrderStatusDistributionDto
    {
        // CS8618 fix: khởi tạo giá trị mặc định để tránh null
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    // Revenue by Date
    public class RevenueByDateDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
    }

    // Top Selling Products
    public class TopProductDto
    {
        public int ProductId { get; set; }
        // CS8618 fix: khởi tạo giá trị mặc định
        public string ProductName { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    // Product Category Performance
    public class CategoryPerformanceDto
    {
        public int CategoryId { get; set; }
        // CS8618 fix: khởi tạo giá trị mặc định
        public string CategoryName { get; set; } = string.Empty;
        public int ProductCount { get; set; }
        public decimal TotalSales { get; set; }
        public decimal AveragePrice { get; set; }
        public int TotalQuantitySold { get; set; }
    }

    // Product Type Statistics
    public class ProductTypeStatisticsDto
    {
        // CS8618 fix: khởi tạo giá trị mặc định
        public string ProductType { get; set; } = string.Empty;
        public int Count { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal AveragePrice { get; set; }
        public int TotalSold { get; set; }
    }

    // Shipping Method Usage
    public class ShippingMethodUsageDto
    {
        // CS8618 fix: khởi tạo giá trị mặc định
        public string ShippingMethodName { get; set; } = string.Empty;
        public int UsageCount { get; set; }
        public decimal TotalShippingFees { get; set; }
        public decimal AverageShippingFee { get; set; }
    }

    // User Activity
    public class UserActivityDto
    {
        public int TotalRegisteredUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int NewUsersThisMonth { get; set; }
        public int UsersWithOrders { get; set; }
    }

    // Inventory Status
    public class InventoryStatusDto
    {
        public int LowStockProducts { get; set; }
        public int OutOfStockProducts { get; set; }
        public decimal TotalInventoryValue { get; set; }
    }

    // Order Completion Statistics
    public class OrderCompletionStatsDto
    {
        public double AverageCompletionTime { get; set; } // in days
        public int CompletedOrdersThisMonth { get; set; }
        public decimal CompletionRate { get; set; } // percentage
    }

    // Monthly Trends
    public class MonthlySalesDto
    {
        public int Month { get; set; }
        public int Year { get; set; }
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
    }

    public class RecentOrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Complete Dashboard Data
    // CS8618 fix: khởi tạo tất cả thuộc tính non-nullable với giá trị mặc định
    public class DashboardDataDto
    {
        public DashboardSummaryDto Summary { get; set; } = new();
        public List<OrderStatusDistributionDto> OrderStatusDistribution { get; set; } = new();
        public List<RevenueByDateDto> RevenueByDate { get; set; } = new();
        public List<TopProductDto> TopProducts { get; set; } = new();
        public List<CategoryPerformanceDto> CategoryPerformance { get; set; } = new();
        public List<ProductTypeStatisticsDto> ProductTypes { get; set; } = new();
        public List<ShippingMethodUsageDto> ShippingMethods { get; set; } = new();
        public UserActivityDto UserActivity { get; set; } = new();
        public InventoryStatusDto InventoryStatus { get; set; } = new();
        public OrderCompletionStatsDto OrderCompletion { get; set; } = new();
        public List<MonthlySalesDto> MonthlySales { get; set; } = new();
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
        public decimal? TargetRevenue { get; set; }
    }
}
