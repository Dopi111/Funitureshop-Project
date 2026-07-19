import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import toast from 'react-hot-toast';

const ProductCard = ({
    id,
    name,
    price,
    originalPrice,
    category,
    image,
    discount,
    isNew
}) => {
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isWishlisted } = useWishlist();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const isSaved = isWishlisted(id);

    // Format price to VND
    const formatPrice = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isAuthenticated()) {
            window.location.href = '/login';
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const result = await addToCart(id, 1);
            if (result.success) {
                setMessage('✓ Đã thêm');
                setTimeout(() => setMessage(''), 2000);
            } else {
                setMessage(result.message || 'Lỗi');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Lỗi');
            setTimeout(() => setMessage(''), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist({ id, name, price, originalPrice, category, image, discount, isNew });
        if (!isSaved) {
            toast.success("Đã thêm vào yêu thích");
        } else {
            toast("Đã xóa khỏi yêu thích", { icon: '💔' });
        }
    };

    return (
        <Link to={`/product/${id}`} className="group flex flex-col h-full cursor-pointer bg-white text-inherit hover:text-inherit transition-all duration-500 ease-out hover:-translate-y-1.5 shadow-[0_2px_12px_rgba(13,13,13,0.04)] hover:shadow-[0_12px_32px_rgba(13,13,13,0.1)] rounded-2xl border border-[#E8E4DC]/80 overflow-hidden">
            <div className="relative w-full h-[300px] sm:h-[340px] bg-[#F5F2EC] overflow-hidden flex-shrink-0">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Wishlist Button */}
                <button 
                    className="absolute top-4 left-4 p-2.5 bg-white/90 backdrop-blur-xs opacity-80 md:opacity-0 translate-y-0 md:-translate-y-2 transition-all duration-300 ease-out hover:bg-white hover:scale-110 group-hover:opacity-100 group-hover:translate-y-0 z-10 cursor-pointer shadow-sm" 
                    title={isSaved ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                    onClick={handleWishlistToggle}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isSaved ? "#ef4444" : "none"} stroke={isSaved ? "#ef4444" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                </button>

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {discount && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest bg-[#0D0D0D] text-[#FDFBF7] font-medium">
                            -{discount}%
                        </span>
                    )}
                    {isNew && !discount && (
                        <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest bg-[#C9A87C] text-[#FDFBF7] font-medium">
                            Mới
                        </span>
                    )}
                </div>

                {/* Quick Add Overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 translate-y-4 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 z-10">
                    <button
                        className={`w-full py-3.5 flex items-center justify-center gap-2 text-[10px] font-medium tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                            message ? 'bg-emerald-600 text-white' : 'bg-[#0D0D0D] text-[#FDFBF7] hover:bg-[#C9A87C] hover:text-[#0D0D0D]'
                        }`}
                        onClick={handleAddToCart}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="animate-pulse">Đang xử lý...</span>
                        ) : message ? (
                            message
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                                    <line x1="3" x2="21" y1="6" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                Thêm vào giỏ
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col flex-1 p-5">
                {category && (
                    <span className="text-[10px] tracking-widest uppercase text-[#8A8278] mb-1.5 font-medium">
                        {category}
                    </span>
                )}
                <h3 className="text-[15px] font-medium text-[#0D0D0D] leading-snug mb-3 group-hover:text-[#C9A87C] transition-colors line-clamp-2">
                    {name}
                </h3>
                <div className="mt-auto flex items-baseline gap-2.5">
                    <span className="text-[15px] font-medium text-[#C9A87C] tabular-nums">
                        {formatPrice(price)}
                    </span>
                    {originalPrice && (
                        <span className="text-xs text-[#8A8278] line-through tabular-nums">
                            {formatPrice(originalPrice)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;