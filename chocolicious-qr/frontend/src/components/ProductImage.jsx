import { useState } from "react";

export default function ProductImage({ src, alt, unavailable }) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  return (
    <div className={`product-image${unavailable ? " product-image--unavailable" : ""}`}>
      {showPlaceholder ? (
        <div className="product-image__placeholder" role="img" aria-label={alt}>
          <svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true">
            <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              d="M24 12c-6 0-11 5-11 11s5 11 11 11 11-5 11-11-5-11-11-11zm0 4c1.9 0 3.4 2 3.4 4.6 0 .5-.8.8-1.4.8-.7 0-1.2-.7-1.4-1.7-.2-1.3-.4-2.4-.6-2.4s-.5 1.1-.6 2.4c-.2 1-.7 1.7-1.4 1.7-.6 0-1.4-.3-1.4-.8 0-2.6 1.5-4.6 3.4-4.6z"
              fill="currentColor"
            />
          </svg>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {unavailable && <span className="product-image__unavailable-tag">Unavailable</span>}
    </div>
  );
}
