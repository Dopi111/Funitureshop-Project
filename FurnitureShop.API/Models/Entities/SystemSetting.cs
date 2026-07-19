using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.Models.Entities
{
    public class SystemSetting
    {
        [Key]
        [StringLength(100)]
        public string Key { get; set; } = string.Empty;

        public string Value { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Description { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
