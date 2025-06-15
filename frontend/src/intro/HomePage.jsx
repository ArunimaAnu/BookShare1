import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [bookStats, setBookStats] = useState({ books: 0, users: 0, exchanges: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const heroRef = useRef(null);

  // Handle scroll effects
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle mouse movement for parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const { left, top, width, height } = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - left) / width;
        const y = (e.clientY - top) / height;
        setMousePosition({ x, y });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    setIsVisible(true);

    // Simulate fetching stats
    const interval = setInterval(() => {
      setBookStats(prev => ({
        books: prev.books < 15642 ? prev.books + 123 : 15642,
        users: prev.users < 3897 ? prev.users + 41 : 3897,
        exchanges: prev.exchanges < 12453 ? prev.exchanges + 98 : 12453
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(testimonialInterval);
  }, []);

  const testimonials = [
    {
      text: "I've exchanged over 50 books in the past six months. The platform has completely changed how I approach reading!",
      author: "Sarah M.",
      location: "Portland, OR"
    },
    {
      text: "The QR code feature makes it incredibly easy to add my books. I'm now reading twice as much as before, without spending a dime.",
      author: "Michael T.",
      location: "Austin, TX"
    },
    {
      text: "As a librarian, I appreciate how this platform connects our resources to people who might not otherwise access them.",
      author: "Rebecca L.",
      location: "Chicago, IL"
    }
  ];

  const features = [
    {
      icon: "📚",
      title: "Add Your Books",
      description: "Easily add books you'd like to exchange with detailed information."
    },
    {
      icon: "🔄",
      title: "Secure Exchanges",
      description: "Our caution deposit system ensures safe and reliable book exchanges between users."
    },
    {
      icon: "📱",
      title: "Browse & Search",
      description: "Search for books by title, author, genre, or location. Find what you want quickly and easily."
    },
    {
      icon: "📍",
      title: "Wishlist Books",
      description: "Create a wishlist of books you want to read. Get notified when they become available for exchange."
    },
    {
      icon: "🏛️",
      title: "Community",
      description: "Join a vibrant community of book lovers. Share , reviews, and connect with fellow readers."
    },
    {
      icon: "⭐",
      title: "Ratings & Reviews",
      description: "Build trust through our comprehensive rating and review system."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Account",
      description: "Sign up, complete your profile, and make a caution deposit to get started."
    },
    {
      number: "02",
      title: "List Your Books",
      description: "Add books to your collection using our easy form or QR code scanner."
    },
    {
      number: "03",
      title: "Connect & Exchange",
      description: "Find books you want, connect with others, and arrange exchanges."
    }
  ];

  // Get parallax transform style
  const getParallaxStyle = (depth = 30) => {
    const translateX = (mousePosition.x - 0.5) * depth;
    const translateY = (mousePosition.y - 0.5) * depth;
    return {
      transform: `translate(${translateX}px, ${translateY}px)`
    };
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="homepage">
      {/* Navigation - Glassmorphism effect */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-logo">
            <span className="gradient-text">BookShare</span>
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            <span className={`hamburger ${showMobileMenu ? 'active' : ''}`}></span>
          </button>

          {/* Desktop Menu */}
          <div className="desktop-menu">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
          </div>

          <div className="auth-buttons">
            <Link to="/login" className="btn-login">
              Log In
            </Link>
            <Link to="/register" className="btn-signup">
              Sign Up
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${showMobileMenu ? 'show' : ''}`}>
          <a href="#features" className="mobile-nav-link" onClick={toggleMobileMenu}>Features</a>
          <a href="#how-it-works" className="mobile-nav-link" onClick={toggleMobileMenu}>How It Works</a>
          <a href="#testimonials" className="mobile-nav-link" onClick={toggleMobileMenu}>Testimonials</a>
          <div className="mobile-auth-buttons">
            <Link to="/login" className="btn-login-mobile" onClick={toggleMobileMenu}>
              Log In
            </Link>
            <Link to="/register" className="btn-signup-mobile" onClick={toggleMobileMenu}>
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with animated gradient background */}
      <section
        ref={heroRef}
        className="hero-section"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(157, 78, 221, 0.4) 0%, rgba(83, 30, 144, 0.2) 40%, rgba(38, 38, 79, 0) 60%)`,
        }}
      >
        {/* Animated background elements */}
        <div className="floating-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>

        {/* Floating book icons */}
        <div className="floating-books">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="floating-book"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${5 + Math.random() * 10}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            >
              {["📚", "📖", "📕", "📗", "📘", "📙"][Math.floor(Math.random() * 6)]}
            </div>
          ))}
        </div>

        <div className="container">
          <div className="hero-content">
            <div className={`hero-text ${isVisible ? 'visible' : ''}`}>
              <div className="hero-label">
                Reimagining Book Exchanges
              </div>
              <h1 className="hero-title">
                <span className="gradient-animated-text">Exchange Books,</span>
                <br />
                <span className="hero-subtitle">Expand Horizons</span>
              </h1>
              <p className="hero-description">
                A decentralized platform where readers can exchange books directly, build communities, and share knowledge with no intermediaries.
              </p>
              <div className="hero-buttons">
                <Link to="/register" className="btn-primary">
                  <span className="btn-text">Get Started</span>
                  <span className="btn-overlay"></span>
                </Link>
              </div>
            </div>

            <div
              className={`hero-image ${isVisible ? 'visible' : ''}`}
              style={getParallaxStyle(20)}
            >
              {/* 3D Book Stack */}
              <div className="book-stack">
                <div className="book book-1">
                  <div className="book-inner">
                    <div className="book-spine"></div>
                    <div className="book-title">DISCOVER</div>
                  </div>
                </div>

                <div className="book book-2">
                  <div className="book-inner">
                    <div className="book-spine"></div>
                    <div className="book-title">CONNECT</div>
                  </div>
                </div>

                <div className="book book-3">
                  <div className="book-inner">
                    <div className="book-spine"></div>
                    <div className="book-title">EXCHANGE</div>
                  </div>
                </div>

                <div className="book-glow"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Separator */}
        <div className="wave-separator">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,140.83,94.17,208.86,82.7A605.33,605.33,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </section>

      {/* Stats Counter Section */}
    

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="animated-circles">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
        </div>

        <div className="container">
          <div className="section-header">
            <div className="section-label">
              POWERFUL FEATURES
            </div>
            <h2 className="section-title gradient-text">
              Everything You Need
            </h2>
            <p className="section-description">
              Discover the simple yet powerful features that make book exchanges secure, transparent, and enjoyable.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{
                  transitionDelay: `${index * 0.1}s`,
                  transform: `translateY(${Math.min(30, Math.max(0, (scrollY - 1000 + index * 100) / 5))}px)`,
                  opacity: Math.min(1, Math.max(0.2, (scrollY - 800 + index * 100) / 400))
                }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                <div className="feature-corner"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="steps-section">
        <div className="grid-dots"></div>

        <div className="container">
          <div className="section-header">
            <div className="section-label">
              HOW IT WORKS
            </div>
            <h2 className="section-title gradient-text">
              Start in Three Simple Steps
            </h2>
            <p className="section-description">
              Our platform makes it easy to join the community and begin sharing books.
            </p>
          </div>

          <div className="steps-container">
            <div className="steps-line"></div>

            {steps.map((step, index) => (
              <div
                key={index}
                className="step-card"
                style={{
                  transitionDelay: `${index * 0.1}s`,
                  transform: `translateY(${Math.min(50, Math.max(0, (scrollY - 1500 + index * 150) / 10))}px)`,
                  opacity: Math.min(1, Math.max(0.2, (scrollY - 1300 + index * 150) / 500))
                }}
              >
                <div className="step-number-container">
                  <div className="step-number">
                    {step.number}
                  </div>
                  <div className="step-glow"></div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <div className="step-accent"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* CTA Section */}
      <section className="cta-section">
        <div className="gradient-bg">
          <div className="radial-overlay"></div>
        </div>

        <div className="floating-particles">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 7}s`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>

        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title gradient-animated-text">
                Ready to Join Our Community?
              </h2>
              <p className="cta-description">
                Start exchanging books and connecting with fellow readers today.
              </p>
            </div>

            <div className="cta-buttons">
              <Link to="/register" className="btn-cta-primary">
                <span className="btn-text">Sign Up Now</span>
                <span className="btn-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 5L21 12M21 12L14 19M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="btn-overlay"></span>
              </Link>

              <button className="btn-cta-secondary">
                <span className="btn-text">Learn More</span>
                <span className="btn-overlay"></span>
              </button>
            </div>

            <div className="cta-decoration cta-decoration-1"></div>
            <div className="cta-decoration cta-decoration-2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-glow"></div>
        <div className="footer-line"></div>

        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <h3 className="gradient-text">BookShare</h3>
                <div className="logo-underline"></div>
              </div>
              <p className="footer-description">
                A decentralized platform for book lovers to exchange knowledge and build communities without intermediaries.
              </p>
              <div className="newsletter">
                <h4 className="newsletter-title">Subscribe to Our Newsletter</h4>
                <div className="newsletter-form">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="newsletter-input"
                  />
                  <button className="newsletter-button">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 5L21 12M21 12L14 19M21 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="footer-links">
              <h4 className="footer-links-title">Quick Links</h4>
              <ul className="footer-menu">
                <li className="footer-menu-item">
                  <a href="#" className="footer-link">Home</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#features" className="footer-link">Features</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#how-it-works" className="footer-link">How It Works</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#testimonials" className="footer-link">Testimonials</a>
                </li>
              </ul>
            </div>

            <div className="footer-links">
              <h4 className="footer-links-title">Support</h4>
              <ul className="footer-menu">
                <li className="footer-menu-item">
                  <a href="#" className="footer-link">FAQs</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#" className="footer-link">Contact Us</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#" className="footer-link">Privacy Policy</a>
                </li>
                <li className="footer-menu-item">
                  <a href="#" className="footer-link">Terms of Service</a>
                </li>
              </ul>
            </div>

            <div className="footer-contact">
              <h4 className="footer-links-title">Connect With Us</h4>
              <div className="social-links">
                <a href="#" className="social-link">
                  <span className="social-icon">f</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">t</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">i</span>
                </a>
                <a href="#" className="social-link">
                  <span className="social-icon">y</span>
                </a>
              </div>

              <div className="contact-info">
                <h4 className="footer-links-title">Contact</h4>
                <p className="contact-item">
                  <span className="contact-icon">📍</span>
                  123 Book Avenue, Reading Town
                </p>
                <p className="contact-item">
                  <span className="contact-icon">✉️</span>
                  bookexchange71@gmail.com
                </p>
                <p className="contact-item">
                  <span className="contact-icon">📱</span>
                  +1 (234) 567-8901
                </p>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="copyright">
              &copy; {new Date().getFullYear()} BookShare. All rights reserved.
            </p>
            <div className="legal-links">
              <a href="#" className="legal-link">Privacy</a>
              <a href="#" className="legal-link">Terms</a>
              <a href="#" className="legal-link">Cookies</a>
            </div>
          </div>
        </div>

        <div className="footer-corner"></div>
      </footer>
    </div>
  );
};

export default HomePage;