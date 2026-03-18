export const runtime = 'edge';

const ALLOWED_ORIGINS = [
  'https://app.across.to',
  'https://testnet.across.to',
];

async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url) {
    return Response.json({ error: 'A `url` query parameter is required' }, {
      status: 400,
    });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Response.json({ error: 'Invalid `url` parameter value' }, {
      status: 400,
    });
  }

  if (!ALLOWED_ORIGINS.includes(parsed.origin)) {
    return Response.json(
      { error: `The origin "${parsed.origin}" is not allowed` },
      { status: 400 },
    );
  }

  // Step 1: Fetch upstream
  let upstream: Response;
  try {
    const hasBody = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const forwardHeaders = new Headers();
    const authorization = req.headers.get('authorization');
    if (authorization) forwardHeaders.set('Authorization', authorization);
    if (hasBody) forwardHeaders.set('Content-Type', 'application/json');

    upstream = await fetch(parsed.toString(), {
      method: req.method,
      headers: forwardHeaders,
      ...(hasBody && { body: await req.arrayBuffer() }),
    });
  } catch (e) {
    return Response.json({
      error: 'Fetch to upstream failed',
      step: 'fetch',
      message: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : 'unknown',
    }, { status: 502 });
  }

  // Step 2: Buffer response body
  let body: ArrayBuffer;
  try {
    body = await upstream.arrayBuffer();
  } catch (e) {
    return Response.json({
      error: 'Failed to read upstream response body',
      step: 'arrayBuffer',
      upstreamStatus: upstream.status,
      message: e instanceof Error ? e.message : String(e),
    }, { status: 502 });
  }

  // Step 3: Build response
  const headers = new Headers(upstream.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.forEach((_value, key) => {
    if (key.toLowerCase().startsWith('access-control-')) headers.delete(key);
  });

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const HEAD = handler;
