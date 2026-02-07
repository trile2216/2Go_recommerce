using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using _2GO_EXE_Project.BAL.Constants;
using _2GO_EXE_Project.BAL.DTOs.Auth;
using _2GO_EXE_Project.BAL.DTOs.Shipping;
using _2GO_EXE_Project.BAL.DTOs.Notifications;
using _2GO_EXE_Project.BAL.Interfaces;
using _2GO_EXE_Project.BAL.Settings;
using _2GO_EXE_Project.DAL.Entities;
using _2GO_EXE_Project.DAL.Repositories.Interfaces;
using Microsoft.Extensions.Options;

namespace _2GO_EXE_Project.BAL.Services;

public class ShippingService : IShippingService
{
    private readonly IUnitOfWork _uow;
    private readonly IGhnShippingService _ghnShippingService;
    private readonly GhnSettings _ghnSettings;
    private readonly INotificationService _notificationService;

    public ShippingService(IUnitOfWork uow, IGhnShippingService ghnShippingService, IOptions<GhnSettings> options, INotificationService notificationService)
    {
        _uow = uow;
        _ghnShippingService = ghnShippingService;
        _ghnSettings = options.Value ?? new GhnSettings();
        _notificationService = notificationService;
    }

    private static long GetUserId(ClaimsPrincipal principal)
    {
        var sub = principal.FindFirst("sub")?.Value
                  ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
                  ?? principal.FindFirst(ClaimTypes.Name)?.Value;
        if (!long.TryParse(sub, out var id))
        {
            throw new UnauthorizedAccessException("Invalid user id in token.");
        }
        return id;
    }

    public async Task<ShippingResponse> CreateAsync(ClaimsPrincipal userPrincipal, CreateShippingRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var order = await _uow.Orders.Query()
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);
        if (order == null) throw new InvalidOperationException("Order not found.");
        if (order.SellerId != userId) throw new InvalidOperationException("Only seller can create shipping.");

        var existing = await _uow.ShippingRequests.Query()
            .FirstOrDefaultAsync(s => s.OrderId == request.OrderId, cancellationToken);
        if (existing != null)
        {
            return new ShippingResponse(
                existing.ShipId,
                existing.OrderId ?? 0,
                existing.Provider,
                existing.TrackingCode,
                existing.PickupAddress,
                existing.DeliveryAddress,
                existing.Status,
                existing.CreatedAt,
                existing.LabelA5Url,
                existing.Label80x80Url,
                existing.Label52x70Url);
        }

