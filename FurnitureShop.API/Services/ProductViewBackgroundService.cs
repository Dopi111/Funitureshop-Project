using System.Threading.Channels;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Services
{
    /// <summary>
    /// Record nhẹ đại diện cho một sự kiện xem sản phẩm cần được ghi vào DB.
    /// Dùng record để immutable và so sánh nhanh.
    /// </summary>
    public record ProductViewEvent(int ProductId, string? UserId, string IpAddress, DateTime ViewedAt);

    /// <summary>
    /// BACKGROUND SERVICE (Producer-Consumer Pattern via System.Threading.Channels):
    /// 
    /// - Controller (Producer) ghi event vào Channel cực nhanh, không block request.
    /// - BackgroundService (Consumer) đọc từ Channel và bulk-insert vào DB theo batch.
    /// 
    /// Lợi ích:
    ///   1. Tốc độ phản hồi trang chi tiết sản phẩm không bị ảnh hưởng bởi I/O database.
    ///   2. Batch insert giảm số lần round-trip tới SQL Server (hiệu quả hơn từng INSERT).
    ///   3. Bounded channel giúp có back-pressure, tránh OOM khi traffic đột biến.
    /// </summary>
    public class ProductViewBackgroundService : BackgroundService
    {
        // Bounded channel với capacity 5000: nếu đầy sẽ drop (không block thread)
        private readonly Channel<ProductViewEvent> _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ProductViewBackgroundService> _logger;

        // Kích thước mỗi batch và khoảng thời gian flush tối đa
        private const int BatchSize = 100;
        private static readonly TimeSpan FlushInterval = TimeSpan.FromSeconds(5);

        public ProductViewBackgroundService(
            Channel<ProductViewEvent> channel,
            IServiceScopeFactory scopeFactory,
            ILogger<ProductViewBackgroundService> logger)
        {
            _channel = channel;
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Enqueue một sự kiện xem sản phẩm vào channel (non-blocking).
        /// Được gọi từ Controller.
        /// </summary>
        public bool TryEnqueue(ProductViewEvent evt)
        {
            // TryWrite trả về false nếu channel đầy (BoundedChannel) — không throw
            return _channel.Writer.TryWrite(evt);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🔄 ProductView Background Service started.");

            var batch = new List<ProductViewEvent>(BatchSize);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Chờ item đầu tiên (block nếu channel trống)
                    if (await _channel.Reader.WaitToReadAsync(stoppingToken))
                    {
                        var deadline = DateTime.UtcNow.Add(FlushInterval);

                        // Drain channel cho đến khi đủ batch hoặc hết thời gian chờ
                        while (batch.Count < BatchSize
                               && DateTime.UtcNow < deadline
                               && _channel.Reader.TryRead(out var evt))
                        {
                            batch.Add(evt);
                        }

                        if (batch.Count > 0)
                        {
                            await PersistBatchAsync(batch, stoppingToken);
                            batch.Clear();
                        }
                    }
                }
                catch (OperationCanceledException)
                {
                    break; // Graceful shutdown
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in ProductView Background Service loop.");
                    await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken); // Backoff
                }
            }

            // Flush phần còn lại trước khi shutdown
            await DrainRemainingAsync(stoppingToken);

            _logger.LogInformation("🛑 ProductView Background Service stopped.");
        }

        private async Task PersistBatchAsync(List<ProductViewEvent> batch, CancellationToken ct)
        {
            // Tạo scope mới vì DbContext là Scoped, không dùng được trong Singleton/BackgroundService
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<Data.AppDbContext>();

            var entities = batch.Select(e => new ProductView
            {
                ProductId = e.ProductId,
                UserId    = e.UserId,
                IpAddress = e.IpAddress,
                ViewedAt  = e.ViewedAt
            });

            await db.ProductViews.AddRangeAsync(entities, ct);
            await db.SaveChangesAsync(ct);

            _logger.LogDebug("✅ Persisted {Count} ProductView records.", batch.Count);
        }

        private async Task DrainRemainingAsync(CancellationToken ct)
        {
            var remaining = new List<ProductViewEvent>();
            while (_channel.Reader.TryRead(out var evt))
                remaining.Add(evt);

            if (remaining.Count > 0)
            {
                _logger.LogInformation("💾 Flushing {Count} remaining ProductViews on shutdown.", remaining.Count);
                await PersistBatchAsync(remaining, ct);
            }
        }
    }
}
