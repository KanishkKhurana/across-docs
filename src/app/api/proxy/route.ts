import { type NextRequest } from 'next/server';

export const maxDuration = 60;

const ALLOWED_ORIGINS = ['https://app.across.to', 'https://testnet.across.to'];

// Headers to strip — never forward these to the upstream API
const SKIP_HEADERS = new Set([
  'authorization',
]);

async function handler(request: NextRequest): Promise<Response> {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return Response.json('[Proxy] A `url` query parameter is required', { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return Response.json('[Proxy] Invalid `url` parameter value.', { status: 400 });
  }

  if (!ALLOWED_ORIGINS.includes(parsedUrl.origin))
    return Response.json(`[Proxy] The origin "${parsedUrl.origin}" is not allowed.`, { status: 400 });

  const contentLength = request.headers.get('content-length');
  const hasBody = contentLength && parseInt(contentLength) > 0;

  // Forward all browser headers except auth, cookies, and connection headers
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!SKIP_HEADERS.has(key.toLowerCase()) && !key.startsWith(':')) {
      headers.set(key, value);
    }
  });

  const res = await fetch(parsedUrl.href, {
    method: request.method,
    cache: 'no-cache',
    credentials: 'omit',
    headers,
    body:
      hasBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())
        ? await request.arrayBuffer()
        : undefined,
  });

  const body = await res.arrayBuffer();

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: {
      'content-type': res.headers.get('content-type') || 'application/json',
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
