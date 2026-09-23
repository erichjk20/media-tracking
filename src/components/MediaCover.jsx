import { useEffect, useState } from "react";

function shouldProxyImage(src) {
  if (!src || typeof window === "undefined") return false;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return false;

  try {
    const url = new URL(src);
    return url.hostname === "uploads.mangadex.org";
  } catch {
    return false;
  }
}

function getCoverImageSrc(src) {
  if (!shouldProxyImage(src)) return src;
  return `/api/proxy-image?url=${encodeURIComponent(src)}`;
}

function MediaCover({
  alt,
  className = "",
  fallbackClassName = "",
  imageClassName = "",
  src,
  title,
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageSrc = getCoverImageSrc(src);

  useEffect(() => {
    setHasImageError(false);
  }, [imageSrc]);

  if (imageSrc && !hasImageError) {
    return (
      <img
        className={imageClassName || className}
        src={imageSrc}
        alt={alt || `${title} cover`}
        onError={() => setHasImageError(true)}
      />
    );
  }

  return (
    <div className={`cover-fallback ${className} ${fallbackClassName}`.trim()}>
      {title}
    </div>
  );
}

export default MediaCover;
