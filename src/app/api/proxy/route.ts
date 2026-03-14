import { type NextRequest, NextResponse } from 'next/server';
import { openapi } from '@/lib/openapi';

// Headers from the deployment platform (Vercel, etc.) that must NOT be
// forwarded to the upstream API.  `host` is the critical one — Cloudflare
// returns 502 when it receives Host: across-docs-new.vercel.app for a
// request aimed at app.across.to.
const stripFromRequest = [
  'host',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'x-vercel-id',
  'x-vercel-deployment-url',
  'x-vercel-forwarded-for',
  'x-vercel-ip-city',
  'x-vercel-ip-country',
  'x-vercel-ip-country-region',
  'x-vercel-ip-latitude',
  'x-vercel-ip-longitude',
  'x-vercel-ip-timezone',
  'x-vercel-proxied-for',
  'x-vercel-proxy-signature',
  'x-vercel-proxy-signature-ts',
  'x-middleware-prefetch',
  'x-middleware-invoke',
  'connection',
];

const proxy = openapi.createProxy({
  allowedOrigins: [
    'https://app.across.to',
    'https://testnet.across.to',
  ],
  overrides: {
    request(req) {
      for (const h of stripFromRequest) req.headers.delete(h);
      return req;
    },
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// Headers that become stale after Node.js fetch() auto-decompresses the
// upstream response body.  Forwarding them causes the browser to attempt a
// second decompression of already-plain content → TypeError: Failed to fetch.
const hopByHopHeaders = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
];

function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: NextRequest) => {
    const res = await handler(req);
    const newHeaders = new Headers(res.headers);
    for (const h of hopByHopHeaders) newHeaders.delete(h);
    for (const [key, value] of Object.entries(corsHeaders)) {
      newHeaders.set(key, value);
    }
    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  };
}

export const GET = withCors(proxy.GET);
export const POST = withCors(proxy.POST);
export const PUT = withCors(proxy.PUT);
export const DELETE = withCors(proxy.DELETE);
export const PATCH = withCors(proxy.PATCH);
export const HEAD = withCors(proxy.HEAD);

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
