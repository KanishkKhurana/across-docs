import { NextRequest } from 'next/server';

// Force Node.js runtime and allow up to 30s for slow upstream responses
// (e.g. /swap/approval simulates transactions and can take 10-15s).
export const runtime = 'nodejs';
export const maxDuration = 30;

const ALLOWED_ORIGINS = [
  'https://app.across.to',
  'https://testnet.across.to',
];

async function handler(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return Response.json('[Proxy] A `url` query parameter is required', {
      status: 400,
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json('[Proxy] Invalid `url` parameter value', {
      status: 400,
    });
  }

  if (!ALLOWED_ORIGINS.includes(parsed.origin)) {
    return Response.json(
      `[Proxy] The origin "${parsed.origin}" is not allowed`,
      { status: 400 },
    );
  }

  try {
    const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

    // Forward safe headers from the client request (e.g. Authorization).
    const forwardHeaders = new Headers();
    const authorization = req.headers.get('authorization');
    if (authorization) forwardHeaders.set('Authorization', authorization);
    if (hasBody) forwardHeaders.set('Content-Type', 'application/json');

    const upstream = await fetch(parsed.toString(), {
      method: req.method,
      cache: 'no-cache',
      headers: forwardHeaders,
      ...(hasBody && { body: await req.arrayBuffer() }),
    });

    // Buffer the body — streaming a ReadableStream from fetch() into a new
    // Response can 502 in serverless runtimes (Vercel).
    const body = await upstream.arrayBuffer();

    // Node's fetch auto-decompresses gzip but keeps the Content-Encoding
    // header. Strip it so the browser doesn't try to decompress again.
    const headers = new Headers(upstream.headers);
    headers.delete('content-encoding');
    headers.delete('content-length');
    // Remove CORS headers from upstream — let the framework handle CORS.
    headers.forEach((_value, key) => {
      if (key.toLowerCase().startsWith('access-control-')) headers.delete(key);
    });

    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json(`[Proxy] Failed to proxy request: ${message}`, {
      status: 502,
    });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
