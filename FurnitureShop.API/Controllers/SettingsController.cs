using FurnitureShop.API.Data;
using FurnitureShop.API.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    public class UpdateSettingDto
    {
        public string Value { get; set; } = string.Empty;
    }

    [Route("api/settings")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SettingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/settings
        [AllowAnonymous]
        [HttpGet]
        public async Task<IActionResult> GetAllSettings()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            var settingsDict = settings.ToDictionary(s => s.Key, s => s.Value);

            return Ok(new { success = true, data = settingsDict });
        }

        // GET: api/settings/details
        [Authorize(Roles = "Admin")]
        [HttpGet("details")]
        public async Task<IActionResult> GetAllSettingsDetails()
        {
            var settings = await _context.SystemSettings.ToListAsync();
            return Ok(new { success = true, data = settings });
        }

        // PUT: api/settings/{key}
        [Authorize(Roles = "Admin")]
        [HttpPut("{key}")]
        public async Task<IActionResult> UpdateSetting(string key, [FromBody] UpdateSettingDto dto)
        {
            var setting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy cấu hình này" });
            }

            setting.Value = dto.Value;
            setting.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = setting, message = "Cập nhật cấu hình thành công" });
        }
    }
}
