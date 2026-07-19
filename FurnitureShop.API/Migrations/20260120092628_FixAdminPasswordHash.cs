using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FurnitureShop.API.Migrations
{
    /// <inheritdoc />
    public partial class FixAdminPasswordHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$8K1p/kLpGxOBWlMvSHV4OeQYHsJ1PgXvXdvVm7cS5YvLq8xEYz.Hy");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$K3g8h7J9kL2mN4pQ6rS8tOuVwXyZ1aB3cD5eF7gH9iJ0kL2mN4pQ6");
        }
    }
}
