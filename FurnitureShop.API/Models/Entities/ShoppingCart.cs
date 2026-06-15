using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    /// <summary>
    /// Giỏ hàng của từng user
    /// </summary>
    public class ShoppingCart
    {
        [Key]
        public int CartId { get; set; }

        // Foreign Key - Mỗi user chỉ có 1 giỏ hàng
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        // Danh sách sản phẩm trong giỏ
        public virtual ICollection<CartItem> Items { get; set; } = new List<CartItem>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Tính tổng tiền giỏ hàng
        [NotMapped]
        public decimal TotalAmount => Items?.Sum(i => i.Subtotal) ?? 0;

        // Tính tổng số lượng sản phẩm
        [NotMapped]
        public int TotalItems => Items?.Sum(i => i.Quantity) ?? 0;
    }

    /// <summary>
    /// Chi tiết từng sản phẩm trong giỏ hàng
    /// </summary>
    public class CartItem
    {
        [Key]
        public int CartItemId { get; set; }

        // Foreign Key - Giỏ hàng
        public int CartId { get; set; }

        [ForeignKey("CartId")]
        public virtual ShoppingCart Cart { get; set; } = null!;

        // Foreign Key - Sản phẩm
        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        // Số lượng
        [Range(1, 999)]
        public int Quantity { get; set; } = 1;

        // Giá tại thời điểm thêm vào giỏ (để tracking nếu giá thay đổi)
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        // Thuộc tính tùy chỉnh (nếu có - JSON string)
        public string? SelectedAttributes { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Tính thành tiền
        [NotMapped]
        public decimal Subtotal => UnitPrice * Quantity;
    }
}