        if (!string.Equals(order.Status, OrderStatuses.Confirmed, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Shipping can only be created when order status is Confirmed.");
        }

        var ship = new ShippingRequest
        {
            OrderId = request.OrderId,
            Provider = request.Provider,
            PickupAddress = request.PickupAddress,
            DeliveryAddress = request.DeliveryAddress,
            Status = ShippingStatuses.Requested,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.ShippingRequests.AddAsync(ship, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await NotifyShippingStatusAsync(order, ShippingStatuses.Requested, cancellationToken);

        return new ShippingResponse(
            ship.ShipId,
            ship.OrderId ?? 0,
            ship.Provider,
            ship.TrackingCode,
            ship.PickupAddress,
            ship.DeliveryAddress,
            ship.Status,
            ship.CreatedAt,
            ship.LabelA5Url,
            ship.Label80x80Url,
            ship.Label52x70Url);
    }

    public async Task<ShippingResponse> CreateGhnAsync(ClaimsPrincipal userPrincipal, CreateGhnShippingRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var order = await _uow.Orders.Query()
            .FirstOrDefaultAsync(o => o.OrderId == request.OrderId, cancellationToken);
        if (order == null) throw new InvalidOperationException("Order not found.");
        if (order.SellerId != userId) throw new InvalidOperationException("Only seller can create shipping.");

        var existing = await _uow.ShippingRequests.Query()
            .FirstOrDefaultAsync(s => s.OrderId == request.OrderId, cancellationToken);
        if (existing != null)
        {
            return new ShippingResponse(
                existing.ShipId,
                existing.OrderId ?? 0,
                existing.Provider,
                existing.TrackingCode,
                existing.PickupAddress,
                existing.DeliveryAddress,
                existing.Status,
                existing.CreatedAt,
                existing.LabelA5Url,
                existing.Label80x80Url,
                existing.Label52x70Url);
        }

        if (!string.Equals(order.Status, OrderStatuses.Confirmed, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Shipping can only be created when order status is Confirmed.");
        }

        var orderCode = await _ghnShippingService.CreateOrderAsync(request, cancellationToken);

        var ship = new ShippingRequest
        {
            OrderId = request.OrderId,
            Provider = "GHN",
            TrackingCode = string.IsNullOrWhiteSpace(orderCode) ? null : orderCode,
            PickupAddress = request.FromAddress,
            DeliveryAddress = request.ToAddress,
            Status = ShippingStatuses.Requested,
            CreatedAt = DateTime.UtcNow
        };

        await _uow.ShippingRequests.AddAsync(ship, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        await NotifyShippingStatusAsync(order, ShippingStatuses.Requested, cancellationToken);

        return new ShippingResponse(
            ship.ShipId,
            ship.OrderId ?? 0,
            ship.Provider,
            ship.TrackingCode,
            ship.PickupAddress,
            ship.DeliveryAddress,
            ship.Status,
            ship.CreatedAt,
            ship.LabelA5Url,
            ship.Label80x80Url,
            ship.Label52x70Url);
    }

    public async Task<IReadOnlyList<GhnProvinceResponse>> GetGhnProvincesAsync(CancellationToken cancellationToken = default)
    {
        return await _ghnShippingService.GetProvincesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GhnDistrictResponse>> GetGhnDistrictsAsync(int provinceId, CancellationToken cancellationToken = default)
    {
        if (provinceId <= 0) return Array.Empty<GhnDistrictResponse>();
        return await _ghnShippingService.GetDistrictsAsync(provinceId, cancellationToken);
    }

    public async Task<IReadOnlyList<GhnWardResponse>> GetGhnWardsAsync(int districtId, CancellationToken cancellationToken = default)
    {
        if (districtId <= 0) return Array.Empty<GhnWardResponse>();
        return await _ghnShippingService.GetWardsAsync(districtId, cancellationToken);
    }

    public async Task<GhnFeeResponse> GetGhnFeeAsync(GhnFeeRequest request, CancellationToken cancellationToken = default)
    {
        if (request.FromDistrictId <= 0 || request.ToDistrictId <= 0)
        {
            return new GhnFeeResponse(0, 0, 0, 0, 0, 0);
        }
        if (string.IsNullOrWhiteSpace(request.FromWardCode) || string.IsNullOrWhiteSpace(request.ToWardCode))
        {
            return new GhnFeeResponse(0, 0, 0, 0, 0, 0);
        }
        return await _ghnShippingService.GetFeeAsync(request, cancellationToken);
    }

    public async Task<GhnCancelResponse> CancelGhnAsync(ClaimsPrincipal userPrincipal, GhnCancelRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        if (request.OrderCodes == null || request.OrderCodes.Count == 0)
        {
            return new GhnCancelResponse(Array.Empty<GhnCancelResult>());
        }

        var codes = request.OrderCodes.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (codes.Length == 0)
        {
            return new GhnCancelResponse(Array.Empty<GhnCancelResult>());
        }

        var shippingList = await _uow.ShippingRequests.Query()
            .Where(s => s.TrackingCode != null && codes.Contains(s.TrackingCode))
            .ToListAsync(cancellationToken);
        if (shippingList.Count == 0)
        {
            throw new InvalidOperationException("Shipping not found for provided GHN codes.");
        }

        foreach (var ship in shippingList)
        {
            var order = await _uow.Orders.GetByIdAsync(ship.OrderId ?? 0);
            if (order == null || order.SellerId != userId)
            {
                throw new InvalidOperationException("Not allowed to cancel this shipping.");
            }
        }

        var response = await _ghnShippingService.CancelAsync(new GhnCancelRequest(codes), cancellationToken);
        foreach (var result in response.Results)
        {
            if (!result.Result || string.IsNullOrWhiteSpace(result.OrderCode)) continue;
            var ship = shippingList.FirstOrDefault(s => string.Equals(s.TrackingCode, result.OrderCode, StringComparison.OrdinalIgnoreCase));
            if (ship == null) continue;
            ship.Status = ShippingStatuses.Failed;
            _uow.ShippingRequests.Update(ship);
        }
        await _uow.SaveChangesAsync(cancellationToken);
        foreach (var ship in shippingList)
        {
            var order = await _uow.Orders.GetByIdAsync(ship.OrderId ?? 0);
            if (order != null)
            {
                await NotifyShippingStatusAsync(order, ShippingStatuses.Failed, cancellationToken);
            }
        }
        return response;
    }

    public async Task<GhnPrintTokenResponse> GetGhnPrintTokenAsync(ClaimsPrincipal userPrincipal, GhnPrintTokenRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        if (request.OrderCodes == null || request.OrderCodes.Count == 0)
        {
            return new GhnPrintTokenResponse(string.Empty, string.Empty, string.Empty, string.Empty);
        }

        var codes = request.OrderCodes.Where(c => !string.IsNullOrWhiteSpace(c)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        if (codes.Length == 0)
        {
            return new GhnPrintTokenResponse(string.Empty, string.Empty, string.Empty, string.Empty);
        }

        var shippingList = await _uow.ShippingRequests.Query()
            .Where(s => s.TrackingCode != null && codes.Contains(s.TrackingCode))
            .ToListAsync(cancellationToken);
        if (shippingList.Count == 0)
        {
            throw new InvalidOperationException("Shipping not found for provided GHN codes.");
        }

        foreach (var ship in shippingList)
        {
            var order = await _uow.Orders.GetByIdAsync(ship.OrderId ?? 0);
            if (order == null || order.SellerId != userId)
            {
                throw new InvalidOperationException("Not allowed to access this shipping.");
            }
        }

        var tokenResponse = await _ghnShippingService.GetPrintTokenAsync(new GhnPrintTokenRequest(codes), cancellationToken);
        if (!string.IsNullOrWhiteSpace(tokenResponse.Token))
        {
            foreach (var ship in shippingList)
            {
                ship.LabelA5Url = tokenResponse.PrintA5Url;
                ship.Label80x80Url = tokenResponse.Print80x80Url;
                ship.Label52x70Url = tokenResponse.Print52x70Url;
                _uow.ShippingRequests.Update(ship);
            }
            await _uow.SaveChangesAsync(cancellationToken);
        }
        return tokenResponse;
    }

    public async Task<BasicResponse> HandleGhnWebhookAsync(GhnWebhookPayload payload, string? webhookToken, CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(_ghnSettings.WebhookToken))
        {
            if (!string.Equals(_ghnSettings.WebhookToken, webhookToken, StringComparison.Ordinal))
            {
                return new BasicResponse(false, "Invalid webhook token.");
            }
        }

        if (string.IsNullOrWhiteSpace(payload.OrderCode))
        {
            return new BasicResponse(false, "OrderCode is required.");
        }

        var ship = await _uow.ShippingRequests.Query()
            .FirstOrDefaultAsync(s => s.TrackingCode == payload.OrderCode, cancellationToken);
        if (ship == null)
        {
            return new BasicResponse(false, "Shipping not found.");
        }

        var mapped = MapGhnStatus(payload.Status);
        if (mapped == null)
        {
            return new BasicResponse(true, "Webhook received, no status change.");
        }

        var current = ship.Status ?? ShippingStatuses.Requested;
        if (string.Equals(current, mapped, StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(true, "Shipping already in requested status.");
        }

        if (!IsShippingTransitionAllowed(current, mapped) &&
            !(string.Equals(current, ShippingStatuses.Requested, StringComparison.OrdinalIgnoreCase) &&
              string.Equals(mapped, ShippingStatuses.Delivered, StringComparison.OrdinalIgnoreCase)))
        {
            return new BasicResponse(false, $"Invalid shipping status transition: {current} -> {mapped}.");
        }

        ship.Status = mapped;
        if (string.IsNullOrWhiteSpace(ship.TrackingCode) && !string.IsNullOrWhiteSpace(payload.OrderCode))
        {
            ship.TrackingCode = payload.OrderCode;
        }

        await UpdateOrderStatusForShippingAsync(ship, mapped, cancellationToken);
        _uow.ShippingRequests.Update(ship);
        await _uow.SaveChangesAsync(cancellationToken);
        if (ship.OrderId.HasValue)
        {
            var order = await _uow.Orders.GetByIdAsync(ship.OrderId.Value);
            if (order != null)
            {
                await NotifyShippingStatusAsync(order, mapped, cancellationToken);
            }
        }
        return new BasicResponse(true, "Shipping updated.");
    }

    public async Task<ShippingResponse?> GetByOrderAsync(ClaimsPrincipal userPrincipal, long orderId, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var order = await _uow.Orders.GetByIdAsync(orderId);
        if (order == null) return null;
        if (order.BuyerId != userId && order.SellerId != userId) return null;

        var ship = await _uow.ShippingRequests.Query()
            .FirstOrDefaultAsync(s => s.OrderId == orderId, cancellationToken);
        if (ship == null) return null;

        return new ShippingResponse(
            ship.ShipId,
            ship.OrderId ?? 0,
            ship.Provider,
            ship.TrackingCode,
            ship.PickupAddress,
            ship.DeliveryAddress,
            ship.Status,
            ship.CreatedAt,
            ship.LabelA5Url,
            ship.Label80x80Url,
            ship.Label52x70Url);
    }

    public async Task<BasicResponse> UpdateStatusAsync(ClaimsPrincipal userPrincipal, long shipId, UpdateShippingStatusRequest request, CancellationToken cancellationToken = default)
    {
        var userId = GetUserId(userPrincipal);
        var ship = await _uow.ShippingRequests.GetByIdAsync(shipId);
        if (ship == null) return new BasicResponse(false, "Shipping not found.");

        var order = await _uow.Orders.GetByIdAsync(ship.OrderId ?? 0);
        if (order == null || order.SellerId != userId) return new BasicResponse(false, "Not allowed.");

        if (string.IsNullOrWhiteSpace(request.Status))
        {
            return new BasicResponse(false, "Status is required.");
        }
        if (!ShippingStatuses.All.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
        {
            return new BasicResponse(false, $"Invalid shipping status. Allowed: {string.Join(", ", ShippingStatuses.All)}.");
        }

        if (string.Equals(ship.Status, request.Status, StringComparison.OrdinalIgnoreCase))
        {
            return new BasicResponse(true, "Shipping already in requested status.");
        }

        var current = ship.Status ?? ShippingStatuses.Requested;
        if (!IsShippingTransitionAllowed(current, request.Status))
        {
            return new BasicResponse(false, $"Invalid shipping status transition: {current} -> {request.Status}.");
        }

        ship.Status = request.Status;
        if (!string.IsNullOrWhiteSpace(request.TrackingCode))
        {
            ship.TrackingCode = request.TrackingCode;
        }
        await UpdateOrderStatusForShippingAsync(ship, request.Status, cancellationToken);
        _uow.ShippingRequests.Update(ship);
        await _uow.SaveChangesAsync(cancellationToken);
        if (order != null)
        {
            await NotifyShippingStatusAsync(order, request.Status, cancellationToken);
        }
        return new BasicResponse(true, "Shipping updated.");
    }

    private static bool IsShippingTransitionAllowed(string current, string next)
    {
        if (string.Equals(current, ShippingStatuses.Requested, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ShippingStatuses.InTransit, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ShippingStatuses.Failed, StringComparison.OrdinalIgnoreCase);
        }
        if (string.Equals(current, ShippingStatuses.InTransit, StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(next, ShippingStatuses.Delivered, StringComparison.OrdinalIgnoreCase) ||
                   string.Equals(next, ShippingStatuses.Failed, StringComparison.OrdinalIgnoreCase);
        }
        return false;
    }

    private static string? MapGhnStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return null;
        var value = status.Trim().ToLowerInvariant();
        if (value.Contains("delivered"))
        {
            return ShippingStatuses.Delivered;
        }
        if (value.Contains("cancel") || value.Contains("return") || value.Contains("fail"))
        {
            return ShippingStatuses.Failed;
        }
        return ShippingStatuses.InTransit;
    }

    private async Task UpdateOrderStatusForShippingAsync(ShippingRequest ship, string status, CancellationToken cancellationToken)
    {
        if (!string.Equals(status, ShippingStatuses.Delivered, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (ship.OrderId == null || ship.OrderId <= 0) return;
        var order = await _uow.Orders.GetByIdAsync(ship.OrderId.Value);
        if (order == null) return;

        if (string.Equals(order.Status, OrderStatuses.Completed, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (!string.Equals(order.Status, OrderStatuses.Confirmed, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        order.Status = OrderStatuses.Completed;
        _uow.Orders.Update(order);
    }

    private async Task NotifyShippingStatusAsync(Order order, string status, CancellationToken cancellationToken)
    {
        var title = status switch
        {
            ShippingStatuses.Requested => "Đơn hàng đang được giao",
            ShippingStatuses.InTransit => "Đơn hàng đang vận chuyển",
            ShippingStatuses.Delivered => "Đơn hàng đã giao",
            ShippingStatuses.Failed => "Giao hàng thất bại",
            _ => "Cập nhật vận chuyển"
        };

        var message = $"Đơn hàng #{order.OrderId} - trạng thái vận chuyển: {status}.";
        if (order.BuyerId.HasValue)
        {
            await NotifyAsync(order.BuyerId.Value, "SHIPPING", title, message, $"/orders/{order.OrderId}", cancellationToken);
        }
        if (order.SellerId.HasValue)
        {
            await NotifyAsync(order.SellerId.Value, "SHIPPING", title, message, $"/orders/{order.OrderId}", cancellationToken);
        }
    }

    private async Task NotifyAsync(long userId, string type, string title, string message, string? link, CancellationToken cancellationToken)
    {
        try
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest(
                userId,
                title,
                message,
                type,
                link), cancellationToken);
        }
        catch
        {
            // ignore notification failures
        }
    }
}

