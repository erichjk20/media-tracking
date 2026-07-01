function MediaCover({
  alt,
  className = "",
  fallbackClassName = "",
  imageClassName = "",
  src,
  title,
}) {
  if (src) {
    return (
      <img
        className={imageClassName || className}
        src={src}
        alt={alt || `${title} cover`}
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
