using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FurnitureShop.API.Models.Entities
{
    public class PurchaseOrder
    {
        [Key]
        public int PurchaseOrderId { get; set; }

        [Required]
        [StringLength(50)]
        public string POCode { get; set; } = string.Empty; // e.g., PO202601001

        public int SupplierId { get; set; }

        [ForeignKey("SupplierId")]
        public virtual Supplier Supplier { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; } = 0;

        [StringLength(50)]
        public string Status { get; set; } = "Completed"; // Pending, Completed, Cancelled

        [StringLength(500)]
        public string? Notes { get; set; }

        public int CreatedById { get; set; } // Admin ID

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; } = null!;

        public virtual ICollection<PurchaseOrderDetail> Details { get; set; } = new List<PurchaseOrderDetail>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class PurchaseOrderDetail
    {
        [Key]
        public int DetailId { get; set; }

        public int PurchaseOrderId { get; set; }

        [ForeignKey("PurchaseOrderId")]
        public virtual PurchaseOrder PurchaseOrder { get; set; } = null!;

        public int ProductId { get; set; }

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;

        public int? VariantId { get; set; }

        [ForeignKey("VariantId")]
        public virtual ProductVariant? Variant { get; set; }

        public int Quantity { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; } // Import price

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalPrice { get; set; } // Quantity * UnitPrice
    }
}
