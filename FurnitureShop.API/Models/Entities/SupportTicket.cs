using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.Models.Entities;

public class SupportTicket
{
    [Key]
    public int SupportTicketId { get; set; }

    [Required]
    [StringLength(50)]
    public string TicketNumber { get; set; } = string.Empty;

    public int? UserId { get; set; }

    [Required]
    [StringLength(300)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string Email { get; set; } = string.Empty;

    [StringLength(100)]
    public string Category { get; set; } = "Khác";

    [StringLength(20)]
    public string Priority { get; set; } = "medium";

    [StringLength(20)]
    public string Status { get; set; } = "pending";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? FirstResponseAt { get; set; }

    public virtual User? User { get; set; }
    public virtual ICollection<SupportReply> Replies { get; set; } = new List<SupportReply>();
}
