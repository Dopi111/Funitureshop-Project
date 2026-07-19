import React from 'react';
import { Link } from 'react-router-dom';

const LifestyleSection = () => {
    const spaces = [
        {
            id: 'living',
            title: 'Phòng Khách',
            subtitle: 'Sofa & Bàn trà',
            image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
            link: '/category/phong-khach'
        },
        {
            id: 'bedroom',
            title: 'Phòng Ngủ',
            subtitle: 'Giường & Tủ',
            image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80',
            link: '/category/phong-ngu'
        },
        {
            id: 'dining',
            title: 'Phòng Ăn',
            subtitle: 'Bàn ghế ăn',
            image: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1200&q=80',
            link: '/category/phong-an'
        }
    ];

    return (
        <section className="py-24 md:py-40 px-6 md:px-12 bg-white w-full">
            <div className="max-w-[1600px] mx-auto w-full flex flex-col md:flex-row gap-16 lg:gap-24">
                {/* Text Block - Pinned/Sticky behavior using Tailwind */}
                <div className="md:w-1/3 flex flex-col justify-start">
                    <div className="sticky top-32">
                        <span className="block text-xs tracking-[0.2em] uppercase text-zinc-400 mb-6 font-medium">
                            Không Gian Sống
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-zinc-950 mb-8 leading-[1.1]">
                            Định hình<br />phong cách.
                        </h2>
                        <p className="text-zinc-500 font-light text-lg mb-12 max-w-sm">
                            Mỗi sản phẩm đều được chọn lọc kỹ lưỡng để tạo nên một tổng thể hài hòa, tôn vinh nét cá tính riêng của gia chủ.
                        </p>
                        <Link 
                            to="/category/all" 
                            className="inline-block text-xs uppercase tracking-[0.2em] font-medium text-zinc-900 border-b border-zinc-900 pb-1 hover:text-[#c4a98b] hover:border-[#c4a98b] transition-colors"
                        >
                            Khám phá tất cả
                        </Link>
                    </div>
                </div>

                {/* Staggered Masonry Block */}
                <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    <div className="flex flex-col gap-8 md:gap-12 pt-0 md:pt-24">
                        <Link to={spaces[0].link} className="group block w-full">
                            <div className="relative aspect-[3/4] overflow-hidden bg-zinc-100 mb-6">
                                <img 
                                    src={spaces[0].image} 
                                    alt={spaces[0].title} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                />
                            </div>
                            <h3 className="text-xl font-medium tracking-tight text-zinc-950 mb-2">{spaces[0].title}</h3>
                            <span className="text-xs uppercase tracking-widest text-zinc-500">{spaces[0].subtitle}</span>
                        </Link>
                        
                        <Link to={spaces[2].link} className="group block w-full">
                            <div className="relative aspect-square overflow-hidden bg-zinc-100 mb-6">
                                <img 
                                    src={spaces[2].image} 
                                    alt={spaces[2].title} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                />
                            </div>
                            <h3 className="text-xl font-medium tracking-tight text-zinc-950 mb-2">{spaces[2].title}</h3>
                            <span className="text-xs uppercase tracking-widest text-zinc-500">{spaces[2].subtitle}</span>
                        </Link>
                    </div>

                    <div className="flex flex-col gap-8 md:gap-12 pb-0 md:pb-24">
                        <Link to={spaces[1].link} className="group block w-full">
                            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 mb-6">
                                <img 
                                    src={spaces[1].image} 
                                    alt={spaces[1].title} 
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
                                />
                            </div>
                            <h3 className="text-xl font-medium tracking-tight text-zinc-950 mb-2">{spaces[1].title}</h3>
                            <span className="text-xs uppercase tracking-widest text-zinc-500">{spaces[1].subtitle}</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LifestyleSection;
