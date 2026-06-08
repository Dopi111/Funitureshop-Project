using FurnitureShop.API.Data;
using FurnitureShop.API.DTOs;
using FurnitureShop.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace FurnitureShop.API.Services
{
    /// <summary>
    /// Interface cho Authentication Service
    /// </summary>
    public interface IAuthService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RequestPasswordResetAsync(ForgotPasswordDto dto);
        Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto);
        Task<AuthResponseDto> ConfirmPasswordResetAsync(ResetPasswordDto dto);
    }

    /// <summary>
    /// Service xử lý logic Authentication với BCrypt và OTP
    /// </summary>
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext context, ILogger<AuthService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Đăng ký tài khoản mới
        /// </summary>
        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            try
            {
                // Kiểm tra Username đã tồn tại
                if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                {
                    return new AuthResponseDto(false, "Username đã được sử dụng.");
                }

                // Kiểm tra Email đã tồn tại
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                {
                    return new AuthResponseDto(false, "Email đã được sử dụng.");
                }

                // Hash password với BCrypt
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 11);

                // Tạo user mới
                var user = new User
                {
                    Username = dto.Username,
                    Email = dto.Email,
                    PasswordHash = passwordHash,
                    FullName = dto.FullName,
                    Role = UserRole.Customer,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Username} registered successfully.", dto.Username);

                return new AuthResponseDto(
                    true,
                    "Đăng ký thành công!",
                    User: new UserInfoDto(user.UserId, user.Username, user.Email, user.FullName, user.Role.ToString())
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during registration for {Username}", dto.Username);
                return new AuthResponseDto(false, "Đã xảy ra lỗi trong quá trình đăng ký.");
            }
        }

        /// <summary>
        /// Đăng nhập
        /// </summary>
        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == dto.Username);

                if (user == null)
                {
                    return new AuthResponseDto(false, "Username hoặc mật khẩu không đúng.");
                }

                if (!user.IsActive)
                {
                    return new AuthResponseDto(false, "Tài khoản đã bị khóa.");
                }

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

                if (!isPasswordValid)
                {
                    return new AuthResponseDto(false, "Username hoặc mật khẩu không đúng.");
                }

                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("User {Username} logged in successfully.", dto.Username);

                return new AuthResponseDto(
                    true,
                    "Đăng nhập thành công!",
                    Token: null,
                    User: new UserInfoDto(user.UserId, user.Username, user.Email, user.FullName, user.Role.ToString())
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for {Username}", dto.Username);
                return new AuthResponseDto(false, "Đã xảy ra lỗi trong quá trình đăng nhập.");
            }
        }

        /// <summary>
        /// Yêu cầu reset password - Gửi OTP 6 số
        /// </summary>
        public async Task<AuthResponseDto> RequestPasswordResetAsync(ForgotPasswordDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                // Luôn trả về success để tránh leak thông tin email
                if (user == null)
                {
                    _logger.LogWarning("Password reset requested for non-existent email: {Email}", dto.Email);
                    return new AuthResponseDto(true, "Nếu email tồn tại, bạn sẽ nhận được mã OTP.");
                }

                // Tạo OTP 6 số
                string otpCode = GenerateOtp();

                // Lưu OTP và thời gian hết hạn (5 phút)
                user.OtpCode = otpCode;
                user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
                await _context.SaveChangesAsync();

                _logger.LogInformation("OTP generated for {Email}. OTP: {OTP}", dto.Email, otpCode);

                // TODO: Gửi email với OTP
                // Trong môi trường development, trả về OTP trực tiếp để test
                return new AuthResponseDto(
                    true,
                    $"Mã OTP đã được gửi đến email của bạn. OTP: {otpCode} (Dev mode - thực tế sẽ gửi qua email)"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset request for {Email}", dto.Email);
                return new AuthResponseDto(false, "Đã xảy ra lỗi trong quá trình xử lý.");
            }
        }

        /// <summary>
        /// Xác thực OTP
        /// </summary>
        public async Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    return new AuthResponseDto(false, "Email không tồn tại.");
                }

                // Kiểm tra OTP
                if (user.OtpCode != dto.Code)
                {
                    return new AuthResponseDto(false, "Mã OTP không đúng.");
                }

                // Kiểm tra OTP còn hạn
                if (user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
                {
                    return new AuthResponseDto(false, "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
                }

                _logger.LogInformation("OTP verified successfully for {Email}", dto.Email);

                return new AuthResponseDto(true, "Xác thực OTP thành công!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during OTP verification for {Email}", dto.Email);
                return new AuthResponseDto(false, "Đã xảy ra lỗi trong quá trình xác thực.");
            }
        }

        /// <summary>
        /// Xác nhận reset password với OTP
        /// </summary>
        public async Task<AuthResponseDto> ConfirmPasswordResetAsync(ResetPasswordDto dto)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email);

                if (user == null)
                {
                    return new AuthResponseDto(false, "Email không tồn tại.");
                }

                // Kiểm tra OTP
                if (user.OtpCode != dto.Code)
                {
                    return new AuthResponseDto(false, "Mã OTP không đúng.");
                }

                // Kiểm tra OTP còn hạn
                if (user.OtpExpiry == null || user.OtpExpiry < DateTime.UtcNow)
                {
                    return new AuthResponseDto(false, "Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.");
                }

                // Hash mật khẩu mới
                string newPasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 11);

                // Cập nhật password và xóa OTP
                user.PasswordHash = newPasswordHash;
                user.OtpCode = null;
                user.OtpExpiry = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Password reset successfully for user {UserId}", user.UserId);

                return new AuthResponseDto(true, "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset confirmation");
                return new AuthResponseDto(false, "Đã xảy ra lỗi trong quá trình xử lý.");
            }
        }

        /// <summary>
        /// Tạo OTP 6 số ngẫu nhiên
        /// </summary>
        private static string GenerateOtp()
        {
            // Sử dụng RandomNumberGenerator để tạo số ngẫu nhiên an toàn
            byte[] randomBytes = RandomNumberGenerator.GetBytes(4);
            int randomNumber = Math.Abs(BitConverter.ToInt32(randomBytes, 0));
            
            // Lấy 6 số cuối và đảm bảo có đủ 6 chữ số
            return (randomNumber % 1000000).ToString("D6");
        }
    }
}
