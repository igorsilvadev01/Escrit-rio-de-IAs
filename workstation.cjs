'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const ROLES=['leadership','planning','development','testing','publishing'];
const UNIT_TESTS=['engine.test.cjs','world.test.cjs','server.test.cjs','ai.test.cjs','codex-bridge.test.cjs','workstation.test.cjs'];
const CODE=/\.(?:js|cjs|mjs|html|css|json|md|bat)$/i;
const PRIVATE=/(?:^|\/)(?:\.|node_modules|artifacts|dist|coverage)|(?:secret|credential|token|password|lockfile)/i;
function stopChild(child){
  if(!child?.pid)return;
  if(process.platform==='win32'){
    const killer=spawn(path.join(process.env.SystemRoot||'C:\\Windows','System32','taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{windowsHide:true,shell:false,stdio:'ignore'});killer.on('error',()=>child.kill());
  }else{try{process.kill(-child.pid,'SIGTERM');}catch{child.kill();}}
}
class Workstation{
  constructor({root,dataDir,ai}){
    this.root=fs.realpathSync(root);this.ai=ai;this.file=path.join(dataDir,'chats.json');this.closed=false;
    this.chats=Object.fromEntries(ROLES.map(r=>[r,[]]));this.terminal={id:'',command:'',status:'idle',output:'Terminal local pronto. Escolha uma verificação. Nenhum comando é executado automaticamente.\n',exitCode:null};
    if(fs.existsSync(this.file)){const saved=JSON.parse(fs.readFileSync(this.file,'utf8'));for(const role of ROLES)if(Array.isArray(saved[role]))this.chats[role]=saved[role].slice(-24).filter(m=>['user','assistant'].includes(m.role)&&typeof m.text==='string').map(m=>({...m,text:this.clean(m.text).slice(0,120000),status:m.status==='running'?'interrupted':m.status,error:m.status==='running'?'Servidor reiniciado. Reenvie manualmente se desejar.':m.error}));}
  }
  clean(value){return this.ai.redactOutput(String(value)).replace(/sk-ant-[A-Za-z0-9_-]{12,}|AIza[A-Za-z0-9_-]{15,}|AQ\.[A-Za-z0-9_-]{25,}/g,'[credencial removida]');}
  save(){if(this.closed)return;const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(this.chats),{mode:0o600});fs.renameSync(temp,this.file);}
  target(name){
    if(typeof name!=='string'||name.length>200||!name||name.includes('\\')||name.includes(':')||/[\x00-\x1f]/.test(name)||name.split('/').some(s=>!s||s==='.'||s==='..')||PRIVATE.test(name)||!CODE.test(name))throw Error('Arquivo não permitido.');
    const parts=name.split('/');if(parts.length>1&&!['docs','tests'].includes(parts[0]))throw Error('Pasta não permitida.');
    let file=this.root;for(const part of parts){file=path.join(file,part);if(fs.lstatSync(file).isSymbolicLink())throw Error('Links simbólicos não são permitidos.');}
    const real=fs.realpathSync(file),relative=path.relative(this.root,real);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Arquivo fora do projeto.');
    const stat=fs.statSync(real);if(!stat.isFile()||stat.nlink!==1||stat.size>300000)throw Error('Arquivo indisponível ou acima de 300 KB.');return {file:real,stat};
  }
  files(){
    const result=[];
    const walk=(dir,prefix='',depth=0)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(result.length>=600)return;const name=prefix+entry.name;if(PRIVATE.test(name)||entry.isSymbolicLink())continue;
      if(entry.isDirectory()&&depth<3&&(prefix||['docs','tests'].includes(entry.name)))walk(path.join(dir,entry.name),name+'/',depth+1);
      if(entry.isFile()&&CODE.test(name))try{const {stat}=this.target(name);result.push({path:name,size:stat.size,modified:stat.mtimeMs});}catch{}
    }};walk(this.root);return result.sort((a,b)=>a.path.localeCompare(b.path));
  }
  read(name){const {file,stat}=this.target(name),text=this.clean(fs.readFileSync(file,'utf8'));return {path:name,text,modified:stat.mtimeMs,hash:crypto.createHash('sha256').update(text).digest('hex')};}
  status(){return {chats:this.chats,terminal:{...this.terminal,output:this.clean(this.terminal.output)},chatRunning:this.ai.activeChat?{role:this.ai.activeChat.role,provider:this.ai.activeChat.provider}:null,commands:[{id:'syntax',label:'Verificar sintaxe do arquivo JS aberto'},{id:'tests',label:'Rodar testes automatizados do projeto'},{id:'status',label:'git status — alterações locais'},{id:'diff',label:'git diff — resumo das alterações'}]};}
  send(p){
    if(p.confirm!==true)throw Error('Confirme o envio da conversa ao provedor.');
    if(!ROLES.includes(p.role)||typeof p.text!=='string'||!p.text.trim()||p.text.length>6000)throw Error('Escolha uma função e escreva até 6000 caracteres.');
    if(this.chats[p.role].some(m=>m.status==='running'))throw Error('Aguarde a resposta deste chat.');
    // Read only the explicitly selected file. Never sends the entire repository or office memory.
    const context=p.file?this.read(p.file):null;if(context&&context.text.length>24000)throw Error('Arquivo acima de 24 mil caracteres para anexar. Escolha um arquivo menor.');
    const previous=this.chats[p.role].filter(m=>m.role==='user'||m.status==='completed').slice(-12).map(m=>({role:m.role,text:m.text+(m.attachment?'\n\nArquivo anexado anteriormente (somente leitura):\n'+m.attachment:'')}));
    const config=this.ai.settings.roles[p.role],user={id:crypto.randomUUID(),role:'user',text:this.clean(p.text.trim()),status:'completed',time:new Date().toISOString(),file:context?.path||'',attachment:context?context.path+'\n'+context.text:''};
    const answer={id:crypto.randomUUID(),role:'assistant',text:'',status:'running',time:new Date().toISOString(),provider:config.provider,model:config.model,error:'',tokens:0};
    // ai.chat checks admission and reserves the shared executor synchronously, before saving a turn.
    const promise=this.ai.chat({role:p.role,messages:[...previous,{role:'user',text:user.text}],context:context?context.path+'\n'+context.text:'',onUpdate:value=>{answer.text=this.clean(value);}});
    this.chats[p.role]=[...this.chats[p.role],user,answer].slice(-24);this.save();
    promise.then(result=>{answer.text=this.clean(result.text);answer.status='completed';answer.model=result.model;answer.tokens=result.usage?.tokens||0;},error=>{answer.status='error';answer.error=this.clean(error.message);}).finally(()=>this.save());
    return {id:answer.id};
  }
  clear(role){if(!ROLES.includes(role))throw Error('Função inválida.');if(this.ai.activeChat?.role===role)throw Error('Cancele ou aguarde a resposta antes de limpar.');this.chats[role]=[];this.save();}
  run(p){
    if(p.confirm!==true)throw Error('Confirme a execução local.');if(this.child)throw Error('Já existe um comando em execução.');
    let bin=process.execPath,args,label;
    switch(p.command){
      case 'syntax':{const {file}=this.target(p.file);if(!/\.(?:js|cjs|mjs)$/.test(file))throw Error('Abra um arquivo JavaScript primeiro.');args=['--check',file];label='node --check '+p.file;break;}
      case 'tests':args=['--test',...UNIT_TESTS.filter(n=>fs.existsSync(path.join(this.root,'tests',n))).map(n=>path.join(this.root,'tests',n))];if(args.length===1)throw Error('Nenhum teste permitido encontrado.');label='node --test · testes locais da Firma';break;
      case 'status':bin='git';args=['--no-pager','status','--short'];label='git status --short';break;
      case 'diff':bin='git';args=['--no-pager','diff','--no-ext-diff','--no-textconv','--stat'];label='git diff --stat';break;
      default:throw Error('Comando não permitido. Não há shell livre neste terminal.');
    }
    const env={};for(const key of ['PATH','Path','SYSTEMROOT','SystemRoot','WINDIR','TEMP','TMP','PATHEXT'])if(process.env[key])env[key]=process.env[key];env.NO_COLOR='1';env.GIT_TERMINAL_PROMPT='0';
    const run={id:crypto.randomUUID(),command:label,status:'running',output:'> '+label+'\n',exitCode:null,started:new Date().toISOString()};this.terminal=run;
    const child=spawn(bin,args,{cwd:this.root,env,shell:false,windowsHide:true,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});this.child=child;
    const finish=(status,code)=>{if(this.child!==child)return;clearTimeout(this.commandTimer);this.child=null;run.status=status;run.exitCode=code;run.output=this.clean(run.output)+'\n['+(status==='completed'?'concluído':status==='cancelled'?'interrompido':'falhou')+' · código '+(code??'indisponível')+']\n';};
    const append=chunk=>{if(this.child!==child)return;run.output+=this.clean(chunk);if(run.output.length>100000){run.output=run.output.slice(0,100000)+'\n[Saída limitada a 100 KB. Processo interrompido.]\n';stopChild(child);finish('error',null);}};
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');child.stdout.on('data',append);child.stderr.on('data',append);
    child.once('error',()=>{append('Não foi possível iniciar o executável local.\n');finish('error',null);});child.once('close',code=>finish(code===0?'completed':'error',code));
    this.commandTimer=setTimeout(()=>{stopChild(child);finish('cancelled',null);},90000);this.commandTimer.unref();
    return {id:run.id};
  }
  cancel(){if(!this.child)throw Error('Nenhum comando em execução.');stopChild(this.child);clearTimeout(this.commandTimer);this.child=null;this.terminal.status='cancelled';this.terminal.output+='\n[Interrompido pelo administrador.]\n';}
  action(action,p={}){if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Dados inválidos.');switch(action){case 'chat.send':return this.send(p);case 'chat.cancel':this.ai.cancelChat(p.role);break;case 'chat.clear':if(p.confirm!==true)throw Error('Confirme a limpeza do histórico.');this.clear(p.role);break;case 'terminal.run':return this.run(p);case 'terminal.cancel':this.cancel();break;default:throw Error('Ação da Bancada desconhecida.');}return {};}
  close(){this.closed=true;this.ai.activeChat?.controller.abort();if(this.child)this.cancel();}
}
module.exports={Workstation};
