import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
import LifestyleSection from './components/LifestyleSection';
import RecentlyViewedCarousel from './components/RecentlyViewedCarousel';
import apiService from './services/apiService';
import './index.css';

// Default placeholder image when no image is available
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch products and categories in parallel
        const [productsResponse, categoriesRaw] = await Promise.all([
          apiService.getProducts({ pageSize: 8 }),
          fetch('/api/categories/all').then(r => r.json())
        ]);

        // categoriesRaw is a flat array of all categories
        const categoriesData = Array.isArray(categoriesRaw) ? categoriesRaw : [];

        // Map API products to component format
        const rawProducts = Array.isArray(productsResponse?.data)
          ? productsResponse.data
          : Array.isArray(productsResponse)
          ? productsResponse
          : [];

        const mappedProducts = rawProducts.map(product => ({
          id: product.productId,
          name: product.name,
          price: product.discountPrice || product.basePrice,
          originalPrice: product.discountPrice ? product.basePrice : null,
          category: product.category?.name || 'Chưa phân loại',
          image: product.images?.[0]?.imageUrl || DEFAULT_IMAGE,
          discount: product.discountPrice
            ? Math.round((1 - product.discountPrice / product.basePrice) * 100)
            : null,
          isNew: product.isFeatured || false
        }));

        // Map API categories to component format
        const mappedCategories = categoriesData
          .filter(category => category.isActive)
          .map(category => ({
          id: category.categoryId,
          name: category.name,
          image: category.imageUrl || DEFAULT_IMAGE,
          link: `/category/${category.slug || category.categoryId}`,
          parentId: category.parentId
        }));

        // Filter sub-categories
        const subCats = mappedCategories.filter(cat => cat.parentId !== null);

        // Filter root categories
        const rootCats = mappedCategories.filter(cat => cat.parentId === null);

        // Check if API failed and use mock data if needed
        let finalCategories = rootCats;
        if (finalCategories.length === 0) {
          finalCategories = [
            { id: 1, name: 'Phòng Khách', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', link: '/category/living' },
            { id: 2, name: 'Phòng Ngủ', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80', link: '/category/bedroom' },
            { id: 3, name: 'Phòng Ăn', image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80', link: '/category/dining' },
            { id: 4, name: 'Làm Việc', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', link: '/category/office' }
          ];
        }

        let finalProducts = mappedProducts;
        if (finalProducts.length === 0) {
          finalProducts = [
            { id: 101, name: 'Sofa Da Cao Cấp', price: 15000000, category: 'Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', isNew: true },
            { id: 102, name: 'Giường Gỗ Sồi', price: 12000000, category: 'Giường', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80', discount: 15 },
            { id: 103, name: 'Bàn Trà Kính', price: 4500000, category: 'Bàn Trà', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80', isNew: true },
            { id: 104, name: 'Ghế Thư Giãn', price: 6800000, category: 'Ghế', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', discount: 10 },
            { id: 105, name: 'Tủ Quần Áo', price: 18000000, category: 'Tủ', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80' }
          ];
        }

        setProducts(finalProducts);
        setCategories(finalCategories);
        setSubCategories(subCats);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        // Provide mock data even on complete error
        setProducts([
            { id: 101, name: 'Sofa Da Cao Cấp', price: 15000000, category: 'Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', isNew: true },
            { id: 102, name: 'Giường Gỗ Sồi', price: 12000000, category: 'Giường', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80', discount: 15 },
            { id: 103, name: 'Bàn Trà Kính', price: 4500000, category: 'Bàn Trà', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80', isNew: true },
            { id: 104, name: 'Ghế Thư Giãn', price: 6800000, category: 'Ghế', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80', discount: 10 },
            { id: 105, name: 'Tủ Quần Áo', price: 18000000, category: 'Tủ', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80' }
        ]);
        setCategories([
            { id: 1, name: 'Phòng Khách', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', link: '/category/living' },
            { id: 2, name: 'Phòng Ngủ', image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80', link: '/category/bedroom' },
            { id: 3, name: 'Phòng Ăn', image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=800&q=80', link: '/category/dining' },
            { id: 4, name: 'Làm Việc', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', link: '/category/office' }
        ]);
        setSubCategories([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--stone)] text-[var(--ink-text)]">
      <Navbar />

      <Hero
        title="BỘ SƯU TẬP HÙNG KING"
        subtitle="Bộ sưu tập 2026"
        buttonText="XEM THÊM"
        buttonLink="/category/all"
        imageUrl="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1800&q=90"
      />

      <LifestyleSection />

      {/* Section: Danh mục nội thất (True Bento Grid) */}
      <section className="py-24 md:py-40 px-6 md:px-12 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <span className="block text-[10px] tracking-[0.25em] uppercase text-[var(--ghost)] mb-3 font-semibold">Danh mục nổi bật</span>
            <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-[var(--ink-text)] mb-4">Tìm Cảm Hứng Theo Không Gian</h2>
            <p className="text-[var(--ghost)] font-light text-lg">Khám phá các sản phẩm nội thất được tuyển chọn kỹ lưỡng, mang đến vẻ đẹp hiện đại và tinh tế cho từng ngôi nhà.</p>
          </div>
          <a href="/category/all" className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-[var(--ink-text)] border-b border-[var(--ink)] pb-1 hover:text-[var(--sand)] hover:border-[var(--sand)] transition-colors">
            Toàn bộ danh mục
          </a>
        </div>

        {loading ? (
          <div className="w-full flex justify-center py-24">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
              <span className="text-xs tracking-widest uppercase text-[var(--ghost)] font-medium">Đang tải...</span>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-24 text-[var(--ghost)]">Chưa có danh mục nào.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[700px]">
            {categories.slice(0, 4).map((category, index) => {
              // True Bento layout
              let gridClass = "md:col-span-1 md:row-span-1";
              if (index === 0) gridClass = "md:col-span-2 md:row-span-2";
              else if (index === 1) gridClass = "md:col-span-2 md:row-span-1";
              
              return (
                <a 
                  key={category.id} 
                  href={category.link} 
                  className={`group relative overflow-hidden bg-white ${gridClass} min-h-[300px] md:min-h-0 block`}
                >
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/80 via-[var(--ink)]/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                    <span className="text-white text-2xl md:text-4xl font-medium tracking-tight transform translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                      {category.name}
                    </span>
                    <span className="text-[var(--sand-light)] text-xs uppercase tracking-[0.2em] font-medium opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 mt-3">
                      Khám phá →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      {/* Section: Thiết kế mới nhất (Agency Luxury Grid Architecture) */}
      <section className="py-24 md:py-36 bg-[#FDFBF7] border-t border-[#E8E4DC] px-6 md:px-12">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E4DC] pb-8">
            <div className="max-w-xl space-y-2">
              <span className="inline-block text-[11px] font-bold tracking-[0.25em] uppercase text-[#C9A87C] bg-[#C9A87C]/10 px-3.5 py-1 rounded-full">Thiết kế mới nhất</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-tight uppercase text-[#0D0D0D]">Sản Phẩm Tiêu Biểu</h2>
            </div>
            <a href="/products" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-[#0D0D0D] hover:text-[#C9A87C] group transition-colors">
              <span>Toàn bộ sản phẩm</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-[#E8E4DC]/40 animate-pulse space-y-4">
                  <div className="bg-[#F5F2EC] h-[300px] sm:h-[340px] rounded-xl w-full" />
                  <div className="h-4 bg-[#E8E4DC] w-2/3 rounded" />
                  <div className="h-4 bg-[#E8E4DC] w-1/3 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-[#8A8278]">Chưa có sản phẩm nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-up">
              {products.slice(0, 8).map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Về Chúng Tôi - Massive Typography */}
      <section className="py-32 md:py-48 px-6 md:px-12 bg-[var(--ink)] text-white text-center">
        <div className="max-w-[1200px] mx-auto">
          <span className="block text-[var(--sand)] text-xs tracking-[0.3em] uppercase mb-12 font-medium">Triết lý thiết kế</span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.4] mb-16 px-4">
            Chúng tôi tin rằng nội thất không chỉ lấp đầy không gian, mà còn là linh hồn của ngôi nhà, phản chiếu cái tôi độc bản của người sở hữu.
          </h2>
          <a href="/gioi-thieu" className="inline-flex items-center justify-center px-10 py-5 bg-white text-[var(--ink)] text-xs tracking-[0.2em] uppercase font-medium transition-all duration-500 hover:bg-[var(--sand)] hover:text-white">
            Về FurnitureShop
          </a>
        </div>
      </section>

      {/* Section: Cảm hứng (Edge-to-edge dark) */}
      <section className="relative h-[80vh] min-h-[600px] w-full flex items-center justify-center overflow-hidden">
        <img
          src="https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?cs=srgb&dl=pexels-dropshado-2251247.jpg&fm=jpg"
          alt="Cảm hứng"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center text-white px-6">
          <h2 className="text-5xl md:text-8xl font-medium tracking-tight mb-8">Nét tinh tế.</h2>
          <a href="/cam-hung" className="inline-block text-xs uppercase tracking-[0.2em] font-medium border-b border-white pb-1 hover:text-[var(--sand)] hover:border-[var(--sand)] transition-colors">
            Khám phá Lookbook
          </a>
        </div>
      </section>

      <RecentlyViewedCarousel />

      <Footer />
    </div>
  );
}

export default App;
