using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models
{
    // COMPOSITE PATTERN: Bộ sưu tập chứa nhiều sản phẩm "Shop the Look"
    public class Collection
    {
        [Key]
        public int CollectionId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Slug { get; set; }

        public string? Description { get; set; }

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public int DisplayOrder { get; set; } = 0;

        // Navigation: Các sản phẩm trong bộ sưu tập
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}