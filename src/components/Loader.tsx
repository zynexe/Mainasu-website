import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import '../styles/Loader.css';

interface LoaderProps {
  onComplete: () => void;
}

const Loader = ({ onComplete }: LoaderProps) => {
  const [percentage, setPercentage] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        // Wait a bit before fading out
        setTimeout(() => {
          gsap.to(loaderRef.current, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.inOut',
            onComplete: onComplete,
          });
        }, 500);
      },
    });

    // Animate percentage from 0 to 100
    tl.to(
      {},
      {
        duration: 3,
        ease: 'power2.inOut',
        onUpdate: function () {
          const progress = Math.round(this.progress() * 100);
          setPercentage(progress);
        },
      }
    );

    // Animate fill from bottom to top (synchronized with percentage)
    tl.to(
      fillRef.current,
      {
        height: '100%',
        duration: 3,
        ease: 'power2.inOut',
      },
      0
    );

    // Fade out percentage text at 100%
    tl.to(percentageRef.current, {
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      ease: 'power2.in',
    });

    // Fade in logo
    tl.to(
      logoRef.current,
      {
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'back.out(1.7)',
      },
      '-=0.2'
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div className="loader-container" ref={loaderRef}>
      {/* Black fill that rises from bottom */}
      <div className="loader-fill" ref={fillRef}></div>

      {/* Percentage number */}
      <div className="loader-content">
        <div className="percentage-text" ref={percentageRef}>
          {percentage}%
        </div>

        {/* Logo that appears after percentage */}
        <img
          ref={logoRef}
          src={new URL('../assets/logo.png', import.meta.url).href}
          alt="Logo"
          className="loader-logo"
        />
      </div>
    </div>
  );
};

export default Loader;
