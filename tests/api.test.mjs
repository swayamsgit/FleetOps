import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync,readdirSync } from 'node:fs';
import { api } from '../server/api.mjs';
import { adapter } from '../server/sqlite-adapter.mjs';
function setup(){const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')))sql.exec(readFileSync('drizzle/'+f,'utf8'));const db=adapter(sql);return async(path,method='GET',body)=>api(new Request('http://test/api/'+path,{method,...(body?{body:JSON.stringify(body)}:{})}),db)}
const task={title:'Inspect engine',aircraft:'VT-ALN',system:'Engine',severity:5,due:'2020-01-01',status:'Open',assignee:'Sam',notes:''};
test('create and retrieve a persisted task',async()=>{const req=setup();assert.equal((await req('tasks','POST',task)).status,201);assert.equal((await (await req('tasks')).json())[0].title,task.title)});
test('reject invalid aircraft and impossible dates',async()=>{const req=setup();assert.equal((await req('tasks','POST',{...task,aircraft:'BAD'})).status,400);assert.equal((await req('tasks','POST',{...task,due:'2026-02-30'})).status,400)});
test('update existing task and complete it',async()=>{const req=setup();const {id}=await(await req('tasks','POST',task)).json();assert.equal((await req('tasks/'+id,'PUT',{...task,status:'Completed'})).status,200);assert.equal((await(await req('tasks')).json())[0].risk,0)});
test('delete and handle missing task',async()=>{const req=setup();const {id}=await(await req('tasks','POST',task)).json();assert.equal((await req('tasks/'+id,'DELETE')).status,200);assert.equal((await req('tasks/'+id,'DELETE')).status,404)});
test('cap risk and sort highest first',async()=>{const req=setup();await req('tasks','POST',{...task,severity:1});await req('tasks','POST',task);const rows=await(await req('tasks')).json();assert.equal(rows[0].risk,100);assert.equal(rows[1].risk,30)});
test('SQL analytics excludes completed work',async()=>{const req=setup();await req('tasks','POST',task);await req('tasks','POST',{...task,status:'Completed'});const rows=await(await req('analytics')).json();assert.equal(rows[0].backlog,1);assert.equal(rows[0].overdue,1)});
test('parameterized SQL stores hostile input as text',async()=>{const req=setup();const title="test'); DROP TABLE tasks; --";await req('tasks','POST',{...task,title});assert.equal((await(await req('tasks')).json())[0].title,title)});
test('demo seed is idempotent',async()=>{const req=setup();await req('seed','POST');await req('seed','POST');assert.equal((await(await req('tasks')).json()).length,12)});

test('settings persist and reject empty names', async () => {
 const req=setup();
 assert.equal((await(await req('settings')).json()).display_name,'Swayams Mohanty');
 assert.equal((await req('settings','PUT',{display_name:'Swayams Mohanty',workspace:'BBI Maintenance'})).status,200);
 assert.equal((await(await req('settings')).json()).workspace,'BBI Maintenance');
 assert.equal((await req('settings','PUT',{display_name:' ',workspace:'Test'})).status,400);
});
test('task history survives deletion and records state transitions', async () => {
 const req=setup();
 const {id}=await(await req('tasks','POST',task)).json();
 await req('tasks/'+id,'PUT',{...task,status:'Completed'});
 await req('tasks/'+id,'DELETE');
 const events=await(await req('activity')).json();
 assert.deepEqual(events.map(event=>event.action),['Deleted','Updated','Created']);
 assert.equal(events[1].detail,'Open → Completed');
 assert.equal(events[0].task_id,id);
});
test('upgrade a legacy database without losing maintenance records', async () => {
 const {migrate}=await import('../server/migrate.mjs');
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync('drizzle/0000_flashy_scarlet_spider.sql','utf8'));
 sql.prepare('INSERT INTO tasks VALUES (?,?,?,?,?,?,?,?,?,?)').run('legacy','Legacy task','VT-ALN','Engine',3,'2026-11-20','Open','','','2026-11-01');
 migrate(sql);
 migrate(sql);
 assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM tasks').get().count,1);
 sql.prepare("UPDATE tasks SET status='Completed' WHERE id='legacy'").run();
 assert.equal(sql.prepare('SELECT COUNT(*) AS count FROM activity').get().count,1);
});
