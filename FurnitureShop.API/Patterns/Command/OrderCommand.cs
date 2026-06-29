using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using FurnitureShop.API.Patterns.Observer;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Patterns.Command
{
    // ══════════════════════════════════════════════════════════════════
    // COMMAND PATTERN: Interface – mỗi hành động trên Order là 1 Command
    // ══════════════════════════════════════════════════════════════════
    public interface IOrderCommand
    {
        int OrderId { get; }
        string CommandName { get; }
        Task<bool> ExecuteAsync();
        Task<bool> UndoAsync();
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 1: Xác nhận đơn hàng (Pending → Processing)
    // Undo: Processing → Pending
    // ══════════════════════════════════════════════════════════════════
    public class ConfirmOrderCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly OrderNotifier _notifier;
        private readonly int _orderId;
        private readonly string? _changedBy;

        public int OrderId => _orderId;
        public string CommandName => "ConfirmOrder";

        public ConfirmOrderCommand(AppDbContext context, OrderNotifier notifier, int orderId, string? changedBy = null)
        {
            _context = context;
            _notifier = notifier;
            _orderId = orderId;
            _changedBy = changedBy;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Pending) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Processing;
            order.ProcessedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Processing,
                Notes = "Đơn hàng đã được xác nhận",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync(order, oldStatus, order.Status);

            Console.WriteLine($"[Command] ✅ ConfirmOrder #{order.OrderNumber}: Pending → Processing");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Processing) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Pending;
            order.ProcessedAt = null;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Pending,
                Notes = "[Undo] Hoàn tác xác nhận đơn hàng",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo ConfirmOrder #{order.OrderNumber}: Processing → Pending");
            return true;
        }

        private Task<Order?> LoadOrderAsync() =>
            _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == _orderId);
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 2: Giao hàng (Processing → Shipped)
    // Undo: Shipped → Processing
    // ══════════════════════════════════════════════════════════════════
    public class ShipOrderCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly OrderNotifier _notifier;
        private readonly int _orderId;
        private readonly string? _changedBy;

        public int OrderId => _orderId;
        public string CommandName => "ShipOrder";

        public ShipOrderCommand(AppDbContext context, OrderNotifier notifier, int orderId, string? changedBy = null)
        {
            _context = context;
            _notifier = notifier;
            _orderId = orderId;
            _changedBy = changedBy;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Processing) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Shipped;
            order.ShippedAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Shipped,
                Notes = "Đơn hàng đã được giao cho đơn vị vận chuyển",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync(order, oldStatus, order.Status);

            Console.WriteLine($"[Command] 🚚 ShipOrder #{order.OrderNumber}: Processing → Shipped");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Shipped) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Processing;
            order.ShippedAt = null;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Processing,
                Notes = "[Undo] Hoàn tác giao hàng",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo ShipOrder #{order.OrderNumber}: Shipped → Processing");
            return true;
        }

        private Task<Order?> LoadOrderAsync() =>
            _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == _orderId);
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 3: Hủy đơn hàng (Pending/Processing → Cancelled)
    // Undo: Cancelled → trạng thái trước đó
    // ══════════════════════════════════════════════════════════════════
    public class CancelOrderCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly OrderNotifier _notifier;
        private readonly int _orderId;
        private readonly string? _reason;
        private readonly string? _changedBy;
        private OrderStatus _previousStatus; // Lưu lại để Undo

        public int OrderId => _orderId;
        public string CommandName => "CancelOrder";

        public CancelOrderCommand(AppDbContext context, OrderNotifier notifier, int orderId, string? reason = null, string? changedBy = null)
        {
            _context = context;
            _notifier = notifier;
            _orderId = orderId;
            _reason = reason;
            _changedBy = changedBy;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null) return false;

            // Chỉ cho hủy khi Pending hoặc Processing
            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Processing)
                return false;

            _previousStatus = order.Status;
            order.Status = OrderStatus.Cancelled;
            order.CancelledAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = _previousStatus,
                ToStatus = OrderStatus.Cancelled,
                Notes = _reason ?? "Đơn hàng đã bị hủy",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync(order, _previousStatus, order.Status);

            Console.WriteLine($"[Command] ❌ CancelOrder #{order.OrderNumber}: {_previousStatus} → Cancelled");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Cancelled) return false;

            order.Status = _previousStatus;
            order.CancelledAt = null;
            order.UpdatedAt = DateTime.UtcNow;

            // Khôi phục timestamp tương ứng
            if (_previousStatus == OrderStatus.Processing)
                order.ProcessedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = OrderStatus.Cancelled,
                ToStatus = _previousStatus,
                Notes = "[Undo] Hoàn tác hủy đơn hàng",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo CancelOrder #{order.OrderNumber}: Cancelled → {_previousStatus}");
            return true;
        }

        private Task<Order?> LoadOrderAsync() =>
            _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == _orderId);
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 3.5: Hoàn thành đơn hàng (Shipped → Completed)
    // Undo: Completed → Shipped
    // ══════════════════════════════════════════════════════════════════
    public class CompleteOrderCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly OrderNotifier _notifier;
        private readonly int _orderId;
        private readonly string? _changedBy;

        public int OrderId => _orderId;
        public string CommandName => "CompleteOrder";

        public CompleteOrderCommand(AppDbContext context, OrderNotifier notifier, int orderId, string? changedBy = null)
        {
            _context = context;
            _notifier = notifier;
            _orderId = orderId;
            _changedBy = changedBy;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Shipped) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Completed;
            
            // Cập nhật ngày hoàn thành và mặc định là đã thanh toán nếu hoàn thành
            order.UpdatedAt = DateTime.UtcNow;
            if (!order.IsPaid)
            {
                order.IsPaid = true;
                order.PaidAt = DateTime.UtcNow;
            }

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Completed,
                Notes = "Đơn hàng đã giao thành công và hoàn thành",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            await _notifier.NotifyAsync(order, oldStatus, order.Status);

            Console.WriteLine($"[Command] ✅ CompleteOrder #{order.OrderNumber}: Shipped → Completed");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await LoadOrderAsync();
            if (order == null || order.Status != OrderStatus.Completed) return false;

            var oldStatus = order.Status;
            order.Status = OrderStatus.Shipped;
            order.UpdatedAt = DateTime.UtcNow;

            order.StatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.OrderId,
                FromStatus = oldStatus,
                ToStatus = OrderStatus.Shipped,
                Notes = "[Undo] Hoàn tác hoàn thành đơn hàng",
                ChangedBy = _changedBy ?? "System"
            });

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo CompleteOrder #{order.OrderNumber}: Completed → Shipped");
            return true;
        }

        private Task<Order?> LoadOrderAsync() =>
            _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderDetails)
                .Include(o => o.StatusHistories)
                .FirstOrDefaultAsync(o => o.OrderId == _orderId);
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 4: Đánh dấu đã thanh toán
    // Undo: bỏ đánh dấu thanh toán
    // ══════════════════════════════════════════════════════════════════
    public class MarkAsPaidCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly int _orderId;
        private readonly string? _changedBy;
        private DateTime? _previousPaidAt;

        public int OrderId => _orderId;
        public string CommandName => "MarkAsPaid";

        public MarkAsPaidCommand(AppDbContext context, int orderId, string? changedBy = null)
        {
            _context = context;
            _orderId = orderId;
            _changedBy = changedBy;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await _context.Orders.FindAsync(_orderId);
            if (order == null || order.IsPaid) return false;

            order.IsPaid = true;
            order.PaidAt = DateTime.UtcNow;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] 💰 MarkAsPaid #{order.OrderNumber} lúc {order.PaidAt:HH:mm dd/MM/yyyy}");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await _context.Orders.FindAsync(_orderId);
            if (order == null || !order.IsPaid) return false;

            _previousPaidAt = order.PaidAt;
            order.IsPaid = false;
            order.PaidAt = null;
            order.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo MarkAsPaid #{order.OrderNumber}");
            return true;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // COMMAND 5: Cập nhật địa chỉ giao hàng
    // Undo: khôi phục địa chỉ cũ
    // ══════════════════════════════════════════════════════════════════
    public class UpdateShippingAddressCommand : IOrderCommand
    {
        private readonly AppDbContext _context;
        private readonly int _orderId;
        private readonly string _newFullName;
        private readonly string _newPhone;
        private readonly string _newAddress;
        private readonly string? _newCity;
        private readonly string? _newDistrict;
        private readonly string? _newWard;

        // Snapshot để Undo
        private string _oldFullName = "";
        private string _oldPhone = "";
        private string _oldAddress = "";
        private string? _oldCity;
        private string? _oldDistrict;
        private string? _oldWard;

        public int OrderId => _orderId;
        public string CommandName => "UpdateShippingAddress";

        public UpdateShippingAddressCommand(
            AppDbContext context,
            int orderId,
            string fullName, string phone, string address,
            string? city = null, string? district = null, string? ward = null)
        {
            _context = context;
            _orderId = orderId;
            _newFullName = fullName;
            _newPhone = phone;
            _newAddress = address;
            _newCity = city;
            _newDistrict = district;
            _newWard = ward;
        }

        public async Task<bool> ExecuteAsync()
        {
            var order = await _context.Orders.FindAsync(_orderId);
            if (order == null) return false;

            // Chỉ cho cập nhật khi chưa giao
            if (order.Status == OrderStatus.Shipped ||
                order.Status == OrderStatus.Completed ||
                order.Status == OrderStatus.Cancelled)
                return false;

            // Snapshot trạng thái cũ để Undo
            _oldFullName  = order.ShippingFullName;
            _oldPhone     = order.ShippingPhone;
            _oldAddress   = order.ShippingAddress;
            _oldCity      = order.ShippingCity;
            _oldDistrict  = order.ShippingDistrict;
            _oldWard      = order.ShippingWard;

            order.ShippingFullName  = _newFullName;
            order.ShippingPhone     = _newPhone;
            order.ShippingAddress   = _newAddress;
            order.ShippingCity      = _newCity;
            order.ShippingDistrict  = _newDistrict;
            order.ShippingWard      = _newWard;
            order.UpdatedAt         = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] 📦 UpdateShippingAddress #{order.OrderNumber}: {_newAddress}, {_newCity}");
            return true;
        }

        public async Task<bool> UndoAsync()
        {
            var order = await _context.Orders.FindAsync(_orderId);
            if (order == null) return false;

            order.ShippingFullName  = _oldFullName;
            order.ShippingPhone     = _oldPhone;
            order.ShippingAddress   = _oldAddress;
            order.ShippingCity      = _oldCity;
            order.ShippingDistrict  = _oldDistrict;
            order.ShippingWard      = _oldWard;
            order.UpdatedAt         = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            Console.WriteLine($"[Command] ↩️  Undo UpdateShippingAddress #{order.OrderNumber}: restored to {_oldAddress}, {_oldCity}");
            return true;
        }
    }

    // ══════════════════════════════════════════════════════════════════
    // INVOKER: Quản lý thực thi và lịch sử Undo/Redo
    // ══════════════════════════════════════════════════════════════════
    public class OrderCommandInvoker
    {
        private readonly Dictionary<int, Stack<IOrderCommand>> _undoStacks = new();
        private readonly Dictionary<int, Stack<IOrderCommand>> _redoStacks = new();
        private readonly Dictionary<int, List<CommandExecutionRecord>> _commandHistory = new();

        private Stack<IOrderCommand> GetUndoStack(int orderId)
        {
            if (!_undoStacks.TryGetValue(orderId, out var stack))
            {
                stack = new Stack<IOrderCommand>();
                _undoStacks[orderId] = stack;
            }

            return stack;
        }

        private Stack<IOrderCommand> GetRedoStack(int orderId)
        {
            if (!_redoStacks.TryGetValue(orderId, out var stack))
            {
                stack = new Stack<IOrderCommand>();
                _redoStacks[orderId] = stack;
            }

            return stack;
        }

        private List<CommandExecutionRecord> GetHistory(int orderId)
        {
            if (!_commandHistory.TryGetValue(orderId, out var history))
            {
                history = new List<CommandExecutionRecord>();
                _commandHistory[orderId] = history;
            }

            return history;
        }

        // Thực thi command và đẩy vào undo stack
        public async Task<bool> ExecuteAsync(IOrderCommand command)
        {
            var success = await command.ExecuteAsync();
            if (success)
            {
                var undoStack = GetUndoStack(command.OrderId);
                var redoStack = GetRedoStack(command.OrderId);
                var history = GetHistory(command.OrderId);

                undoStack.Push(command);
                redoStack.Clear(); // Redo stack bị xóa khi có action mới
                history.Add(new CommandExecutionRecord
                {
                    OrderId = command.OrderId,
                    CommandName = command.CommandName,
                    Action = "execute",
                    ExecutedAt = DateTime.UtcNow
                });

                Console.WriteLine($"[Invoker] Executed: {command.CommandName} (Order {command.OrderId}) | Undo stack: {undoStack.Count}");
            }
            return success;
        }

        // Undo command gần nhất
        public async Task<bool> UndoAsync(int orderId)
        {
            var undoStack = GetUndoStack(orderId);
            var redoStack = GetRedoStack(orderId);
            var history = GetHistory(orderId);

            if (!undoStack.Any())
            {
                Console.WriteLine($"[Invoker] Nothing to undo for Order {orderId}");
                return false;
            }

            var command = undoStack.Pop();
            var success = await command.UndoAsync();
            if (success)
            {
                redoStack.Push(command);
                history.Add(new CommandExecutionRecord
                {
                    OrderId = orderId,
                    CommandName = command.CommandName,
                    Action = "undo",
                    ExecutedAt = DateTime.UtcNow
                });
                Console.WriteLine($"[Invoker] Undone: {command.CommandName} (Order {orderId}) | Redo stack: {redoStack.Count}");
            }
            return success;
        }

        // Redo command vừa undo
        public async Task<bool> RedoAsync(int orderId)
        {
            var undoStack = GetUndoStack(orderId);
            var redoStack = GetRedoStack(orderId);
            var history = GetHistory(orderId);

            if (!redoStack.Any())
            {
                Console.WriteLine($"[Invoker] Nothing to redo for Order {orderId}");
                return false;
            }

            var command = redoStack.Pop();
            var success = await command.ExecuteAsync();
            if (success)
            {
                undoStack.Push(command);
                history.Add(new CommandExecutionRecord
                {
                    OrderId = orderId,
                    CommandName = command.CommandName,
                    Action = "redo",
                    ExecutedAt = DateTime.UtcNow
                });
                Console.WriteLine($"[Invoker] Redone: {command.CommandName} (Order {orderId}) | Undo stack: {undoStack.Count}");
            }
            return success;
        }

        public bool CanUndo(int orderId) => GetUndoStack(orderId).Any();
        public bool CanRedo(int orderId) => GetRedoStack(orderId).Any();

        // Lấy danh sách command đang trong undo stack (để hiển thị lịch sử)
        public IReadOnlyList<string> GetUndoHistory(int orderId) =>
            GetUndoStack(orderId).Select(c => c.CommandName).ToList();

        public IReadOnlyList<CommandExecutionRecord> GetExecutionHistory(int orderId) =>
            GetHistory(orderId).OrderByDescending(h => h.ExecutedAt).ToList();
    }

    public class CommandExecutionRecord
    {
        public int OrderId { get; set; }
        public string CommandName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
    }
}
