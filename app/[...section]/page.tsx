import Dashboard from '../dashboard';
import { requireChatGPTUser } from '../chatgpt-auth';
import { notFound } from 'next/navigation';
import { fleet } from '../../server/api.mjs';
export const dynamic = 'force-dynamic';
const pages:Record<string,string>={maintenance:'Maintenance',aircraft:'Aircraft',analytics:'Analytics',schedule:'Schedule',alerts:'Alerts',activity:'Activity',settings:'Settings'};
export default async function Page({params}:{params:Promise<{section:string[]}>}){
 const {section}=await params;
 const view=pages[section[0]];
 if(!view || section.length>2 || (section.length===2 && (section[0]!=='aircraft' || !fleet.some(f=>f.registration===section[1]))))notFound();
 if(process.env.NODE_ENV !== 'development')await requireChatGPTUser('/'+section.join('/'));
 return <Dashboard initialView={section.length===2?'Maintenance':view} initialAircraft={section[1]||'All aircraft'}/>;
}
