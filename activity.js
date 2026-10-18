/* Honest progress: completed deliveries are measurable; provider generation percent is not. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));else root.FirmaActivity=factory(root.FirmaEngine);})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const roles=['leadership','planning','development','testing','publishing'];
  function roleOf(task){return task.execution?.role||E.taskDepartment(task);}
  function summarize(state,role,live={},paused=false){
    const tasks=state.tasks.filter(t=>roleOf(t)===role),ready=tasks.filter(t=>['review','done'].includes(t.status)||t.execution?.status==='ready').length;
    const real=tasks.find(t=>t.execution?.status==='running'),chat=live.chatRunning?.role===role;
    const simulated=tasks.find(t=>t.status==='working'&&t.execution?.kind!=='real'),error=tasks.find(t=>t.execution?.status==='error');
    const meeting=!!state.assembly?.active,active=!!real||chat||!!simulated&&!paused&&!meeting;
    const percent=tasks.length?Math.round(ready/tasks.length*100):0;
    const generationPercent=real||chat?null:simulated?Math.floor(simulated.progress):null;
    let label=real||chat?'IA gerando · percentual indisponível':simulated&&!paused&&!meeting?'Simulação · '+generationPercent+'%':meeting?'Equipe em reunião':paused?'Escritório pausado':tasks.some(t=>t.status==='review')?'Entrega para revisar':error?'Falha · precisa de atenção':tasks.some(t=>t.execution?.status==='held')?'Aguarda autorização':tasks.some(t=>t.status==='blocked')?'Aguarda etapa anterior':tasks.length&&ready===tasks.length?'Entregas prontas':'Disponível';
    return {role,active,mode:real||chat?'real':simulated?'simulation':'idle',label,percent,ready,total:tasks.length,generationPercent,metric:ready+'/'+tasks.length+' entregas prontas · '+percent+'%',taskId:real?.id||simulated?.id||null};
  }
  function all(state,live={},paused=false){return Object.fromEntries(roles.map(role=>[role,summarize(state,role,live,paused)]));}
  function codeFrom(text){const value=String(text||''),blocks=[];const regex=/```([^\n`]*)\n([\s\S]*?)(?:```|$)/g;let match;while((match=regex.exec(value)))blocks.push({language:match[1].trim()||'texto',code:match[2]});return blocks;}
  return {roles,roleOf,summarize,all,codeFrom};
});
