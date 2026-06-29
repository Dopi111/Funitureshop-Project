using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    /// <summary>
    /// Entity lưu log mỗi lần khách hàng click xem sản phẩm.
    /// Được thiết kế để write-heavy (ghi nhiều) và đọc cho báo cáo thống kê.
    /// </summary>
    public class ProductView
    {
        [Key]
        public long Id { get; set; }

        /// <summary>
        /// FK tới bảng Products. Index riêng để tăng tốc GROUP BY ProductId.
        /// </summary>
        public int ProductId { get; set; }

        /// <summary>
        /// Id của user đã đăng nhập. Null nếu khách vãng lai.
        /// </summary>
        [StringLength(50)]
        public string? UserId { get; set; }

        /// <summary>
        /// Địa chỉ IP của client (IPv4 hoặc IPv6, tối đa 45 ký tự).
        /// </summary>
        [Required]
        [StringLength(45)]
        public string IpAddress { get; set; } = string.Empty;

        /// <summary>
        /// Thời điểm xem trang. Lưu UTC để tránh lỗi timezone khi thống kê.
        /// Index composite (ProductId, ViewedAt) để tối ưu truy vấn "top N ngày qua".
        /// </summary>
        public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Dwell Time: số giây khách hàng ở lại trang sản phẩm.
        /// Null khi mới tạo — được cập nhật bằng PATCH từ sendBeacon khi khách rời trang.
        /// </summary>
        public int? DurationSeconds { get; set; }

        // Navigation Property
        [ForeignKey(nameof(ProductId))]
        public virtual Product Product { get; set; } = null!;
    }
}
