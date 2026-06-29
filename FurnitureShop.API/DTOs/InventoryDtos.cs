using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.DTOs
{
    public class SupplierDto
    {
        public int SupplierId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateSupplierDto
    {
        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }
    }

    public class PurchaseOrderDetailDto
    {
        public int DetailId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int? VariantId { get; set; }
        public string? VariantSKU { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class PurchaseOrderDto
    {
        public int PurchaseOrderId { get; set; }
        public string POCode { get; set; } = string.Empty;
        public int SupplierId { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<PurchaseOrderDetailDto> Details { get; set; } = new List<PurchaseOrderDetailDto>();
    }

    public class CreatePurchaseOrderDetailDto
    {
        [Required]
        public int ProductId { get; set; }
        
        public int? VariantId { get; set; }

        [Required]
        [Range(1, 100000)]
        public int Quantity { get; set; }

        [Required]
        [Range(0, 1000000000)]
        public decimal UnitPrice { get; set; }
    }

    public class CreatePurchaseOrderDto
    {
        [Required]
        public int SupplierId { get; set; }

        public string? Notes { get; set; }

        [Required]
        [MinLength(1)]
        public List<CreatePurchaseOrderDetailDto> Details { get; set; } = new List<CreatePurchaseOrderDetailDto>();
    }
}
