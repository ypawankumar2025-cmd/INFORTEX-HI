
import { useLayoutEffect } from "react";
import { gsap } from "gsap";

export default function HeroMotion() {
  useLayoutEffect(() => {
    const hero = document.querySelector<HTMLElement>(
      ".welcome-banner.hi-theme-hero"
    );

    if (!hero) return;
       if (typeof window.matchMedia !== "function") {
        return;
       }

if (
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
) {
  return;
}
const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hi-hero-copy h2",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform",
        }
      );

      gsap.fromTo(
        ".hi-hero-copy p, .hi-hero-copy .text-button",
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.65,
          delay: 0.2,
          stagger: 0.12,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform",
        }
      );

      gsap.fromTo(
        ".hi-hero-decoration",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 1,
          delay: 0.2,
          clearProps: "opacity",
        }
      );
    }, hero);

    return () => ctx.revert();
  }, []);

  return null;
}
