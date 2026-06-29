using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Data;
using FurnitureShop.API.Models.Entities;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CouponsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCoupons()
        {
            var coupons = await _context.Coupons
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
            return Ok(new { data = coupons, success = true });
        }

        [HttpPost]
        public async Task<IActionResult> CreateCoupon([FromBody] Coupon coupon)
        {
            coupon.CreatedAt = DateTime.UtcNow;
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();
            return Ok(new { data = coupon, success = true, message = "Thêm mã giảm giá thành công" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCoupon(int id, [FromBody] Coupon coupon)
        {
            if (id != coupon.CouponId) return BadRequest();

            var existing = await _context.Coupons.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Code = coupon.Code;
            existing.Description = coupon.Description;
            existing.DiscountPercentage = coupon.DiscountPercentage;
            existing.MaxDiscountAmount = coupon.MaxDiscountAmount;
            existing.MinOrderAmount = coupon.MinOrderAmount;
            existing.StartDate = coupon.StartDate;
            existing.EndDate = coupon.EndDate;
            existing.UsageLimit = coupon.UsageLimit;
            existing.IsActive = coupon.IsActive;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { data = existing, success = true, message = "Cập nhật thành công" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCoupon(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return NotFound();

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa mã giảm giá thành công" });
        }
    }
}
