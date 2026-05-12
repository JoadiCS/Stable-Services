import { useState } from 'react';

interface PhotoCardProps {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  objectPosition: string;
  brightness: number;
  saturate: number;
}

function PhotoCard({
  src,
  alt,
  eyebrow,
  title,
  objectPosition,
  brightness,
  saturate,
}: PhotoCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      style={{ position: 'relative', overflow: 'hidden' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition,
          filter: `brightness(${brightness}) saturate(${saturate})`,
          transition: 'transform .6s',
          transform: hover ? 'scale(1.04)' : 'scale(1)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top,rgba(10,15,30,.6) 0%,transparent 55%)',
        }}
      />
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '2rem' }}>
        <div
          style={{
            fontSize: '.62rem',
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(201,168,76,.85)',
            marginBottom: '.3rem',
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: 'Cormorant Garamond, Georgia, serif',
            fontSize: '1.4rem',
            fontWeight: 300,
            color: '#fff',
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

export function PhotoBand() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        height: 340,
        overflow: 'hidden',
      }}
    >
      <PhotoCard
        src="/img/photo-band-left.png"
        alt="Crystal clear Arizona pool"
        eyebrow="Pool & Spa"
        title="Pristine water, every week."
        objectPosition="center 30%"
        brightness={0.88}
        saturate={1.15}
      />
      <PhotoCard
        src="/img/photo-band-right.png"
        alt="Scottsdale estate pool and grounds"
        eyebrow="Full Property Care"
        title="Grounds, repairs & beyond."
        objectPosition="center 45%"
        brightness={0.82}
        saturate={1.1}
      />
    </div>
  );
}
