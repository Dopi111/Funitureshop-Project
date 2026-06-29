using FurnitureShop.API.Hubs;
using FurnitureShop.API.Models;
using Microsoft.AspNetCore.SignalR;

namespace FurnitureShop.API.Patterns.Observer
{
    // OBSERVER PATTERN: Concrete Observer - SignalR Notification
    public class SignalRObserver : IOrderObserver
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public SignalRObserver(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task UpdateAsync(Order order, OrderStatus oldStatus, OrderStatus newStatus)
        {
            var message = $"Đơn hàng #{order.OrderNumber} đã chuyển sang trạng thái {GetStatusText(newStatus)}";
            
            // Push message to all connected admin clients via SignalR
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new 
            {
                orderId = order.OrderId,
                orderNumber = order.OrderNumber,
                status = newStatus.ToString(),
                message = message,
                timestamp = DateTime.UtcNow
            });
            
            Console.WriteLine($"   ⚡ SignalR Notification sent: {message}");
        }

        public string GetObserverName() => "SignalR Notification";

        private string GetStatusText(OrderStatus status) => status switch
        {
            OrderStatus.Pending => "Chờ xác nhận",
            OrderStatus.Processing => "Đang xử lý",
            OrderStatus.Shipped => "Đang vận chuyển",
            OrderStatus.Completed => "Hoàn thành",
            OrderStatus.Cancelled => "Đã hủy",
            _ => status.ToString()
        };
    }
}
