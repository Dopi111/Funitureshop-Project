using FurnitureShop.API.Patterns.Observer;
using Microsoft.AspNetCore.Mvc;

namespace FurnitureShop.API.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ISmsService _smsService;

        public NotificationsController(IEmailService emailService, ISmsService smsService)
        {
            _emailService = emailService;
            _smsService = smsService;
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> TestEmail([FromBody] TestEmailRequest request)
        {
            await _emailService.SendEmailAsync(request.To, request.Subject, request.Body);
            return Ok(new { success = true, message = "Test email queued" });
        }

        [HttpPost("test-sms")]
        public async Task<IActionResult> TestSms([FromBody] TestSmsRequest request)
        {
            await _smsService.SendSmsAsync(request.PhoneNumber, request.Message);
            return Ok(new { success = true, message = "Test SMS queued" });
        }
    }

    public class TestEmailRequest
    {
        public string To { get; set; } = string.Empty;
        public string Subject { get; set; } = "[FurnitureShop] Test Email";
        public string Body { get; set; } = "This is a test email.";
    }

    public class TestSmsRequest
    {
        public string PhoneNumber { get; set; } = string.Empty;
        public string Message { get; set; } = "This is a test SMS.";
    }
}
