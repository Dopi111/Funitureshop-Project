// src/App.js
import React from 'react';
import Navbar from 'components/Navbar';
import Hero from 'components/Hero';
import ProductCard from 'components/ProductCard';
import Footer from 'components/Footer';
import './index.css';

// Sample products data
const products = [
    {
        id: 1,
        name: 'Sofa Băng Elegance',
        price: 15900000,
        originalPrice: 18900000,
        category: 'Phòng khách',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        discount: 16,
        isNew: true
    },
    {
        id: 2,
        name: 'Bàn Ăn Gỗ Sồi',
        price: 8500000,
        category: 'Phòng ăn',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=800&q=80',
        isNew: true
    },
    {
        id: 3,
        name: 'Đèn Sàn Minimal',
        price: 2100000,
        category: 'Trang trí',
        image: 'https://images.unsplash.com/photo-1507473888900-52e1ad145986?auto=format&fit=crop&w=800&q=80',
        isNew: true
    },
    {
        id: 4,
        name: 'Ghế Thư Giãn Luxury',
        price: 4200000,
        originalPrice: 5200000,
        category: 'Phòng ngủ',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80',
        discount: 20
    },
    {
        id: 5,
        name: 'Kệ Sách Hiện Đại',
        price: 6800000,
        category: 'Phòng làm việc',
        image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80',
        isNew: true
    },
    {
        id: 6,
        name: 'Bàn Console Gỗ Óc Chó',
        price: 12500000,
        category: 'Phòng khách',
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
        isNew: true
    },
    {
        id: 7,
        name: 'Gương Trang Trí Tròn',
        price: 3200000,
        originalPrice: 3800000,
        category: 'Trang trí',
        image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&q=80',
        discount: 15
    },
    {
        id: 8,
        name: 'Ghế Ăn Bọc Da',
        price: 2800000,
        category: 'Phòng ăn',
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=800&q=80',
        isNew: true
    },
];

// Category data for room showcase
const categories = [
    {
        id: 1,
        name: 'Phòng khách',
        image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=600&q=80',
        link: '/phong-khach'
    },
    {
        id: 2,
        name: 'Phòng ăn',
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
        link: '/phong-an'
    },
    {
        id: 3,
        name: 'Phòng ngủ',
        image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80',
        link: '/phong-ngu'
    },
    {
        id: 4,
        name: 'Phòng làm việc',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=600&q=80',
        link: '/phong-lam-viec'
    }
];

function App() {
    return (
        <div className="app">
            <Navbar />

            <Hero
                title="Không gian sống đẳng cấp"
                subtitle="Bộ sưu tập 2024"
                description="Khám phá những thiết kế nội thất tinh tế, mang đến sự sang trọng và tiện nghi cho ngôi nhà của bạn."
                buttonText="Khám phá ngay"
                buttonLink="/san-pham"
            />

            {/* Section: Sản phẩm mới */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Sản phẩm mới</h2>
                        <a href="/san-pham-moi" className="section-link">
                            Xem tất cả →
                        </a>
                    </div>

                    <div className="grid grid-4">
                        {products.map(product => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section: Về Chúng Tôi */}
            <section className="about-section">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <h2>Về FurnitureShop</h2>
                            <p>
                                FurnitureShop, thành lập năm 2024, là thương hiệu nội thất cao cấp
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
                                src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80"
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
                </div>
            </section>

            {/* Section: Cảm hứng */}
            <section className="section" style={{ backgroundColor: 'var(--color-background-alt)' }}>
                <div className="container">
                    <div className="about-grid">
                        <div className="about-image">
                            <img
                                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?auto=format&fit=crop&w=1000&q=80"
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