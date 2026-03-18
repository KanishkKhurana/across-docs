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

  const contentLength = request.headers.get('content-length');
  const hasBody = contentLength && parseInt(contentLength) > 0;

  const start = Date.now();

  try {
    const res = await fetch(parsedUrl.href, {
      method: request.method,
      cache: 'no-cache',
      headers: {
        accept: 'application/json',
        ...(request.headers.get('authorization')
          ? { authorization: request.headers.get('authorization')! }
          : {}),
        ...(request.headers.get('content-type')
          ? { 'content-type': request.headers.get('content-type')! }
          : {}),
      },
      body:
        hasBody && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())
          ? await request.arrayBuffer()
          : undefined,
    });

    const elapsed = Date.now() - start;
    const body = await res.arrayBuffer();

    // If upstream returned an error, return diagnostic info
    if (!res.ok) {
      const text = new TextDecoder().decode(body).slice(0, 500);
      return Response.json(
        {
          error: 'upstream_error',
          status: res.status,
          statusText: res.statusText,
          elapsed_ms: elapsed,
          url: parsedUrl.href,
          body_preview: text,
        },
        { status: res.status }
      );
    }

    const responseHeaders = new Headers();
    responseHeaders.set('content-type', res.headers.get('content-type') || 'application/json');
    responseHeaders.set('X-Forwarded-Host', res.url);
    responseHeaders.set('X-Proxy-Time-Ms', String(elapsed));

    return new Response(body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (e) {
    const elapsed = Date.now() - start;
    return Response.json(
      {
        error: 'fetch_failed',
        message: e instanceof Error ? e.message : String(e),
        elapsed_ms: elapsed,
        url: parsedUrl.href,
      },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
