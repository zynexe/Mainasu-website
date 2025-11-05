import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "../styles/Loader.css";
import logo from "../assets/logo.png";

interface LoaderProps {
  onComplete: () => void;
}

const Loader = ({ onComplete }: LoaderProps) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const [percentage, setPercentage] = useState(0);
  const [textColor, setTextColor] = useState("#000");

  // Calculate luminance using YIQ formula
  const calculateLuminance = (r: number, g: number, b: number): number => {
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  // Parse RGB/RGBA string to get individual values
  const parseRGB = (rgbString: string): { r: number; g: number; b: number } => {
    const match = rgbString.match(/\d+/g);
    if (match && match.length >= 3) {
      return {
        r: parseInt(match[0]),
        g: parseInt(match[1]),
        b: parseInt(match[2]),
      };
    }
    return { r: 255, g: 255, b: 255 }; // default to white
  };

  // Get background color at the center of the screen and determine text color
  const updateTextColor = () => {
    if (!percentageRef.current) return;

    const rect = percentageRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;

    // Create a temporary element at the center to sample background
    const sample = document.createElement("div");
    sample.style.position = "fixed";
    sample.style.left = "50%";
    sample.style.top = `${centerY}px`;
    sample.style.width = "1px";
    sample.style.height = "1px";
    sample.style.pointerEvents = "none";
    document.body.appendChild(sample);

    // Get the computed background color
    const bgColor = window.getComputedStyle(loaderRef.current!).backgroundColor;
    const fillHeight = fillRef.current
      ? parseFloat(window.getComputedStyle(fillRef.current).height)
      : 0;
    const loaderHeight = loaderRef.current ? loaderRef.current.clientHeight : 0;

    // Determine if we're on the black fill or white background
    let color;
    if (fillHeight > 0 && centerY > loaderHeight - fillHeight) {
      // We're on the black fill
      const fillColor = window.getComputedStyle(
        fillRef.current!
      ).backgroundColor;
      color = parseRGB(fillColor);
    } else {
      // We're on the white background
      color = parseRGB(bgColor);
    }

    document.body.removeChild(sample);

    // Calculate luminance and set text color
    const luminance = calculateLuminance(color.r, color.g, color.b);

    // If luminance > 128 (bright background), use black text; otherwise white text
    setTextColor(luminance > 128 ? "#000" : "#fff");
  };

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          onComplete();
        }, 500);
      },
    });

    // Animate percentage from 0 to 100
    tl.to(
      {},
      {
        duration: 2,
        ease: "power2.inOut",
        onUpdate: function () {
          const progress = this.progress();
          const currentPercentage = Math.round(progress * 100);
          setPercentage(currentPercentage);

          // Animate fill height
          if (fillRef.current) {
            gsap.set(fillRef.current, {
              height: `${currentPercentage}%`,
            });
          }

          // Update text color based on background
          updateTextColor();
        },
      }
    );

    // Fade out percentage and show logo
    tl.to(percentageRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.4,
      ease: "power2.in",
    });

    tl.to(
      logoRef.current,
      {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
      },
      "-=0.2"
    );

    // Hold logo for a moment
    tl.to({}, { duration: 0.5 });

    // Fade out entire loader
    tl.to(loaderRef.current, {
      opacity: 0,
      duration: 0.5,
      ease: "power2.inOut",
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div ref={loaderRef} className="loader-container">
      <div ref={fillRef} className="loader-fill"></div>
      <div className="loader-content">
        <div
          ref={percentageRef}
          className="percentage-text"
          style={{ color: textColor }}
        >
          {percentage}%
        </div>
        <img ref={logoRef} src={logo} alt="Logo" className="loader-logo" />
      </div>
    </div>
  );
};

export default Loader;
