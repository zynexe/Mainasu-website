import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Fade in animation
export const fadeIn = (element: string | HTMLElement, duration = 1, delay = 0) => {
  gsap.from(element, {
    opacity: 0,
    y: 50,
    duration,
    delay,
    ease: 'power3.out',
  });
};

// Slide in from left
export const slideInLeft = (element: string | HTMLElement, duration = 1, delay = 0) => {
  gsap.from(element, {
    opacity: 0,
    x: -100,
    duration,
    delay,
    ease: 'power3.out',
  });
};

// Slide in from right
export const slideInRight = (element: string | HTMLElement, duration = 1, delay = 0) => {
  gsap.from(element, {
    opacity: 0,
    x: 100,
    duration,
    delay,
    ease: 'power3.out',
  });
};

// Scale up animation
export const scaleUp = (element: string | HTMLElement, duration = 0.5, delay = 0) => {
  gsap.from(element, {
    scale: 0,
    duration,
    delay,
    ease: 'back.out(1.7)',
  });
};

// Stagger animation for lists
export const staggerFadeIn = (elements: string, duration = 0.8, stagger = 0.2) => {
  gsap.from(elements, {
    opacity: 0,
    y: 30,
    duration,
    stagger,
    ease: 'power3.out',
  });
};

// Scroll triggered animation
export const scrollTriggerAnimation = (
  element: string | HTMLElement,
  animation: gsap.TweenVars,
  triggerElement?: string | HTMLElement
) => {
  gsap.from(element, {
    ...animation,
    scrollTrigger: {
      trigger: triggerElement || element,
      start: 'top 80%',
      end: 'bottom 20%',
      toggleActions: 'play none none reverse',
    },
  });
};

// Hover animation
export const hoverScale = (element: HTMLElement) => {
  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
};

// Rotate animation
export const rotate = (element: string | HTMLElement, duration = 2) => {
  gsap.to(element, {
    rotation: 360,
    duration,
    ease: 'none',
    repeat: -1,
  });
};

// Pulse animation
export const pulse = (element: string | HTMLElement, duration = 1) => {
  gsap.to(element, {
    scale: 1.1,
    duration,
    ease: 'power1.inOut',
    repeat: -1,
    yoyo: true,
  });
};
