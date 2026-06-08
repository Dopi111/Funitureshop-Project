using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Patterns.State
{
    // STATE PATTERN: Context
    public class OrderStateContext
    {
        private IOrderState _currentState;
        public Order Order { get; private set; }

        public OrderStateContext(Order order)
        {
            Order = order;
            _currentState = CreateStateFromStatus(order.Status);
        }

        public IOrderState CurrentState => _currentState;

        public void SetState(IOrderState state)
        {
            _currentState = state;
        }

        // STATE PATTERN: Chuyển trạng thái
        public async Task<bool> TransitionToNextStateAsync(string? notes = null, string? changedBy = null)
        {
            return await _currentState.HandleAsync(this, notes, changedBy);
        }

        public async Task<bool> CancelOrderAsync(string? reason = null, string? changedBy = null)
        {
            return await _currentState.CancelAsync(this, reason, changedBy);
        }

        public List<OrderStatus> GetAvailableTransitions()
        {
            return _currentState.GetAvailableNextStates();
        }

        private IOrderState CreateStateFromStatus(OrderStatus status)
        {
            return status switch
            {
                OrderStatus.Pending => new PendingState(),
                OrderStatus.Processing => new ProcessingState(),
                OrderStatus.Shipped => new ShippedState(),
                OrderStatus.Completed => new CompletedState(),
                OrderStatus.Cancelled => new CancelledState(),
                _ => throw new ArgumentException($"Unknown status: {status}")
            };
        }

        public void UpdateStateFromStatus()
        {
            _currentState = CreateStateFromStatus(Order.Status);
        }
    }

    // STATE PATTERN: State interface
    public interface IOrderState
    {
        OrderStatus Status { get; }
        Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy);
        Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy);
        List<OrderStatus> GetAvailableNextStates();
        string GetStatusDescription();
    }

    // STATE PATTERN: Concrete State - Pending
    public class PendingState : IOrderState
    {
        public OrderStatus Status => OrderStatus.Pending;

        public async Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy)
        {
            // Chuyển từ Pending → Processing
            var oldStatus = context.Order.Status;
            context.Order.Status = OrderStatus.Processing;
            context.Order.ProcessedAt = DateTime.UtcNow;
            context.Order.UpdatedAt = DateTime.UtcNow;

            // Ghi lịch sử
            context.Order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = context.Order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Processing,
                Notes = notes ?? "Đơn hàng đã được xác nhận và đang xử lý",
                ChangedBy = changedBy ?? "System"
            });

            context.SetState(new ProcessingState());
            return true;
        }

        public async Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy)
        {
            var oldStatus = context.Order.Status;
            context.Order.Status = OrderStatus.Cancelled;
            context.Order.CancelledAt = DateTime.UtcNow;
            context.Order.UpdatedAt = DateTime.UtcNow;

            context.Order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = context.Order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Cancelled,
                Notes = reason ?? "Đơn hàng đã bị hủy",
                ChangedBy = changedBy ?? "System"
            });

            context.SetState(new CancelledState());
            return true;
        }

        public List<OrderStatus> GetAvailableNextStates() =>
            new() { OrderStatus.Processing, OrderStatus.Cancelled };

        public string GetStatusDescription() => "Đơn hàng đang chờ xác nhận";
    }

    // STATE PATTERN: Concrete State - Processing
    public class ProcessingState : IOrderState
    {
        public OrderStatus Status => OrderStatus.Processing;

        public async Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy)
        {
            // Chuyển từ Processing → Shipped
            var oldStatus = context.Order.Status;
            context.Order.Status = OrderStatus.Shipped;
            context.Order.ShippedAt = DateTime.UtcNow;
            context.Order.UpdatedAt = DateTime.UtcNow;

            context.Order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = context.Order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Shipped,
                Notes = notes ?? "Đơn hàng đã được giao cho đơn vị vận chuyển",
                ChangedBy = changedBy ?? "System"
            });

            context.SetState(new ShippedState());
            return true;
        }

        public async Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy)
        {
            var oldStatus = context.Order.Status;
            context.Order.Status = OrderStatus.Cancelled;
            context.Order.CancelledAt = DateTime.UtcNow;
            context.Order.UpdatedAt = DateTime.UtcNow;

            context.Order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = context.Order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Cancelled,
                Notes = reason ?? "Đơn hàng đã bị hủy trong quá trình xử lý",
                ChangedBy = changedBy ?? "System"
            });

            context.SetState(new CancelledState());
            return true;
        }

        public List<OrderStatus> GetAvailableNextStates() =>
            new() { OrderStatus.Shipped, OrderStatus.Cancelled };

        public string GetStatusDescription() => "Đơn hàng đang được xử lý";
    }

    // STATE PATTERN: Concrete State - Shipped
    public class ShippedState : IOrderState
    {
        public OrderStatus Status => OrderStatus.Shipped;

        public async Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy)
        {
            // Chuyển từ Shipped → Completed
            var oldStatus = context.Order.Status;
            context.Order.Status = OrderStatus.Completed;
            context.Order.CompletedAt = DateTime.UtcNow;
            context.Order.UpdatedAt = DateTime.UtcNow;

            context.Order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = context.Order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Completed,
                Notes = notes ?? "Đơn hàng đã được giao thành công",
                ChangedBy = changedBy ?? "System"
            });

            context.SetState(new CompletedState());
            return true;
        }

        public async Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy)
        {
            // Không cho phép hủy khi đã shipped
            return false;
        }

        public List<OrderStatus> GetAvailableNextStates() =>
            new() { OrderStatus.Completed };

        public string GetStatusDescription() => "Đơn hàng đang được vận chuyển";
    }

    // STATE PATTERN: Concrete State - Completed
    public class CompletedState : IOrderState
    {
        public OrderStatus Status => OrderStatus.Completed;

        public async Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy)
        {
            // Không thể chuyển tiếp từ Completed
            return false;
        }

        public async Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy)
        {
            // Không thể hủy đơn đã hoàn thành
            return false;
        }

        public List<OrderStatus> GetAvailableNextStates() => new();

        public string GetStatusDescription() => "Đơn hàng đã hoàn thành";
    }

    // STATE PATTERN: Concrete State - Cancelled
    public class CancelledState : IOrderState
    {
        public OrderStatus Status => OrderStatus.Cancelled;

        public async Task<bool> HandleAsync(OrderStateContext context, string? notes, string? changedBy)
        {
            // Không thể chuyển tiếp từ Cancelled
            return false;
        }

        public async Task<bool> CancelAsync(OrderStateContext context, string? reason, string? changedBy)
        {
            // Đã bị hủy rồi
            return false;
        }

        public List<OrderStatus> GetAvailableNextStates() => new();

        public string GetStatusDescription() => "Đơn hàng đã bị hủy";
    }
}