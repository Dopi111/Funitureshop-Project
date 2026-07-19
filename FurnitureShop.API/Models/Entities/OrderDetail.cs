using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models
{
    // Chi tiết đơn hàng
    public class OrderDetail
    {
        [Key]
        public int OrderDetailId { get; set; }

        public int OrderId { get; set; }

        public int ProductId { get; set; }

        [Required]
        [StringLength(300)]
        public string ProductName { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ProductSKU { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        public int Quantity { get; set; }

        // DECORATOR PATTERN: Lưu các thuộc tính đã chọn dạng JSON
        // Ví dụ: {"Color":"Red Velvet","Material":"Oak Wood","Armrest":"Wide"}
        public string? SelectedAttributes { get; set; }

        // Tổng phụ phí từ attributes
        [Column(TypeName = "decimal(18,2)")]
        public decimal AttributesAdjustment { get; set; } = 0;

        // Tổng tiền = (UnitPrice + AttributesAdjustment) * Quantity
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; }

        // Navigation
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}