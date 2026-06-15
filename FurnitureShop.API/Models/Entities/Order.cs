using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Models
{
    // STATE PATTERN: Trạng thái đơn hàng
    public enum OrderStatus
    {
        Pending = 1,      // Chờ xác nhận
        Processing = 2,   // Đang xử lý
        Shipped = 3,      // Đang giao hàng
        Completed = 4,    // Hoàn thành
        Cancelled = 5     // Đã hủy
    }

    // BUILDER PATTERN: Order phức tạp với nhiều thông tin
    public class Order
    {
        [Key]
        public int OrderId { get; set; }

        [Required]
        [StringLength(50)]
        public string OrderNumber { get; set; } = string.Empty; // AUTO: ORD20260120001

        public int UserId { get; set; }

        // STATE PATTERN: Quản lý workflow
        public OrderStatus Status { get; set; } = OrderStatus.Pending;

        // Thông tin giao hàng
        [Required]
        [StringLength(100)]
        public string ShippingFullName { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string ShippingPhone { get; set; } = string.Empty;

        [Required]
        [StringLength(300)]
        public string ShippingAddress { get; set; } = string.Empty;

        [StringLength(100)]
        public string? ShippingCity { get; set; }

        [StringLength(100)]
        public string? ShippingDistrict { get; set; }

        [StringLength(100)]
        public string? ShippingWard { get; set; }

        // Phí ship
        public int? ShippingMethodId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ShippingFee { get; set; } = 0;

        // Tổng tiền
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; } // Tổng tiền hàng

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } // SubTotal + ShippingFee

        [StringLength(1000)]
        public string? Notes { get; set; }

        [StringLength(100)]
        public string? PaymentMethod { get; set; } = "COD";

        public bool IsPaid { get; set; } = false;

        public DateTime? PaidAt { get; set; }

        // STATE PATTERN: Tracking status changes
        public DateTime? ProcessedAt { get; set; }
        public DateTime? ShippedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        [ForeignKey("ShippingMethodId")]
        public virtual ShippingMethod? ShippingMethod { get; set; }

        public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

        // OBSERVER PATTERN: Lịch sử thay đổi trạng thái
        public virtual ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}