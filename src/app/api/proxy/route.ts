import { type NextRequest } from 'next/server';

export const maxDuration = 60;

const ALLOWED_ORIGINS = ['https://app.across.to', 'https://testnet.across.to'];

function isAllowedUrl(url: string): boolean {
  return ALLOWED_ORIGINS.some((origin) => url.startsWith(origin));
}

async function proxyRequest(request: NextRequest): Promise<Response> {
  const targetUrl = request.nextUrl.searchParams.get('url');

  if (!targetUrl || !isAllowedUrl(targetUrl)) {
    return new Response('Invalid or disallowed URL', { status: 400 });
  }

  const headers: HeadersInit = {
    'user-agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers['authorization'] = auth;
  const contentType = request.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
  });

  // Buffer the entire response to avoid streaming issues on Vercel
  const body = await res.arrayBuffer();

  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('content-length');

  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
export const HEAD = proxyRequest;
