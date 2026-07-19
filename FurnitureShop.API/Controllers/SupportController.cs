using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using FurnitureShop.API.Data;
using FurnitureShop.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers;

[ApiController]
[Route("api/support")]
public class SupportController : ControllerBase
{
    private readonly AppDbContext _context;

    public SupportController(AppDbContext context)
    {
        _context = context;
    }

    [AllowAnonymous]
    [HttpPost("tickets")]
    public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketRequest request)
    {
        var now = DateTime.UtcNow;
        var ticket = new SupportTicket
        {
            TicketNumber = CreateNumber("TK"),
            UserId = GetCurrentUserId(),
            Subject = request.Subject.Trim(),
            CustomerName = request.Customer.Trim(),
            Email = request.Email.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Khác" : request.Category.Trim(),
            Priority = NormalizePriority(request.Priority),
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        if (!string.IsNullOrWhiteSpace(request.Message))
        {
            ticket.Replies.Add(new SupportReply
            {
                UserId = ticket.UserId,
                SenderName = ticket.CustomerName,
                Message = request.Message.Trim(),
                IsAdmin = false,
                CreatedAt = now
            });
        }

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(CreateTicket), new { id = ticket.TicketNumber }, new
        {
            success = true,
            data = new
            {
                id = ticket.TicketNumber,
                ticketId = ticket.SupportTicketId,
                ticket.Subject,
                customer = ticket.CustomerName,
                ticket.Email,
                ticket.Category,
                ticket.Priority,
                ticket.Status,
                ticket.CreatedAt,
                ticket.UpdatedAt
            }
        });
    }

    [AllowAnonymous]
    [HttpPost("chat")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateChatConversationRequest request)
    {
        var now = DateTime.UtcNow;
        var conversation = new ChatConversation
        {
            ConversationNumber = CreateNumber("CHAT"),
            UserId = GetCurrentUserId(),
            CustomerName = request.Customer.Trim(),
            Email = request.Email.Trim(),
            Status = "waiting",
            UnreadCount = 1,
            CreatedAt = now,
            UpdatedAt = now,
            Messages = new List<ChatMessage>
            {
                new()
                {
                    UserId = GetCurrentUserId(),
                    SenderName = request.Customer.Trim(),
                    Message = request.Message.Trim(),
                    IsAdmin = false,
                    CreatedAt = now
                }
            }
        };

        _context.ChatConversations.Add(conversation);
        await _context.SaveChangesAsync();
        return StatusCode(StatusCodes.Status201Created, new
        {
            success = true,
            data = ToChatResponse(conversation)
        });
    }

    [AllowAnonymous]
    [HttpPost("chat/{id}/messages")]
    public async Task<IActionResult> SendCustomerMessage(string id, [FromBody] CreateChatMessageRequest request)
    {
        var conversation = await FindConversationAsync(id);
        if (conversation == null)
            return NotFound(new { success = false, message = "Conversation not found" });

        var now = DateTime.UtcNow;
        conversation.Messages.Add(new ChatMessage
        {
            UserId = GetCurrentUserId(),
            SenderName = conversation.CustomerName,
            Message = request.Message.Trim(),
            IsAdmin = false,
            CreatedAt = now
        });
        conversation.Status = "waiting";
        conversation.UnreadCount += 1;
        conversation.UpdatedAt = now;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = ToChatResponse(conversation) });
    }

    private async Task<ChatConversation?> FindConversationAsync(string id)
    {
        var query = _context.ChatConversations.Include(c => c.Messages).AsQueryable();
        if (int.TryParse(id, out var numericId))
            return await query.FirstOrDefaultAsync(c => c.ChatConversationId == numericId);

        return await query.FirstOrDefaultAsync(c => c.ConversationNumber == id);
    }

    private int? GetCurrentUserId()
    {
        var value = User.FindFirstValue("userId")
            ?? User.FindFirstValue("id")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(value, out var userId) ? userId : null;
    }

    private static string CreateNumber(string prefix) =>
        $"{prefix}-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid():N}"[..(prefix.Length + 19)].ToUpperInvariant();

    private static string NormalizePriority(string? priority) => priority?.Trim().ToLowerInvariant() switch
    {
        "low" => "low",
        "high" => "high",
        _ => "medium"
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
}

public class CreateSupportTicketRequest
{
    [Required, StringLength(300)]
    public string Subject { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Customer { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(20)]
    public string? Priority { get; set; }

    public string? Message { get; set; }
}

public class CreateChatConversationRequest
{
    [Required, StringLength(200)]
    public string Customer { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;
}

public class CreateChatMessageRequest
{
    [Required]
    public string Message { get; set; } = string.Empty;
}
