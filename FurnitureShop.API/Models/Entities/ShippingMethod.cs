using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models
{
    // STRATEGY PATTERN: Các phương thức vận chuyển khác nhau
    public class ShippingMethod
    {
        [Key]
        public int ShippingMethodId { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty; // "Nội thành HCM", "Liên tỉnh miền Nam", "Toàn quốc"

        [Required]
        [StringLength(100)]
        public string Code { get; set; } = string.Empty; // "LOCAL", "REGIONAL", "NATIONAL"

        [StringLength(500)]
        public string? Description { get; set; }

        // STRATEGY PATTERN: Base fee
        [Column(TypeName = "decimal(18,2)")]
        public decimal BaseFee { get; set; }

        // Phí theo khoảng cách (VND/km)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? FeePerKm { get; set; }

        // Phí theo trọng lượng (VND/kg)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? FeePerKg { get; set; }

        // Phí theo thể tích (VND/m³)
        [Column(TypeName = "decimal(18,2)")]
        public decimal? FeePerCubicMeter { get; set; }

        // Giới hạn khu vực (JSON: ["HCM", "Binh Duong", ...])
        public string? ApplicableRegions { get; set; }

        // Thời gian giao hàng ước tính (ngày)
        public int EstimatedDeliveryDays { get; set; } = 3;

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        // Navigation
        public virtual ICollection<Order> Orders { get; set; } = new List<Order>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}