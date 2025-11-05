import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import Navbar from "../components/Navbar";
import MobileNavbar from "../components/MobileNavbar";
import "../styles/Home.css";
import myBini from "../assets/myBini.webp";
import song from "../assets/song.png";
import tierList from "../assets/tierList.webp";
import logo from "../assets/logo.png";

const Home = () => {
  const navigate = useNavigate();
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Always play slicing animation on load
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
            duration: 0.4,
            delay: index * 0.15,
          }
        );
      }
    });
  }, []);

  const handleCardHover = (index: number, isHovering: boolean) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      scale: isHovering ? 1.02 : 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <>
      <Navbar />
      <MobileNavbar />
      <div className="home">
        {/* Main Content */}
        <main className="main-content">
          <h1 className="welcome-text">Welcome Asu..</h1>
          <h2 className="welcome-subtext">
            This is the official Mainasu website.
          </h2>

          <div className="cards-grid">
            {/* Character Tierlist Card */}
            <div
              ref={(el) => {
                cardsRef.current[0] = el;
              }}
              className="nav-card blue-border"
              onMouseEnter={() => handleCardHover(0, true)}
              onMouseLeave={() => handleCardHover(0, false)}
              onClick={() => navigate("/tierlist")}
            >
              <div className="card-content">
                <h2 className="card-title">Character Tierlist</h2>
                <img src={tierList} alt="Tier List" className="card-icon" />
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
