(() => {
  'use strict';
  const ui=window.FirmaUI,state=ui.state,W=window.FirmaWorld,$=id=>document.getElementById(id),agentDetail=ui.agentDetail,roleLabel=window.FirmaAccess.isAdmin?'Fundador':'Visitante';
  let zoom=matchMedia('(max-width:540px)').matches?1.7:1;
  const camera={x:500,y:330},viewport={width:1000,height:660,scale:1,dpr:1};
  function setZoom(value){zoom=Math.min(2.4,Math.max(.8,value));$('zoom-value').textContent=Math.round(zoom*100)+'%';}
  $('zoom-in').onclick=()=>setZoom(zoom+.1);$('zoom-out').onclick=()=>setZoom(zoom-.1);
  // The scene uses integer-aligned shapes, entirely drawn locally without external assets.
  const canvas=$('office-canvas'),ctx=canvas.getContext('2d');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');let sectorActivity={},sectorGuideKey='';
  if(window.FirmaAccess.isAdmin){const guide=document.createElement('div');guide.className='sector-computer-guide';guide.id='sector-guide';guide.setAttribute('aria-live','polite');guide.innerHTML='<strong id="sector-guide-title">Computadores dentro das salas</strong><span id="sector-guide-state">Aproxime-se de um terminal e aperte E.</span><small id="sector-guide-metric"></small><div class="sector-meter"><i id="sector-guide-meter"></i></div>';document.querySelector('.office-scene').append(guide);}
  function resize(){const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;viewport.width=bounds.width;viewport.height=bounds.height;viewport.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(bounds.width*viewport.dpr);canvas.height=Math.round(bounds.height*viewport.dpr);}
  new ResizeObserver(resize).observe(canvas);resize();
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function text(s,x,y,color='#b7c1ab',size=10){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign='left';ctx.fillText(s,x,y);}
  const positions=new Map();
  const keys=new Set(),directions={w:[0,-1],arrowup:[0,-1],s:[0,1],arrowdown:[0,1],a:[-1,0],arrowleft:[-1,0],d:[1,0],arrowright:[1,0]};
  let route=[],pending=null,nearby=null,walking=false,facing='down',lastPlayer=state.player,hudKey='',touchDirection=null,seated='',lastAssembly=state.assembly.active;
  function safePlayer(){if(!W.walkable(state.player.x,state.player.y))Object.assign(state.player,W.spawn);}
  safePlayer();
  function syncMode(){state.player.immersive=true;document.body.classList.add('playing');$('player-name').textContent=state.player.name+' · '+roleLabel;hudKey='';}
  function clearMovement(){keys.clear();touchDirection=null;route=[];pending=null;walking=false;}
  window.addEventListener('firma-player-changed',()=>{safePlayer();syncMode();});
  window.addEventListener('blur',clearMovement);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearMovement();});
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||$('modal').open||$('studio')?.open||ui.view!=='office'||e.target.closest('input,textarea,select,[contenteditable]'))return;
    if(document.activeElement!==canvas&&!state.player.immersive)return;
    const key=e.key.toLowerCase();
    if(directions[key]){e.preventDefault();keys.add(key);route=[];pending=null;}
    if(key==='e'&&!e.repeat){e.preventDefault();interactNearby();}
    if(key==='escape'){clearMovement();$('route-status').textContent='Destino cancelado. Clique para andar.';}
  });
  document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('firma-studio-open',clearMovement);
  $('modal').addEventListener('close',()=>{keys.clear();touchDirection=null;if(state.player.immersive)canvas.focus({preventScroll:true});});
  new MutationObserver(()=>{if($('modal').open)clearMovement();}).observe($('modal'),{attributes:true,attributeFilter:['open']});
  for(const button of document.querySelectorAll('[data-move]')){
    button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keys.clear();route=[];pending=null;touchDirection={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[button.dataset.move];});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{touchDirection=null;});
    button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const [x,y]={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[button.dataset.move];stand();Object.assign(state.player,W.move(state.player,x*20,y*20));}});
  }
  $('world-destinations').replaceChildren(...W.stations.map(station=>{const button=document.createElement('button');button.type='button';button.dataset.destination=station.id;const icon=document.createElement('span');icon.textContent=station.icon;icon.setAttribute('aria-hidden','true');button.append(icon,document.createTextNode(station.name));button.onclick=()=>{openRemote(station);button.closest('details').open=false;};return button;}));
  function stand(){seated='';hudKey='';}
  function sit(kind){goTo(W.playerSeats[kind]);}
  function goTo(target){
    stand();
    const destination=target.agent?positions.get(target.agent):target;if(!destination)return;
    const end=target.agent?W.nearest(destination):{x:target.x,y:target.y};
    route=W.path(state.player,end);pending=target;
    if(!route.length){pending=null;ui.toast('Não há passagem até esse ponto. Escolha um ponto livre no chão.');return;}
    $('route-status').textContent='Indo para '+target.name+' · Esc cancela';canvas.focus({preventScroll:true});
  }
  function markVisited(target){if(!target.id||state.player.visited.includes(target.id))return;state.player.visited.push(target.id);ui.save();}
  function activate(target){if(!target)return;clearMovement();if(target.seat){seated=target.seat;facing='down';markVisited(target);ui.toast('Sentado. Use WASD ou clique no chão para levantar.');return;}markVisited(target);openRemote(target);}
  function openRemote(target,tab='code'){
    if(!target)return;clearMovement();if(target.seat){goTo(target);return;}
    if(target.agent){agentDetail(target.agent);return;}
    if(target===W.meetingStation){ui.interact({id:'leadership'});return;}
    if(window.FirmaAccess.isAdmin&&window.FirmaStudio&&(target.id==='admin'||window.FirmaActivity.roles.includes(target.id)))window.FirmaStudio.open(target.id,target.id==='leadership'?'chat':tab);
    else ui.interact(target);
  }
  function closestInteraction(){const p=state.player,candidates=[...Object.values(W.playerSeats),...W.stations,W.meetingStation].map(s=>({...s,distance:Math.hypot(p.x-s.x,p.y-s.y)}));for(const a of state.agents){const pos=positions.get(a.id);if(pos)candidates.push({agent:a.id,name:a.name,verb:'Conversar com '+a.name,distance:Math.hypot(p.x-pos.x,p.y-pos.y)});}return candidates.filter(s=>s.distance<=57).sort((a,b)=>a.distance-b.distance)[0]||null;}
  function interactNearby(){if(seated){stand();return;}activate(closestInteraction());}
  $('interact-button').onclick=interactNearby;
  function updatePlayer(dt){
    if(lastAssembly!==state.assembly.active){lastAssembly=state.assembly.active;if(!lastAssembly&&(seated==='meeting'||pending?.seat==='meeting')){clearMovement();stand();}}
    if(lastPlayer!==state.player){lastPlayer=state.player;safePlayer();clearMovement();syncMode();}
    walking=false;if($('modal').open||ui.view!=='office'||document.hidden)return;
    const p=state.player,before={x:p.x,y:p.y};let dx=touchDirection?.[0]||0,dy=touchDirection?.[1]||0;
    for(const key of keys){const direction=directions[key];if(direction){dx+=direction[0];dy+=direction[1];}}
    if(dx||dy){stand();const length=Math.hypot(dx,dy);Object.assign(p,W.move(p,dx/length*175*dt,dy/length*175*dt));}
    else if(route.length){
      let budget=175*dt;
      while(route.length&&budget>.01){
        const next=route[0],length=Math.hypot(next.x-p.x,next.y-p.y);
        if(length<.1){route.shift();continue;}
        const amount=Math.min(length,budget),moved=W.move(p,(next.x-p.x)/length*amount,(next.y-p.y)/length*amount);
        if(Math.hypot(moved.x-p.x,moved.y-p.y)<Math.min(.0001,amount*.1)){route=[];pending=null;$('route-status').textContent='Caminho interrompido. Escolha outro destino.';break;}
        Object.assign(p,moved);budget-=amount;if(amount>=length-.01)route.shift();
      }
      if(!route.length&&pending){const target=pending;pending=null;if(target.agent){const at=positions.get(target.agent);if(at&&Math.hypot(at.x-p.x,at.y-p.y)>65){goTo(target);return;}}activate(target);}
    }
    const mx=p.x-before.x,my=p.y-before.y;walking=Math.hypot(mx,my)>.05;if(walking)facing=Math.abs(mx)>Math.abs(my)?mx>0?'right':'left':my>0?'down':'up';
  }
  function updateHUD(){
    nearby=closestInteraction();const p=state.player,visited=W.stations.filter(s=>p.visited.includes(s.id)).length;
    const key=[p.name,visited,nearby?.name,ui.paused,seated,state.assembly.active,W.roomAt(p.x,p.y)?.id,state.tasks.filter(t=>t.status==='review').length].join('|');if(key===hudKey)return;hudKey=key;
    $('player-name').textContent=p.name+' · '+roleLabel;$('interact-button').disabled=!nearby&&!seated;$('interact-button').textContent=seated?'E · Levantar':nearby?'E · '+(window.FirmaAccess.isAdmin?nearby.verb:'Conhecer '+nearby.name):'Chegue perto de um objeto ou colega';
    $('exploration-progress').textContent=visited+' / '+W.stations.length+' computadores visitados';$('exploration-status').textContent=visited===W.stations.length?'Você conhece todos os computadores!':'Visite as salas e converse com Codex';
    $('player-location').textContent=state.assembly.active?'Reunião geral em andamento':W.roomAt(p.x,p.y)?.name||'Corredor central';
    if(!route.length)$('route-status').textContent=seated?'Sentado · E, WASD ou clique para levantar':nearby?'E · '+nearby.verb:'Clique para andar · E para interagir';
  }
  function drawStationMarkers(){
    for(const s of W.stations){
      const room=W.roomForStation(s.id),selected=nearby?.id===s.id||pending?.id===s.id,x=s.marker.x,y=s.marker.y;
      const count=state.tasks.filter(t=>t.status==='review'&&(s.id==='leadership'||window.FirmaEngine.taskDepartment(t)===s.id)).length;
      rect(x-13,y-17,27,25,selected?room.color:'#5c4434');ctx.strokeStyle=room.color;ctx.lineWidth=1;ctx.strokeRect(x-13,y-17,27,25);text(s.icon,x-8,y+1,selected?'#203323':room.color,16);
      if(count){rect(x+7,y-25,18,14,'#e8c987');text(String(count),x+11,y-14,'#45381e',9);}
      if(selected){ctx.font='10px monospace';const label=s.id==='leadership'?'CODEX · LÍDER':s.name.toUpperCase(),width=ctx.measureText(label).width;rect(x-width/2-7,y-39,width+14,16,'#efce96');text(label,x-width/2,y-27,room.color,10);}
    }
    if(route.length){ctx.save();ctx.globalAlpha=.55;ctx.setLineDash([3,8]);ctx.strokeStyle='#70d7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(state.player.x,state.player.y+12);for(const p of route)ctx.lineTo(p.x,p.y+12);ctx.stroke();ctx.restore();const end=route[route.length-1];ctx.strokeStyle='#ddf8bd';ctx.beginPath();ctx.ellipse(end.x,end.y+12,11,5,0,0,Math.PI*2);ctx.stroke();}
  }
  function drawPlayer(time){const p=state.player;ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));window.FirmaVillage.sprite(ctx,{name:p.name,shirt:p.color,skin:p.skin,hair:p.hair,walking,time,sitting:!!seated,facing,player:true});ctx.restore();}
  syncMode();
  function targetFor(a){if(state.assembly.active)return W.meetingSeat(state.agents.findIndex(agent=>agent.id===a.id));const department=window.FirmaEngine.departmentOf(a),members=state.agents.filter(agent=>window.FirmaEngine.departmentOf(agent)===department);return W.agentSeat({...a,department},members.findIndex(agent=>agent.id===a.id));}
  function character(x,y,a,time,walking=false,sitting=false){const phase=Array.from(a.id).reduce((sum,c)=>sum+c.charCodeAt(0),0);window.FirmaVillage.sprite(ctx,{name:a.id==='codex-leader'?'Codex':a.name,shirt:a.color,skin:'#dfba92',hair:['#534033','#775340','#9b633e','#403037'][phase%4],phase,walking,time,sitting,facing:'down'});}
  const leader={id:'codex-leader',name:'Codex',role:'Líder da Firma',color:'#ffd15c',rest:false,meetingUntil:0};
  function sectorEffects(time){
    for(const room of W.rooms){const activity=sectorActivity[room.id];if(!activity)continue;const barWidth=room.w-18;rect(room.x+9,room.y+room.h-4,barWidth,2,'#a27f57');rect(room.x+9,room.y+room.h-4,barWidth*activity.percent/100,2,room.color);}
    const guide=$('sector-guide');if(!guide)return;const role=window.FirmaStudio?.isOpen?(window.FirmaStudio.room==='admin'?'development':window.FirmaStudio.role):W.roomAt(state.player.x,state.player.y)?.id,activity=sectorActivity[role];
    const ready=state.tasks.filter(t=>['review','done'].includes(t.status)).length,total=state.tasks.length,percent=total?Math.round(ready/total*100):0;
    const values=activity?[window.FirmaStudio?.isOpen&&window.FirmaStudio.room==='admin'?'Administrador':W.rooms.find(r=>r.id===role).name,activity.label,activity.metric,activity.percent,activity.active]:['Computadores dentro das salas','Clique no computador ou aproxime-se e aperte E.',ready+'/'+total+' entregas prontas · '+percent+'%',percent,false];
    const key=JSON.stringify(values);if(key!==sectorGuideKey){sectorGuideKey=key;$('sector-guide-title').textContent=values[0];$('sector-guide-state').textContent=values[1];$('sector-guide-state').dataset.live=String(values[4]);$('sector-guide-metric').textContent=values[2];$('sector-guide-meter').style.width=values[3]+'%';}
  }
  function workGesture(a,time,moving){
    const role=a.id==='codex-leader'?'leadership':window.FirmaEngine.departmentOf(a),activity=sectorActivity[role];
    if(!activity?.active||moving||a.rest||state.assembly.active)return;
    const assigned=a.id==='codex-leader'||state.tasks.some(t=>t.agent===a.id&&t.status==='working'&&(t.execution?.kind!=='real'||t.execution.status==='running'))||window.FirmaStudio?.live.chatRunning?.role===role;
    if(!assigned)return;const step=reducedMotion.matches?0:Math.floor(time*4)%2;
    rect(-13,-10+step*2,5,8,'#efc4a4');rect(11,-8-step*2,5,8,'#efc4a4');rect(-12,-58,35,17,'#49382d');text(({planning:'PLANO',development:'{ }',testing:'TESTE',publishing:'POST',leadership:'FLUXO'})[role],-8,-46,'#eff6ff',8);
  }
  function drawOffice(){window.FirmaVillage.draw(ctx,W,state,animationTime);}
  function project(point){const bounds=canvas.getBoundingClientRect();return {x:bounds.left+viewport.width/2+(point.x-camera.x)*viewport.scale,y:bounds.top+viewport.height/2+(point.y-camera.y)*viewport.scale};}
  let lastFrame=0,animationTime=0;
  function draw(timestamp){
    const dt=lastFrame?Math.min((timestamp-lastFrame)/1000,.05):0;lastFrame=timestamp;if(!ui.paused)animationTime+=dt*state.speed;
    sectorActivity=window.FirmaActivity.all(state,window.FirmaStudio?.live||{},ui.paused);
    updatePlayer(dt);updateHUD();
    viewport.scale=(viewport.width<=540?Math.max(viewport.width/W.width,viewport.height/1000):Math.min(viewport.width/W.width,viewport.height/W.height))*zoom;
    const halfX=viewport.width/(2*viewport.scale),halfY=viewport.height/(2*viewport.scale);
    camera.x=halfX>=W.width/2?W.width/2:Math.max(halfX,Math.min(W.width-halfX,state.player.x));
    camera.y=halfY>=W.height/2?W.height/2:Math.max(halfY,Math.min(W.height-halfY,state.player.y));
    if(window.FirmaStudio?.isOpen){const room=W.roomForStation(window.FirmaStudio.room||window.FirmaStudio.role),screen=$('studio').getBoundingClientRect();if(viewport.width>900){const visible=Math.max(100,viewport.width-screen.width-28);viewport.scale=Math.max(viewport.scale,visible/(room.w+50));camera.x=room.x+room.w/2+(viewport.width/2-visible/2)/viewport.scale;camera.y=room.y+room.h/2+(room.id==='leadership'?0:viewport.height*.2/viewport.scale);}else{camera.x=room.x+room.w/2;camera.y=room.y+room.h/2+(viewport.height/2-48)/viewport.scale;}}
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.width,viewport.height);ctx.imageSmoothingEnabled=false;
    ctx.save();ctx.translate(viewport.width/2,viewport.height/2);ctx.scale(viewport.scale,viewport.scale);ctx.translate(-camera.x,-camera.y);
    drawOffice();sectorEffects(timestamp/1000);
    function advanceActor(a,target){
      const targetKey=target.x+','+target.y;let p=positions.get(a.id);
      if(!p){p={...(a.id==='codex-leader'?W.leaderHome:target),route:[],targetKey:''};positions.set(a.id,p);}
      if(targetKey!==p.targetKey){p.route=W.path(p,target);p.targetKey=targetKey;}
      const moving=!!p.route.length;
      if(moving){let budget=85*dt*state.speed;while(p.route.length&&budget>.01){const point=p.route[0],distance=Math.hypot(point.x-p.x,point.y-p.y);if(distance<.1){p.route.shift();continue;}const amount=Math.min(distance,budget);Object.assign(p,W.move(p,(point.x-p.x)/distance*amount,(point.y-p.y)/distance*amount));budget-=amount;if(amount>=distance-.01)p.route.shift();}}
      return {a,p,moving,sitting:!p.route.length&&(state.assembly.active||a.rest)&&Math.hypot(p.x-target.x,p.y-target.y)<1};
    }
    const renderAgents=state.agents.map(a=>advanceActor(a,targetFor(a)));
    renderAgents.push(advanceActor(leader,state.assembly.active?W.hostSeats.leader:W.leaderHome));renderAgents.sort((a,b)=>a.p.y-b.p.y);
    drawStationMarkers();let playerDrawn=false;
    for(const {a,p,moving,sitting} of renderAgents){if(!playerDrawn&&p.y>state.player.y){drawPlayer(timestamp/1000);playerDrawn=true;}ctx.save();ctx.translate(p.x,p.y);const scale=W.layoutScale*(a.id==='codex-leader'?1:state.assembly.active?.68:.85);ctx.scale(scale,scale);character(0,0,a,animationTime,moving,sitting);workGesture(a,timestamp/1000,moving);ctx.restore();}
    if(!playerDrawn)drawPlayer(timestamp/1000);ctx.restore();requestAnimationFrame(draw);
  }
  canvas.onclick=e=>{
    if($('modal').open)return;const bounds=canvas.getBoundingClientRect(),x=(e.clientX-bounds.left-viewport.width/2)/viewport.scale+camera.x,y=(e.clientY-bounds.top-viewport.height/2)/viewport.scale+camera.y;if(window.FirmaStudio?.isOpen)window.FirmaStudio.close();
    if(x<W.bounds.left||x>W.bounds.right||y<W.bounds.top||y>W.bounds.bottom)return;
    const playerSeat=W.stationAt(x,y);if(playerSeat?.seat){goTo(playerSeat);return;}
    const leaderAt=positions.get(leader.id)||W.leaderHome;if(Math.hypot(x-leaderAt.x,y-leaderAt.y+12)<30){openRemote(W.stations.find(s=>s.id==='leadership'),'chat');return;}
    let nearest=null,best=22;for(const a of state.agents){const p=positions.get(a.id);if(!p)continue;const distance=Math.hypot(p.x-x,p.y-12-y);if(distance<best){best=distance;nearest=a;}}
    const station=W.stationAt(x,y);
    if(station)openRemote(station);else if(nearest)openRemote({agent:nearest.id,name:nearest.name});else{stand();pending=null;route=W.path(state.player,{x,y});if(route.length){$('route-status').textContent='Caminhando · Esc cancela';canvas.focus({preventScroll:true});}}
  };
  window.FirmaGame={get player(){return state.player;},get moving(){return walking||route.length>0;},get destination(){return pending?.id||pending?.agent||null;},get seated(){return seated;},get leaderPosition(){const p=positions.get(leader.id);return p?{x:p.x,y:p.y,moving:!!p.route.length}:null;},get agentPositions(){return [...positions].filter(([id])=>id!==leader.id).map(([id,p])=>({id,x:p.x,y:p.y}));},sit,stand,goTo,project,interact:interactNearby};
  Object.defineProperty(window.FirmaGame,'sectorActivity',{get:()=>sectorActivity});
  window.FirmaGame.openStation=(id,tab='code')=>openRemote(typeof id==='string'?W.stations.find(s=>s.id===id):id,tab);
  setZoom(zoom);requestAnimationFrame(draw);
})();
