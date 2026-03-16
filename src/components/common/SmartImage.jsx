'use client';

import { useEffect, useMemo, useState } from 'react';

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

export default function SmartImage({
  src,
  alt,
  className = '',
  fallbackClassName = '',
  loading = 'lazy',
  decoding = 'async',
  onClick,
}) {
  const normalizedSrc = typeof src === 'string' ? src.trim() : '';

  const proxiedSrc = useMemo(() => {
    if (!normalizedSrc) return '';
    if (!isRemoteUrl(normalizedSrc)) return normalizedSrc;
    return `/api/image-proxy?url=${encodeURIComponent(normalizedSrc)}`;
  }, [normalizedSrc]);

  const [mode, setMode] = useState(proxiedSrc !== normalizedSrc ? 'proxy' : 'direct');
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setMode(proxiedSrc !== normalizedSrc ? 'proxy' : 'direct');
    setHasImageError(false);
  }, [proxiedSrc, normalizedSrc]);

  const displaySrc = mode === 'proxy' ? proxiedSrc : normalizedSrc;

  const handleError = () => {
    if (mode === 'proxy' && normalizedSrc) {
      setMode('direct');
      return;
    }
    setHasImageError(true);
  };

  if (!displaySrc || hasImageError) {
    return (
      <div
        className={`bg-gray-100 text-xs text-gray-500 uppercase tracking-wide flex items-center justify-center ${className} ${fallbackClassName}`}
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={displaySrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onClick={onClick}
      onError={handleError}
      className={className}
    />
  );
}
