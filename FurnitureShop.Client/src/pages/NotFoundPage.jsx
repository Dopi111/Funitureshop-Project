// src/pages/NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import '../index.css';

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />
            
            <main className="flex-1 flex flex-col items-center justify-center py-32 px-6 text-center max-w-4xl mx-auto space-y-8 animate-fade-up">
                <span className="text-8xl sm:text-9xl font-extralight tracking-tighter text-[#C9A87C]/30 select-none">
                    404
                </span>
                
                <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C9A87C]">Lạc lối trong không gian</span>
                    <h1 className="text-3xl sm:text-5xl font-light uppercase tracking-tight text-[#0D0D0D]">
                        Trang Bạn Tìm Không Tồn Tại
                    </h1>
                    <p className="text-sm text-[#8A8278] max-w-md mx-auto font-light leading-relaxed">
                        Liên kết này có thể đã bị thay đổi, xóa bỏ hoặc tạm thời không thể truy cập. Hãy để chúng tôi đưa bạn trở về căn phòng ấm cúng.
                    </p>
                </div>

                <div className="pt-4 flex flex-wrap gap-4 justify-center">
                    <Link
                        to="/"
                        className="py-4 px-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300"
                    >
                        ← Trở về trang chủ
                    </Link>
                    <Link
                        to="/products"
                        className="py-4 px-8 rounded-full border border-[#E8E4DC] bg-white text-[#0D0D0D] font-semibold text-xs uppercase tracking-widest hover:border-[#0D0D0D] transition-all duration-300"
                    >
                        Khám phá sản phẩm
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
