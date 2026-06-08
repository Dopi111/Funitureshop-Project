using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    // OBSERVER PATTERN: Lịch sử thay đổi trạng thái đơn hàng
    public class OrderStatusHistory
    {
        [Key]
        public int HistoryId { get; set; }

        public int OrderId { get; set; }

        public OrderStatus FromStatus { get; set; }

        public OrderStatus ToStatus { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(100)]
        public string? ChangedBy { get; set; } // User email hoặc "System"

        // Navigation
        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
