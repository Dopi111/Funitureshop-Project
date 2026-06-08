using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Models
{
    // FACTORY METHOD PATTERN: Base class cho các loại sản phẩm
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [StringLength(300)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Slug { get; set; }

        public string? Description { get; set; }

        [StringLength(100)]
        public string? SKU { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal BasePrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? DiscountPrice { get; set; }

        public int StockQuantity { get; set; } = 0;

        // FACTORY METHOD: Phân loại sản phẩm (Table, Chair, Bed, Sofa, etc.)
        [Required]
        [StringLength(50)]
        public string ProductType { get; set; } = "Furniture";

        // Kích thước - quan trọng cho tính phí ship
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Width { get; set; } // cm

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Height { get; set; } // cm

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Depth { get; set; } // cm

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Weight { get; set; } // kg

        // Thông tin bổ sung
        [StringLength(100)]
        public string? Material { get; set; }

        [StringLength(100)]
        public string? Color { get; set; }

        [StringLength(100)]
        public string? Brand { get; set; }

        public bool IsFeatured { get; set; } = false;
        public bool IsActive { get; set; } = true;

        public int ViewCount { get; set; } = 0;

        // Foreign Keys
        public int CategoryId { get; set; }
        public int? CollectionId { get; set; }

        // Navigation Properties
        [ForeignKey("CategoryId")]
        public virtual Category Category { get; set; } = null!;

        [ForeignKey("CollectionId")]
        public virtual Collection? Collection { get; set; }

        // DECORATOR PATTERN: Attributes để tùy chỉnh sản phẩm
        public virtual ICollection<ProductAttribute> Attributes { get; set; } = new List<ProductAttribute>();

        public virtual ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();

        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // STRATEGY PATTERN: Tính thể tích cho shipping
        public decimal CalculateVolume()
        {
            if (Width.HasValue && Height.HasValue && Depth.HasValue)
            {
                return (Width.Value * Height.Value * Depth.Value) / 1000000; // m³
            }
            return 0;
        }
    }
}