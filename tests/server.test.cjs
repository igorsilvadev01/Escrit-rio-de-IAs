const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const E=require('../engine.js');
const {createFirmaServer}=require('../server.cjs');
const password='Uma senha longa para testes 2026!';
async function fixture(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firma-auth-test-'));
  let app=createFirmaServer({dataDir:dir});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  let base=`http://127.0.0.1:${app.server.address().port}`;
  const request=(url,options={})=>fetch(base+url,options);
  async function post(url,data,auth={},extra={}){return request(url,{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...(auth.cookie?{Cookie:auth.cookie}:{}),...(auth.csrf?{'X-Firma-CSRF':auth.csrf}:{}),...extra},body:JSON.stringify(data)});}
  async function setup(){const response=await post('/api/setup',{token:app.setupToken,username:'igor',password});assert.equal(response.status,201);const data=await response.json();return {cookie:response.headers.get('set-cookie').split(';')[0],csrf:data.csrf};}
  async function restart(){await new Promise(resolve=>app.server.close(resolve));app=createFirmaServer({dataDir:dir});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.server.address().port}`;}
  async function close(){await new Promise(resolve=>app.server.close(resolve));assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('firma-auth-test-'));fs.rmSync(dir,{recursive:true,force:true});}
  return {request,post,setup,restart,close,dir,get token(){return app.setupToken;}};
}

test('single administrator setup, private credentials, cookies and server-side authorization',async()=>{
  const f=await fixture();try{
    const session=await (await f.request('/api/session')).json();assert.equal(session.role,'guest');assert.equal(session.setupRequired,true);assert.equal(session.csrf,undefined);
    assert.equal((await f.post('/api/setup',{token:'guessed',username:'intruder',password})).status,403);
    const auth=await f.setup();assert.match(auth.cookie,/firma_session=[a-f0-9]{64}/);assert.equal(f.token,'');
    const stored=JSON.parse(fs.readFileSync(path.join(f.dir,'admin.json'),'utf8'));assert.equal(stored.username,'igor');assert.ok(stored.salt.length>=32);assert.ok(!JSON.stringify(stored).includes(password));assert.equal(fs.existsSync(path.join(f.dir,'setup-token')),false);
    assert.equal((await f.post('/api/setup',{token:'old',username:'other',password})).status,409);
    assert.equal((await f.post('/api/action',{action:'memory',payload:{memory:'invaded'}})).status,401);
    assert.equal((await f.post('/api/action',{action:'memory',payload:{memory:'invaded'}},{cookie:auth.cookie,csrf:'forged'})).status,403);
    assert.equal((await f.post('/api/action',{action:'memory',payload:{memory:'invaded'}},auth,{Origin:'https://untrusted.example'})).status,403);
    assert.equal((await f.post('/api/action',{action:'memory',payload:{memory:'invaded'}},auth,{'Content-Type':'text/plain'})).status,415);
    const change=await f.post('/api/action',{action:'memory',payload:{memory:'Admin only'}},auth);assert.equal(change.status,200);assert.equal((await change.json()).state.memory,'Admin only');
    for(const url of ['/api/backup','/.firma-private/admin.json','/.firma-private/setup-token','/server.cjs','/../server.cjs'])assert.ok([401,404].includes((await f.request(url)).status),url);
    const backup=await f.request('/api/backup',{headers:{Cookie:auth.cookie}});assert.equal(backup.status,200);assert.equal((await backup.json()).memory,'Admin only');
  }finally{await f.close();}
});

test('visitors receive a redacted view of the real office and never private task contents',async()=>{
  const f=await fixture();try{
    const auth=await f.setup();await f.post('/api/action',{action:'simulation',payload:{paused:true}},auth);
    const state=E.create();state.memory='SECRET_CONTEXT';state.agents[0].instructions='SECRET_AGENT_INSTRUCTIONS';state.tasks[0].title='SECRET_TITLE';state.tasks[0].description='SECRET_BRIEF';state.tasks[0].output='SECRET_OUTPUT';state.tasks[0].criteria='SECRET_CRITERIA';state.tasks[0].context='SECRET_SNAPSHOT';state.tasks[0].result='SECRET_RESULT';state.tasks[0].revisions=[{text:'SECRET_FEEDBACK',time:0}];state.events=[{name:'Você',text:'SECRET_EVENT',time:0}];
    assert.equal((await f.post('/api/action',{action:'restore',payload:{state}},auth)).status,200);
    const publicResponse=await f.request('/api/state');const publicState=await publicResponse.json();assert.equal(publicState.role,'visitor');assert.equal(publicState.state.agents.length,6);assert.equal(publicState.state.tasks.length,3);assert.equal(JSON.stringify(publicState).includes('SECRET_'),false);
    const privateState=await (await f.request('/api/state',{headers:{Cookie:auth.cookie}})).json();assert.equal(privateState.role,'admin');assert.equal(privateState.state.memory,'SECRET_CONTEXT');
    const preview=await (await f.request('/api/state?public=1',{headers:{Cookie:auth.cookie}})).json();assert.equal(preview.role,'visitor');assert.equal(JSON.stringify(preview).includes('SECRET_'),false);
    assert.match(publicResponse.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(publicResponse.headers.get('cache-control'),'no-store');
  }finally{await f.close();}
});

test('production advances on the server without an admin tab and pausing is admin-only',async()=>{
  const f=await fixture();try{
    const before=await (await f.request('/api/state')).json();await new Promise(resolve=>setTimeout(resolve,1150));const after=await (await f.request('/api/state')).json();assert.ok(after.state.seconds>before.state.seconds);assert.ok(after.state.tasks[0].progress>before.state.tasks[0].progress);
    const auth=await f.setup();await f.post('/api/action',{action:'simulation',payload:{paused:true}},auth);const paused=await (await f.request('/api/state')).json();await new Promise(resolve=>setTimeout(resolve,1100));assert.equal((await (await f.request('/api/state')).json()).state.seconds,paused.state.seconds);
  }finally{await f.close();}
});

test('login rotates sessions; logout invalidates them; credentials and office survive restart',async()=>{
  const f=await fixture();try{
    const old=await f.setup();assert.equal((await f.post('/api/login',{username:'igor',password:'wrong'})).status,401);
    const response=await f.post('/api/login',{username:'igor',password},old);assert.equal(response.status,200);const record=await response.json();const auth={cookie:response.headers.get('set-cookie').split(';')[0],csrf:record.csrf};assert.notEqual(auth.cookie,old.cookie);assert.match(response.headers.get('set-cookie'),/HttpOnly/);assert.match(response.headers.get('set-cookie'),/SameSite=Strict/);assert.match(response.headers.get('set-cookie'),/Max-Age=28800/);
    assert.equal((await (await f.request('/api/session',{headers:{Cookie:old.cookie}})).json()).role,'guest');
    await f.post('/api/action',{action:'settings',payload:{company:'Persisted office',speed:2}},auth);
    assert.equal((await f.post('/api/logout',{},auth)).status,200);assert.equal((await f.request('/api/backup',{headers:{Cookie:auth.cookie}})).status,401);
    await f.restart();const login=await f.post('/api/login',{username:'igor',password});assert.equal(login.status,200);assert.equal((await (await f.request('/api/state')).json()).state.company,'Persisted office');
  }finally{await f.close();}
});

test('concurrent setup cannot register or replace a second owner',async()=>{
  const f=await fixture();try{
    const token=f.token;
    const responses=await Promise.all([f.post('/api/setup',{token,username:'first',password}),f.post('/api/setup',{token,username:'second',password})]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
  }finally{await f.close();}
});

test('repeated invalid logins are rate limited',async()=>{
  const f=await fixture();try{
    for(let i=0;i<8;i++)assert.equal((await f.post('/api/login',{username:'guess',password:'wrong'})).status,401);
    assert.equal((await f.post('/api/login',{username:'guess',password:'wrong'})).status,429);
  }finally{await f.close();}
});

test('an email address can own the office and sign in case-insensitively with a 12-character password',async()=>{
  const f=await fixture();try{
    const username='Proprietario@Example.com',emailPassword='SenhaQA@2026';assert.equal(emailPassword.length,12);
    const created=await f.post('/api/setup',{token:f.token,username,password:emailPassword});assert.equal(created.status,201);
    const login=await f.post('/api/login',{username:' PROPRIETARIO@EXAMPLE.COM ',password:emailPassword});assert.equal(login.status,200);
    const cookie=login.headers.get('set-cookie').split(';')[0];const session=await (await f.request('/api/session',{headers:{Cookie:cookie}})).json();assert.equal(session.username,'proprietario@example.com');
  }finally{await f.close();}
});

test('departments are validated, persisted and limited to six specialists per room',async()=>{
  const f=await fixture();try{
    const auth=await f.setup();
    assert.equal((await f.post('/api/action',{action:'agent.hire',payload:{name:'Invalid',role:'Tester',department:'leadership'}},auth)).status,400);
    const created=await f.post('/api/action',{action:'agent.hire',payload:{name:'Vera',role:'Qualidade',department:'testing'}},auth);assert.equal(created.status,200);const added=(await created.json()).state.agents.at(-1);assert.equal(added.department,'testing');
    const moved=await f.post('/api/action',{action:'agent.instructions',payload:{id:added.id,instructions:'Validar com evidências.',department:'development'}},auth);assert.equal(moved.status,200);assert.equal((await moved.json()).state.agents.at(-1).department,'development');
    for(let i=0;i<3;i++)assert.equal((await f.post('/api/action',{action:'agent.hire',payload:{name:'Planejador '+i,role:'Planejamento',department:'planning'}},auth)).status,200);
    assert.equal((await f.post('/api/action',{action:'agent.hire',payload:{name:'A mais',role:'Planejamento',department:'planning'}},auth)).status,400);
  }finally{await f.close();}
});
test('all-hands is administrator-only, visible to guests and persisted across restart',async()=>{
  const f=await fixture();try{
    const auth=await f.setup();
    for(const action of ['assembly.start','assembly.end'])assert.equal((await f.post('/api/action',{action})).status,401);
    const call=await f.post('/api/action',{action:'assembly.start'},auth);assert.equal(call.status,200);assert.equal((await call.json()).state.assembly.active,true);
    assert.equal((await (await f.request('/api/state')).json()).state.assembly.active,true);
    await f.restart();assert.equal((await (await f.request('/api/state')).json()).state.assembly.active,true);
  }finally{await f.close();}
});
