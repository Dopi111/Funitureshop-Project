import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';

const formatPrice = (price) => {
    const num = Number(price);
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(isNaN(num) ? 0 : num);
};

const RecentlyViewedCarousel = () => {
    const [products, setProducts] = useState([]);
    const [wishlist, setWishlist] = useState(new Set());
    const scrollContainerRef = useRef(null);

    // Load recently viewed from localStorage or fallback
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        if (stored.length > 0) {
            setProducts(stored);
        } else {
            // Fallback elegant mock data
            const fallbackProducts = [
                { id: 101, name: 'Sofa Da Cao Cấp', price: 15000000, category: 'Sofa', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
                { id: 102, name: 'Giường Gỗ Sồi Modern', price: 12000000, category: 'Giường', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80' },
                { id: 103, name: 'Bàn Trà Kính Minimalist', price: 4500000, category: 'Bàn Trà', image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=800&q=80' },
                { id: 104, name: 'Ghế Thư Giãn Loft', price: 6800000, category: 'Ghế', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?auto=format&fit=crop&w=800&q=80' },
                { id: 105, name: 'Tủ Quần Áo Linea', price: 18000000, category: 'Tủ', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?auto=format&fit=crop&w=800&q=80' }
            ];
            setProducts(fallbackProducts);
        }
    }, []);

    const toggleWishlist = (id, e) => {
        e.preventDefault();
        e.stopPropagation();
        setWishlist(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = 320 + 24; // Card width + gap
            const target = direction === 'left' 
                ? container.scrollLeft - scrollAmount 
                : container.scrollLeft + scrollAmount;
            
            container.scrollTo({
                left: target,
                behavior: 'smooth'
            });
        }
    };

    if (products.length === 0) return null;

    return (
        <section className="py-24 md:py-36 bg-[var(--stone)] w-full border-t border-[var(--mist)]">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <span className="block text-[10px] tracking-[0.22em] uppercase text-[var(--ghost)] mb-3 font-semibold">Gợi ý dành cho bạn</span>
                        <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-[var(--ink-text)]">Sản Phẩm Đã Xem</h2>
                    </div>
                    
                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-3">
                        <button
                            className="w-12 h-12 rounded-full border border-[var(--mist)] flex items-center justify-center text-[var(--ink-text)] bg-white hover:bg-[var(--ink)] hover:text-white hover:border-[var(--ink)] transition-all duration-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[var(--ink-text)] disabled:hover:border-[var(--mist)] cursor-pointer"
                            onClick={() => scroll('left')}
                            aria-label="Trước"
                        >
                            <ArrowLeft size={16} strokeWidth={1.5} />
                        </button>
                        <button
                            className="w-12 h-12 rounded-full border border-[var(--mist)] flex items-center justify-center text-[var(--ink-text)] bg-white hover:bg-[var(--ink)] hover:text-white hover:border-[var(--ink)] transition-all duration-300 disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-[var(--ink-text)] disabled:hover:border-[var(--mist)] cursor-pointer"
                            onClick={() => scroll('right')}
                            aria-label="Sau"
                        >
                            <ArrowRight size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Scroller Container */}
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-6 hide-scrollbar snap-x snap-mandatory pb-4 scroll-smooth"
                >
                    {products.map((product) => (
                        <Link 
                            key={product.id} 
                            to={`/product/${product.id}`}
                            className="min-w-[280px] md:min-w-[320px] max-w-[320px] snap-start flex-shrink-0 group flex flex-col"
                        >
                            <div className="relative w-full aspect-[4/5] overflow-hidden bg-white mb-4">
                                <img
                                    src={product.image || DEFAULT_IMAGE}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                                />

                                {/* Wishlist Icon */}
                                <button
                                    className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-sm transition-all duration-300 z-10 ${
                                        wishlist.has(product.id) 
                                            ? 'bg-red-500 text-white opacity-100' 
                                            : 'bg-white/80 hover:bg-white text-[var(--ink-text)] opacity-0 group-hover:opacity-100'
                                    }`}
                                    onClick={(e) => toggleWishlist(product.id, e)}
                                    aria-label="Yêu thích"
                                >
                                    <Heart size={14} fill={wishlist.has(product.id) ? 'currentColor' : 'none'} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="flex flex-col flex-1 px-1">
                                {product.category && (
                                    <span className="text-[9px] tracking-widest uppercase text-[var(--ghost)] mb-1.5 font-medium">
                                        {product.category}
                                    </span>
                                )}
                                <h3 className="text-sm font-medium text-[var(--ink-text)] leading-snug mb-2 group-hover:text-[var(--sand)] transition-colors line-clamp-2">
                                    {product.name}
                                </h3>
                                <div className="mt-auto flex items-baseline gap-2">
                                    <span className="text-sm font-semibold text-[var(--ink-text)]">
                                        {formatPrice(product.price)}
                                    </span>
                                    {product.originalPrice && (
                                        <span className="text-xs text-[var(--ghost)] line-through">
                                            {formatPrice(product.originalPrice)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RecentlyViewedCarousel;
