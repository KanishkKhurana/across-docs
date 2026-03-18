import { type NextRequest } from 'next/server';

export const maxDuration = 60;

const ALLOWED_ORIGINS = ['https://app.across.to', 'https://testnet.across.to'];

async function handler(request: NextRequest): Promise<Response> {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return Response.json('[Proxy] A `url` query parameter is required', { status: 400 });

  const parsedUrl = URL.parse(url);
  if (!parsedUrl) return Response.json('[Proxy] Invalid `url` parameter value.', { status: 400 });
  if (!ALLOWED_ORIGINS.includes(parsedUrl.origin))
    return Response.json(`[Proxy] The origin "${parsedUrl.origin}" is not allowed.`, { status: 400 });

  // Forward all original headers (same as fumadocs proxy)
  const headers = new Headers(request.headers);
  headers.delete('origin');
  headers.delete('host');

  const contentLength = request.headers.get('content-length');
  const hasBody = contentLength && parseInt(contentLength) > 0;

  const res = await fetch(parsedUrl, {
    method: request.method,
    cache: 'no-cache',
    headers,
    body:
      hasBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())
        ? await request.arrayBuffer()
        : undefined,
  });

  // Buffer full response to avoid Vercel streaming issues with large payloads
  const body = await res.arrayBuffer();

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');
  responseHeaders.forEach((_value, key) => {
    if (key.toLowerCase().startsWith('access-control-')) responseHeaders.delete(key);
  });
  responseHeaders.set('X-Forwarded-Host', res.url);

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
