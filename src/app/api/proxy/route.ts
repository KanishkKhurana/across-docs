import { openapi } from '@/lib/openapi';

export const { GET, POST, PUT, DELETE, PATCH, HEAD } = openapi.createProxy({
  allowedOrigins: ['https://app.across.to', 'https://testnet.across.to'],
  overrides: {
    response: (res) => {
      // Node's fetch decompresses the body, but forwards the original
      // Content-Encoding header. The browser then tries to decompress
      // the already-decompressed body, causing res.json() to fail.
      const headers = new Headers(res.headers);
      headers.delete('content-encoding');
      headers.delete('content-length');
      return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    },
  },
});
