using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;
using FurnitureShop.API.Patterns.Singleton;
using FurnitureShop.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureShop.API.Controllers
{
    /// <summary>
    /// Controller xử lý Authentication: Register, Login, Forgot Password với OTP
    /// và quản lý Users cho Admin
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly Microsoft.Extensions.Logging.ILogger<AuthController> _aspLogger;
        private readonly AppDbContext _context;
        // SINGLETON PATTERN: Sử dụng Logger Service duy nhất
        private readonly ILoggerService _logger = LoggerService.Instance;

        public AuthController(IAuthService authService, Microsoft.Extensions.Logging.ILogger<AuthController> logger, AppDbContext context)
        {
            _authService = authService;
            _aspLogger = logger;
            _context = context;
            _logger.LogInfo($"AuthController initialized. Logger Instance ID: {LoggerService.Instance.InstanceId}");
        }

        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        [HttpPost("register")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto(false, "Dữ liệu không hợp lệ."));
            }

            var result = await _authService.RegisterAsync(dto);

            if (result.Success)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        /// <summary>
        /// Đăng nhập
        /// </summary>
        [HttpPost("login")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto(false, "Dữ liệu không hợp lệ."));
            }

            var result = await _authService.LoginAsync(dto);

            if (result.Success)
            {
                return Ok(result);
            }

            return Unauthorized(result);
        }

        /// <summary>
        /// Yêu cầu gửi OTP để reset password
        /// </summary>
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto(false, "Email không hợp lệ."));
            }

            var result = await _authService.RequestPasswordResetAsync(dto);
            return Ok(result);
        }

        /// <summary>
        /// Xác thực OTP 6 số
        /// </summary>
        [HttpPost("verify-reset-code")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyResetCode([FromBody] VerifyOtpDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto(false, "Dữ liệu không hợp lệ."));
            }

            var result = await _authService.VerifyOtpAsync(dto);

            if (result.Success)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        /// <summary>
        /// Đặt lại mật khẩu mới với OTP
        /// </summary>
        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponseDto(false, "Dữ liệu không hợp lệ."));
            }

            var result = await _authService.ConfirmPasswordResetAsync(dto);

            if (result.Success)
            {
                return Ok(result);
            }

            return BadRequest(result);
        }

        // =====================================================
        // ADMIN USER MANAGEMENT ENDPOINTS
        // =====================================================

        /// <summary>
        /// Get all users with pagination (Admin only)
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] int? role = null,
            [FromQuery] bool? isActive = null)
        {
            var query = _context.Users.AsQueryable();

            if (role.HasValue)
            {
                query = query.Where(u => (int)u.Role == role.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var users = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.Address,
                    u.City,
                    u.District,
                    u.Ward,
                    u.Role,
                    u.IsActive,
                    u.LastLoginAt,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                data = users,
                page,
                pageSize,
                totalCount,
                totalPages
            });
        }

        /// <summary>
        /// Get single user by ID
        /// </summary>
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.Address,
                    u.City,
                    u.District,
                    u.Ward,
                    u.Role,
                    u.IsActive,
                    u.LastLoginAt,
                    u.CreatedAt,
                    u.UpdatedAt
                })
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            return Ok(user);
        }

        /// <summary>
        /// Create new user (Admin only)
        /// </summary>
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if username already exists
            var existingUsername = await _context.Users.AnyAsync(u => u.Username == dto.Username);
            if (existingUsername)
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại" });

            // Check if email already exists
            var existingEmail = await _context.Users.AnyAsync(u => u.Email == dto.Email);
            if (existingEmail)
                return BadRequest(new { message = "Email đã được sử dụng" });

            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Address = dto.Address,
                City = dto.City,
                District = dto.District,
                Ward = dto.Ward,
                Role = (UserRole)dto.Role,
                IsActive = dto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.UserId }, new
            {
                user.UserId,
                user.Username,
                user.Email,
                user.FullName,
                user.Role,
                user.IsActive
            });
        }

        /// <summary>
        /// Update user (Admin only)
        /// </summary>
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            // Check if email is being changed and already exists
            if (dto.Email != user.Email)
            {
                var existingEmail = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.UserId != id);
                if (existingEmail)
                    return BadRequest(new { message = "Email đã được sử dụng" });
            }

            user.Email = dto.Email;
            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;
            user.Address = dto.Address;
            user.City = dto.City;
            user.District = dto.District;
            user.Ward = dto.Ward;
            user.Role = (UserRole)dto.Role;
            user.IsActive = dto.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            // Update password if provided
            if (!string.IsNullOrEmpty(dto.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.UserId,
                user.Username,
                user.Email,
                user.FullName,
                user.Role,
                user.IsActive,
                message = "Cập nhật thành công"
            });
        }

        /// <summary>
        /// Toggle user active status
        /// </summary>
        [HttpPatch("users/{id}/toggle-status")]
        public async Task<IActionResult> ToggleUserStatus(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            // Get current admin user from token (simplified - in real app, get from JWT)
            // Prevent admin from locking themselves
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (authHeader != null)
            {
                // For now, prevent locking the default admin (ID=1) by themselves
                // In a real app, you'd decode the JWT to get the current user ID
            }

            // Prevent locking admin account with ID 1
            if (user.UserId == 1 && user.IsActive)
                return BadRequest(new { message = "Không thể khóa tài khoản Admin mặc định" });

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                isActive = user.IsActive,
                message = user.IsActive ? "Đã kích hoạt tài khoản" : "Đã vô hiệu hóa tài khoản"
            });
        }

        /// <summary>
        /// Reset user password (Admin only)
        /// </summary>
        [HttpPost("users/{id}/reset-password")]
        public async Task<IActionResult> AdminResetPassword(int id, [FromBody] AdminResetPasswordDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
                return BadRequest(new { message = "Mật khẩu phải có ít nhất 6 ký tự" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đặt lại mật khẩu thành công" });
        }

        /// <summary>
        /// Delete user (Admin only)
        /// </summary>
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users
                .Include(u => u.Orders)
                .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            // Prevent deleting admin with ID 1 (default admin)
            if (user.UserId == 1)
                return BadRequest(new { message = "Không thể xóa tài khoản Admin mặc định" });

            // Prevent admin from deleting themselves (check if user is admin)
            if (user.Role == UserRole.Admin)
                return BadRequest(new { message = "Không thể xóa tài khoản Admin. Hãy hạ cấp vai trò trước khi xóa." });

            // Check if user has orders
            if (user.Orders?.Any() == true)
                return BadRequest(new { message = "Không thể xóa người dùng đã có đơn hàng. Hãy vô hiệu hóa tài khoản thay vì xóa." });

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // =====================================================
        // USER PROFILE ENDPOINTS
        // =====================================================

        /// <summary>
        /// Lấy thông tin đầy đủ của người dùng
        /// </summary>
        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetProfile(int userId)
        {
            var user = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.Username,
                    u.Email,
                    u.FullName,
                    u.PhoneNumber,
                    u.Address,
                    u.City,
                    u.District,
                    u.Ward,
                    Role = u.Role.ToString(),
                    u.IsActive,
                    u.CreatedAt
                })
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "Không tìm thấy người dùng" });

            return Ok(user);
        }

        /// <summary>
        /// Cập nhật thông tin hồ sơ cá nhân (tên, địa chỉ giao hàng mặc định)
        /// </summary>
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            user.FullName = dto.FullName;
            user.Address = dto.Address;
            user.City = dto.City;
            user.District = dto.District;
            user.Ward = dto.Ward;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Cập nhật thông tin thành công" });
        }

        /// <summary>
        /// Đổi mật khẩu – yêu cầu xác nhận mật khẩu cũ
        /// </summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash))
                return BadRequest(new { success = false, message = "Mật khẩu hiện tại không chính xác" });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Đổi mật khẩu thành công" });
        }

        /// <summary>
        /// Gửi OTP để xác minh đổi email hoặc số điện thoại
        /// </summary>
        [HttpPost("send-otp-contact")]
        public async Task<IActionResult> SendOtpForContactUpdate([FromBody] SendOtpForContactUpdateDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            if (dto.ContactType != "email" && dto.ContactType != "phone")
                return BadRequest(new { success = false, message = "Loại liên hệ không hợp lệ" });

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            if (dto.ContactType == "email")
            {
                if (string.IsNullOrWhiteSpace(dto.NewValue) || !dto.NewValue.Contains('@'))
                    return BadRequest(new { success = false, message = "Email không hợp lệ" });
                var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.NewValue && u.UserId != dto.UserId);
                if (emailExists)
                    return BadRequest(new { success = false, message = "Email này đã được sử dụng" });
            }
            else
            {
                if (string.IsNullOrWhiteSpace(dto.NewValue))
                    return BadRequest(new { success = false, message = "Số điện thoại không hợp lệ" });
                var phoneExists = await _context.Users.AnyAsync(u => u.PhoneNumber == dto.NewValue && u.UserId != dto.UserId);
                if (phoneExists)
                    return BadRequest(new { success = false, message = "Số điện thoại này đã được sử dụng" });
            }

            var otpCode = new Random().Next(100000, 999999).ToString();
            user.OtpCode = otpCode;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInfo($"OTP for contact update generated for user {user.UserId}");

            // In production: send OTP via email/SMS. For development, return in response.
            return Ok(new { success = true, message = $"Mã OTP đã được gửi đến {(dto.ContactType == "email" ? "email" : "số điện thoại")} mới.", otpCode });
        }

        /// <summary>
        /// Xác nhận OTP và cập nhật email hoặc số điện thoại
        /// </summary>
        [HttpPut("update-contact")]
        public async Task<IActionResult> UpdateContact([FromBody] UpdateContactDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ" });

            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return NotFound(new { success = false, message = "Không tìm thấy người dùng" });

            if (user.OtpCode != dto.OtpCode)
                return BadRequest(new { success = false, message = "Mã OTP không chính xác" });

            if (user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
                return BadRequest(new { success = false, message = "Mã OTP đã hết hạn. Vui lòng gửi lại." });

            if (dto.ContactType == "email")
            {
                var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.NewValue && u.UserId != dto.UserId);
                if (emailExists)
                    return BadRequest(new { success = false, message = "Email này đã được sử dụng" });
                user.Email = dto.NewValue;
            }
            else if (dto.ContactType == "phone")
            {
                var phoneExists = await _context.Users.AnyAsync(u => u.PhoneNumber == dto.NewValue && u.UserId != dto.UserId);
                if (phoneExists)
                    return BadRequest(new { success = false, message = "Số điện thoại này đã được sử dụng" });
                user.PhoneNumber = dto.NewValue;
            }
            else
            {
                return BadRequest(new { success = false, message = "Loại liên hệ không hợp lệ" });
            }

            user.OtpCode = null;
            user.OtpExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = dto.ContactType == "email" ? "Cập nhật email thành công" : "Cập nhật số điện thoại thành công" });
        }
    }

    // DTOs for User Management
    public class CreateUserDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public int Role { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserDto
    {
        public string Email { get; set; } = string.Empty;
        public string? Password { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? District { get; set; }
        public string? Ward { get; set; }
        public int Role { get; set; } = 0;
        public bool IsActive { get; set; } = true;
    }

    public class AdminResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;
    }
}
