'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createFirmaServer}=require('../server.cjs'),{fakeProviders}=require('./ai-fixtures.cjs'),P=require('../ai-providers.cjs');
const wait=async fn=>{for(let n=0;n<200;n++){if(await fn())return;await new Promise(r=>setTimeout(r,15));}throw Error('QA timed out');};
async function fixture(options={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firma-studio-test-')),root=path.join(dir,'project'),dataDir=path.join(dir,'private');fs.mkdirSync(root);fs.mkdirSync(path.join(root,'docs'));fs.mkdirSync(path.join(root,'.firma-private'));
  fs.writeFileSync(path.join(root,'app.js'),'// FILE_CONTEXT_ONLY\nconsole.log("QA");\n');fs.writeFileSync(path.join(root,'README.md'),'# QA documentation');fs.writeFileSync(path.join(root,'.env'),'SECRET_ENV');fs.writeFileSync(path.join(root,'.firma-private','admin.json'),'SECRET_ADMIN');
  const fakes=fakeProviders(),app=createFirmaServer({dataDir,workspaceRoot:root,ai:fakes,...options});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;let auth={};
  const hostHeaders=options.publicOrigin?{Host:new URL(options.publicOrigin).host}:{};
  // Node fetch may replace Host; native HTTP preserves the configured public-host header for this test.
  const transport=options.publicOrigin?(url,options={})=>new Promise((resolve,reject)=>{const request=require('node:http').request(url,options,response=>{const chunks=[];response.on('data',c=>chunks.push(c));response.on('end',()=>resolve(new Response(Buffer.concat(chunks),{status:response.statusCode,headers:response.headers})));});request.on('error',reject);request.end(options.body);}):fetch;
  const request=(url,headers=auth)=>transport(base+url,{headers:{...hostHeaders,...headers}});
  const post=(url,value,headers=auth)=>transport(base+url,{method:'POST',headers:{Origin:options.publicOrigin||base,'Content-Type':'application/json',...hostHeaders,...headers},body:JSON.stringify(value)});
  const setup=await post('/api/setup',{token:app.setupToken,username:'qa-admin',password:'Uma senha longa para QA 2026!'},{}),session=await setup.json();if(setup.status!==201){await new Promise(r=>app.server.close(r));throw Error('QA setup failed: '+setup.status);}auth={Cookie:setup.headers.get('set-cookie').split(';')[0],'X-Firma-CSRF':session.csrf};
  const action=(action,payload={})=>post('/api/studio/action',{action,payload});
  const ai=(action,payload={})=>post('/api/ai/action',{action,payload});
  const status=async()=>await (await request('/api/studio/status')).json();
  async function connect(){await ai('connect',{provider:'gemini',key:'QA_SECRET_API_KEY_1234567890'});await ai('codex.login');await ai('codex.check');const roles={...app.ai.settings.roles};for(const role of ['planning','testing','publishing'])roles[role]={provider:'gemini',model:'gemini-3.8-flash'};await ai('settings',{roles,dailyLimit:10,maxTokens:1024});}
  return {dir,root,app,fakes,request,post,action,ai,status,connect,get auth(){return auth;},async close(){await new Promise(r=>app.server.close(r));await new Promise(r=>setTimeout(r,70));assert.equal(path.dirname(dir),os.tmpdir());assert.ok(path.basename(dir).startsWith('firma-studio-test-'));fs.rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100});}};
}
test('studio APIs require admin, local origin, JSON and CSRF; no private files or traversal',async()=>{
  const f=await fixture();try{
    for(const url of ['/api/studio/status','/api/studio/files','/api/studio/file?path=app.js'])assert.equal((await f.request(url,{})).status,401);
    assert.equal((await f.post('/api/studio/action',{action:'terminal.run',payload:{command:'status',confirm:true}},{Cookie:f.auth.Cookie})).status,403);
    assert.equal((await f.post('/api/studio/action',{action:'terminal.run'},{...f.auth,Origin:'https://attacker.test'})).status,403);
    assert.equal((await f.post('/api/studio/action',{action:'terminal.run'},{...f.auth,'Content-Type':'text/plain'})).status,415);
    const files=await (await f.request('/api/studio/files')).json();assert.deepEqual(files.files.map(f=>f.path),['app.js','README.md']);
    for(const name of ['../private/admin.json','.firma-private/admin.json','.env','docs/../app.js','C:/Windows/win.ini','docs\\secret.js','node_modules/a.js','docs/token.json'])assert.equal((await f.request('/api/studio/file?path='+encodeURIComponent(name))).status,400,name);
    assert.match((await (await f.request('/api/studio/file?path=app.js')).json()).text,/FILE_CONTEXT_ONLY/);
    fs.linkSync(path.join(f.root,'app.js'),path.join(f.root,'linked.js'));assert.equal((await f.request('/api/studio/file?path=linked.js')).status,400);fs.unlinkSync(path.join(f.root,'linked.js'));
    try{fs.symlinkSync(path.join(f.root,'app.js'),path.join(f.root,'symlink.js'));assert.equal((await f.request('/api/studio/file?path=symlink.js')).status,400);}catch(e){if(e.code!=='EPERM')throw e;}
    for(const url of ['/workstation.cjs','/.firma-private/chats.json','/api/studio/unknown'])assert.equal((await f.request(url)).status,404);
  }finally{await f.close();}
});
test('Gemini chat streams real SSE, keeps history per role and sends only explicit files',async()=>{
  const f=await fixture();try{
    await f.connect();f.app.ai.getState().memory='NEVER_SEND_OFFICE_MEMORY';
    assert.equal((await f.action('chat.send',{role:'planning',text:'hello',confirm:false})).status,400);assert.equal(f.fakes.calls.length,0);
    assert.equal((await f.action('chat.send',{role:'planning',text:'Explique o arquivo',file:'app.js',confirm:true})).status,200);
    await wait(async()=>!(await f.status()).chatRunning);let s=await f.status();assert.equal(s.chats.planning.at(-1).status,'completed');assert.equal(s.chats.planning.at(-1).text,'Olá, resposta em tempo real de QA.');assert.equal(s.chats.development.length,0);
    const payload=f.fakes.calls.at(-1).payload;assert.match(payload.contents.at(-1).parts[0].text,/FILE_CONTEXT_ONLY/);assert.ok(!JSON.stringify(payload).includes('NEVER_SEND_OFFICE_MEMORY'));assert.ok(!JSON.stringify(s).includes('QA_PRIVATE_REASONING'));
    await f.action('chat.send',{role:'planning',text:'E o próximo passo?',confirm:true});await wait(async()=>!(await f.status()).chatRunning);assert.equal(f.fakes.calls.at(-1).payload.contents.length,3);assert.match(f.fakes.calls.at(-1).payload.contents[0].parts[0].text,/FILE_CONTEXT_ONLY/);
    await f.action('chat.send',{role:'publishing',text:'Escreva uma legenda.',confirm:true});await wait(async()=>!(await f.status()).chatRunning);assert.equal(f.fakes.calls.at(-1).payload.contents.length,1);assert.ok(!JSON.stringify(f.fakes.calls.at(-1).payload).includes('FILE_CONTEXT_ONLY'));
    assert.equal((await f.action('chat.clear',{role:'planning',confirm:false})).status,400);await f.action('chat.clear',{role:'planning',confirm:true});s=await f.status();assert.equal(s.chats.planning.length,0);assert.equal(s.chats.publishing.length,2);
    const persisted=fs.readFileSync(path.join(f.dir,'private','chats.json'),'utf8');assert.ok(!persisted.includes('QA_SECRET_API_KEY'));assert.ok(!persisted.includes('NEVER_SEND_OFFICE_MEMORY'));
  }finally{await f.close();}
});
test('Codex chat uses the existing isolated bridge and the shared daily cap',async()=>{
  const f=await fixture();try{
    await f.connect();const roles=f.app.ai.settings.roles;await f.ai('settings',{roles,dailyLimit:1,maxTokens:1024});
    assert.equal((await f.action('chat.send',{role:'development',text:'Proponha uma soma.',confirm:true})).status,200);await wait(async()=>!(await f.status()).chatRunning);
    const s=await f.status();assert.equal(s.chats.development.at(-1).status,'completed');assert.match(s.chats.development.at(-1).text,/Codex/);assert.equal(f.fakes.calls.at(-1).provider,'codex');assert.match(f.fakes.calls.at(-1).system,/Não tem ferramentas/);
    const r=await f.action('chat.send',{role:'leadership',text:'Mais uma?',confirm:true});assert.equal(r.status,400);assert.match((await r.json()).error,/Limite diário/);assert.equal((await f.status()).chats.leadership.length,0);assert.equal(f.app.ai.usage().used,1);
  }finally{await f.close();}
});
test('chat cancellation, executor locking, errors and truncation never become successful answers',async()=>{
  const f=await fixture();try{
    await f.connect();f.fakes.settings.block=true;
    await f.action('chat.send',{role:'planning',text:'Uma resposta bloqueada no QA.',confirm:true});assert.equal((await f.status()).chatRunning.role,'planning');
    assert.equal((await f.action('chat.send',{role:'testing',text:'Concorrente',confirm:true})).status,400);
    assert.equal((await f.ai('settings',f.app.ai.settings)).status,400);assert.equal((await f.ai('disconnect',{provider:'gemini'})).status,400);assert.equal((await f.action('chat.clear',{role:'planning',confirm:true})).status,400);
    assert.equal((await f.action('chat.cancel',{role:'testing'})).status,400);assert.equal((await f.action('chat.cancel',{role:'planning'})).status,200);await wait(async()=>!(await f.status()).chatRunning);assert.equal((await f.status()).chats.planning.at(-1).status,'error');
    f.fakes.settings.block=false;f.fakes.settings.truncated=true;await f.action('chat.send',{role:'testing',text:'Truncado',confirm:true});await wait(async()=>!(await f.status()).chatRunning);assert.equal((await f.status()).chats.testing.at(-1).status,'error');
    f.fakes.settings.truncated=false;f.fakes.settings.fail=true;await f.action('chat.send',{role:'publishing',text:'Falha de cota',confirm:true});await wait(async()=>!(await f.status()).chatRunning);const failed=(await f.status()).chats.publishing.at(-1);assert.equal(failed.status,'error');assert.match(failed.error,/Limite/);assert.ok(!JSON.stringify(failed).includes('QA_SECRET'));assert.equal(f.fakes.calls.length,3);
  }finally{await f.close();}
});
test('terminal executes actual syntax checks, reports failures and rejects arbitrary shell or paths',async()=>{
  const f=await fixture();try{
    assert.equal((await f.action('terminal.run',{command:'syntax',file:'app.js',confirm:false})).status,400);
    for(const command of ['whoami','syntax; whoami','powershell','npm install','rm'])assert.equal((await f.action('terminal.run',{command,confirm:true})).status,400);
    assert.equal((await f.action('terminal.run',{command:'syntax',file:'../bad.js',confirm:true})).status,400);assert.equal((await f.action('terminal.run',{command:'syntax',file:'README.md',confirm:true})).status,400);
    assert.equal((await f.action('terminal.run',{command:'syntax',file:'app.js',confirm:true})).status,200);await wait(async()=>(await f.status()).terminal.status!=='running');let t=(await f.status()).terminal;assert.equal(t.status,'completed');assert.equal(t.exitCode,0);
    fs.writeFileSync(path.join(f.root,'broken.js'),'function ( {');await f.action('terminal.run',{command:'syntax',file:'broken.js',confirm:true});await wait(async()=>(await f.status()).terminal.status!=='running');t=(await f.status()).terminal;assert.equal(t.status,'error');assert.notEqual(t.exitCode,0);assert.match(t.output,/SyntaxError/);
    assert.equal((await f.action('terminal.cancel')).status,400);
  }finally{await f.close();}
});
test('live files update hashes and secrets are redacted from code and chat history',async()=>{
  const f=await fixture();try{
    await f.connect();let r=await (await f.request('/api/studio/file?path=app.js')).json();const old=r.hash;
    fs.writeFileSync(path.join(f.root,'app.js'),'// QA_SECRET_API_KEY_1234567890\nconsole.log("changed");');r=await (await f.request('/api/studio/file?path=app.js')).json();assert.notEqual(r.hash,old);assert.ok(!r.text.includes('QA_SECRET_API_KEY'));assert.match(r.text,/credencial removida/);
    await f.action('chat.send',{role:'planning',text:'Não divulgue QA_SECRET_API_KEY_1234567890',confirm:true});await wait(async()=>!(await f.status()).chatRunning);assert.ok(!JSON.stringify(await f.status()).includes('QA_SECRET_API_KEY'));assert.ok(!JSON.stringify(f.fakes.calls).includes('Não divulgue QA_SECRET_API_KEY'));
  }finally{await f.close();}
});
test('Gemini SSE parsing handles fragmented UTF-8, suppresses thoughts and requires STOP',async()=>{
  const content='data: '+JSON.stringify({candidates:[{content:{parts:[{thought:true,text:'PRIVATE_REASONING'},{text:'Olá 🌎'}]},finishReason:'STOP'}],usageMetadata:{totalTokenCount:9}})+'\r\n\r\n';const bytes=new TextEncoder().encode(content),deltas=[];
  const fetcher=async()=>new Response(new ReadableStream({start(controller){for(let i=0;i<bytes.length;i+=3)controller.enqueue(bytes.slice(i,i+3));controller.close();}}));
  const result=await P.generateStream('gemini',{key:'QA_KEY',model:'qa-model',system:'QA',messages:[{role:'user',text:'QA'}],maxTokens:512,signal:new AbortController().signal,onDelta:d=>deltas.push(d)},fetcher);assert.equal(result.text,'Olá 🌎');assert.equal(deltas.join(''),'Olá 🌎');assert.equal(result.usage.tokens,9);
});
test('studio is unavailable on a public deployment even to the authenticated owner',async()=>{
  const f=await fixture({publicOrigin:'https://firma.example'});try{for(const url of ['/api/studio/status','/api/studio/files','/api/studio/file?path=app.js'])assert.equal((await f.request(url)).status,403);assert.equal((await f.action('terminal.run',{command:'status',confirm:true})).status,403);}finally{await f.close();}
});
test('incremental output redacts credentials split between chunks and restarted chats do not retry',async()=>{
  const f=await fixture();try{
    await f.connect();const updates=[];f.fakes.codex.run=async request=>{request.onDelta('Resposta QA_SEC');request.onDelta('RET_API_KEY_1234567890');return {text:'Resposta QA_SECRET_API_KEY_1234567890',model:'qa-codex',usage:{tokens:1}};};
    const result=await f.app.ai.chat({role:'development',messages:[{role:'user',text:'QA'}],onUpdate:t=>updates.push(t)});assert.ok(!updates.join('').includes('QA_SEC'));assert.ok(!result.text.includes('QA_SECRET'));assert.match(result.text,/credencial removida/);
    fs.writeFileSync(path.join(f.dir,'private','chats.json'),JSON.stringify({planning:[{id:'qa',role:'assistant',text:'Trecho parcial',status:'running'}]}));
    const {Workstation}=require('../workstation.cjs'),restored=new Workstation({root:f.root,dataDir:path.join(f.dir,'private'),ai:f.app.ai});assert.equal(restored.status().chats.planning[0].status,'interrupted');assert.match(restored.status().chats.planning[0].error,/reiniciado/);assert.equal(restored.status().chatRunning,null);restored.close();
  }finally{await f.close();}
});
