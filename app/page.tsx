import Dashboard from './dashboard';
import { requireChatGPTUser } from './chatgpt-auth';
export const dynamic = 'force-dynamic';
export default async function Home(){
 if(process.env.NODE_ENV !== 'development') await requireChatGPTUser('/');
 return <Dashboard/>;
}
