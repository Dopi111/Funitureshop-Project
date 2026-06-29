using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Services
{
    public class DatabaseCleanupBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DatabaseCleanupBackgroundService> _logger;

        public DatabaseCleanupBackgroundService(IServiceProvider serviceProvider, ILogger<DatabaseCleanupBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Database Cleanup Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CleanupDatabaseAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing database cleanup.");
                }

                // Run every 24 hours
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }

            _logger.LogInformation("Database Cleanup Background Service is stopping.");
        }

        private async Task CleanupDatabaseAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            _logger.LogInformation("Starting database cleanup tasks...");

            // 1. Cleanup old carts (older than 30 days)
            var oldCartsDate = DateTime.UtcNow.AddDays(-30);
            var oldCarts = await context.ShoppingCarts
                .Where(c => (c.UpdatedAt != null ? c.UpdatedAt : c.CreatedAt) < oldCartsDate)
                .ToListAsync(stoppingToken);

            if (oldCarts.Any())
            {
                context.ShoppingCarts.RemoveRange(oldCarts);
                _logger.LogInformation($"Cleaned up {oldCarts.Count} old carts.");
            }

            // 2. Cancel pending orders older than 24 hours
            var pendingOrdersDate = DateTime.UtcNow.AddHours(-24);
            var pendingOrders = await context.Orders
                .Where(o => o.Status == OrderStatus.Pending && o.CreatedAt < pendingOrdersDate)
                .ToListAsync(stoppingToken);

            if (pendingOrders.Any())
            {
                foreach (var order in pendingOrders)
                {
                    order.Status = OrderStatus.Cancelled;
                    order.CancelledAt = DateTime.UtcNow;
                    order.Notes = (string.IsNullOrEmpty(order.Notes) ? "" : order.Notes + "\n") + "[System] Auto-cancelled due to timeout.";
                    
                    // Track history
                    context.OrderStatusHistories.Add(new FurnitureShop.API.Models.Entities.OrderStatusHistory
                    {
                        OrderId = order.OrderId,
                        FromStatus = OrderStatus.Pending,
                        ToStatus = OrderStatus.Cancelled,
                        ChangedBy = "System",
                        Notes = "Auto-cancelled due to timeout",
                        CreatedAt = DateTime.UtcNow
                    });
                }
                _logger.LogInformation($"Auto-cancelled {pendingOrders.Count} pending orders.");
            }

            if (oldCarts.Any() || pendingOrders.Any())
            {
                await context.SaveChangesAsync(stoppingToken);
                _logger.LogInformation("Database changes saved.");
            }

            _logger.LogInformation("Database cleanup tasks completed.");
        }
    }
}
