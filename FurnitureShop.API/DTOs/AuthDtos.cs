using System.ComponentModel.DataAnnotations;

namespace FurnitureShop.API.DTOs
{
    /// <summary>
    /// DTO cho đăng ký tài khoản mới
    /// </summary>
    public record RegisterDto(
        [Required][StringLength(50, MinimumLength = 3)] string Username,
        [Required][EmailAddress] string Email,
        [Required][StringLength(100, MinimumLength = 6)] string Password,
        [Required][StringLength(100)] string FullName
    );

    /// <summary>
    /// DTO cho đăng nhập
    /// </summary>
    public record LoginDto(
        [Required] string Username,
        [Required] string Password
    );

    /// <summary>
    /// DTO cho yêu cầu gửi OTP reset password
    /// </summary>
    public record ForgotPasswordDto(
        [Required][EmailAddress] string Email
    );

    /// <summary>
    /// DTO cho xác thực OTP
    /// </summary>
    public record VerifyOtpDto(
        [Required][EmailAddress] string Email,
        [Required][StringLength(6, MinimumLength = 6)] string Code
    );

    /// <summary>
    /// DTO cho xác nhận reset password với OTP
    /// </summary>
    public record ResetPasswordDto(
        [Required][EmailAddress] string Email,
        [Required][StringLength(6, MinimumLength = 6)] string Code,
        [Required][StringLength(100, MinimumLength = 6)] string NewPassword
    );

    /// <summary>
    /// DTO kết quả trả về cho các API Authentication
    /// </summary>
    public record AuthResponseDto(
        bool Success,
        string Message,
        string? Token = null,
        UserInfoDto? User = null
    );

    /// <summary>
    /// DTO thông tin user trả về (không bao gồm password)
    /// </summary>
    public record UserInfoDto(
        int UserId,
        string Username,
        string Email,
        string FullName,
        string Role
    );

    /// <summary>
    /// DTO cập nhật thông tin hồ sơ cá nhân (tên, địa chỉ)
    /// </summary>
    public record UpdateProfileDto(
        [Required] int UserId,
        [Required][StringLength(100)] string FullName,
        [StringLength(300)] string? Address,
        [StringLength(100)] string? City,
        [StringLength(100)] string? District,
        [StringLength(100)] string? Ward
    );

    /// <summary>
    /// DTO đổi mật khẩu (yêu cầu xác nhận mật khẩu cũ)
    /// </summary>
    public record ChangePasswordDto(
        [Required] int UserId,
        [Required] string OldPassword,
        [Required][StringLength(100, MinimumLength = 6)] string NewPassword
    );

    /// <summary>
    /// DTO gửi OTP để xác minh đổi email / số điện thoại
    /// </summary>
    public record SendOtpForContactUpdateDto(
        [Required] int UserId,
        [Required] string ContactType,
        [Required] string NewValue
    );

    /// <summary>
    /// DTO xác nhận OTP và cập nhật email / số điện thoại
    /// </summary>
    public record UpdateContactDto(
        [Required] int UserId,
        [Required] string ContactType,
        [Required] string NewValue,
        [Required][StringLength(6, MinimumLength = 6)] string OtpCode
    );
}
