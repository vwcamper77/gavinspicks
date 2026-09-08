"use client";

import {useRef, useState} from 'react';
import {Camera, ChevronLeft, ChevronRight} from 'lucide-react';

export default function ListingGallery({title, image, images = [], eager = false}: {
  title: string; image: string; images?: string[]; eager?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const touchStart = useRef<{x: number; y: number} | null>(null);
  const photos = [...new Set([image, ...images])].filter(url => url && !failed.includes(url));
  const current = photos.length ? index % photos.length : 0;
  const move = (direction: number) => setIndex((current + direction + photos.length) % photos.length);

  return <div className="car-image listing-gallery" role="group" aria-roledescription="carousel"
    aria-label={`${title} seller photographs`} tabIndex={photos.length > 1 ? 0 : undefined}
    onKeyDown={event => {
      if (photos.length > 1 && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
      }
    }}
    onTouchStart={event => {const t = event.touches[0]; touchStart.current = {x: t.clientX, y: t.clientY};}}
    onTouchCancel={() => {touchStart.current = null;}}
    onTouchEnd={event => {
      const start = touchStart.current; touchStart.current = null;
      if (!start || photos.length < 2) return;
      const t = event.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
    }}>
    {photos.length ? <img key={photos[current]} src={photos[current]}
      alt={`${title} — seller photograph ${current + 1} of ${photos.length}`}
      loading={eager ? 'eager' : 'lazy'} referrerPolicy="no-referrer"
      onError={() => setFailed(previous => [...previous, photos[current]])}/>
      : <p className="gallery-unavailable">Photos unavailable here.<br/>See the original advert.</p>}
    {photos.length > 0 && <span className="verified"><Camera size={14}/> SELLER PHOTOS</span>}
    {photos.length > 1 && <>
      <button type="button" className="gallery-arrow gallery-previous" aria-label={`Previous photo of ${title}`} onClick={() => move(-1)}><ChevronLeft size={22}/></button>
      <button type="button" className="gallery-arrow gallery-next" aria-label={`Next photo of ${title}`} onClick={() => move(1)}><ChevronRight size={22}/></button>
      <span className="gallery-count" aria-live="polite" aria-atomic="true">{current + 1} / {photos.length}</span>
    </>}
  </div>;
}
