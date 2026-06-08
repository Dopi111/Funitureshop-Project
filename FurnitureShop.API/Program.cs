using Microsoft.EntityFrameworkCore;
using FurnitureShop.API.Data;
using FurnitureShop.API.Services;
using FurnitureShop.API.Patterns.Observer;
using FurnitureShop.API.Patterns.Facade;
using FurnitureShop.API.Patterns.Factory;
using FurnitureShop.API.Patterns.Repository.Contracts;
using FurnitureShop.API.Patterns.Repository.Implementations;

var builder = WebApplication.CreateBuilder(args);

// ========== DATABASE CONFIGURATION ==========
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions => sqlOptions.EnableRetryOnFailure()));

// ========== DEPENDENCY INJECTION - DESIGN PATTERNS ==========

// SINGLETON PATTERN: Services
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<ISmsService, SmsService>();

// REPOSITORY PATTERN: Generic Repository
builder.Services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// SCOPED PATTERN: DbContext và Services
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<CategoryService>();

// AUTHENTICATION SERVICE
builder.Services.AddScoped<IAuthService, AuthService>();

// CART SERVICE
builder.Services.AddScoped<ICartService, CartService>();

// FACADE PATTERN: Checkout Service
builder.Services.AddScoped<CheckoutFacade>();

// COMMAND PATTERN: Order Command Invoker (Singleton - duy trì lịch sử command giữa các request)
builder.Services.AddSingleton<FurnitureShop.API.Patterns.Command.OrderCommandInvoker>();

// FACTORY PATTERN: Product Factory
builder.Services.AddSingleton<ProductFactory>();

// ========== API CONFIGURATION ==========
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ========== CORS CONFIGURATION ==========
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ========== BUILD APP ==========
var app = builder.Build();

// ========== MIDDLEWARE PIPELINE ==========
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Furniture Shop API V1");
        c.RoutePrefix = "api/docs"; // Swagger at /api/docs
    });
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // Serve static files from wwwroot
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// ========== DEFAULT ROUTE TO INDEX.HTML ==========
app.MapFallbackToFile("index.html");

// ========== DATABASE MIGRATION ==========
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();

        // Apply migrations
        context.Database.Migrate();

        Console.WriteLine("✅ Database migrations applied successfully!");

        // Display seed data info
        var categoryCount = context.Categories.Count();
        var shippingCount = context.ShippingMethods.Count();

        Console.WriteLine($"📊 Database Statistics:");
        Console.WriteLine($"   - Categories: {categoryCount}");
        Console.WriteLine($"   - Shipping Methods: {shippingCount}");

        // Update categories with null ImageUrl
        var categoriesWithoutImage = context.Categories.Where(c => c.ImageUrl == null).ToList();
        if (categoriesWithoutImage.Any())
        {
            foreach (var cat in categoriesWithoutImage)
            {
                var slug = cat.Slug ?? cat.Name.ToLower().Replace(" ", "-");
                cat.ImageUrl = $"/images/{slug}.jpg";
            }
            context.SaveChanges();
            Console.WriteLine($"   - Updated {categoriesWithoutImage.Count} categories with ImageUrl");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "❌ An error occurred while migrating the database.");
    }
}

// ========== START APPLICATION ==========
Console.WriteLine("\n🚀 Furniture Shop API is running!");
Console.WriteLine("📖 Swagger UI: https://localhost:7206 or http://localhost:5028");
Console.WriteLine("\n🎯 Design Patterns Implemented:");
Console.WriteLine("   1. ✅ Repository Pattern - Generic CRUD operations");
Console.WriteLine("   2. ✅ Composite Pattern - Category tree structure");
Console.WriteLine("   3. ✅ Decorator Pattern - Product price calculation");
Console.WriteLine("   4. ✅ Builder Pattern - Complex Order creation");
Console.WriteLine("   5. ✅ Strategy Pattern - Shipping fee calculation");
Console.WriteLine("   6. ✅ State Pattern - Order status workflow");
Console.WriteLine("   7. ✅ Facade Pattern - Checkout process");
Console.WriteLine("   8. ✅ Factory Method - Product type creation");
Console.WriteLine("   9. ✅ Singleton Pattern - Services (Email, SMS)");
Console.WriteLine("   10. ✅ Observer Pattern - Order notifications");

app.Run();