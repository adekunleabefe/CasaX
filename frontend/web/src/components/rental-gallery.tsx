"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Badge, Button } from "@casax/ui";
import { RentalImage } from "@/components/rental-image";
import { rentalImageFallback, resolveAssetUrl } from "@/lib/rentals";

export function RentalGallery({
  images,
  propertyName,
  title,
  unitName,
  verifiedDate,
}: {
  images: string[];
  propertyName: string;
  title: string;
  unitName: string;
  verifiedDate: string | null;
}) {
  const galleryImages = useMemo<string[]>(
    () =>
      images.length
        ? images.map((image) => resolveAssetUrl(image))
        : [rentalImageFallback],
    [images],
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const coverImage = galleryImages[0];
  const thumbnails = galleryImages.slice(1, 5);
  const hasThumbnails = thumbnails.length > 0;

  const openGallery = useCallback(
    (index: number) => {
      const safeIndex = Math.min(Math.max(index, 0), galleryImages.length - 1);
      setActiveImageIndex(safeIndex);
      setIsGalleryOpen(true);
    },
    [galleryImages.length],
  );

  const closeGallery = useCallback(() => {
    setIsGalleryOpen(false);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveImageIndex((current) =>
      current === 0 ? galleryImages.length - 1 : current - 1,
    );
  }, [galleryImages.length]);

  const showNext = useCallback(() => {
    setActiveImageIndex((current) =>
      current === galleryImages.length - 1 ? 0 : current + 1,
    );
  }, [galleryImages.length]);

  useEffect(() => {
    if (!isGalleryOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeGallery, isGalleryOpen, showNext, showPrevious]);

  return (
    <>
      <div className="grid gap-2 overflow-hidden rounded-[1.75rem] lg:grid-cols-4">
        <button
          className={`group relative min-h-[300px] overflow-hidden bg-slate-200 text-left shadow-[0_25px_65px_-38px_rgba(15,23,42,0.6)] outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            hasThumbnails
              ? "aspect-[4/3] rounded-[1.75rem] lg:col-span-2 lg:row-span-2"
              : "aspect-[16/9] rounded-[1.75rem] sm:min-h-[480px] lg:col-span-4"
          }`}
          onClick={() => openGallery(0)}
          type="button"
        >
          <RentalImage
            alt={`${title} cover image`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            src={coverImage}
          />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/72 via-slate-950/24 to-transparent" />
          <div className="absolute left-5 right-5 top-5 flex justify-between gap-4">
            <Badge className="bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
              <BadgeCheck className="mr-1.5 size-3.5 text-emerald-300" />
              Verified rental
            </Badge>
            {verifiedDate ? (
              <p className="rounded-full bg-slate-950/30 px-3 py-1 text-xs text-white backdrop-blur">
                Reviewed {verifiedDate}
              </p>
            ) : null}
          </div>
          <div className="absolute bottom-5 left-5 right-5">
            <p className="text-sm text-slate-200">{propertyName}</p>
            <p className="mt-2 max-w-[72%] text-2xl font-semibold text-white sm:text-3xl">
              {unitName}
            </p>
          </div>
        </button>

        {hasThumbnails
          ? thumbnails.slice(0, 4).map((image, index) => {
              const imageIndex = index + 1;
              const isLast = index === 3 && galleryImages.length > 5;
              return (
                <button
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 text-left shadow-sm outline-none ring-0 transition focus-visible:ring-2 focus-visible:ring-emerald-500 lg:rounded-none"
                  key={`${image ?? "fallback"}-${index}`}
                  onClick={() => openGallery(imageIndex)}
                  type="button"
                >
                  <RentalImage
                    alt={`${title} gallery image ${index + 2}`}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    src={image}
                  />
                  {isLast ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-semibold text-white backdrop-blur-[1px]">
                      <span className="rounded-full bg-white/15 px-4 py-2">
                        +{galleryImages.length - 5} more
                      </span>
                    </div>
                  ) : null}
                </button>
              );
            })
          : null}
      </div>

      <Button
        className="mt-3 rounded-2xl bg-white px-4 py-3 text-slate-950 shadow-sm"
        onClick={() => openGallery(0)}
        type="button"
        variant="outline"
      >
        <Camera className="mr-2 size-4" />
        Show all photos ({galleryImages.length})
      </Button>

      {isGalleryOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[100] bg-slate-950/95 px-4 py-4 text-white sm:px-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGallery();
          }}
          role="dialog"
        >
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-300">
                {activeImageIndex + 1} / {galleryImages.length}
              </p>
              <button
                aria-label="Close image viewer"
                className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                onClick={closeGallery}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
              <button
                aria-label="Previous image"
                className="absolute left-0 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                onClick={showPrevious}
                type="button"
              >
                <ChevronLeft className="size-5" />
              </button>
              <RentalImage
                alt={`${title} preview image ${activeImageIndex + 1}`}
                className="max-h-full max-w-full rounded-3xl object-contain"
                src={galleryImages[activeImageIndex]}
              />
              <button
                aria-label="Next image"
                className="absolute right-0 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                onClick={showNext}
                type="button"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {galleryImages.map((image, index) => (
                <button
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition ${
                    activeImageIndex === index
                      ? "border-emerald-300"
                      : "border-white/10 opacity-70 hover:opacity-100"
                  }`}
                  key={`${image ?? "fallback-thumb"}-${index}`}
                  onClick={() => setActiveImageIndex(index)}
                  type="button"
                >
                  <RentalImage
                    alt={`${title} thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                    src={image}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
