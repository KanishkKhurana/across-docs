import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Across Developer Documentation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#151518',
          padding: '60px',
        }}
      >
        {/* Logo mark */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 56 56"
          fill="none"
          style={{ marginBottom: 40 }}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.3615 7.3615H14.723V0H41.277V7.3615H48.6385V0H56V7.3615H48.6385V14.723H56V41.277H48.6385V48.6385H41.277V56H14.723V48.6385H7.3615V56H0V48.6385H7.3615V41.277H0V14.723H7.3615V7.3615H0V0H7.3615V7.3615ZM12.139 40.0725L15.9277 43.8612L27.0481 32.7407L26.2922 32.4505C25.0345 31.9675 24.0326 30.9657 23.5496 29.7079L23.2594 28.952L12.139 40.0725ZM32.4504 29.7079C31.9674 30.9657 30.9655 31.9675 29.7078 32.4505L28.9519 32.7407L40.0723 43.8612L43.861 40.0725L32.7406 28.952L32.4504 29.7079ZM12.139 15.9278L23.2594 27.0482L23.5496 26.2924C24.0326 25.0346 25.0345 24.0328 26.2922 23.5498L27.0481 23.2595L15.9277 12.1391L12.139 15.9278ZM28.9519 23.2595L29.7078 23.5498C30.9655 24.0328 31.9674 25.0346 32.4504 26.2924L32.7406 27.0482L43.861 15.9278L40.0723 12.1391L28.9519 23.2595Z"
            fill="#6CF9D8"
          />
          <path d="M56 48.6385V56H48.6385V48.6385H56Z" fill="#6CF9D8" />
        </svg>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: 52,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          Across Developer Documentation
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: 24,
            color: '#A1A1AA',
          }}
        >
          The fastest crosschain infrastructure for builders.
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            gap: 60,
            marginTop: 48,
          }}
        >
          {[
            { value: '$35B+', label: 'Bridged' },
            { value: '0', label: 'Exploits' },
            { value: '<2s', label: 'Fill Time' },
            { value: '23+', label: 'Chains' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 700,
                  color: '#6CF9D8',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: '#A1A1AA',
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
