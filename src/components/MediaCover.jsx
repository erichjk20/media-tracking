import { useEffect, useState } from "react";

function MediaCover({
  alt,
  className = "",
  fallbackClassName = "",
  imageClassName = "",
  src,
  title,
}) {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [src]);

  if (src && !hasImageError) {
    return (
      <img
        className={imageClassName || className}
        src={src}
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
