import { env } from 'cloudflare:workers';
import { api } from '../../../server/api.mjs';
import { getChatGPTUser } from '../../chatgpt-auth';
const handler = async (request: Request) => {
 const user = await getChatGPTUser();
 const serviceSecret = (env as unknown as Record<string, string>).FLEETOPS_SERVICE_SECRET;
 const serviceRequest = !!serviceSecret && request.headers.get('X-FleetOps-Service') === serviceSecret;
 const development = process.env.NODE_ENV === 'development';
 if (!user && !serviceRequest && !development && new URL(request.url).pathname !== '/api/health') {
  return Response.json({error:'Sign in to access your workspace.'},{status:401});
 }
 return api(request, env.DB);
};
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
