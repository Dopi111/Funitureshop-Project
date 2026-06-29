// src/pages/LookbookPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import '../index.css';

const LOOKBOOK_ITEMS = [
    {
        title: 'Penthouse Minimalist Sài Gòn',
        category: 'Phòng khách',
        img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
        span: 'md:col-span-8 md:row-span-2 aspect-[16/10]'
    },
    {
        title: 'Phòng Ăn Japandi Thượng Lưu',
        category: 'Phòng ăn',
        img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
        span: 'md:col-span-4 md:row-span-1 aspect-[4/3]'
    },
    {
        title: 'Góc Làm Việc Độc Bản Đông Dương',
        category: 'Phòng làm việc',
        img: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
        span: 'md:col-span-4 md:row-span-1 aspect-[4/3]'
    },
    {
        title: 'Master Suite Yên Bình',
        category: 'Phòng ngủ',
        img: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1000&q=80',
        span: 'md:col-span-6 md:row-span-1 aspect-[16/9]'
    },
    {
        title: 'Sảnh Đón Khách Nghệ Thuật',
        category: 'Sảnh biệt thự',
        img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80',
        span: 'md:col-span-6 md:row-span-1 aspect-[16/9]'
    }
];

export default function LookbookPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />

            {/* Editorial Breadcrumb */}
            <div className="border-b border-[#E8E4DC] bg-[#FDFBF7]">
                <nav className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-4 text-[11px] font-semibold uppercase tracking-widest text-[#8A8278] flex items-center gap-2">
                    <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <span className="text-[#0D0D0D] underline underline-offset-4">Cảm hứng Lookbook</span>
                </nav>
            </div>

            {/* Header */}
            <header className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-6">
                <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase text-[#C9A87C] bg-[#C9A87C]/10 px-4 py-1.5 rounded-full">
                    Lookbook 2026
                </span>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E8E4DC] pb-10">
                    <h1 className="text-4xl sm:text-6xl font-light uppercase tracking-tight text-[#0D0D0D]">
                        Cảm Hứng Không Gian <br />
                        <span className="font-normal text-[#C9A87C]">Từ Các Công Trình Độc Bản</span>
                    </h1>
                    <p className="text-sm text-[#8A8278] max-w-md font-light">
                        Tuyển tập hình ảnh kiến trúc thực tế ứng dụng các tác phẩm nội thất FurnitureShop trong các căn hộ sang trọng và biệt thự khắp Việt Nam.
                    </p>
                </div>
            </header>

            {/* True Bento Grid Lookbook */}
            <main className="px-6 md:px-12 pb-32 max-w-7xl mx-auto w-full flex-1">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {LOOKBOOK_ITEMS.map((item, i) => (
                        <div key={i} className={`relative rounded-3xl overflow-hidden group border border-[#E8E4DC] shadow-xs bg-[#F5F2EC] ${item.span}`}>
                            <img
                                src={item.img}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-106"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-85" />
                            
                            <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end space-y-2">
                                <span className="text-xs uppercase tracking-[0.2em] text-[#C9A87C] font-bold transform translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                                    {item.category}
                                </span>
                                <h3 className="text-2xl sm:text-4xl font-light text-white tracking-tight transform translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                                    {item.title}
                                </h3>
                                <div className="pt-4 opacity-0 transform translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                                    <Link
                                        to="/products"
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0D0D0D] rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-[#C9A87C] hover:text-white transition-colors"
                                    >
                                        <span>Khám phá sản phẩm trong phòng</span>
                                        <span>→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
