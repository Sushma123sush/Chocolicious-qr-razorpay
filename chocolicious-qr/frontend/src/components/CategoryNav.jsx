import { useEffect, useRef } from "react";

export default function CategoryNav({ categories, activeId, onSelect }) {
  const railRef = useRef(null);
  const chipRefs = useRef({});

  useEffect(() => {
    const chip = chipRefs.current[activeId];
    const rail = railRef.current;
    if (chip && rail) {
      const chipLeft = chip.offsetLeft;
      const chipRight = chipLeft + chip.offsetWidth;
      const railLeft = rail.scrollLeft;
      const railRight = railLeft + rail.clientWidth;
      if (chipLeft < railLeft || chipRight > railRight) {
        rail.scrollTo({ left: chipLeft - 16, behavior: "smooth" });
      }
    }
  }, [activeId]);

  return (
    <nav className="category-nav no-scrollbar" ref={railRef} aria-label="Menu categories">
      {categories.map((cat) => (
        <button
          key={cat.id}
          ref={(el) => (chipRefs.current[cat.id] = el)}
          type="button"
          className={`category-chip${cat.id === activeId ? " category-chip--active" : ""}`}
          onClick={() => onSelect(cat.id)}
          aria-current={cat.id === activeId ? "true" : undefined}
        >
          {cat.name}
        </button>
      ))}
    </nav>
  );
}
