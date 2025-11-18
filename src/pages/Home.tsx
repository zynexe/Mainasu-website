import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import "../styles/Home.css";
import myBini from "../assets/myBini.webp";
import song from "../assets/song.png";
import gallery from "../assets/gallery.png";
import logo from "../assets/logo.png";
import purpleBlob from "../assets/purple-blob.webp";
import blueBlob from "../assets/blue-blob.webp";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface Photo {
  id: string;
  image_url: string;
}

const Home = () => {
  const navigate = useNavigate();
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navCardsRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch random photos from "jalan-jalan" category
  useEffect(() => {
    fetchRandomPhotos();
  }, []);

  const fetchRandomPhotos = async () => {
    try {
      console.log("🔍 Fetching photos from 'jalan' category...");

      const { data, error } = await supabase
        .from("photos")
        .select("id, image_url")
        .eq("category", "jalan") // Changed from "jalan-jalan" to "jalan"
        .limit(10);

      console.log("📊 Query result:", {
        found: data?.length || 0,
        error: error?.message,
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn("⚠️ No photos found in 'jalan' category");
        setPhotos([]);
        return;
      }

      // Shuffle and select random photos
      const shuffled = data.sort(() => Math.random() - 0.5);
      console.log("✅ Loaded photos:", shuffled.length);

      setPhotos(shuffled);
    } catch (error) {
      console.error("❌ Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Animate cards when they come into view
  useEffect(() => {
    cardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(
          card,
          {
            clipPath: "inset(0 100% 0 0)",
            opacity: 0,
          },
          {
            clipPath: "inset(0 0% 0 0)",
            opacity: 1,
            duration: 0.5,
            delay: index * 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%", // Animation starts when card is 85% down viewport
              end: "top 50%", // Animation ends when card is 50% down viewport
              toggleActions: "play none none none", // Only play once
              // markers: true, // Uncomment to see trigger points (debug)
            },
          }
        );
      }
    });

    // Cleanup ScrollTrigger instances on unmount
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // GSAP Blob Animation
  useEffect(() => {
    // Animate blob-1 (purple)
    gsap.to(".blob-1", {
      x: 450,
      scale: 1.25,
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Animate blob-2 (blue)
    gsap.to(".blob-2", {
      x: -180,
      scale: 2,
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 1,
    });

    // Animate blob-3 (purple)
    gsap.to(".blob-3", {
      x: -1200,
      rotation: 90,
      scale: 1.5,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 2,
    });

    // Animate blob-4 (blue)
    gsap.to(".blob-4", {
      x: 1000,
      scale: 1.3,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 3,
    });

    // Animate blob-5 (purple)
    gsap.to(".blob-5", {
      x: -900,
      rotation: -45,
      scale: 1.3,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 4,
    });
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!carouselRef.current) return;

    const carousel = carouselRef.current;
    let scrollInterval: number; // Changed from NodeJS.Timeout

    const startAutoScroll = () => {
      scrollInterval = window.setInterval(() => {
        if (!isDragging.current && carousel) {
          carousel.scrollLeft += 1;

          // Reset to beginning when reaching end
          if (
            carousel.scrollLeft >=
            carousel.scrollWidth - carousel.clientWidth
          ) {
            carousel.scrollLeft = 0;
          }
        }
      }, 30);
    };

    startAutoScroll();

    return () => window.clearInterval(scrollInterval); // Added window.
  }, [photos]);

  // Carousel drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
    carouselRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (carouselRef.current) {
      carouselRef.current.style.cursor = "grab";
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!carouselRef.current) return;
    isDragging.current = true;
    startX.current = e.touches[0].pageX - carouselRef.current.offsetLeft;
    scrollLeft.current = carouselRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !carouselRef.current) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX.current) * 2;
    carouselRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Scroll to navigation cards
  const scrollToNavCards = () => {
    navCardsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCardHover = (index: number, isHovering: boolean) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      scale: isHovering ? 1.02 : 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  // CDN helper - FIXED VERSION
  const getCDNImageUrl = (supabaseUrl: string): string => {
    const CDN_URL = "https://cdn.mainasu.my.id";
    const USE_CDN = true;

    if (!USE_CDN || !supabaseUrl) return supabaseUrl;

    try {
      const url = new URL(supabaseUrl);
      const pathParts = url.pathname.split("/");
      const publicIndex = pathParts.indexOf("public");

      if (publicIndex === -1 || publicIndex >= pathParts.length - 2) {
        return supabaseUrl;
      }

      const bucketName = pathParts[publicIndex + 1];
      const imagePath = pathParts.slice(publicIndex + 2).join("/");

      if (!bucketName || !imagePath) {
        return supabaseUrl;
      }

      // Use same format as Gallery.tsx
      return `${CDN_URL}/${bucketName}/${imagePath}?width=800&quality=85`;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return supabaseUrl;
    }
  };

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="home">
        {/* Hero Section */}
        <section className="hero-section">
          {/* Animated Mesh Gradient Background */}
          <div className="mesh-gradient">
            <img src={purpleBlob} alt="" className="blob blob-purple blob-1" />
            <img src={blueBlob} alt="" className="blob blob-blue blob-2" />
            <img src={purpleBlob} alt="" className="blob blob-purple blob-3" />
            <img src={blueBlob} alt="" className="blob blob-blue blob-4" />
            <img src={purpleBlob} alt="" className="blob blob-purple blob-5" />
          </div>

          {/* Hero Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              This hero section doesn't have a purpose
            </h1>
            <p className="hero-subtitle">
              Made this just to train my designing skills. Cause why not
            </p>

            {/* Carousel */}
            <div
              ref={carouselRef}
              className="carousel-container"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {loading ? (
                <div className="carousel-loading">Loading photos...</div>
              ) : photos.length > 0 ? (
                <div className="carousel-track">
                  {/* Duplicate images for infinite effect */}
                  {[...photos, ...photos].map((photo, index) => (
                    <div key={`${photo.id}-${index}`} className="carousel-card">
                      <img
                        src={getCDNImageUrl(photo.image_url)}
                        alt="Jalan-jalan"
                        className="carousel-image"
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="carousel-loading">
                  No photos found in jalan-jalan category
                </div>
              )}
            </div>

            {/* Scroll Down Button */}
            <button className="scroll-down-btn" onClick={scrollToNavCards}>
              <span className="scroll-text">Scroll Down</span>
              <svg
                className="scroll-arrow"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 5V19M12 19L5 12M12 19L19 12"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </section>

        {/* Main Content - Navigation Cards */}
        <main ref={navCardsRef} className="main-content">
          <h1 className="welcome-text">Welcome Asu..</h1>
          <h2 className="welcome-subtext">
            This is the official Mainasu website.
          </h2>

          <div className="cards-grid">
            {/* Gallery Card */}
            <div
              ref={(el) => {
                cardsRef.current[0] = el;
              }}
              className="nav-card blue-border"
              onMouseEnter={() => handleCardHover(0, true)}
              onMouseLeave={() => handleCardHover(0, false)}
              onClick={() => navigate("/gallery")}
            >
              <div className="card-content">
                <h2 className="card-title">Gallery</h2>
                <img src={gallery} alt="Gallery" className="card-icon" />
              </div>
            </div>

            {/* Rating Lagu Card */}
            <div
              ref={(el) => {
                cardsRef.current[1] = el;
              }}
              className="nav-card red-border"
              onMouseEnter={() => handleCardHover(1, true)}
              onMouseLeave={() => handleCardHover(1, false)}
              onClick={() => navigate("/rating")}
            >
              <div className="card-content">
                <h2 className="card-title">Rating Lagu</h2>
                <img src={song} alt="Song Rating" className="card-icon" />
              </div>
            </div>

            {/* Claim Waifu Card */}
            <div
              ref={(el) => {
                cardsRef.current[2] = el;
              }}
              className="nav-card purple-border"
              onMouseEnter={() => handleCardHover(2, true)}
              onMouseLeave={() => handleCardHover(2, false)}
              onClick={() => navigate("/waifu")}
            >
              <div className="card-content">
                <h2 className="card-title">Claim Waifu</h2>
                <img
                  src={myBini}
                  alt="Claim Waifu"
                  className="card-icon waifu-icon"
                />
              </div>
            </div>

            {/* About Us Card */}
            <div
              ref={(el) => {
                cardsRef.current[3] = el;
              }}
              className="nav-card orange-border"
              onMouseEnter={() => handleCardHover(3, true)}
              onMouseLeave={() => handleCardHover(3, false)}
              onClick={() => navigate("/about")}
            >
              <div className="card-content">
                <h2 className="card-title">About Us</h2>
                <img
                  src={logo}
                  alt="About Us"
                  className="card-icon logo-icon-card"
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="footer">
          <p className="footer-text">All Right Reserved © Mainasu 2025</p>
          <p className="footer-text">Made By Zynexe</p>
        </footer>
      </div>
    </>
  );
};

export default Home;
