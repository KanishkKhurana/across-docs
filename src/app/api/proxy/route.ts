import { type NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://app.across.to',
  'https://testnet.across.to',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// Only these request headers are forwarded to the upstream API.
// Everything else (host, x-vercel-*, x-forwarded-*, etc.) is dropped
// so Cloudflare doesn't reject the request due to mismatched metadata.
const SAFE_REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'authorization',
  'content-type',
];

// Response headers that are stale after Node.js auto-decompresses the body,
// or that leak upstream infrastructure details to the browser.
const DROP_RESPONSE_HEADERS = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'strict-transport-security',
  'content-security-policy',
  'content-security-policy-report-only',
];

async function proxyHandler(req: NextRequest) {
  const targetUrl = new URL(req.url).searchParams.get('url');
  if (!targetUrl) {
    return NextResponse.json('A `url` query parameter is required', {
      status: 400,
    });
  }

  const parsed = URL.parse(targetUrl);
  if (!parsed) {
    return NextResponse.json('Invalid `url` parameter', { status: 400 });
  }

  if (!ALLOWED_ORIGINS.includes(parsed.origin)) {
    return NextResponse.json(
      `Origin "${parsed.origin}" is not allowed`,
      { status: 403 },
    );
  }

  // Build a clean set of headers — only forward safe ones
  const upstreamHeaders = new Headers();
  for (const name of SAFE_REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) upstreamHeaders.set(name, value);
  }

  // Forward request body for methods that support it
  const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let res: Response;
  try {
    res = await fetch(parsed.href, {
      method: req.method,
      headers: upstreamHeaders,
      body,
      cache: 'no-cache',
    });
  } catch (err) {
    return NextResponse.json(
      `Proxy error: ${err instanceof Error ? err.message : String(err)}`,
      { status: 502 },
    );
  }

  // Build response — drop problematic headers, add CORS
  const responseHeaders = new Headers(res.headers);
  for (const h of DROP_RESPONSE_HEADERS) responseHeaders.delete(h);
  for (const [k, v] of Object.entries(CORS_HEADERS)) responseHeaders.set(k, v);

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const HEAD = proxyHandler;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
