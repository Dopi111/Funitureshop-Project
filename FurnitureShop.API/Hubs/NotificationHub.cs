using Microsoft.AspNetCore.SignalR;

namespace FurnitureShop.API.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }
}
