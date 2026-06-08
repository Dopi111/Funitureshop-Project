namespace FurnitureShop.API.Patterns.Repository.Contracts
{
    public interface IUnitOfWork
    {
        IProductRepository Products { get; }
        ICategoryRepository Categories { get; }
        IOrderRepository Orders { get; }

        Task<int> CompleteAsync();
    }
}