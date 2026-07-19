using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.Models.Entities;

public class ChatMessage
{
    [Key]
    public int ChatMessageId { get; set; }

    public int ChatConversationId { get; set; }
    public int? UserId { get; set; }

    [Required]
    [StringLength(200)]
    public string SenderName { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;

    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ChatConversation ChatConversation { get; set; } = null!;
    public virtual User? User { get; set; }
}
