// src/pages/WishlistPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import '../index.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const WishlistPage = () => {
    const { wishlist } = useWishlist();

    return (
        <div className="bg-[#FDFBF7] min-h-screen flex flex-col font-['Outfit']">
            <Navbar />

            {/* Mini Dark Hero */}
            <div className="h-[18vh] min-h-[150px] flex items-center justify-center bg-[#0D0D0D] relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${DEFAULT_IMAGE})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0D0D0D]/60" />
                <div className="relative z-10 text-center px-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A87C] font-semibold mb-1 block">Sưu tập cá nhân</span>
                    <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-[#FDFBF7] uppercase">Sản phẩm yêu thích</h1>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="bg-[#F5F2EC] py-4 border-b border-[#E8E4DC]">
                <div className="max-w-[1440px] mx-auto px-6">
                    <nav className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[#8A8278]">
                        <Link to="/" className="hover:text-[#0D0D0D] transition-colors">Trang chủ</Link>
                        <span className="text-[#E8E4DC]">/</span>
                        <span className="text-[#0D0D0D] font-medium">Yêu thích</span>
                    </nav>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 max-w-[1440px] mx-auto px-6 py-12 md:py-16 w-full">
                {wishlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-[#F5F2EC] flex items-center justify-center rounded-full mb-6 text-[#8A8278]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            </svg>
                        </div>
                        <h2 className="text-xl uppercase tracking-widest font-semibold text-[#0d0d0d] mb-2">Danh sách trống</h2>
                        <p className="text-sm text-[#8A8278] mb-8 max-w-sm">Hãy lưu lại những món đồ nội thất bạn yêu thích để dễ dàng theo dõi và mua sắm sau này</p>
                        <Link to="/products" className="px-8 py-4 bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-colors cursor-pointer text-center">
                            Khám phá sản phẩm
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-8 animate-fade-up">
                        <div className="flex justify-between items-center pb-4 border-b border-[#E8E4DC]">
                            <span className="text-xs uppercase tracking-widest font-bold text-[#8A8278]">Đang lưu {wishlist.length} sản phẩm</span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                            {wishlist.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={product.price}
                                    originalPrice={product.originalPrice}
                                    category={product.category}
                                    image={product.image}
                                    discount={product.discount}
                                    isNew={product.isNew}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default WishlistPage;
