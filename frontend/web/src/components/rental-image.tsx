"use client";

import { useState } from "react";
import { rentalImageFallback, resolveAssetUrl } from "@/lib/rentals";

export function RentalImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const resolvedSrc = resolveAssetUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSrc = failedSrc === resolvedSrc ? rentalImageFallback : resolvedSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      onError={() => setFailedSrc(resolvedSrc)}
      src={imageSrc}
    />
  );
}
