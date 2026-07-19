import React from 'react';
import { Link } from 'react-router-dom';

const Hero = ({ 
    title = "BỘ SƯU TẬP HÙNG KING", 
    subtitle = "Mới 2026", 
    description = "Sự kết hợp hoàn hảo giữa công năng hiện đại và vẻ đẹp vượt thời gian.", 
    buttonText = "Khám phá", 
    buttonLink = "/category/all",
    imageUrl = "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=2000&q=90"
}) => {
    return (
        <section className="relative min-h-[100dvh] w-full bg-[#111] overflow-hidden flex items-end pb-12 md:pb-24">
            {/* Background Image with elegant overlay */}
            <div className="absolute inset-0 w-full h-full">
                <img 
                    src={imageUrl} 
                    alt="Hero Furniture" 
                    className="w-full h-full object-cover object-center opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-black/30"></div>
            </div>

            {/* Content overlaid at the bottom */}
            <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 mx-auto max-w-[1600px] flex flex-col md:flex-row md:items-end justify-between gap-12">
                <div className="max-w-3xl">
                    <span className="block text-[#c4a98b] text-xs md:text-sm tracking-[0.3em] uppercase font-medium mb-6">
                        {subtitle}
                    </span>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1] mb-6">
                        {title}
                    </h1>
                </div>
                
                <div className="max-w-sm flex flex-col gap-8 md:items-end md:text-right">
                    <p className="text-zinc-400 font-light text-lg leading-relaxed">
                        {description}
                    </p>
                    <Link 
                        to={buttonLink} 
                        className="inline-flex items-center justify-center px-10 py-5 bg-white text-[#111] text-xs tracking-[0.2em] uppercase font-medium transition-all duration-500 hover:bg-[#c4a98b] hover:text-white"
                    >
                        {buttonText}
                    </Link>
                </div>
            </div>

        </section>
    );
};

export default Hero;