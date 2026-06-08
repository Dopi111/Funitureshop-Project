using System.Collections.Concurrent;

namespace FurnitureShop.API.Patterns.Singleton
{
    /// <summary>
    /// Interface cho Logger Service
    /// </summary>
    public interface ILoggerService
    {
        void LogInfo(string message);
        void LogWarning(string message);
        void LogError(string message, Exception? exception = null);
        void LogDebug(string message);
        IReadOnlyList<LogEntry> GetLogs();
    }

    /// <summary>
    /// Log Entry để lưu trữ thông tin log
    /// </summary>
    public class LogEntry
    {
        public DateTime Timestamp { get; set; }
        public LogLevel Level { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ExceptionDetails { get; set; }
    }

    /// <summary>
    /// Mức độ log
    /// </summary>
    public enum LogLevel
    {
        Debug,
        Info,
        Warning,
        Error
    }

    /// <summary>
    /// SINGLETON PATTERN: Logger Service chỉ có một instance duy nhất trong toàn bộ ứng dụng.
    /// 
    /// Đặc điểm:
    /// - Private constructor: Ngăn việc tạo instance từ bên ngoài
    /// - Static instance: Lưu trữ instance duy nhất
    /// - Thread-safe: Sử dụng Lazy<T> để đảm bảo an toàn trong môi trường đa luồng
    /// - Double-check locking không cần thiết khi dùng Lazy<T>
    /// </summary>
    public sealed class LoggerService : ILoggerService
    {
        // Lazy initialization đảm bảo thread-safe và chỉ tạo instance khi cần
        private static readonly Lazy<LoggerService> _instance = 
            new Lazy<LoggerService>(() => new LoggerService());

        // Thread-safe collection để lưu logs
        private readonly ConcurrentQueue<LogEntry> _logs = new ConcurrentQueue<LogEntry>();
        
        // Giới hạn số lượng log entries để tránh memory leak
        private const int MaxLogEntries = 1000;

        // ID duy nhất để chứng minh chỉ có 1 instance
        public Guid InstanceId { get; }

        /// <summary>
        /// Property để truy cập instance duy nhất (Singleton access point)
        /// </summary>
        public static LoggerService Instance => _instance.Value;

        /// <summary>
        /// Private constructor - ngăn việc tạo instance từ bên ngoài class
        /// </summary>
        private LoggerService()
        {
            InstanceId = Guid.NewGuid();
            LogInfo($"LoggerService Singleton initialized. Instance ID: {InstanceId}");
        }

        /// <summary>
        /// Ghi log với mức Info
        /// </summary>
        public void LogInfo(string message)
        {
            AddLog(LogLevel.Info, message);
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine($"[INFO] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
            Console.ResetColor();
        }

        /// <summary>
        /// Ghi log với mức Warning
        /// </summary>
        public void LogWarning(string message)
        {
            AddLog(LogLevel.Warning, message);
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine($"[WARNING] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
            Console.ResetColor();
        }

        /// <summary>
        /// Ghi log với mức Error
        /// </summary>
        public void LogError(string message, Exception? exception = null)
        {
            var exceptionDetails = exception?.ToString();
            AddLog(LogLevel.Error, message, exceptionDetails);
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"[ERROR] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
            if (exception != null)
            {
                Console.WriteLine($"Exception: {exception.Message}");
            }
            Console.ResetColor();
        }

        /// <summary>
        /// Ghi log với mức Debug
        /// </summary>
        public void LogDebug(string message)
        {
            AddLog(LogLevel.Debug, message);
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine($"[DEBUG] {DateTime.Now:yyyy-MM-dd HH:mm:ss} - {message}");
            Console.ResetColor();
        }

        /// <summary>
        /// Lấy danh sách các log entries
        /// </summary>
        public IReadOnlyList<LogEntry> GetLogs()
        {
            return _logs.ToList().AsReadOnly();
        }

        /// <summary>
        /// Thêm log entry vào queue với giới hạn số lượng
        /// </summary>
        private void AddLog(LogLevel level, string message, string? exceptionDetails = null)
        {
            var entry = new LogEntry
            {
                Timestamp = DateTime.Now,
                Level = level,
                Message = message,
                ExceptionDetails = exceptionDetails
            };

            _logs.Enqueue(entry);

            // Xóa log cũ nếu vượt quá giới hạn
            while (_logs.Count > MaxLogEntries)
            {
                _logs.TryDequeue(out _);
            }
        }
    }
}
