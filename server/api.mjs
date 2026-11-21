export const fleet = [
 {registration:'VT-ALN',model:'Airbus A320neo',base:'BBI',hours:12480},
 {registration:'VT-BHX',model:'Boeing 737-800',base:'DEL',hours:18320},
 {registration:'VT-CTX',model:'Airbus A321',base:'BOM',hours:8650},
 {registration:'VT-DRM',model:'ATR 72-600',base:'CCU',hours:6210},
 {registration:'VT-EKP',model:'Airbus A320neo',base:'BLR',hours:11340},
 {registration:'VT-FSR',model:'Boeing 737 MAX',base:'HYD',hours:4320}
];
export function score(task, now = new Date()) {
 const overdue = Math.max(0, Math.floor((Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())-Date.parse(task.due))/86400000));
 const base = [0,10,25,45,65,80][task.severity];
 return {...task, overdue, risk:task.status==='Completed'?0:Math.min(100,base+Math.min(20,overdue*5))};
}
function validate(t) {
 return t && typeof t.title==='string' && t.title.trim().length>2 && t.title.length<=160 && fleet.some(a=>a.registration===t.aircraft) && ['Airframe','Engine','Avionics','Hydraulics','Landing gear','Cabin'].includes(t.system) && Number.isInteger(t.severity) && t.severity>=1 && t.severity<=5 && typeof t.due==='string' && /^\d{4}-\d{2}-\d{2}$/.test(t.due) && !isNaN(Date.parse(t.due)) && new Date(t.due).toISOString().slice(0,10)===t.due && ['Open','In progress','Completed'].includes(t.status) && typeof t.assignee==='string' && t.assignee.length<=80 && typeof t.notes==='string' && t.notes.length<=4000;
}
export async function api(request, db) {
 const path=new URL(request.url).pathname, method=request.method;
 const json=(value,status=200)=>Response.json(value,{status});
 try {
 if(path==='/api/health')return json({ok:true});
 if(path==='/api/activity' && method==='GET')return json((await db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT 200').all()).results);
 if(path==='/api/settings' && method==='GET') {
 const rows=(await db.prepare("SELECT display_name, workspace FROM settings WHERE id = 'workspace'").all()).results;
 return json(rows[0] || {display_name:'Swayams Mohanty',workspace:'Flight operations'});
 }
 if(path==='/api/settings' && method==='PUT') {
 let value; try { value=await request.json(); } catch { return json({error:'Invalid JSON'},400); }
 if(typeof value?.display_name!=='string' || !value.display_name.trim() || value.display_name.length>80 || typeof value?.workspace!=='string' || !value.workspace.trim() || value.workspace.length>80)return json({error:'Enter a name and workspace name, each up to 80 characters.'},400);
 await db.prepare("INSERT INTO settings (id,display_name,workspace) VALUES ('workspace',?,?) ON CONFLICT(id) DO UPDATE SET display_name=excluded.display_name,workspace=excluded.workspace").bind(value.display_name.trim(),value.workspace.trim()).run();
 return json({ok:true});
 }

 if(path==='/api/aircraft' && method==='GET')return json(fleet);
 if(path==='/api/analytics' && method==='GET')return json((await db.prepare("SELECT aircraft, COUNT(*) AS backlog, SUM(CASE WHEN due < date('now') THEN 1 ELSE 0 END) AS overdue FROM tasks WHERE status != 'Completed' GROUP BY aircraft").all()).results);
 if(path==='/api/tasks' && method==='GET')return json((await db.prepare('SELECT * FROM tasks').all()).results.map(t=>score(t)).sort((a,b)=>b.risk-a.risk || a.due.localeCompare(b.due)));
 if(path==='/api/seed' && method==='POST') {
 const names=['Hydraulic pressure fluctuation','Engine oil filter inspection','Main landing gear inspection','Weather radar calibration','Cabin pressure valve check','Wing leading edge inspection','Brake wear assessment','Engine vibration investigation','Emergency lighting test','Fuel pump inspection','Flight display diagnostic','Scheduled airframe check'];
 const systems=['Hydraulics','Engine','Landing gear','Avionics','Cabin','Airframe','Landing gear','Engine','Cabin','Engine','Avionics','Airframe'];
 const statements=names.map((title,i)=>{const due=new Date();due.setUTCDate(due.getUTCDate()+i-4);return db.prepare('INSERT OR IGNORE INTO tasks (id,title,aircraft,system,severity,due,status,assignee,notes,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind('demo-'+i,title,fleet[i%6].registration,systems[i],i<2?5:i<5?4:2,due.toISOString().slice(0,10),i===10?'Completed':i%3===0?'In progress':'Open',['A. Patel','S. Das','R. Mehta'][i%3],'Synthetic demonstration record. Verify findings against approved maintenance procedures.',new Date().toISOString())});
 await db.batch(statements);return json({ok:true});
 }
 const match=path.match(/^\/api\/tasks\/([^/]+)$/);
 if(path==='/api/tasks' && method==='POST' || match && method==='PUT') {
 let t;try{t=await request.json()}catch{return json({error:'Invalid JSON'},400)}
 if(!validate(t))return json({error:'Check all fields. A valid aircraft, date, severity (1–5), title and status are required.'},400);
 if(match){const result=await db.prepare('UPDATE tasks SET title=?,aircraft=?,system=?,severity=?,due=?,status=?,assignee=?,notes=? WHERE id=?').bind(t.title.trim(),t.aircraft,t.system,t.severity,t.due,t.status,t.assignee,t.notes,match[1]).run();return result.meta.changes?json({ok:true}):json({error:'Task not found'},404)}
 const id=crypto.randomUUID();await db.prepare('INSERT INTO tasks (id,title,aircraft,system,severity,due,status,assignee,notes,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,t.title.trim(),t.aircraft,t.system,t.severity,t.due,t.status,t.assignee,t.notes,new Date().toISOString()).run();return json({id},201);
 }
 if(match && method==='DELETE'){const r=await db.prepare('DELETE FROM tasks WHERE id=?').bind(match[1]).run();return r.meta.changes?json({ok:true}):json({error:'Task not found'},404)}
 return json({error:'Not found'},404);
 }catch(error){console.error(error);return json({error:'Unable to complete request. Please retry.'},500)}
}
