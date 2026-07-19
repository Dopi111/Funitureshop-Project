using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.Models.Entities;

public class ChatConversation
{
    [Key]
    public int ChatConversationId { get; set; }

    [Required]
    [StringLength(50)]
    public string ConversationNumber { get; set; } = string.Empty;

    public int? UserId { get; set; }

    [Required]
    [StringLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(20)]
    public string Status { get; set; } = "waiting";

    public int UnreadCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public virtual User? User { get; set; }
    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
