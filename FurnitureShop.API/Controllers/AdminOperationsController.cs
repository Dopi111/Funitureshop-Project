using System.Security.Claims;
using System.Text.Json;
using FurnitureShop.API.Data;
using FurnitureShop.API.Models;
using FurnitureShop.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers;

[ApiController]
[Route("api/admin-operations")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class AdminOperationsController : ControllerBase
{
    private const string DeliveryKey = "Admin.DeliveryAssignments";
    private readonly AppDbContext _context;

    public AdminOperationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("delivery")]
    public async Task<IActionResult> GetDeliveryOrders()
    {
        var assignments = await ReadSettingAsync(DeliveryKey, new List<DeliveryAssignment>());
        var orders = await _context.Orders
            .Include(o => o.ShippingMethod)
            .OrderByDescending(o => o.CreatedAt)
            .Take(100)
            .ToListAsync();

        var data = orders.Select(o =>
        {
            var assignment = assignments.FirstOrDefault(a => a.OrderId == o.OrderId);
            return new
            {
                id = o.OrderId,
                orderNumber = o.OrderNumber,
                customer = o.ShippingFullName,
                phone = o.ShippingPhone,
                address = string.Join(", ", new[] { o.ShippingAddress, o.ShippingWard, o.ShippingDistrict, o.ShippingCity }.Where(x => !string.IsNullOrWhiteSpace(x))),
                total = o.TotalAmount,
                method = o.ShippingMethod?.Name ?? "Giao hàng tiêu chuẩn",
                status = ToDeliveryStatus(o.Status),
                driver = assignment?.DriverName,
                vehicle = assignment?.Vehicle,
                trackingCode = assignment?.TrackingCode ?? $"FS{o.OrderId:000000}",
                updatedAt = assignment?.UpdatedAt ?? o.UpdatedAt ?? o.CreatedAt
            };
        });

        return Ok(new { success = true, data });
    }

    [HttpPut("delivery/{orderId:int}/assign")]
    public async Task<IActionResult> AssignDelivery(int orderId, [FromBody] AssignDeliveryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DriverName))
            return BadRequest(new { success = false, message = "Driver is required" });

        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) return NotFound(new { success = false, message = "Order not found" });

        var assignments = await ReadSettingAsync(DeliveryKey, new List<DeliveryAssignment>());
        var existing = assignments.FirstOrDefault(a => a.OrderId == orderId);
        if (existing == null)
        {
            existing = new DeliveryAssignment { OrderId = orderId };
            assignments.Add(existing);
        }

        existing.DriverName = request.DriverName.Trim();
        existing.Vehicle = request.Vehicle;
        existing.TrackingCode = string.IsNullOrWhiteSpace(request.TrackingCode) ? $"FS{orderId:000000}" : request.TrackingCode;
        existing.UpdatedAt = DateTime.UtcNow;
        if (order.Status is OrderStatus.Pending or OrderStatus.Processing)
        {
            order.Status = OrderStatus.Shipped;
            order.ShippedAt = DateTime.UtcNow;
        }

        AddAudit("ASSIGN_DELIVERY", "Order", orderId, new { request.DriverName, request.Vehicle, existing.TrackingCode });
        await SaveSettingAsync(DeliveryKey, assignments, "Demo delivery assignments");
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = existing });
    }

    [HttpPut("delivery/{orderId:int}/status")]
    public async Task<IActionResult> UpdateDeliveryStatus(int orderId, [FromBody] DeliveryStatusRequest request)
    {
        var order = await _context.Orders.FindAsync(orderId);
        if (order == null) return NotFound(new { success = false, message = "Order not found" });

        switch (request.Status?.ToLowerInvariant())
        {
            case "completed":
                order.Status = OrderStatus.Completed;
                order.CompletedAt = DateTime.UtcNow;
                break;
            case "cancelled":
            case "failed":
                order.Status = OrderStatus.Cancelled;
                order.CancelledAt = DateTime.UtcNow;
                break;
            default:
                order.Status = OrderStatus.Shipped;
                order.ShippedAt ??= DateTime.UtcNow;
                break;
        }

        order.UpdatedAt = DateTime.UtcNow;
        AddAudit("UPDATE_DELIVERY_STATUS", "Order", orderId, new { request.Status, request.Note });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { orderId, status = ToDeliveryStatus(order.Status) } });
    }

    [HttpGet("tickets")]
    public async Task<IActionResult> GetTickets()
    {
        var tickets = await _context.SupportTickets
            .AsNoTracking()
            .Include(t => t.Replies)
            .OrderByDescending(t => t.UpdatedAt)
            .ToListAsync();

        return Ok(new { success = true, data = tickets.Select(ToTicketResponse) });
    }

    [HttpPost("tickets/{id}/reply")]
    public async Task<IActionResult> ReplyTicket(string id, [FromBody] TicketReplyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { success = false, message = "Reply is required" });

        var ticket = await FindTicketAsync(id);
        if (ticket == null) return NotFound(new { success = false, message = "Ticket not found" });

        ticket.Replies.Add(new SupportReply
        {
            UserId = GetCurrentUserId(),
            SenderName = User.Identity?.Name ?? "Admin",
            Message = request.Message.Trim(),
            IsAdmin = true,
            CreatedAt = DateTime.UtcNow
        });
        ticket.FirstResponseAt ??= DateTime.UtcNow;
        ticket.Status = request.CloseTicket ? "completed" : "processing";
        ticket.UpdatedAt = DateTime.UtcNow;
        AddAudit("REPLY_TICKET", "SupportTicket", ticket.SupportTicketId, new { ticket.TicketNumber, ticket.Status });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = ToTicketResponse(ticket) });
    }

    [HttpPatch("tickets/{id}/status")]
    public async Task<IActionResult> UpdateTicketStatus(string id, [FromBody] TicketStatusRequest request)
    {
        var status = request.Status?.Trim().ToLowerInvariant();
        if (status is not ("pending" or "processing" or "completed"))
            return BadRequest(new { success = false, message = "Invalid ticket status" });

        var ticket = await FindTicketAsync(id);
        if (ticket == null) return NotFound(new { success = false, message = "Ticket not found" });
        ticket.Status = status;
        ticket.UpdatedAt = DateTime.UtcNow;
        AddAudit("UPDATE_TICKET_STATUS", "SupportTicket", ticket.SupportTicketId, new { ticket.TicketNumber, ticket.Status });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = ToTicketResponse(ticket) });
    }

    [HttpDelete("tickets/{id}")]
    public async Task<IActionResult> DeleteTicket(string id)
    {
        var ticket = await FindTicketAsync(id);
        if (ticket == null) return NotFound(new { success = false, message = "Ticket not found" });

        _context.SupportTickets.Remove(ticket);
        AddAudit("DELETE_TICKET", "SupportTicket", ticket.SupportTicketId, new { ticket.TicketNumber });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Ticket deleted" });
    }

    [HttpGet("chat")]
    public async Task<IActionResult> GetChatConversations()
    {
        var conversations = await _context.ChatConversations
            .AsNoTracking()
            .Include(c => c.Messages)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync();

        return Ok(new { success = true, data = conversations.Select(ToChatResponse) });
    }

    [HttpPost("chat/{id}/messages")]
    public async Task<IActionResult> SendChatMessage(string id, [FromBody] ChatMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { success = false, message = "Message is required" });

        var conversation = await FindConversationAsync(id);
        if (conversation == null) return NotFound(new { success = false, message = "Conversation not found" });
        conversation.Messages.Add(new ChatMessage
        {
            UserId = GetCurrentUserId(),
            SenderName = User.Identity?.Name ?? "Admin",
            Message = request.Message.Trim(),
            IsAdmin = true,
            CreatedAt = DateTime.UtcNow
        });
        conversation.Status = "active";
        conversation.UnreadCount = 0;
        conversation.UpdatedAt = DateTime.UtcNow;
        AddAudit("SEND_CHAT_MESSAGE", "ChatConversation", conversation.ChatConversationId, new { conversation.ConversationNumber });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = ToChatResponse(conversation) });
    }

    [HttpDelete("chat/{id}")]
    public async Task<IActionResult> DeleteChatConversation(string id)
    {
        var conversation = await FindConversationAsync(id);
        if (conversation == null) return NotFound(new { success = false, message = "Conversation not found" });

        _context.ChatConversations.Remove(conversation);
        AddAudit("DELETE_CHAT_CONVERSATION", "ChatConversation", conversation.ChatConversationId, new { conversation.ConversationNumber });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Conversation deleted" });
    }

    [HttpGet("security/{userId:int}")]
    public async Task<IActionResult> GetSecurity(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { success = false, message = "User not found" });
        var sessions = new[]
        {
            new { id = "current", device = "Trình duyệt hiện tại", ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1", location = "Việt Nam", time = user.LastLoginAt ?? DateTime.UtcNow, current = true },
        };
        return Ok(new { success = true, data = new { twoFactorEnabled = user.TwoFactorEnabled, sessions } });
    }

    [HttpPut("security/{userId:int}/two-factor")]
    public async Task<IActionResult> SetTwoFactor(int userId, [FromBody] TwoFactorRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound(new { success = false, message = "User not found" });

        user.TwoFactorEnabled = request.Enabled;
        user.UpdatedAt = DateTime.UtcNow;
        AddAudit("UPDATE_TWO_FACTOR", "User", userId, new { request.Enabled });
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { enabled = request.Enabled } });
    }

    [HttpDelete("security/{userId:int}/sessions/{sessionId}")]
    public IActionResult RevokeSession(int userId, string sessionId)
    {
        return sessionId == "current"
            ? BadRequest(new { success = false, message = "Không thể thu hồi phiên hiện tại" })
            : NotFound(new { success = false, message = "Phiên đăng nhập không tồn tại" });
    }

    private async Task<SupportTicket?> FindTicketAsync(string id)
    {
        var query = _context.SupportTickets.Include(t => t.Replies).AsQueryable();
        if (int.TryParse(id, out var numericId))
            return await query.FirstOrDefaultAsync(t => t.SupportTicketId == numericId);

        return await query.FirstOrDefaultAsync(t => t.TicketNumber == id);
    }

    private async Task<ChatConversation?> FindConversationAsync(string id)
    {
        var query = _context.ChatConversations.Include(c => c.Messages).AsQueryable();
        if (int.TryParse(id, out var numericId))
            return await query.FirstOrDefaultAsync(c => c.ChatConversationId == numericId);

        return await query.FirstOrDefaultAsync(c => c.ConversationNumber == id);
    }

    private static object ToTicketResponse(SupportTicket ticket) => new
    {
        id = ticket.TicketNumber,
        ticketId = ticket.SupportTicketId,
        subject = ticket.Subject,
        customer = ticket.CustomerName,
        ticket.Email,
        ticket.Category,
        ticket.Priority,
        ticket.Status,
        ticket.CreatedAt,
        ticket.UpdatedAt,
        ticket.FirstResponseAt,
        replies = ticket.Replies.OrderBy(r => r.CreatedAt).Select(r => new
        {
            id = r.SupportReplyId,
            sender = r.SenderName,
            r.Message,
            r.IsAdmin,
            r.CreatedAt
        })
    };

    private static object ToChatResponse(ChatConversation conversation) => new
    {
        id = conversation.ConversationNumber,
        conversationId = conversation.ChatConversationId,
        customer = conversation.CustomerName,
        conversation.Email,
        conversation.Status,
        unread = conversation.UnreadCount,
        conversation.CreatedAt,
        conversation.UpdatedAt,
        messages = conversation.Messages.OrderBy(m => m.CreatedAt).Select(m => new
        {
            id = m.ChatMessageId,
            sender = m.SenderName,
            m.Message,
            m.IsAdmin,
            m.CreatedAt
        })
    };

    private int? GetCurrentUserId()
    {
        var value = User.FindFirstValue("userId")
            ?? User.FindFirstValue("id")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId) ? userId : null;
    }

    private async Task<T> ReadSettingAsync<T>(string key, T fallback)
    {
        var value = await _context.SystemSettings.AsNoTracking().Where(s => s.Key == key).Select(s => s.Value).FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        try { return JsonSerializer.Deserialize<T>(value) ?? fallback; }
        catch { return fallback; }
    }

    private async Task SaveSettingAsync<T>(string key, T value, string description)
    {
        var setting = await _context.SystemSettings.FindAsync(key);
        if (setting == null)
        {
            setting = new SystemSetting { Key = key, Description = description };
            _context.SystemSettings.Add(setting);
        }
        setting.Value = JsonSerializer.Serialize(value);
        setting.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private async Task EnsureSettingExistsAsync<T>(string key, T value, string description)
    {
        if (!await _context.SystemSettings.AnyAsync(s => s.Key == key))
            await SaveSettingAsync(key, value, description);
    }

    private void AddAudit(string action, string entityName, int? entityId, object details)
    {
        var userIdValue = User.FindFirstValue("userId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        _context.AuditLogs.Add(new AuditLog
        {
            UserId = int.TryParse(userIdValue, out var userId) ? userId : null,
            Username = User.Identity?.Name ?? "Admin",
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            Details = JsonSerializer.Serialize(details)
        });
    }

    private static string ToDeliveryStatus(OrderStatus status) => status switch
    {
        OrderStatus.Completed => "completed",
        OrderStatus.Cancelled => "cancelled",
        OrderStatus.Shipped => "shipped",
        _ => "pending"
    };

}

public class AssignDeliveryRequest { public string DriverName { get; set; } = string.Empty; public string? Vehicle { get; set; } public string? TrackingCode { get; set; } }
public class DeliveryStatusRequest { public string Status { get; set; } = "shipped"; public string? Note { get; set; } }
public class TicketReplyRequest { public string Message { get; set; } = string.Empty; public bool CloseTicket { get; set; } = true; }
public class TicketStatusRequest { public string Status { get; set; } = "processing"; }
public class ChatMessageRequest { public string Message { get; set; } = string.Empty; }
public class TwoFactorRequest { public bool Enabled { get; set; } }
public class DeliveryAssignment { public int OrderId { get; set; } public string DriverName { get; set; } = string.Empty; public string? Vehicle { get; set; } public string? TrackingCode { get; set; } public DateTime UpdatedAt { get; set; } }
