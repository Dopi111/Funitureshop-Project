// src/App.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './components/navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import Footer from './components/Footer';
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
        console.log('Categories from API:', categoriesData.length, categoriesData);

        // Map API products to component format - using imageUrl from database
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

        // Map API categories to component format - using imageUrl from database
        const mappedCategories = categoriesData
          .filter(category => category.isActive)
          .map(category => ({
          id: category.categoryId,
          name: category.name,
          image: category.imageUrl || DEFAULT_IMAGE,
          link: `/category/${category.categoryId}`,
          parentId: category.parentId
        }));

        // Filter sub-categories (level 2 - those with parentId)
        const subCats = mappedCategories.filter(cat => cat.parentId !== null);

        // Filter root categories (level 1 - those without parentId)
        const rootCats = mappedCategories.filter(cat => cat.parentId === null);

        setProducts(mappedProducts);
        setCategories(rootCats);
        setSubCategories(subCats);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="app">
      <Navbar />

      <Hero
        title="Không gian sống đẳng cấp"
        subtitle="Bộ sưu tập 2026"
        description="Khám phá những thiết kế nội thất tinh tế, mang đến sự sang trọng và tiện nghi cho ngôi nhà của bạn."
        buttonText="Khám phá ngay"
        buttonLink="/san-pham"
        imageUrl="http://localhost:5028/images/hero.png"
      />

      {/* Section: Danh mục nội thất */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Danh mục nội thất</h2>
            <a href="/category/all" className="section-link">
              Xem tất cả →
            </a>
          </div>

          {loading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Đang tải danh mục...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Chưa có danh mục nào.</p>
            </div>
          ) : (
            <div className="category-grid">
              {categories.map(category => (
                <a key={category.id} href={category.link} className="category-card">
                  <img src={category.image} alt={category.name} />
                  <div className="category-overlay">
                    <span className="category-name">{category.name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Sản phẩm mới */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Sản phẩm mới</h2>
            <a href="/products" className="section-link">
              Xem tất cả →
            </a>
          </div>

          {loading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Đang tải sản phẩm...</p>
            </div>
          ) : error ? (
            <div className="error-state" style={{ textAlign: 'center', padding: '3rem', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Chưa có sản phẩm nào.</p>
            </div>
          ) : (
            <div className="grid grid-4">
              {products.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Về Chúng Tôi */}
      <section className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2>Về FurnitureShop</h2>
              <p>
                FurnitureShop, thành lập năm 2026, là thương hiệu nội thất cao cấp
                với nguồn cảm hứng từ văn hóa Việt và gu thẩm mỹ tinh tế.
                Chúng tôi luôn chú trọng đổi mới để mang đến những sản phẩm
                chất lượng tốt nhất cho khách hàng.
              </p>
              <p>
                Mỗi sản phẩm của chúng tôi là sự kết hợp hoàn hảo giữa
                công năng sử dụng và vẻ đẹp thẩm mỹ, phù hợp với không gian
                sống hiện đại của gia đình Việt.
              </p>
              <a href="/gioi-thieu" className="btn btn-outline">
                Tìm hiểu thêm
              </a>
            </div>
            <div className="about-image">
              <img
                src="/images/hero.png"
                alt="Về chúng tôi"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section: Không gian */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Khám phá theo không gian</h2>
            <a href="/khong-gian" className="section-link">
              Xem tất cả →
            </a>
          </div>

          {loading ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Đang tải danh mục...</p>
            </div>
          ) : subCategories.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
              <p>Chưa có danh mục nào.</p>
            </div>
          ) : (
            <div className="subcategory-grid">
              {subCategories.map(category => (
                <a key={category.id} href={category.link} className="subcategory-card">
                  <div className="subcategory-image">
                    <img src={category.image} alt={category.name} />
                  </div>
                  <div className="subcategory-info">
                    <span className="subcategory-name">{category.name}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Cảm hứng */}
      <section className="section" style={{ backgroundColor: 'var(--color-background-alt)' }}>
        <div className="container">
          <div className="about-grid">
            <div className="about-image">
              <img
                src="https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?cs=srgb&dl=pexels-dropshado-2251247.jpg&fm=jpg"
                alt="Cảm hứng thiết kế"
              />
            </div>
            <div className="about-content">
              <h2>Góc cảm hứng</h2>
              <p>
                Chúng tôi không chỉ bán nội thất, chúng tôi cung cấp giải pháp
                cho không gian sống của bạn. Mỗi sản phẩm là một câu chuyện
                về sự tiện nghi và thẩm mỹ.
              </p>
              <p>
                Hãy để FurnitureShop đồng hành cùng bạn trong hành trình
                kiến tạo tổ ấm hoàn hảo.
              </p>
              <a href="/cam-hung" className="btn btn-outline">
                Xem Lookbook
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default App;
