// src/components/Hero.jsx
import React from 'react';

const Hero = ({
    title = "Không gian sống đẳng cấp",
    subtitle = "Bộ sưu tập mới",
    description = "Khám phá những thiết kế nội thất tinh tế, mang đến sự sang trọng và tiện nghi cho ngôi nhà của bạn.",
    buttonText = "Khám phá ngay",
    buttonLink = "/san-pham",
    imageUrl = "https://hoaphatmiennam.vn/wp-content/uploads/2020/10/anh-noi-that-dep-17.jpg"
}) => {
    return (
        <section className="hero">
            <img
                src={imageUrl}
                alt="Hero Background"
                className="hero-image"
            />
            <div className="hero-overlay"></div>
            <div className="container hero-content">
                <span className="hero-subtitle">{subtitle}</span>
                <h1 className="hero-title">{title}</h1>
                <p className="hero-description">{description}</p>
                <a href={buttonLink} className="btn btn-primary">
                    {buttonText}
                </a>
            </div>
        </section>
    );
};

export default Hero;