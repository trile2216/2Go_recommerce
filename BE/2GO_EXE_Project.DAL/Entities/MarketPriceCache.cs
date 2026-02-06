using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace _2GO_EXE_Project.DAL.Entities;

[Table("MarketPriceCache")]
public partial class MarketPriceCache
{
    [Key]
    [StringLength(255)]
    [Unicode(false)]
    public string ProductKey { get; set; } = null!;

    [Column(TypeName = "decimal(15, 2)")]
    public decimal MinPrice { get; set; }

    [Column(TypeName = "decimal(15, 2)")]
    public decimal AvgPrice { get; set; }

    [Column(TypeName = "decimal(15, 2)")]
    public decimal MaxPrice { get; set; }

    public string? SourcesJson { get; set; }

    public DateTime LastUpdated { get; set; }
}
