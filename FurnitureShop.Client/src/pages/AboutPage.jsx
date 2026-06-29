// src/pages/AboutPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/Footer';
import '../index.css';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#0D0D0D] font-['Outfit'] flex flex-col selection:bg-[#C9A87C] selection:text-white">
            <Navbar />

            {/* Editorial Breadcrumb */}
            <div className="border-b border-[#E8E4DC] bg-[#FDFBF7]">
                <nav className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-4 text-[11px] font-semibold uppercase tracking-widest text-[#8A8278] flex items-center gap-2">
                    <Link to="/" className="hover:text-black transition-colors">Trang chủ</Link>
                    <span>/</span>
                    <span className="text-[#0D0D0D] underline underline-offset-4">Về chúng tôi</span>
                </nav>
            </div>

            {/* Hero Section */}
            <header className="py-24 md:py-36 px-6 md:px-12 border-b border-[#E8E4DC] relative overflow-hidden">
                <div className="max-w-5xl mx-auto text-center space-y-6">
                    <span className="inline-block text-[11px] font-bold tracking-[0.3em] uppercase text-[#C9A87C] bg-[#C9A87C]/10 px-4 py-1.5 rounded-full">
                        Di sản & Khát vọng
                    </span>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-light uppercase tracking-tight text-[#0D0D0D] leading-[1.1]">
                        Kiến Tạo Linh Hồn <br />
                        <span className="font-normal underline decoration-1 underline-offset-8 decoration-[#C9A87C]">Cho Mọi Không Gian</span>
                    </h1>
                    <p className="text-base sm:text-lg text-[#8A8278] max-w-2xl mx-auto font-light leading-relaxed pt-4">
                        Khởi nguồn từ niềm đam mê kiến trúc bất hủ và khát khao định hình phong cách sống thượng lưu, FurnitureShop không chỉ tạo ra đồ nội thất, mà kiến tạo những tác phẩm nghệ thuật vượt thời gian.
                    </p>
                </div>
            </header>

            {/* Split Narrative 55/45 */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                <div className="lg:col-span-7 relative aspect-[16/11] rounded-3xl overflow-hidden border border-[#E8E4DC] shadow-lg group">
                    <img
                        src="https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=1400&q=85"
                        alt="Nghệ thuật chế tác"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-8 left-8 text-white space-y-1">
                        <span className="text-[10px] tracking-widest uppercase text-[#C9A87C] font-bold">Xưởng chế tác thủ công 2026</span>
                        <p className="text-xl font-light tracking-wide">Sự tỉ mỉ trong từng đường kim mũi chỉ</p>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-8">
                    <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#C9A87C]">Triết lý thiết kế</span>
                        <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tight text-[#0D0D0D] leading-snug">
                            Độc Bản Tát Yếu, Vượt Thời Gian
                        </h2>
                        <p className="text-sm text-[#5A5A5A] leading-relaxed">
                            Chúng tôi tin rằng sự xa xỉ đích thực không nằm ở sự phô trương bề ngoài, mà ẩn chứa trong cảm giác xúc giác (Haptic) khi chạm vào bề mặt vật liệu và sự tĩnh lặng mà tác phẩm mang lại cho không gian sống.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#E8E4DC]">
                        <div className="space-y-1">
                            <span className="text-3xl font-light text-[#0D0D0D] tabular-nums">100%</span>
                            <span className="block text-xs text-[#8A8278] uppercase tracking-wider font-medium">Gỗ tự nhiên tinh tuyển</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-3xl font-light text-[#0D0D0D] tabular-nums">25+</span>
                            <span className="block text-xs text-[#8A8278] uppercase tracking-wider font-medium">Năm di sản chế tác</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* True Bento Grid Values */}
            <section className="bg-[#F5F2EC] py-24 px-6 md:px-12 border-t border-b border-[#E8E4DC]">
                <div className="max-w-7xl mx-auto space-y-16">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#C9A87C]">Giá trị cốt lõi</span>
                        <h2 className="text-3xl sm:text-4xl font-light uppercase tracking-tight text-[#0D0D0D]">Chuẩn Mực Khắt Khe Nhất</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                num: '01',
                                title: 'Vật Liệu Tinh Tuyển',
                                desc: 'Da bò thuộc thảo mộc nhập khẩu Italy cùng các dòng gỗ sồi, óc chó nguyên khối được xử lý độ ẩm nghiêm ngặt.'
                            },
                            {
                                num: '02',
                                title: 'Kỹ Thuật Ghép Nối Mộng',
                                desc: 'Sử dụng kỹ thuật ghép mộng gỗ truyền thống không dùng đinh vít, tạo nên cấu trúc vững chãi bền bỉ qua hàng thập kỷ.'
                            },
                            {
                                num: '03',
                                title: 'Cá Nhân Hóa Độc Bản',
                                desc: 'Mọi tác phẩm đều cho phép khách hàng tùy biến kích thước, chất liệu phủ và màu sắc theo đúng gu thẩm mỹ riêng.'
                            }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#FDFBF7] p-8 md:p-10 rounded-3xl border border-[#E8E4DC] space-y-6 shadow-xs hover:shadow-md transition-shadow">
                                <span className="text-xs font-mono font-bold text-[#C9A87C] bg-[#C9A87C]/10 px-3 py-1 rounded-full">{item.num}</span>
                                <h3 className="text-xl font-medium uppercase tracking-tight text-[#0D0D0D]">{item.title}</h3>
                                <p className="text-sm text-[#8A8278] font-light leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Doppelrand Architecture */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h2 className="text-3xl sm:text-5xl font-light uppercase tracking-tight text-[#0D0D0D]">
                        Sẵn Sàng Định Hình <br /> Ngôi Nhà Của Bạn?
                    </h2>
                    <p className="text-sm text-[#8A8278]">Khám phá bộ sưu tập mới nhất hoặc ghé thăm hệ thống showroom trực tiếp.</p>
                    
                    <div className="inline-block p-1.5 rounded-full bg-gradient-to-b from-[#E8E4DC] to-[#C9A87C]/40 shadow-lg">
                        <div className="flex items-center gap-2 bg-[#0D0D0D] p-1.5 rounded-full">
                            <Link
                                to="/products"
                                className="py-4 px-8 rounded-full bg-[#0D0D0D] text-[#FDFBF7] font-semibold text-xs uppercase tracking-widest hover:bg-[#C9A87C] hover:text-[#0D0D0D] transition-all duration-300"
                            >
                                Khám phá bộ sưu tập →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
