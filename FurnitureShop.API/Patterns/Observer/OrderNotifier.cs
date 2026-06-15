using FurnitureShop.API.Models;

namespace FurnitureShop.API.Patterns.Observer
{
    // OBSERVER PATTERN: Subject interface
    public interface IOrderSubject
    {
        void Attach(IOrderObserver observer);
        void Detach(IOrderObserver observer);
        Task NotifyAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus);
    }

    // OBSERVER PATTERN: Observer interface
    public interface IOrderObserver
    {
        Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus);
        string GetObserverName();
    }

    // OBSERVER PATTERN: Concrete Subject
    public class OrderNotifier : IOrderSubject
    {
        private readonly List<IOrderObserver> _observers = new();

        public void Attach(IOrderObserver observer)
        {
            if (!_observers.Contains(observer))
            {
                _observers.Add(observer);
                Console.WriteLine($"✓ Observer attached: {observer.GetObserverName()}");
            }
        }

        public void Detach(IOrderObserver observer)
        {
            _observers.Remove(observer);
            Console.WriteLine($"✗ Observer detached: {observer.GetObserverName()}");
        }

        public async Task NotifyAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            Console.WriteLine($"\n📢 Notifying {_observers.Count} observers about order {order.OrderNumber}");
            Console.WriteLine($"   Status: {oldStatus} → {newStatus}");

            var tasks = _observers.Select(observer => observer.UpdateAsync(order, oldStatus, newStatus));
            await Task.WhenAll(tasks);
        }
    }

    // OBSERVER PATTERN: Concrete Observer - Email Notification
    public class EmailNotificationObserver : IOrderObserver
    {
        private readonly IEmailService _emailService;

        public EmailNotificationObserver(IEmailService emailService)
        {
            _emailService = emailService;
        }

        public async Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            // Skip email if user is not loaded
            if (order.User == null)
            {
                Console.WriteLine($"   ⚠️  Could not send email: Order user not loaded");
                return;
            }

            string subject = newStatus switch
            {
                OrderStatus.Processing => $"Đơn hàng #{order.OrderNumber} đã được xác nhận",
                OrderStatus.Shipped => $"Đơn hàng #{order.OrderNumber} đang được vận chuyển",
                OrderStatus.Completed => $"Đơn hàng #{order.OrderNumber} đã giao thành công",
                OrderStatus.Cancelled => $"Đơn hàng #{order.OrderNumber} đã bị hủy",
                _ => $"Cập nhật đơn hàng #{order.OrderNumber}"
            };

            string body = GenerateEmailBody(order, oldStatus, newStatus);

            await _emailService.SendEmailAsync(order.User.Email, subject, body);
            Console.WriteLine($"   ✉️  Email sent to {order.User.Email}");
        }

        private string GenerateEmailBody(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            return $@"
Xin chào {order.ShippingFullName},

Đơn hàng #{order.OrderNumber} của bạn đã được cập nhật.

Trạng thái: {GetStatusText(oldStatus)} → {GetStatusText(newStatus)}

Chi tiết đơn hàng:
- Tổng tiền hàng: {order.SubTotal:N0}đ
- Phí vận chuyển: {order.ShippingFee:N0}đ
- Tổng thanh toán: {order.TotalAmount:N0}đ

{GetStatusMessage(newStatus)}

Trân trọng,
Furniture Shop Team
";
        }

        private string GetStatusText(OrderStatus status) => status switch
        {
            OrderStatus.Pending => "Chờ xác nhận",
            OrderStatus.Processing => "Đang xử lý",
            OrderStatus.Shipped => "Đang vận chuyển",
            OrderStatus.Completed => "Hoàn thành",
            OrderStatus.Cancelled => "Đã hủy",
            _ => status.ToString()
        };

        private string GetStatusMessage(OrderStatus status) => status switch
        {
            OrderStatus.Processing => "Chúng tôi đang chuẩn bị đơn hàng của bạn.",
            OrderStatus.Shipped => "Đơn hàng đã được giao cho đơn vị vận chuyển.",
            OrderStatus.Completed => "Cảm ơn bạn đã mua hàng! Hẹn gặp lại!",
            OrderStatus.Cancelled => "Đơn hàng đã bị hủy. Vui lòng liên hệ nếu có thắc mắc.",
            _ => ""
        };

        public string GetObserverName() => "Email Notification";
    }

    // OBSERVER PATTERN: Concrete Observer - SMS Notification
    public class SmsNotificationObserver : IOrderObserver
    {
        private readonly ISmsService _smsService;

        public SmsNotificationObserver(ISmsService smsService)
        {
            _smsService = smsService;
        }

        public async Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            // Chỉ gửi SMS cho các trạng thái quan trọng
            if (newStatus == OrderStatus.Shipped || newStatus == OrderStatus.Completed)
            {
                string message = newStatus switch
                {
                    OrderStatus.Shipped => $"Don hang #{order.OrderNumber} dang duoc van chuyen. Furniture Shop",
                    OrderStatus.Completed => $"Don hang #{order.OrderNumber} da giao thanh cong. Cam on ban!",
                    _ => ""
                };

                if (!string.IsNullOrEmpty(message))
                {
                    await _smsService.SendSmsAsync(order.ShippingPhone, message);
                    Console.WriteLine($"   📱 SMS sent to {order.ShippingPhone}");
                }
            }
        }

        public string GetObserverName() => "SMS Notification";
    }

    // OBSERVER PATTERN: Concrete Observer - Inventory Update
    public class InventoryObserver : IOrderObserver
    {
        private readonly IInventoryService _inventoryService;

        public InventoryObserver(IInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        public async Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            // Giảm tồn kho khi đơn chuyển sang Processing
            if (newStatus == OrderStatus.Processing && oldStatus == OrderStatus.Pending)
            {
                foreach (var detail in order.OrderDetails)
                {
                    await _inventoryService.DecreaseStockAsync(detail.ProductId, detail.Quantity);
                    Console.WriteLine($"   📦 Stock decreased for Product #{detail.ProductId} x{detail.Quantity}");
                }
            }

            // Hoàn tồn kho nếu đơn bị hủy
            if (newStatus == OrderStatus.Cancelled &&
                (oldStatus == OrderStatus.Pending || oldStatus == OrderStatus.Processing))
            {
                foreach (var detail in order.OrderDetails)
                {
                    await _inventoryService.IncreaseStockAsync(detail.ProductId, detail.Quantity);
                    Console.WriteLine($"   📦 Stock restored for Product #{detail.ProductId} x{detail.Quantity}");
                }
            }
        }

        public string GetObserverName() => "Inventory Update";
    }

    // OBSERVER PATTERN: Concrete Observer - Analytics/Logging
    public class AnalyticsObserver : IOrderObserver
    {
        public async Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            // Log analytics data
            Console.WriteLine($"   📊 Analytics logged: Order {order.OrderNumber} → {newStatus}");

            // Có thể gửi data đến analytics service (Google Analytics, Mixpanel, etc.)
            await Task.Delay(10); // Simulate async operation
        }

        public string GetObserverName() => "Analytics Logger";
    }

    // Service Interfaces (sẽ implement sau)
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public interface ISmsService
    {
        Task SendSmsAsync(string phoneNumber, string message);
    }

    public interface IInventoryService
    {
        Task DecreaseStockAsync(int productId, int quantity);
        Task IncreaseStockAsync(int productId, int quantity);
    }
}