using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Services
{
    public interface IPurchaseOrderService
    {
        Task<List<SupplierDto>> GetSuppliersAsync();
        Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto);
        Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int adminUserId);
        Task<List<PurchaseOrderDto>> GetPurchaseOrdersAsync();
        Task<bool> CompletePurchaseOrderAsync(int poId);
    }

    public class PurchaseOrderService : IPurchaseOrderService
    {
        private readonly AppDbContext _context;

        public PurchaseOrderService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<SupplierDto>> GetSuppliersAsync()
        {
            return await _context.Suppliers
                .Select(s => new SupplierDto
                {
                    SupplierId = s.SupplierId,
                    Name = s.Name,
                    Phone = s.Phone,
                    Email = s.Email,
                    Address = s.Address,
                    Notes = s.Notes,
                    IsActive = s.IsActive,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<SupplierDto> CreateSupplierAsync(CreateSupplierDto dto)
        {
            var supplier = new Supplier
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Email = dto.Email,
                Address = dto.Address,
                Notes = dto.Notes
            };

            _context.Suppliers.Add(supplier);
            await _context.SaveChangesAsync();

            return new SupplierDto
            {
                SupplierId = supplier.SupplierId,
                Name = supplier.Name,
                Phone = supplier.Phone,
                Email = supplier.Email,
                Address = supplier.Address,
                Notes = supplier.Notes,
                IsActive = supplier.IsActive,
                CreatedAt = supplier.CreatedAt
            };
        }

        public async Task<PurchaseOrderDto> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto, int adminUserId)
        {
            var poCode = $"PO{DateTime.UtcNow:yyyyMMdd}{new Random().Next(1000, 9999)}";
            
            var po = new PurchaseOrder
            {
                POCode = poCode,
                SupplierId = dto.SupplierId,
                Status = "Pending",
                Notes = dto.Notes,
                CreatedById = adminUserId,
                TotalAmount = dto.Details.Sum(d => d.Quantity * d.UnitPrice)
            };

            foreach (var d in dto.Details)
            {
                po.Details.Add(new PurchaseOrderDetail
                {
                    ProductId = d.ProductId,
                    VariantId = d.VariantId,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    TotalPrice = d.Quantity * d.UnitPrice
                });
            }

            _context.PurchaseOrders.Add(po);
            await _context.SaveChangesAsync();

            return await GetPurchaseOrderByIdAsync(po.PurchaseOrderId);
        }

        public async Task<List<PurchaseOrderDto>> GetPurchaseOrdersAsync()
        {
            return await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.CreatedBy)
                .Include(po => po.Details)
                    .ThenInclude(d => d.Product)
                .Include(po => po.Details)
                    .ThenInclude(d => d.Variant)
                .OrderByDescending(po => po.CreatedAt)
                .Select(po => MapToDto(po))
                .ToListAsync();
        }

        private async Task<PurchaseOrderDto> GetPurchaseOrderByIdAsync(int id)
        {
            var po = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.CreatedBy)
                .Include(po => po.Details)
                    .ThenInclude(d => d.Product)
                .Include(po => po.Details)
                    .ThenInclude(d => d.Variant)
                .FirstOrDefaultAsync(p => p.PurchaseOrderId == id);

            if (po == null) throw new Exception("PO not found");
            return MapToDto(po);
        }

        private static PurchaseOrderDto MapToDto(PurchaseOrder po)
        {
            return new PurchaseOrderDto
            {
                PurchaseOrderId = po.PurchaseOrderId,
                POCode = po.POCode,
                SupplierId = po.SupplierId,
                SupplierName = po.Supplier?.Name ?? "",
                TotalAmount = po.TotalAmount,
                Status = po.Status,
                Notes = po.Notes,
                CreatedByName = po.CreatedBy?.FullName ?? po.CreatedBy?.Username ?? "",
                CreatedAt = po.CreatedAt,
                Details = po.Details.Select(d => new PurchaseOrderDetailDto
                {
                    DetailId = d.DetailId,
                    ProductId = d.ProductId,
                    ProductName = d.Product?.Name ?? "",
                    VariantId = d.VariantId,
                    VariantSKU = d.Variant?.SKU,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    TotalPrice = d.TotalPrice
                }).ToList()
            };
        }

        public async Task<bool> CompletePurchaseOrderAsync(int poId)
        {
            var po = await _context.PurchaseOrders
                .Include(p => p.Details)
                .FirstOrDefaultAsync(p => p.PurchaseOrderId == poId);

            if (po == null || po.Status == "Completed") return false;

            // Tăng số lượng tồn kho
            foreach (var detail in po.Details)
            {
                if (detail.VariantId.HasValue)
                {
                    var variant = await _context.ProductVariants.FindAsync(detail.VariantId.Value);
                    if (variant != null) variant.StockQuantity += detail.Quantity;
                }
                else
                {
                    var product = await _context.Products.FindAsync(detail.ProductId);
                    if (product != null) product.StockQuantity += detail.Quantity;
                }
            }

            po.Status = "Completed";
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
