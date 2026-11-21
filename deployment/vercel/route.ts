
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function handler(request: Request) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    return Response.json({ error: 'This public workspace is read-only.' }, { status: 403 });
  }
  const path = new URL(request.url).pathname;
  if (!['/api/tasks', '/api/aircraft', '/api/analytics', '/api/settings', '/api/activity', '/api/health'].includes(path)) {
    return Response.json({ error: 'Not found.' }, { status: 404 });
  }
  const origin = process.env.FLEETOPS_BACKEND_URL;
  const access = process.env.FLEETOPS_BACKEND_ACCESS;
  const secret = process.env.FLEETOPS_SERVICE_SECRET;
  if (!origin || !access || !secret) {
    return Response.json({ error: 'The maintenance service is not configured.' }, { status: 503 });
  }
  const url = new URL(request.url);
  const headers = new Headers({
    'Content-Type': 'application/json',
    'OAI-Sites-Authorization': `Bearer ${access}`,
    'X-FleetOps-Service': secret,
  });
  try {
    const response = await fetch(new URL(url.pathname + url.search, origin), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text(),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) {
      return Response.json({ error: 'The maintenance service is unavailable.' }, { status: 502 });
    }
    return new Response(await response.text(), {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch {
    return Response.json({ error: 'Unable to reach maintenance service. Please retry.' }, { status: 502 });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as HEAD };
