"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItem {
  title: string;
  content: string[];
}

interface ProductAccordionsProps {
  items: AccordionItem[];
}

export function ProductAccordions({ items }: ProductAccordionsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div key={item.title} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="font-medium">{item.title}</span>
              <ChevronDown
                className={[
                  "h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform",
                  isOpen ? "rotate-180" : "",
                ].join(" ")}
                aria-hidden
              />
            </button>
            {isOpen && (
              <div className="border-t border-[var(--color-border)] px-5 py-4">
                <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {item.content.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="text-gold">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
