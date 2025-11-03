import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";
import personIcon from "../assets/person.png";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="page-navbar">
      <div className="page-navbar-container">
        <div className="page-navbar-logo" onClick={() => navigate("/")}>
          <img src={logo} alt="Mainasu Logo" className="page-logo-icon" />
          <span className="page-logo-text">Mainasu</span>
        </div>

        <div className="page-navbar-center">
          <div className="page-navbar-links">
            <Link
              to="/tierlist"
              className={`page-nav-link ${
                isActive("/tierlist") ? "active" : ""
              }`}
            >
              Tierlist
            </Link>
            <Link
              to="/waifu"
              className={`page-nav-link ${isActive("/waifu") ? "active" : ""}`}
            >
              Waifu's
            </Link>
            <Link
              to="/rating"
              className={`page-nav-link ${isActive("/rating") ? "active" : ""}`}
            >
              Rating
            </Link>
            <Link
              to="/about"
              className={`page-nav-link ${isActive("/about") ? "active" : ""}`}
            >
              About
            </Link>
          </div>
        </div>

        <div className="page-navbar-profile">
          <button
            className="page-profile-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <img src={personIcon} alt="Profile" className="page-profile-icon" />
            <span className="page-username">zynexe</span>
            <svg
              className={`page-dropdown-arrow ${isDropdownOpen ? "open" : ""}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="page-dropdown-menu">
              <button className="page-dropdown-item">Change User</button>
              <button className="page-dropdown-item danger">Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
