'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {promisify}=require('node:util');
const E=require('./engine.js');
const {AIRuntime}=require('./ai-runtime.cjs');
const {Workstation}=require('./workstation.cjs');
const {Company}=require('./company.cjs');
const scrypt=promisify(crypto.scrypt);
const STATIC={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/work.css':'work.css','/play.css':'play.css','/access.css':'access.css','/office.css':'office.css','/studio.css':'studio.css','/engine.js':'engine.js','/world.js':'world.js','/activity.js':'activity.js','/ui.js':'ui.js','/app.js':'app.js','/access.js':'access.js','/ai-ui.js':'ai-ui.js','/studio.js':'studio.js'};
const TYPES={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
STATIC['/company-ui.js']='company-ui.js';
STATIC['/station.css']='station.css';
STATIC['/village.css']='village.css';
STATIC['/village-renderer.js']='village-renderer.js';STATIC['/scene-model.js']='scene-model.js';STATIC['/scene-controls.js']='scene-controls.js';
STATIC['/visitor-avatar.js'] = 'visitor-avatar.js';
STATIC['/office-life.js'] = 'office-life.js';
STATIC['/office-life-ui.js'] = 'office-life-ui.js';
STATIC['/portfolio-theme.css'] = 'portfolio-theme.css';
STATIC['/office-logo.svg'] = 'office-logo.svg';
TYPES['.svg'] = 'image/svg+xml';
const COOKIE='firma_session',SESSION_MS=8*60*60*1000;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
// Capture the backend code at process start, so the launcher never reuses a stale instance.
const SERVER_BUILD=hash(['package.json','server.cjs','engine.js','ai-runtime.cjs','ai-providers.cjs','workstation.cjs','workspace-projects.cjs','company.cjs','company-backup.cjs','company-tools.cjs','codex-bridge.cjs'].map(name=>fs.readFileSync(path.join(__dirname,name),'utf8')).join('\n')).slice(0,16);
const equal=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};
class ApiError extends Error{constructor(status,message){super(message);this.status=status;}}
function atomic(file,data){const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(data,null,2),{mode:0o600});fs.renameSync(temp,file);}
function text(value,max=3000){if(typeof value!=='string'||value.length>max)throw new ApiError(400,'Campo de texto inválido.');return value;}
function loginId(value){const id=text(value,254).trim();return id.includes('@')?id.toLowerCase():id;}
function createFirmaServer(options={}){
  const dataDir=options.dataDir||process.env.FIRMA_DATA_DIR||path.join(__dirname,'.firma-private');
  const publicOrigin=options.publicOrigin||process.env.FIRMA_PUBLIC_ORIGIN||'';
  const configuredOrigin=publicOrigin?new URL(publicOrigin).origin:null;
  const secure=!!configuredOrigin?.startsWith('https:');
  const localAI=!configuredOrigin||['localhost','127.0.0.1','[::1]'].includes(new URL(configuredOrigin).hostname);
  fs.mkdirSync(dataDir,{recursive:true,mode:0o700});
  const authFile=path.join(dataDir,'admin.json'),stateFile=path.join(dataDir,'office.json'),setupFile=path.join(dataDir,'setup-token');
  let credentials=fs.existsSync(authFile)?JSON.parse(fs.readFileSync(authFile,'utf8')):null;
  let bootstrapToken='';
  if(!credentials){bootstrapToken=fs.existsSync(setupFile)?fs.readFileSync(setupFile,'utf8'):options.bootstrapToken||crypto.randomBytes(32).toString('hex');if(!fs.existsSync(setupFile))fs.writeFileSync(setupFile,bootstrapToken,{mode:0o600});}
  const stored=fs.existsSync(stateFile)?JSON.parse(fs.readFileSync(stateFile,'utf8')):null;
  let state=stored?E.migrate(stored.state):E.create(),paused=!!stored?.paused,revision=0,setupInProgress=false;
  let legacyImportAvailable=stored?!!stored.legacyImportAvailable:true;
  const sessions=new Map(),attempts=new Map();
  const persist=()=>atomic(stateFile,{state,paused,legacyImportAvailable});
  if(!stored)persist();
  const ai=new AIRuntime({dataDir,getState:()=>state,isPaused:()=>paused||!E.officeOpen(state),changed:()=>{revision++;persist();},...options.ai});
  const workstation=new Workstation({root:options.workspaceRoot||__dirname,dataDir,ai});
  const company=new Company({dataDir,workstation,ai,getState:()=>state,changed:()=>{revision++;persist();},restoreState:value=>{state=E.migrate(value);revision++;persist();}});workstation.company=company;
  function session(req){const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));const token=cookie?.slice(COOKIE.length+1);if(!token||token.length>128)return null;const key=hash(token),record=sessions.get(key);if(record&&record.expires>Date.now())return record;sessions.delete(key);return null;}
  function setCookie(res,token,maxAge=SESSION_MS/1000){res.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`);}
  function signIn(req,res){const old=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));if(old)sessions.delete(hash(old.slice(COOKIE.length+1)));const token=crypto.randomBytes(32).toString('hex'),record={csrf:crypto.randomBytes(32).toString('hex'),expires:Date.now()+SESSION_MS};sessions.set(hash(token),record);setCookie(res,token);return record;}
  function admin(req){const record=session(req);if(!record)throw new ApiError(401,'Entre como administrador para fazer alterações.');return record;}
  function origin(req){const host=req.headers.host;if(!host)throw new ApiError(400,'Host ausente.');if(configuredOrigin){if(host!==new URL(configuredOrigin).host)throw new ApiError(403,'Host não permitido.');return configuredOrigin;}if(!/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host))throw new ApiError(403,'Configure FIRMA_PUBLIC_ORIGIN para usar este domínio.');return 'http://'+host;}
  function mutation(req){const expected=origin(req);if(req.headers.origin!==expected||req.headers['sec-fetch-site']==='cross-site')throw new ApiError(403,'Origem não permitida.');if(!String(req.headers['content-type']||'').startsWith('application/json'))throw new ApiError(415,'Envie dados JSON.');}
  function csrf(req){const record=admin(req);if(!equal(req.headers['x-firma-csrf']||'',record.csrf))throw new ApiError(403,'Sessão inválida. Atualize a página.');return record;}
  async function body(req,maxBytes=3_000_000){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new ApiError(413,'Envie até 3 MB.');chunks.push(chunk);}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error();return value;}catch{throw new ApiError(400,'JSON inválido.');}}
  function limited(req){const key=req.socket.remoteAddress||'unknown',now=Date.now();let item=attempts.get(key);if(!item||now-item.start>15*60*1000){item={start:now,count:0};attempts.set(key,item);}if(item.count>=8)throw new ApiError(429,'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.');item.count++;return key;}
  function snapshot(isAdmin){
    if(isAdmin)return {role:'admin',state,paused,revision};
    // Never publish context, briefings, instructions, feedback or deliverable contents.
    return {role:'visitor',paused,revision,state:{...state,memory:'Contexto reservado ao administrador.',onboarded:true,agents:state.agents.map(a=>({...a,instructions:''})),tasks:state.tasks.map((t,i)=>({...t,projectId:'firma',workRunId:'',workStatus:'',artifacts:[],validation:null,title:`Missão ${i+1} · ${t.category}`,description:'Acompanhamento público da produção. Briefing e documentos são privados.',output:'',criteria:'',context:'',result:'',execution:t.execution?{kind:'real',provider:t.execution.provider,model:'',status:t.execution.status,error:'',role:E.taskDepartment(t),tokens:0,completedAt:''}:null,revisions:[],due:'',steps:['Preparação','Produção','Revisão']})),events:[],player:{...state.player,visited:[]}}};
  }
  function apply(action,p={}){
    if(!p||typeof p!=='object'||Array.isArray(p))throw new ApiError(400,'Dados inválidos.');
    const getAgent=()=>{const a=state.agents.find(a=>a.id===p.id);if(!a)throw new ApiError(404,'Agente não encontrado.');return a;};
    const getTask=()=>{const t=state.tasks.find(t=>t.id===p.id);if(!t)throw new ApiError(404,'Missão não encontrada.');return t;};
    switch(action){
      case 'office.close':if(company.active||ai.active||ai.activeChat)throw new ApiError(409,'Aguarde a resposta de IA em andamento terminar antes de fechar o escritório.');E.changeOffice(state,'closed');ai.holdAll();break;
      case 'office.open':E.changeOffice(state,'open');break;
      case 'task.create':if(state.tasks.length>=500)throw new ApiError(400,'Limite de 500 missões atingido.');text(p.title,100);text(p.description);{const projectId=company.project(p.projectId||'firma');const t=E.addTask(state,{...p,projectId,context:projectId==='firma'&&company.meta(projectId).memory.length===0?state.memory:company.context(projectId)});company.audit(projectId,'task','Tarefa criada: '+t.title,{taskId:t.id});if(p.executionMode==='real'){const role=E.taskDepartment(t),c=ai.settings.roles[role];t.execution={kind:'real',role,provider:c.provider,model:c.model,status:'held',error:'Confirme o envio para iniciar a execução real.',tokens:0,completedAt:''};}}break;
      case 'task.approve':{const task=getTask();E.approve(state,task.id);company.audit(task.projectId||'firma','approved','Entrega aprovada: '+task.title,{taskId:task.id});break;}
      case 'task.revise':E.revise(state,getTask().id,text(p.feedback,2000));break;
      case 'task.assign':{const t=getTask();if(ai.active?.id===t.id||ai.armed.has(t.id))throw new ApiError(409,'Cancele a execução de IA antes de reatribuir.');if(t.status==='done')throw new ApiError(400,'A missão já foi aprovada.');if(!state.agents.some(a=>a.id===p.agent)||!['low','normal','high'].includes(p.priority))throw new ApiError(400,'Atribuição inválida.');t.agent=p.agent;t.priority=p.priority;E.event(state,'Você',`atualizou a atribuição de “${t.title}”.`);break;}
      case 'agent.pause':E.pauseAgent(state,getAgent().id);break;
      case 'agent.instructions':{const a=getAgent(),instructions=text(p.instructions,2000);if(p.department!==undefined){if(!Object.hasOwn(E.departments,p.department))throw new ApiError(400,'Sala inválida.');if(state.agents.filter(other=>other.id!==a.id&&other.department===p.department).length>=6)throw new ApiError(400,'Esta sala já tem seis especialistas.');a.department=p.department;}a.instructions=instructions;break;}
      case 'agent.hire':{
        if(!E.officeOpen(state))throw new ApiError(409,'Abra o escritório e aguarde a equipe chegar antes de contratar.');
        if(state.agents.length>=24)throw new ApiError(400,'O escritório comporta até 24 agentes.');
        const name=text(p.name,25).trim(),role=text(p.role,60).trim();if(!name||!role)throw new ApiError(400,'Preencha nome e especialidade.');
        if(p.department!==undefined&&!Object.hasOwn(E.departments,p.department))throw new ApiError(400,'Sala inválida.');const department=E.departmentOf({role,department:p.department});if(state.agents.filter(a=>a.department===department).length>=6)throw new ApiError(400,'Esta sala já tem seis especialistas.');
        state.agents.push({id:E.uid(),name,role,department,model:'Simulador local',color:E.colors[state.agents.length%E.colors.length],rest:false,autoRest:false,energy:100,xp:0,instructions:text(p.instructions||'',2000),meetingUntil:0});E.event(state,name,'entrou para a equipe.');break;
      }
      case 'assembly.start':E.summonTeam(state);break;
      case 'assembly.end':E.dismissTeam(state);break;
      case 'meeting':if(state.tasks.length>496)throw new ApiError(400,'Limite de missões atingido.');E.meeting(state,text(p.goal,200));break;
      case 'memory':state.memory=text(p.memory,12000);E.event(state,'Você','atualizou o contexto compartilhado.');break;
      case 'settings':if(![1,2,4].includes(p.speed))throw new ApiError(400,'Velocidade inválida.');state.company=text(p.company,40).trim()||'Firma HQ';state.speed=p.speed;break;
      case 'player':state.player=E.migrate({...state,player:{...state.player,...p}}).player;break;
      case 'onboard':state.onboarded=true;break;
      case 'legacy.dismiss':legacyImportAvailable=false;break;
      case 'simulation':if(typeof p.paused!=='boolean')throw new ApiError(400,'Pausa inválida.');paused=p.paused;break;
      case 'restore':if(company.active||ai.active||ai.activeChat)throw new ApiError(409,'Cancele a execução de IA antes de restaurar.');state=E.migrate(p.state);ai.holdAll();legacyImportAvailable=false;break;
      default:throw new ApiError(400,'Ação desconhecida.');
    }
    E.reconcile(state);revision++;persist();
  }
  let timer=null,wasListening=false;
  function advance(){
    const transition=['closing','opening'].includes(state.office.status);E.advanceOffice(state,1);revision++;
    if(transition||Math.floor(state.office.clock)%5===0)persist();
    ai.pump().catch(()=>{});
    if(!paused){E.tick(state,state.speed);revision++;if(Math.floor(state.seconds)%5<state.speed)persist();}
    for(const [key,item] of sessions)if(item.expires<=Date.now())sessions.delete(key);
    for(const [key,item] of attempts)if(Date.now()-item.start>15*60*1000)attempts.delete(key);
  }
  const server=http.createServer(async(req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
    try{
      origin(req);const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')){
        if(url.pathname.startsWith('/api/company/')){
          admin(req);if(!localAI||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))throw new ApiError(403,'Projetos e execuções estão disponíveis apenas localmente.');
          try{
            if(req.method==='GET'&&url.pathname==='/api/company/status')return json(200,company.state(url.searchParams.get('project')||'firma'));
            if(req.method==='GET'&&url.pathname==='/api/company/run')return json(200,company.inspect(url.searchParams.get('id')));
            if(req.method==='POST'&&url.pathname==='/api/company/action'){mutation(req);csrf(req);const input=await body(req,30_000_000);return json(200,await company.action(input.action,input.payload));}
          }catch(error){if(error.status)throw error;throw new ApiError(400,ai.redact(error.message));}throw new ApiError(404,'Recurso de projeto não encontrado.');
        }

        if(url.pathname.startsWith('/api/studio/')){
          admin(req);if(!localAI||!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))throw new ApiError(403,'A Bancada e o terminal estão disponíveis apenas no servidor local.');
          if(req.method==='GET'){
            if(url.pathname==='/api/studio/preview'){
              const html=workstation.previewPage(url.searchParams.get('id'));if(html===null)throw new ApiError(404,'Prévia expirada. Atualize a prévia na sua mesa.');
              res.removeHeader('X-Frame-Options');res.setHeader('Content-Security-Policy',"sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; object-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'");
              res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return;
            }
            if(url.pathname==='/api/studio/status')return json(200,workstation.status());
            if(url.pathname==='/api/studio/files')return json(200,{files:workstation.files(url.searchParams.get('project')||'firma')});
            if(url.pathname==='/api/studio/file'){try{return json(200,workstation.read(url.searchParams.get('path'),url.searchParams.get('project')||'firma'));}catch{throw new ApiError(400,'Arquivo não permitido, inexistente ou indisponível.');}}
          }
          if(req.method==='POST'&&url.pathname==='/api/studio/action'){mutation(req);csrf(req);const input=await body(req);try{return json(200,workstation.action(input.action,input.payload));}catch(error){throw new ApiError(400,ai.redact(error.message));}}
          throw new ApiError(404,'Endpoint da Bancada não encontrado.');
        }
        if(req.method==='GET'&&url.pathname==='/api/session'){const record=session(req);return json(200,{app:'firma',serverBuild:SERVER_BUILD,role:record?'admin':'guest',username:record?credentials.username:null,csrf:record?.csrf,setupRequired:!credentials,legacyImportAvailable:!!record&&legacyImportAvailable});}
        if(req.method==='GET'&&url.pathname==='/api/state')return json(200,snapshot(url.searchParams.get('public')!=='1'&&!!session(req)));
        if(req.method==='GET'&&url.pathname==='/api/ai/status'){admin(req);if(!localAI&&!secure)throw new ApiError(403,'Use HTTPS ou localhost para conectar IAs.');return json(200,ai.status());}
        if(req.method==='GET'&&url.pathname==='/api/backup'){admin(req);res.setHeader('Content-Disposition','attachment; filename="firma-backup.json"');return json(200,state);}
        if(req.method!=='POST')throw new ApiError(405,'Método não permitido.');mutation(req);
        if(url.pathname==='/api/setup'){
          limited(req);if(credentials||setupInProgress)throw new ApiError(409,'O administrador já foi configurado.');
          const input=await body(req);if(!bootstrapToken||!equal(input.token||'',bootstrapToken))throw new ApiError(403,'Use o acesso privado de configuração aberto pelo iniciador no seu computador.');
          const username=loginId(input.username),password=text(input.password,256);if(!(/^[a-zA-Z0-9._-]{3,40}$/.test(username)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username))||password.length<12)throw new ApiError(400,'Informe um e-mail válido ou usuário com 3 a 40 caracteres e uma senha de pelo menos 12 caracteres.');
          if(credentials||setupInProgress)throw new ApiError(409,'O administrador já foi configurado.');setupInProgress=true;
          try{const salt=crypto.randomBytes(16).toString('hex'),derived=await scrypt(password,salt,64,{N:65536,r:8,p:1,maxmem:128*1024*1024});const created={username,salt,hash:derived.toString('hex')};fs.writeFileSync(authFile,JSON.stringify(created),{flag:'wx',mode:0o600});credentials=created;bootstrapToken='';if(fs.existsSync(setupFile))fs.unlinkSync(setupFile);const record=signIn(req,res);return json(201,{role:'admin',csrf:record.csrf});}finally{setupInProgress=false;}
        }
        if(url.pathname==='/api/login'){
          const key=limited(req),input=await body(req);const username=loginId(input.username),password=text(input.password,256);
          const salt=credentials?.salt||'00000000000000000000000000000000',derived=await scrypt(password,salt,64,{N:65536,r:8,p:1,maxmem:128*1024*1024});
          if(!credentials||!equal(username,credentials.username)||!equal(derived.toString('hex'),credentials.hash))throw new ApiError(401,'Usuário ou senha inválidos.');
          attempts.delete(key);const record=signIn(req,res);return json(200,{role:'admin',csrf:record.csrf});
        }
        if(url.pathname==='/api/logout'){csrf(req);const cookie=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='));if(cookie)sessions.delete(hash(cookie.slice(COOKIE.length+1)));setCookie(res,'',0);return json(200,{ok:true});}
        if(url.pathname==='/api/ai/action'){csrf(req);if(!localAI&&!secure)throw new ApiError(403,'Use HTTPS ou localhost para conectar IAs.');const input=await body(req);try{const result=await ai.action(input.action,{...input.payload,...(['advice','agent.order','flow'].includes(input.action)?{projectId:company.project(input.payload?.projectId||'firma'),projectContext:company.context(input.payload?.projectId||'firma')}:{})},{local:localAI&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)});return json(200,{...snapshot(true),ai:ai.status(),...result});}catch(error){throw new ApiError(400,ai.redact(error.message));}}
        if(url.pathname==='/api/action'){csrf(req);const input=await body(req);try{apply(input.action,input.payload);}catch(error){if(error instanceof ApiError)throw error;throw new ApiError(400,error.message);}return json(200,snapshot(true));}
        throw new ApiError(404,'Endpoint não encontrado.');
      }
      if(!['GET','HEAD'].includes(req.method))throw new ApiError(405,'Método não permitido.');
      const name=Object.hasOwn(STATIC,url.pathname)?STATIC[url.pathname]:null;if(!name)throw new ApiError(404,'Não encontrado.');
      const data=await fs.promises.readFile(path.join(__dirname,name));res.writeHead(200,{'Content-Type':TYPES[path.extname(name)]});res.end(req.method==='HEAD'?undefined:data);
    }catch(error){if(!res.headersSent)json(error.status||500,{error:error.status?error.message:'Não foi possível concluir a solicitação.'});else res.end();}
  });
  server.once('listening',()=>{wasListening=true;timer=setInterval(advance,1000);timer.unref();});
  server.on('close',()=>{clearInterval(timer);company.close();workstation.close();ai.close();if(wasListening)persist();sessions.clear();});
  return {server,ai,workstation,company,get setupToken(){return bootstrapToken;},get configured(){return !!credentials;},dataDir};
}
if(require.main===module){
  const app=createFirmaServer(),port=Number(process.env.PORT)||3000,host=process.env.FIRMA_HOST||'127.0.0.1';
  function openBrowser(){const url=`http://localhost:${port}/`+(app.configured?'':'#configurar='+app.setupToken);if(process.platform==='win32'){const child=require('node:child_process').spawn('explorer.exe',[url],{stdio:'ignore',windowsHide:true});child.on('error',()=>console.log('Abra o endereço local no navegador.'));}}
  app.server.listen(port,host,()=>{console.log(`Firma está pronta: http://localhost:${port}`);if(!app.configured)console.log('Primeiro acesso: abra Iniciar Firma.bat para configurar seu login privado.');if(process.argv.includes('--open'))openBrowser();});
  app.server.on('error',error=>{if(error.code==='EADDRINUSE'&&process.argv.includes('--open')){http.get(`http://localhost:${port}/api/session`,response=>{let data='';response.on('data',chunk=>data+=chunk);response.on('end',()=>{try{const running=JSON.parse(data);if(running.app!=='firma')throw Error();if(running.serverBuild!==SERVER_BUILD){console.error('A Firma antiga ainda está aberta. Feche a janela antiga do servidor com Ctrl+C e abra Iniciar Firma.bat novamente para carregar a atualização.');process.exitCode=1;}else openBrowser();app.server.close();}catch{console.error('A porta está em uso por outro aplicativo.');process.exitCode=1;}});}).on('error',()=>{console.error('Reinicie a outra instância da Firma.');process.exitCode=1;});}else{console.error(error.code==='EADDRINUSE'?'A porta já está em uso. Feche a outra instância e tente novamente.':error.message);process.exitCode=1;}});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.server.close(()=>process.exit()));
}
module.exports={createFirmaServer};
