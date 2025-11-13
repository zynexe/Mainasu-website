import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import logo from "../assets/logo.png";
import personIcon from "../assets/person.png";
import "../styles/MobileNavbar.css";

interface User {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
}

const MobileNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false); // NEW: Control rendering
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user from localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      // Start rendering the menu
      setShouldRender(true);

      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";

      // Wait for next frame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Open animation - slide in from right
        gsap.set(menuRef.current, { x: "100%" });
        gsap.set(overlayRef.current, { opacity: 0 });

        const tl = gsap.timeline();
        tl.to(overlayRef.current, {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        }).to(
          menuRef.current,
          {
            x: "0%",
            duration: 0.4,
            ease: "power3.out",
          },
          "-=0.2"
        );
      });
    } else if (menuRef.current && shouldRender) {
      // Re-enable body scroll
      document.body.style.overflow = "";

      // Close animation - slide out to right
      const tl = gsap.timeline({
        onComplete: () => {
          // Stop rendering after animation completes
          setShouldRender(false);
        },
      });
      tl.to(menuRef.current, {
        x: "100%",
        duration: 0.3,
        ease: "power3.in",
      }).to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.2,
        },
        "-=0.1"
      );
    }
  }, [isMenuOpen, shouldRender]);

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    // No need for setTimeout - animation handles timing
    setTimeout(() => navigate(path), 400);
  };

  const handleChangeUser = () => {
    setIsMenuOpen(false);
    setTimeout(() => navigate("/change-user"), 400);
  };

  const isActive = (path: string) => location.pathname === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <nav className="mobile-navbar">
        <div className="mobile-navbar-container">
          {/* Logo only (no text) */}
          <div className="mobile-navbar-logo" onClick={() => navigate("/")}>
            <img src={logo} alt="Mainasu" className="mobile-logo-icon" />
          </div>

          {/* Hamburger Icon */}
          <button
            className={`hamburger-button ${isMenuOpen ? "active" : ""}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </nav>

      {/* Only render overlay and menu when shouldRender is true */}
      {shouldRender && (
        <>
          {/* Overlay */}
          <div
            ref={overlayRef}
            className="mobile-menu-overlay"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Full Screen Menu */}
          <div ref={menuRef} className="mobile-menu">
            <div className="mobile-menu-content">
              {/* User Profile Section - Now Clickable */}
              <button
                className="mobile-menu-profile"
                onClick={handleChangeUser}
              >
                <img
                  src={currentUser?.avatar_url || personIcon}
                  alt="Profile"
                  className="mobile-profile-avatar"
                />
                <div className="mobile-profile-info">
                  <p className="mobile-profile-name">
                    {currentUser?.name || "Guest"}
                  </p>
                  <p className="mobile-profile-role">
                    {currentUser?.role || "Select a user"}
                  </p>
                </div>
                <span className="mobile-profile-change">Change</span>
              </button>

              {/* Navigation Links */}
              <div className="mobile-menu-links">
                <button
                  className={`mobile-menu-link ${
                    isActive("/") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/")}
                >
                  <span className="mobile-link-text">Home</span>
                </button>

                <button
                  className={`mobile-menu-link ${
                    isActive("/gallery") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/gallery")}
                >
                  <span className="mobile-link-text">Gallery</span>
                </button>

                <button
                  className={`mobile-menu-link ${
                    isActive("/waifu") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/waifu")}
                >
                  <span className="mobile-link-text">Waifu's</span>
                </button>

                <button
                  className={`mobile-menu-link ${
                    isActive("/rating") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/rating")}
                >
                  <span className="mobile-link-text">Rating</span>
                </button>

                <button
                  className={`mobile-menu-link ${
                    isActive("/about") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/about")}
                >
                  <span className="mobile-link-text">About</span>
                </button>
              </div>

              {/* Close Button at Bottom */}
              <button className="mobile-menu-close" onClick={toggleMenu}>
                <span className="close-icon">✕</span>
                <span>Close Menu</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavbar;
