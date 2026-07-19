using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models
{
    // DECORATOR PATTERN: Thuộc tính tùy chỉnh sản phẩm (màu sắc, vật liệu, tay vịn...)
    public class ProductAttribute
    {
        [Key]
        public int AttributeId { get; set; }

        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string AttributeName { get; set; } = string.Empty; // "Color", "Material", "Armrest"

        [Required]
        [StringLength(200)]
        public string AttributeValue { get; set; } = string.Empty; // "Red Velvet", "Oak Wood", "Wide Armrest"

        // DECORATOR PATTERN: Điều chỉnh giá khi chọn thuộc tính này
        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceAdjustment { get; set; } = 0; // +500.000đ cho vải nhung cao cấp

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsAvailable { get; set; } = true;

        // Navigation
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}