/* Local scene preferences, truthful indicators and shared depth/hit rules. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.FirmaEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.FirmaScene=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const defaults={mode:'ambient',camera:'overview',zoom:1,material:'oak',rug:'sage',plant:true,lamp:true,lighting:'auto',sound:false,volume:20,reduceMotion:false};
  function preferences(value={}){return {reduceMotion:value.reduceMotion===true,mode:['ambient','work'].includes(value.mode)?value.mode:defaults.mode,camera:['overview','follow','desk'].includes(value.camera)?value.camera:defaults.camera,zoom:Number.isFinite(value.zoom)?Math.max(.8,Math.min(2.4,value.zoom)):1,material:['oak','walnut','cream'].includes(value.material)?value.material:'oak',rug:['sage','clay','straw'].includes(value.rug)?value.rug:'sage',plant:value.plant!==false,lamp:value.lamp!==false,lighting:['auto','day','evening'].includes(value.lighting)?value.lighting:'auto',sound:value.sound===true,volume:Number.isFinite(value.volume)?Math.max(0,Math.min(100,value.volume)):20};}
  function depth(items){return items.map((item,i)=>({...item,order:i})).sort((a,b)=>a.y-b.y||(a.layer||0)-(b.layer||0)||a.order-b.order);}
  function hit(items,x,y){return depth(items).reverse().find(item=>item.area&&x>=item.area.x&&y>=item.area.y&&x<=item.area.x+item.area.w&&y<=item.area.y+item.area.h)||null;}
  function indicator(state,agentId,{admin=true,projectId='firma'}={}){
    const tasks=state.tasks.filter(t=>t.agent===agentId&&(!admin||(t.projectId||'firma')===projectId));
    if(!admin)return {kind:'visitor',symbol:'',label:'Conhecer colega',taskId:null,animation:'idle'};
    const error=tasks.find(t=>t.execution?.status==='error'||['interrupted','validation_failed','cancelled'].includes(t.workStatus));
    const review=tasks.find(t=>t.status==='review'||t.workStatus==='review'),running=tasks.find(t=>t.workStatus==='running'||t.execution?.status==='running'),blocked=tasks.find(t=>t.status==='blocked'),simulated=tasks.find(t=>t.status==='working'&&!t.workRunId&&t.execution?.kind!=='real');
    if(error)return {kind:'error',symbol:'!',label:'Precisa de atenção',taskId:error.id,animation:'waiting'};
    if(review)return {kind:'review',symbol:'✓',label:review.workRunId?'Revisar cópia':review.execution?.kind==='real'?'Revisar entrega':'Revisar simulação',taskId:review.id,animation:'reading'};
    if(running)return {kind:'running',symbol:'…',label:running.workRunId?'Executando na cópia':'IA gerando · sem percentual',taskId:running.id,animation:'typing'};
    if(blocked)return {kind:'blocked',symbol:'⌛',label:'Aguarda etapa anterior',taskId:blocked.id,animation:'waiting'};
    if(simulated)return {kind:'simulation',symbol:'·',label:'Trabalhando · simulação',taskId:simulated.id,animation:'typing'};
    const elsewhere=state.tasks.find(t=>t.agent===agentId&&(t.projectId||'firma')!==projectId&&t.status!=='done');if(elsewhere)return {kind:'elsewhere',symbol:'',label:'Em outro projeto',taskId:null,animation:elsewhere.status==='working'?'typing':'reading'};
    return {kind:'idle',symbol:'',label:'Disponível',taskId:null,animation:'reading'};
  }
  function action(state,id,options={}){const status=indicator(state,id,options);return {agent:id,name:state.agents.find(a=>a.id===id)?.name||'Colega',verb:'Conversar',...status};}
  function resolveTask(state,taskId,options){if(!options.admin)return null;return state.tasks.find(t=>t.id===taskId&&(t.projectId||'firma')===options.projectId)||null;}
  return {defaults,preferences,depth,hit,indicator,action,resolveTask};
});
