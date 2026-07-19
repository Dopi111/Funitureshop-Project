using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    public class Coupon
    {
        [Key]
        public int CouponId { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal DiscountPercentage { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxDiscountAmount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MinOrderAmount { get; set; }

        public DateTime StartDate { get; set; } = DateTime.UtcNow;
        
        public DateTime EndDate { get; set; }

        public int UsageLimit { get; set; } = 0; // 0 = unlimited

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
