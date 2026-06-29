using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    public class ProductVariant
    {
        [Key]
        public int VariantId { get; set; }

        public int ProductId { get; set; }

        [Required]
        [StringLength(100)]
        public string SKU { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Color { get; set; }

        [StringLength(100)]
        public string? Size { get; set; } // e.g., 1m8, 2m2

        [StringLength(100)]
        public string? Material { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal AdditionalPrice { get; set; } = 0; // Addition to BasePrice

        public int StockQuantity { get; set; } = 0;

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
