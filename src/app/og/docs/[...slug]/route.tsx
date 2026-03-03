import { getPageImage, source } from '@/lib/source';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

const acrossLogoSvg = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="32" fill="#6CF9D8"/><path fill-rule="evenodd" clip-rule="evenodd" d="M46.3743 14L50 17.6257L37.8834 29.7423C37.2447 28.079 35.921 26.7553 34.2577 26.1166L46.3743 14ZM29.7423 26.1166L17.6257 14L14 17.6257L26.1166 29.7423C26.7553 28.079 28.079 26.7553 29.7423 26.1166ZM26.1166 34.2577L14 46.3743L17.6257 50L29.7423 37.8834C28.079 37.2447 26.7553 35.921 26.1166 34.2577ZM34.2577 37.8834L46.3743 50L50 46.3743L37.8834 34.2577C37.2447 35.921 35.921 37.2447 34.2577 37.8834Z" fill="#2D2E33"/></svg>`;
const acrossLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(acrossLogoSvg).toString('base64')}`;

let barlowSemiBold: ArrayBuffer | null = null;
let barlowBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!barlowSemiBold) {
    const res = await fetch(
      'https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3p-ks51os.ttf',
    );
    barlowSemiBold = await res.arrayBuffer();
  }
  if (!barlowBold) {
    const res = await fetch(
      'https://fonts.gstatic.com/s/barlow/v12/7cHqv4kjgoGqM7E3_-4s51os.ttf',
    );
    barlowBold = await res.arrayBuffer();
  }
}

export const revalidate = false;

export async function GET(
  _req: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>,
) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: '60px 80px',
          backgroundColor: '#151518',
          fontFamily: 'Barlow',
          color: '#ffffff',
        }}
      >
        {/* Site branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '40px',
          }}
        >
          <img src={acrossLogoDataUri} alt="" width={40} height={40} />
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: '0.02em',
            }}
          >
            Across Protocol
          </span>
        </div>

        {/* Page title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: '20px',
          }}
        >
          {page.data.title}
        </div>

        {/* Page description */}
        {page.data.description && (
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.4,
            }}
          >
            {page.data.description}
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#6CF9D8',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Barlow',
          data: barlowSemiBold!,
          weight: 600,
          style: 'normal',
        },
        {
          name: 'Barlow',
          data: barlowBold!,
          weight: 700,
          style: 'normal',
        },
      ],
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
