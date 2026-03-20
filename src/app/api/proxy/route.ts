import { type NextRequest } from 'next/server';

async function handler(req: NextRequest) {
  const url = new URL(req.url).searchParams.get('url');
  if (!url) {
    return Response.json('[Proxy] A `url` query parameter is required', {
      status: 400,
    });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return Response.json('[Proxy] Invalid `url` parameter value.', {
      status: 400,
    });
  }

  const contentLength = req.headers.get('content-length');
  const hasBody =
    contentLength &&
    parseInt(contentLength) > 0 &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());

  const headers = new Headers();
  headers.set('accept', 'application/json');
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const res = await fetch(parsedUrl.toString(), {
    method: req.method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
  }).catch((e: unknown) => new Error(e instanceof Error ? e.message : String(e)));

  if (res instanceof Error) {
    return Response.json(`[Proxy] Failed to proxy request: ${res.message}`, {
      status: 500,
    });
  }

  const responseHeaders = new Headers();
  responseHeaders.set('content-type', res.headers.get('content-type') || 'application/json');

  return new Response(await res.arrayBuffer(), {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
