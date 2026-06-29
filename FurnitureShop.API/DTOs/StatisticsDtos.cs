using System;
using System.Collections.Generic;

namespace FurnitureShop.API.DTOs
{
    // Dashboard Summary Statistics
    public class DashboardSummaryDto
    {
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCost { get; set; } // Lợi nhuận gộp: Giá vốn
        public decimal GrossProfit { get; set; } // Lợi nhuận gộp: Lợi nhuận
        public int TotalCustomers { get; set; }
        public int TotalProducts { get; set; }
        public decimal AverageOrderValue { get; set; }
        public int PendingOrders { get; set; }
    }

    // Order Status Distribution
    public class OrderStatusDistributionDto
    {
        public string Status { get; set; }
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
        public string ProductName { get; set; }
        public int QuantitySold { get; set; }
        public decimal Revenue { get; set; }
    }

    // Product Category Performance
    public class CategoryPerformanceDto
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int ProductCount { get; set; }
        public decimal TotalSales { get; set; }
        public decimal AveragePrice { get; set; }
        public int TotalQuantitySold { get; set; }
    }

    // Product Type Statistics
    public class ProductTypeStatisticsDto
    {
        public string ProductType { get; set; }
        public int Count { get; set; }
        public decimal MinPrice { get; set; }
        public decimal MaxPrice { get; set; }
        public decimal AveragePrice { get; set; }
        public int TotalSold { get; set; }
    }

    // Shipping Method Usage
    public class ShippingMethodUsageDto
    {
        public string ShippingMethodName { get; set; }
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

    // Complete Dashboard Data
    public class DashboardDataDto
    {
        public DashboardSummaryDto Summary { get; set; }
        public List<OrderStatusDistributionDto> OrderStatusDistribution { get; set; }
        public List<RevenueByDateDto> RevenueByDate { get; set; }
        public List<TopProductDto> TopProducts { get; set; }
        public List<CategoryPerformanceDto> CategoryPerformance { get; set; }
        public List<ProductTypeStatisticsDto> ProductTypes { get; set; }
        public List<ShippingMethodUsageDto> ShippingMethods { get; set; }
        public UserActivityDto UserActivity { get; set; }
        public InventoryStatusDto InventoryStatus { get; set; }
        public OrderCompletionStatsDto OrderCompletion { get; set; }
        public List<MonthlySalesDto> MonthlySales { get; set; }
    }
}
