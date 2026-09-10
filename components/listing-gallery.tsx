"use client";

import {useRef, useState} from 'react';
import {Camera, ChevronLeft, ChevronRight} from 'lucide-react';

export default function ListingGallery({id, title, image, images = [], eager = false}: {
  id: string; title: string; image: string; images?: string[]; eager?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<number[]>([]);
  const touchStart = useRef<{x: number; y: number} | null>(null);
  const photos = [...new Set([image, ...images])].filter(Boolean);
  const availableIndexes = photos.map((_, i) => i).filter(i => !failed.includes(i));
  const currentPosition = availableIndexes.length ? index % availableIndexes.length : 0;
  const sourceIndex = availableIndexes[currentPosition] ?? 0;
  const move = (direction: number) => {
    if (!availableIndexes.length) return;
    setIndex((currentPosition + direction + availableIndexes.length) % availableIndexes.length);
  };

  return <div className="car-image listing-gallery" role="group" aria-roledescription="carousel"
    aria-label={`${title} seller photographs`} tabIndex={availableIndexes.length > 1 ? 0 : undefined}
    onKeyDown={event => {
      if (availableIndexes.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}
    onTouchStart={event => {const t = event.touches[0]; touchStart.current = {x: t.clientX, y: t.clientY};}}
    onTouchCancel={() => {touchStart.current = null;}}
    onTouchEnd={event => {
      const start = touchStart.current; touchStart.current = null;
      if (!start || availableIndexes.length < 2) return;
      const t = event.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    }}>
    {availableIndexes.length ? <img key={`${id}-${sourceIndex}`} src={`/api/listing-image?id=${encodeURIComponent(id)}&index=${sourceIndex}`}
      alt={`${title} — seller photograph ${currentPosition + 1} of ${availableIndexes.length}`}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => {
        setFailed(previous => previous.includes(sourceIndex) ? previous : [...previous, sourceIndex]);
        setIndex(0);
      }}/>
      : <p className="gallery-unavailable">Photos unavailable here.<br/>See the original advert.</p>}
    {availableIndexes.length > 0 && <span className="verified"><Camera size={14}/> SELLER PHOTOS</span>}
    {availableIndexes.length > 1 && <>
      <button type="button" className="gallery-arrow gallery-previous" aria-label={`Previous photo of ${title}`} onClick={() => move(-1)}><ChevronLeft size={22}/></button>
      <button type="button" className="gallery-arrow gallery-next" aria-label={`Next photo of ${title}`} onClick={() => move(1)}><ChevronRight size={22}/></button>
      <span className="gallery-count" aria-live="polite" aria-atomic="true">{currentPosition + 1} / {availableIndexes.length}</span>
    </>}
  </div>;
}
