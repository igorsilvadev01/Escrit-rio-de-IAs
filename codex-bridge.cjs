'use strict';
// Official Codex app-server protocol. Never reads the IDE's account or tokens.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),readline=require('node:readline');
function command(){
  if(process.env.FIRMA_CODEX_BIN){const bin=process.env.FIRMA_CODEX_BIN;if(!path.isAbsolute(bin)||!fs.existsSync(bin))return null;return {bin,args:[]};}
  if(process.platform==='win32'){const target=process.arch==='arm64'?'aarch64-pc-windows-msvc':'x86_64-pc-windows-msvc';const native=path.join(process.env.APPDATA||'','npm','node_modules','@openai','codex','node_modules','@openai','codex-win32-'+process.arch,'vendor',target,'bin','codex.exe');return fs.existsSync(native)?{bin:native,args:[]}:null;}
  return {bin:'codex',args:[]};
}
class CodexBridge{
  constructor(dataDir,options={}){this.home=path.join(dataDir,'codex');this.workspace=path.join(dataDir,'ai-workspace');this.launch=options.launch||command();this.pending=new Map();this.next=1;this.account=null;this.login=null;this.listener=null;this.closed=false;}
  get available(){return !!this.launch;}
  async start(){
    if(this.ready)return this.ready;
    this.closed=false;
    this.ready=(async()=>{
      if(!this.launch)throw Error('Codex CLI não encontrado. Instale a distribuição oficial e reinicie a Firma.');
      fs.mkdirSync(this.home,{recursive:true,mode:0o700});fs.mkdirSync(this.workspace,{recursive:true,mode:0o700});
      const env={};for(const key of ['PATH','Path','SYSTEMROOT','SystemRoot','WINDIR','APPDATA','LOCALAPPDATA','TEMP','TMP','USERPROFILE','HOME'])if(process.env[key])env[key]=process.env[key];
      env.CODEX_HOME=this.home;
      this.child=spawn(this.launch.bin,[...this.launch.args,'app-server','-c','features.shell_tool=false','-c','features.multi_agent=false','-c','features.apps=false','-c','web_search="disabled"'],{cwd:this.workspace,env,stdio:['pipe','pipe','pipe'],windowsHide:true,shell:false});
      this.child.stderr.resume();this.child.stdin.on('error',()=>{});
      const child=this.child;this.child.once('error',()=>{if(this.child===child)this.fail();});this.child.once('exit',()=>{if(this.child===child)this.fail();});
      this.lines=readline.createInterface({input:this.child.stdout});this.lines.on('line',line=>{if(line.length>2_000_000)return;try{this.receive(JSON.parse(line));}catch{}});
      await this.rpc('initialize',{clientInfo:{name:'firma_local',title:'Firma — escritório local',version:'0.8.0'}});
      this.send({method:'initialized',params:{}});
      await this.refresh();
    })();
    try{return await this.ready;}catch(error){this.close();throw error;}
  }
  send(message){if(!this.child||this.child.killed)throw Error('Codex indisponível.');this.child.stdin.write(JSON.stringify(message)+'\n');}
  rpc(method,params={},timeout=20000){return new Promise((resolve,reject)=>{const id=this.next++,timer=setTimeout(()=>{this.pending.delete(id);reject(Error('O Codex não respondeu a tempo.'));},timeout);this.pending.set(id,{resolve,reject,timer});try{this.send({id,method,params});}catch(error){clearTimeout(timer);this.pending.delete(id);reject(error);}});}
  receive(message){
    if(message.method&&message.id!==undefined){ // All tool/permission requests fail closed.
      const approval=message.method.endsWith('/requestApproval');
      this.send(approval?{id:message.id,result:{decision:'decline'}}:{id:message.id,error:{code:-32601,message:'Ferramentas não habilitadas pela Firma.'}});return;
    }
    if(message.id!==undefined){const p=this.pending.get(message.id);if(!p)return;clearTimeout(p.timer);this.pending.delete(message.id);message.error?p.reject(Error('O Codex recusou a solicitação. Confira a conta, o modelo e os limites.')):p.resolve(message.result);return;}
    if(message.method==='account/login/completed'){this.login=null;this.refresh().catch(()=>{});}
    if(message.method==='account/updated')this.refresh().catch(()=>{});
    this.listener?.(message);
  }
  async refresh(){const r=await this.rpc('account/read',{refreshToken:false});this.account=r.account?{type:r.account.type,plan:r.account.planType||''}:null;return this.account;}
  async loginStart(){
    await this.start();await this.refresh();if(this.account)return {connected:true};
    if(this.login)return {...this.login};
    const result=await this.rpc('account/login/start',{type:'chatgpt'});
    const url=new URL(result.authUrl);if(url.protocol!=='https:'||!['auth.openai.com','chatgpt.com'].includes(url.hostname))throw Error('O Codex retornou uma URL de login inesperada.');
    this.login={authUrl:url.href,loginId:result.loginId};return {...this.login};
  }
  async loginCancel(){if(this.login){await this.rpc('account/login/cancel',{loginId:this.login.loginId});this.login=null;}}
  async logout(){if(this.ready){await this.start();await this.loginCancel();await this.rpc('account/logout');this.account=null;}this.close();}
  async models(){await this.start();await this.refresh();if(!this.account)throw Error('Conecte sua conta ChatGPT primeiro.');const r=await this.rpc('model/list',{});return (r.data||[]).map(m=>({id:m.model||m.id,name:m.displayName||m.model||m.id})).filter(m=>typeof m.id==='string').slice(0,100);}
  async run({system,prompt,model,signal,onDelta}){
    await this.start();await this.refresh();if(!this.account)throw Error('Conta Codex desconectada.');
    if(signal.aborted)throw Error('cancelled');
    const thread=await this.rpc('thread/start',{...(model?{model}:{}),cwd:this.workspace,approvalPolicy:'never',sandbox:'read-only',ephemeral:true,baseInstructions:system+' Responda somente em texto. Não use ferramentas, shell ou arquivos.',config:{'features.shell_tool':false,'features.multi_agent':false,'features.apps':false,'web_search':'disabled'}});
    const threadId=thread.thread.id;
    return new Promise((resolve,reject)=>{
      let settled=false,finalText='',stream='',turnId='';
      const cleanup=()=>{signal.removeEventListener('abort',abort);this.listener=null;};
      const finish=(error,value)=>{if(settled)return;settled=true;cleanup();error?reject(error):resolve(value);};
      const abort=()=>{this.rpc('turn/interrupt',{threadId,...(turnId?{turnId}:{})},5000).catch(()=>{});finish(Error('cancelled'));};
      signal.addEventListener('abort',abort,{once:true});
      this.listener=message=>{const p=message.params||{};if(p.threadId&&p.threadId!==threadId)return;
        if(message.method==='item/agentMessage/delta'){const delta=String(p.delta||'');stream=(stream+delta).slice(0,120001);onDelta?.(delta);}
        if(message.method==='item/completed'&&p.item?.type==='agentMessage')finalText=(finalText+'\n'+String(p.item.text||'')).trim().slice(0,120001);
        if(message.method==='turn/completed'){if(p.turn?.status!=='completed')return finish(Error('O Codex não concluiu a execução.'));const value=finalText||stream;if(!value.trim()||value.length>120000)return finish(Error('Resposta vazia ou acima do limite.'));finish(null,{text:value,model:thread.model||model||'padrão da conta',usage:null});}
        if(message.method==='error'&&!p.willRetry)finish(Error('O Codex encontrou um erro. Confira o acesso e os limites da conta.'));
      };
      this.rpc('turn/start',{threadId,input:[{type:'text',text:prompt}],approvalPolicy:'never',sandboxPolicy:{type:'readOnly',networkAccess:false}}).then(r=>{turnId=r.turn?.id||'';if(signal.aborted)abort();},error=>finish(error));
    });
  }
  fail(){for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('O processo Codex foi encerrado.'));}this.pending.clear();this.listener?.({method:'error',params:{willRetry:false}});this.ready=null;this.account=null;this.login=null;}
  close(){this.closed=true;this.child?.kill();this.lines?.close();this.fail();this.child=null;}
}
module.exports={CodexBridge,command};
