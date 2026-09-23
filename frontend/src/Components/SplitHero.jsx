import React, { useEffect, useState } from "react";
import Eyebrow from "./Eyebrow.jsx";

const SLIDE_MS = 5000;

// One slide is either a "plain" finished picture (its own frame and tagline) or a photo shown in
// a curved frame with a handwritten tagline on top.
function Slide({ slide }) {
  if (slide.plain) {
    return (
      <div className="flex h-full items-center justify-end">
        <img src={slide.image} alt={slide.alt || ""} className="hero-fade h-auto w-full mix-blend-multiply" />
      </div>
    );
  }

  return (
    <div className="h-full p-4 sm:p-6 lg:p-0">
      <div className="relative h-full overflow-hidden rounded-3xl shadow-xl ring-8 ring-white/70 lg:ml-6 lg:rounded-l-[220px] lg:rounded-r-none">
        <img src={slide.image} alt={slide.alt || ""} className={`h-full w-full object-cover ${slide.focusRight ? "object-right" : ""}`} />
        {!slide.focusRight && <div className="absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-transparent" />}
        {slide.tagline && (
          <p className="absolute bottom-6 right-6 max-w-[11rem] text-right font-script text-2xl leading-[1.05] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] sm:max-w-[13rem] sm:text-3xl lg:bottom-12 lg:right-12 lg:text-4xl">
            {slide.tagline}
            <span className="ml-auto mt-1 block h-1 w-24 rounded bg-brand sm:w-28" />
          </p>
        )}
      </div>
    </div>
  );
}

// Crossfading picture area; with more than one slide it rotates automatically and shows dots.
function HeroMedia({ slides }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => setActive((prev) => (prev + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative order-1 min-h-[240px] sm:min-h-[320px] lg:order-2 lg:min-h-[440px]">
      {slides.map((slide, index) => (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === active ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          aria-hidden={index !== active}
        >
          <Slide slide={slide} />
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-10 flex justify-center gap-2 lg:left-auto lg:right-12 lg:bottom-4">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show picture ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === active ? "w-7 bg-brand" : "w-2.5 bg-navy/25 hover:bg-navy/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Two-column page hero: copy on the left, picture(s) on the right.
// Pass `slides` for a rotating set, or `image` (+ optional tagline / plainImage) for a single picture.
function SplitHero({
  eyebrow,
  title,
  text,
  actions,
  extra,
  slides,
  image,
  imageAlt = "",
  tagline,
  plainImage = false,
}) {
  const media = slides || [{ image, alt: imageAlt, tagline, plain: plainImage }];

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-2">
        <div className="order-2 flex flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 lg:order-1 lg:px-8 lg:py-20">
          <Eyebrow className="mb-5">{eyebrow}</Eyebrow>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
            {title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg">{text}</p>
          {actions && <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">{actions}</div>}
          {extra && <div className="mt-8">{extra}</div>}
        </div>

        <HeroMedia slides={media} />
      </div>
    </section>
  );
}

export default SplitHero;
