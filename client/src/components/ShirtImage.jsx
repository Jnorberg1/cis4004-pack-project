export default function ShirtImage({ src, alt, size = "md" }) {
  const sizeClass = size === "sm" ? "shirt-image--sm" : "";

  if (!src?.trim()) {
    return (
      <div
        className={`shirt-image shirt-image--placeholder ${sizeClass}`.trim()}
        role="img"
        aria-label={alt || "No shirt image"}
      >
        No image
      </div>
    );
  }

  return (
    <img
      className={`shirt-image ${sizeClass}`.trim()}
      src={src.trim()}
      alt={alt || "Shirt"}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  );
}
