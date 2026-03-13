import { type NextRequest, NextResponse } from 'next/server';
import { openapi } from '@/lib/openapi';

const proxy = openapi.createProxy({
  allowedOrigins: [
    'https://app.across.to',
    'https://testnet.across.to',
  ],
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
