using System;
using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.Models.Entities
{
    public class AuditLog
    {
        [Key]
        public int LogId { get; set; }

        public int? UserId { get; set; }

        [StringLength(100)]
        public string? Username { get; set; }

        [Required]
        [StringLength(100)]
        public string Action { get; set; } = string.Empty;

        [StringLength(100)]
        public string? EntityName { get; set; }

        public int? EntityId { get; set; }

        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
