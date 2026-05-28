"use client";

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  variant?: RevealVariant;
  /** Stagger index — adds 60ms delay per step (capped). */
  index?: number;
  /** Explicit delay in ms (overrides index). */
  delay?: number;
  /** Reveal only once (default true). */
  once?: boolean;
  className?: string;
}

const VARIANT_CLASS: Record<RevealVariant, string> = {
  up: "",
  fade: "reveal-fade",
  scale: "reveal-scale",
  left: "reveal-left",
  right: "reveal-right",
};

export function Reveal({
  children,
  as,
  variant = "up",
  index = 0,
  delay,
  once = true,
  className = "",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  const resolvedDelay = delay ?? Math.min(index * 60, 420);

  return (
    <Tag
      ref={ref}
      className={`reveal ${VARIANT_CLASS[variant]} ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={resolvedDelay ? { transitionDelay: `${resolvedDelay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
