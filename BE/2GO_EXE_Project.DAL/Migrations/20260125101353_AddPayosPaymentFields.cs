using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace _2GO_EXE_Project.DAL.Migrations
{
    /// <inheritdoc />
    public partial class AddPayosPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayosCheckoutUrl",
                table: "Payments",
                type: "character varying(500)",
                unicode: false,
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PayosOrderCode",
                table: "Payments",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayosPaymentLinkId",
                table: "Payments",
                type: "character varying(255)",
                unicode: false,
                maxLength: 255,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Event",
                table: "PaymentLogs",
                type: "character varying(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Provider",
                table: "PaymentLogs",
                type: "character varying(50)",
                unicode: false,
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayosCheckoutUrl",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PayosOrderCode",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "PayosPaymentLinkId",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "Event",
                table: "PaymentLogs");

            migrationBuilder.DropColumn(
                name: "Provider",
                table: "PaymentLogs");
        }
    }
}
