(() => {
  'use strict';
  const ui=window.FirmaUI,state=ui.state,W=window.FirmaWorld,$=id=>document.getElementById(id),agentDetail=ui.agentDetail,roleLabel=window.FirmaAccess.isAdmin?'Fundador':'Visitante';
  let zoom=matchMedia('(max-width:540px)').matches?1.7:1;
  const camera={x:500,y:330},viewport={width:1000,height:660,scale:1,dpr:1};
  function setZoom(value){zoom=Math.min(2.4,Math.max(.8,value));$('zoom-value').textContent=Math.round(zoom*100)+'%';}
  $('zoom-in').onclick=()=>setZoom(zoom+.1);$('zoom-out').onclick=()=>setZoom(zoom-.1);
  // The scene uses integer-aligned shapes, entirely drawn locally without external assets.
  const canvas=$('office-canvas'),ctx=canvas.getContext('2d');
  function resize(){const bounds=canvas.getBoundingClientRect();if(!bounds.width||!bounds.height)return;viewport.width=bounds.width;viewport.height=bounds.height;viewport.dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(bounds.width*viewport.dpr);canvas.height=Math.round(bounds.height*viewport.dpr);}
  new ResizeObserver(resize).observe(canvas);resize();
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function text(s,x,y,color='#b7c1ab',size=10){ctx.fillStyle=color;ctx.font=`${size}px monospace`;ctx.textAlign='left';ctx.fillText(s,x,y);}
  function plant(x,y,large=false){const s=large?1.4:1;ctx.save();ctx.translate(x,y);ctx.scale(s,s);rect(-11,0,23,17,'#272f25');rect(-9,2,19,15,'#b2936a');rect(-12,-3,25,6,'#c7ae80');rect(-3,-26,6,25,'#5b7441');rect(-16,-25,13,9,'#6d8650');rect(3,-32,13,11,'#87a15e');rect(-9,-39,11,14,'#91a66b');rect(-20,-19,13,9,'#8c9b5c');rect(4,-17,15,8,'#6b884c');ctx.restore();}
  function chair(x,y,color='#697b57'){rect(x-12,y+7,24,8,'#303c2e');rect(x-13,y-9,26,20,color);rect(x-10,y-6,20,12,'#7f9069');rect(x-2,y+16,4,8,'#3c4539');rect(x-12,y+23,24,3,'#3b4438');}
  function desk(x,y){rect(x+4,y+7,112,55,'#29312450');rect(x,y+8,108,46,'#816e4d');rect(x,y,108,44,'#c4aa79');rect(x+3,y+3,102,37,'#d1b886');line(x+5,y+36,x+103,y+36,'#b69c6f');rect(x+11,y+49,7,14,'#62583d');rect(x+91,y+49,7,14,'#62583d');rect(x+30,y-17,43,29,'#38423a');rect(x+33,y-14,37,22,'#759d90');rect(x+36,y-11,30,15,'#a3c5b1');rect(x+39,y-8,15,2,'#5c8d7e');rect(x+39,y-3,23,2,'#81ac97');rect(x+48,y+12,7,6,'#545c49');rect(x+42,y+17,20,3,'#636d54');rect(x+32,y+25,42,9,'#e0d6b0');for(let i=0;i<7;i++)rect(x+35+i*5,y+28,3,2,'#adad90');rect(x+83,y+20,10,12,'#f1e6bd');rect(x+93,y+23,3,6,'#d2c79f');rect(x+86,y+18,5,3,'#6a5940');rect(x+9,y+20,13,16,'#98a1a1');rect(x+11,y+22,9,12,'#c6d4c7');}
  function windowFrame(x,y,w){rect(x-4,y-4,w+8,66,'#47564a');rect(x,y,w,58,'#adc5b1');rect(x+4,y+4,w-8,50,'#91b7ab');rect(x+8,y+8,w-16,35,'#a3c6b6');rect(x+w/2-2,y,4,58,'#d2d3b5');rect(x,y+57,w,6,'#d7d6b9');rect(x-6,y+63,w+12,8,'#6d7e5c');line(x+9,y+49,x+28,y+14,'#b7d3bd',3);}
  function bookshelf(x,y){rect(x+4,y+7,104,76,'#34402f');rect(x,y,104,78,'#746648');rect(x+5,y+6,94,29,'#474d34');rect(x+5,y+42,94,29,'#484c35');const cols=['#9f9770','#8eaa90','#c1aa79','#b18f71','#a3af83','#799790'];for(let i=0;i<11;i++){rect(x+9+i*8,y+11+(i%3)*3,6,24-(i%3)*3,cols[i%6]);rect(x+10+i*8,y+14+(i%3)*3,4,2,'#d4cf9f');}for(let i=0;i<7;i++)rect(x+9+i*9,y+48,7,22,cols[(i+2)%6]);rect(x+77,y+52,17,16,'#bcb490');rect(x+80,y+57,11,3,'#787d59');}
  function wallLabel(label,x,y){rect(x-5,y-12,label.length*6.5+12,19,'#323e31aa');text(label,x,y,'#c2c9ad',10);}
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
  $('world-destinations').replaceChildren(...W.stations.map(station=>{const button=document.createElement('button');button.type='button';button.dataset.destination=station.id;const icon=document.createElement('span');icon.textContent=station.icon;icon.setAttribute('aria-hidden','true');button.append(icon,document.createTextNode(station.name));button.onclick=()=>{goTo(station);button.closest('details').open=false;};return button;}));
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
  function activate(target){if(!target)return;clearMovement();if(target.seat){seated=target.seat;facing='down';markVisited(target);ui.toast('Sentado. Use WASD ou clique no chão para levantar.');return;}if(target.agent)agentDetail(target.agent);else{markVisited(target);ui.interact(target);}}
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
    $('exploration-progress').textContent=visited+' / '+W.stations.length+' salas visitadas';$('exploration-status').textContent=visited===W.stations.length?'Você conhece as seis salas!':'Visite as salas e converse com Codex';
    $('player-location').textContent=state.assembly.active?'Reunião geral em andamento':W.roomAt(p.x,p.y)?.name||'Corredor central';
    if(!route.length)$('route-status').textContent=seated?'Sentado · E, WASD ou clique para levantar':nearby?'E · '+nearby.verb:'Clique para andar · E para interagir';
  }
  function drawStationMarkers(){
    for(const s of W.stations){
      const room=W.rooms.find(r=>r.id===s.id),selected=nearby?.id===s.id||pending?.id===s.id,x=s.marker.x,y=s.marker.y;
      const count=state.tasks.filter(t=>t.status==='review'&&(s.id==='leadership'||window.FirmaEngine.taskDepartment(t)===s.id)).length;
      rect(x-13,y-17,27,25,selected?room.color:'#1b2456f2');ctx.strokeStyle=room.color;ctx.lineWidth=1;ctx.strokeRect(x-13,y-17,27,25);text(s.icon,x-8,y+1,selected?'#203323':room.color,16);
      if(count){rect(x+7,y-25,18,14,'#e8c987');text(String(count),x+11,y-14,'#45381e',9);}
      if(selected){ctx.font='10px monospace';const label=s.id==='leadership'?'CODEX · LÍDER':s.name.toUpperCase(),width=ctx.measureText(label).width;rect(x-width/2-7,y-39,width+14,16,'#151e45e8');text(label,x-width/2,y-27,room.color,10);}
    }
    if(route.length){ctx.save();ctx.globalAlpha=.55;ctx.setLineDash([3,8]);ctx.strokeStyle='#70d7ff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(state.player.x,state.player.y+12);for(const p of route)ctx.lineTo(p.x,p.y+12);ctx.stroke();ctx.restore();const end=route[route.length-1];ctx.strokeStyle='#ddf8bd';ctx.beginPath();ctx.ellipse(end.x,end.y+12,11,5,0,0,Math.PI*2);ctx.stroke();}
  }
  function drawPlayer(time){const p=state.player;ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
    ctx.strokeStyle='#96e7ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,16,17,6,0,0,Math.PI*2);ctx.stroke();
    if(seated){ctx.translate(0,5);}const bounce=walking?Math.sin(time*15)*1.5:0,stride=walking?Math.round(Math.sin(time*15)*3):0;ctx.translate(0,Math.round(bounce));
    if(seated){rect(-11,1,23,6,'#344239');rect(-12,5,7,6,'#202d27');rect(6,5,7,6,'#202d27');}else{rect(-8,1+stride,6,14,'#344239');rect(3,1-stride,6,14,'#344239');rect(-10,13+stride,10,4,'#202d27');rect(2,13-stride,10,4,'#202d27');}
    rect(-11,-17,23,20,p.color);rect(-15,-13-stride,5,14,p.skin);rect(12,-13+stride,5,14,p.skin);rect(-8,-32,18,16,p.skin);rect(-10,-36,22,8,p.hair);rect(-10,-29,4,8,p.hair);rect(9,-29,3,7,p.hair);
    if(facing!=='up'){const offset=facing==='left'?-3:facing==='right'?3:0;rect(-4+offset,-25,2,2,'#302b28');rect(4+offset,-25,2,2,'#302b28');rect(offset,-19,4,1,'#8b5b45');}else rect(-8,-30,18,13,p.hair);
    const label=p.name+' · VOCÊ',width=label.length*6+14;rect(-width/2,26,width,17,'#70d7ff');text(label,-width/2+7,38,'#25371b',10);text('▼',-5,-45,'#d7f4ad',12);ctx.restore();
  }
  syncMode();
  function targetFor(a){if(state.assembly.active)return W.meetingSeat(state.agents.findIndex(agent=>agent.id===a.id));if(a.rest)return W.restSeat(state.agents.findIndex(agent=>agent.id===a.id));const department=window.FirmaEngine.departmentOf(a),members=state.agents.filter(agent=>window.FirmaEngine.departmentOf(agent)===department);return W.agentSeat({...a,department},members.findIndex(agent=>agent.id===a.id));}
  function character(x,y,a,time,walking=false,sitting=false){const phase=Array.from(a.id).reduce((sum,c)=>sum+c.charCodeAt(0),0);ctx.save();ctx.translate(Math.round(x),Math.round(y));const bounce=walking?Math.round(Math.sin(time*9)*2):Math.round(Math.sin(time*2+phase)*.6);ctx.translate(0,bounce+(sitting?5:0));rect(-10,11,23,5,'#2b342b55');if(sitting){rect(-10,1,21,6,'#354337');rect(-11,5,7,6,'#27312b');rect(5,5,7,6,'#27312b');}else{rect(-7,1,6,13,'#354337');rect(3,1,6,13,'#354337');rect(-9,12,9,4,'#27312b');rect(2,12,10,4,'#27312b');}rect(-10,-16,21,19,a.color);rect(-14,-12,5,13,'#c5a17a');rect(10,-12,5,13,'#c5a17a');rect(-7,-31,16,16,'#d5b58a');rect(-9,-34,20,9,'#4f493a');rect(-9,-28,5,10,'#4f493a');rect(7,-28,4,8,'#4f493a');if(phase%3===1){rect(-6,-25,6,4,'#353e34');rect(2,-25,6,4,'#353e34');rect(0,-24,2,1,'#353e34');}else{rect(-3,-24,2,2,'#3b4333');rect(4,-24,2,2,'#3b4333');}rect(-1,-19,4,1,'#9f7956');if(!state.assembly.active&&!walking&&!a.rest&&Math.sin(time*1.3+phase)>.6){rect(14,-48,28,18,'#e1e5cf');rect(14,-31,5,4,'#e1e5cf');text('···',18,-36,'#536345',12);}const displayName=state.assembly.active&&state.agents.length>12&&a.id!=='codex-leader'?a.name.slice(0,5):a.name;const nameWidth=displayName.length*6+14;rect(-nameWidth/2,23,nameWidth,17,'#182342ed');text(displayName,-nameWidth/2+7,35,'#d7dec7',10);const status=ui.status(a);text(a.id==='codex-leader'?'LÍDER · SIMULADO':status.key==='review'?'REVISAR':status.key==='blocked'?'AGUARDA':status.key==='meeting'?'':status.key==='idle'?'LIVRE':'',-nameWidth/2+4,49,status.key==='review'?'#f1cb82':'#bfcba8',8);rect(-nameWidth/2-1,27,3,8,a.rest?'#d1b579':'#57d8ff');ctx.restore();}
  const leader={id:'codex-leader',name:'Codex',role:'Líder da Firma',color:'#ffd15c',rest:false,meetingUntil:0};
  function workstation(x,y,accent){
    rect(x+3,y+8,84,42,'#18271d55');rect(x,y+4,84,39,'#8f7958');rect(x,y,84,34,'#c8b286');rect(x+3,y+3,78,27,'#d3be97');
    rect(x+25,y-16,34,25,'#34493c');rect(x+28,y-13,28,18,accent);rect(x+32,y-9,18,2,'#eff4da99');rect(x+32,y-4,12,2,'#213f3b77');rect(x+39,y+9,5,6,'#6b785b');rect(x+33,y+15,18,3,'#6b785b');rect(x+25,y+21,37,7,'#e5dfc6');rect(x+69,y+14,7,10,'#f0e3c3');
  }
  function terminal(station){
    const room=W.rooms.find(r=>r.id===station.id);if(['leadership','rest'].includes(station.id))return;
    const x=station.x-22,y=station.y-39;rect(x,y+5,46,19,'#786d54');rect(x,y,46,14,'#b5ac86');rect(x+8,y-15,30,22,'#2a4439');rect(x+11,y-12,24,15,room.color);rect(x+15,y-8,15,2,'#344c3b');rect(x+17,y+9,12,3,'#d5d8b6');
  }
  function drawOffice(){
    rect(24,50,1152,880,'#151e45');rect(29,56,1142,868,'#829ce6');rect(36,64,1128,854,'#334d91');
    rect(36,610,1128,68,'#5475c2');text('PAUSAS E CONVIVÊNCIA  ↓',414,653,'#edf2ff',10);
    // A clear central corridor ties the production rooms to the leader.
    rect(36,286,682,92,'#5475c2');rect(660,64,48,554,'#5475c2');
    for(let y=292;y<375;y+=14)for(let x=44;x<700;x+=26)rect(x,y,24,12,'#ffffff06');
    for(const room of W.rooms){
      const colors={planning:['#c5a4f6','#d3b7ff'],development:['#80baf4','#97ccff'],testing:['#f6b684','#ffc99a'],publishing:['#cf91e9','#dfadf4'],leadership:['#a9a0f0','#bfb6ff'],rest:['#f2cb9b','#ffdeb7']}[room.id];
      rect(room.x,room.y,room.w,room.h,colors[0]);
      for(let y=room.y+8;y<room.y+room.h-4;y+=18)for(let x=room.x+5;x<room.x+room.w-16;x+=38)rect(x,y,35,16,colors[(Math.floor(y/18)+Math.floor(x/38))%2]);
      rect(room.x,room.y,room.w,37,'#202d60');rect(room.x+9,room.y+9,24,19,room.color);text(room.number,room.x+13,room.y+23,'#243a2d',11);text(room.name.toUpperCase(),room.x+43,room.y+24,'#e7eddc',13);
      if(window.FirmaEngine.departments[room.id]){
        const members=state.agents.filter(a=>a.department===room.id),tasks=state.tasks.filter(t=>window.FirmaEngine.taskDepartment(t)===room.id);
        const active=tasks.filter(t=>t.status==='working').length,waiting=tasks.filter(t=>t.status==='review').length;
        text(active+'/'+members.length+' PRODUZINDO'+(waiting?' · '+waiting+' REVISAR':''),room.x+43,room.y+34,'#d1dfff',7);
      }
    }
    // Solid geometry and visible walls share the same source of truth.
    for(const obstacle of W.obstacles.filter(o=>o.w<=12||o.h===8)){rect(obstacle.x,obstacle.y,obstacle.w,obstacle.h,'#283c77');rect(obstacle.x+2,obstacle.y+1,Math.max(2,obstacle.w-4),Math.max(2,obstacle.h-2),'#95b4ff88');}
    for(const [x,y,room] of [[66,130,'planning'],[190,130,'planning'],[384,130,'development'],[510,130,'development'],[66,430,'testing'],[190,430,'testing'],[384,430,'publishing'],[510,430,'publishing']])workstation(x,y,W.rooms.find(r=>r.id===room).color);
    for(const room of W.rooms.filter(r=>window.FirmaEngine.departments[r.id])){const lower=room.y>300;rect(room.door.x-25,lower?370:286,50,8,'#d5c29c');text(lower?'↑':'↓',room.door.x-4,lower?397:276,'#32503b',12);}
    // Planning has an idea wall, development a code display, testing a checklist, publishing a content board.
    const boards=[{x:262,y:134,id:'planning'},{x:586,y:134,id:'development'},{x:262,y:433,id:'testing'},{x:586,y:433,id:'publishing'}];
    for(const board of boards){const color=W.rooms.find(r=>r.id===board.id).color;rect(board.x,board.y,48,48,'#405446');rect(board.x+3,board.y+3,42,42,'#e4e2cc');for(let i=0;i<3;i++){rect(board.x+8,board.y+9+i*11,6,6,color);rect(board.x+18,board.y+10+i*11,22-i*4,2,'#6b8170');}}
    for(const s of W.stations)terminal(s);
    // Meeting area belongs to the leader suite; physical furniture matches world.js.
    workstation(790,140,'#ffc857');
    rect(734,350,412,252,'#4338a0');rect(738,354,404,244,'#6256c9');
    text('SALA DE REUNIÃO',747,370,'#ffffff',12);
    text(state.assembly.active?'EQUIPE CONVOCADA':'CLIQUE NA MESA PARA REUNIR',747,381,'#e4e3ff',7);
    for(let i=0;i<state.agents.length;i++){const p=W.meetingSeat(i);rect(p.x-9,p.y-10,18,20,'#242852');rect(p.x-7,p.y-8,14,14,'#a39cff');}
    for(const [id,p] of Object.entries(W.hostSeats)){rect(p.x-14,p.y-12,28,26,'#342c68');rect(p.x-11,p.y-9,22,19,id==='player'?'#72d4ff':'#ffd15c');text(id==='player'?'VOCÊ':'CODEX',p.x-15,p.y+32,'#fff',8);}
    rect(850,434,180,33,'#242852');rect(850,430,180,30,'#ffcb79');rect(854,433,172,23,'#ffe1a8');
    text('CODEX · VOCÊ · EQUIPE',862,449,'#513b55',10);
    rect(890,407,100,13,state.assembly.active?'#ffcf5c':'#283463');text(state.assembly.active?'REUNIÃO ATIVA':'ESPAÇO COLABORATIVO',896,416,state.assembly.active?'#26213f':'#e8edff',7);
    plant(1120,150,true);bookshelf(1000,180);plant(61,263);plant(631,596);
    // Lounge: four sofa groups, shared coffee counter and a reserved armchair.
    for(let group=0;group<4;group++){const base=[100,350,650,950][group];rect(base-25,746,150,148,'#e4af78');text(['CONVERSA','LEITURA','CAFÉ','SOSSEGO'][group],base-16,739,'#63435e',10);for(let i=0;i<6;i++){const p=W.restSeat(group*6+i);rect(p.x-17,p.y-12,34,24,'#9b4a77');rect(p.x-14,p.y-9,28,18,'#e88fb0');rect(p.x-20,p.y-5,5,19,'#be658f');rect(p.x+16,p.y-5,5,19,'#be658f');}rect(base+20,810,60,16,'#9e7153');rect(base+23,812,54,9,'#ffe0aa');}
    rect(500,720,200,25,'#99684e');rect(504,722,192,17,'#ffe5bb');rect(575,705,29,24,'#25375c');rect(579,709,21,9,'#72d4ff');text('CAFÉ · ÁGUA',620,737,'#513951',8);
    rect(530,845,40,32,'#246080');rect(534,849,32,23,'#72d4ff');text('SEU CANTO',520,897,'#503f67',8);
    plant(77,895);plant(1127,895);rect(470,670,50,8,'#ffe0aa');

    rect(708,300,10,60,'#c9ba8b');text('→',678,337,'#dce9cb',17);
    text('PLANEJAR  →  DESENVOLVER  →  TESTAR  →  POSTAR',124,336,'#ffffff',10);
    text('REVISÃO HUMANA ENTRE AS ETAPAS',183,354,'#d8e5ff',8);
  }
  function project(point){const bounds=canvas.getBoundingClientRect();return {x:bounds.left+viewport.width/2+(point.x-camera.x)*viewport.scale,y:bounds.top+viewport.height/2+(point.y-camera.y)*viewport.scale};}
  let lastFrame=0,animationTime=0;
  function draw(timestamp){
    const dt=lastFrame?Math.min((timestamp-lastFrame)/1000,.05):0;lastFrame=timestamp;if(!ui.paused)animationTime+=dt*state.speed;
    updatePlayer(dt);updateHUD();
    viewport.scale=(viewport.width<=540?Math.max(viewport.width/W.width,viewport.height/1000):Math.min(viewport.width/W.width,viewport.height/W.height))*zoom;
    const halfX=viewport.width/(2*viewport.scale),halfY=viewport.height/(2*viewport.scale);
    camera.x=halfX>=W.width/2?W.width/2:Math.max(halfX,Math.min(W.width-halfX,state.player.x));
    camera.y=halfY>=W.height/2?W.height/2:Math.max(halfY,Math.min(W.height-halfY,state.player.y));
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.width,viewport.height);ctx.imageSmoothingEnabled=false;
    ctx.save();ctx.translate(viewport.width/2,viewport.height/2);ctx.scale(viewport.scale,viewport.scale);ctx.translate(-camera.x,-camera.y);
    drawOffice();
    function advanceActor(a,target){
      const targetKey=target.x+','+target.y;let p=positions.get(a.id);
      if(!p){p={...(a.id==='codex-leader'?{x:835,y:212}:target),route:[],targetKey:''};positions.set(a.id,p);}
      if(targetKey!==p.targetKey){p.route=W.path(p,target);p.targetKey=targetKey;}
      const moving=!!p.route.length;
      if(moving){let budget=85*dt*state.speed;while(p.route.length&&budget>.01){const point=p.route[0],distance=Math.hypot(point.x-p.x,point.y-p.y);if(distance<.1){p.route.shift();continue;}const amount=Math.min(distance,budget);Object.assign(p,W.move(p,(point.x-p.x)/distance*amount,(point.y-p.y)/distance*amount));budget-=amount;if(amount>=distance-.01)p.route.shift();}}
      return {a,p,moving,sitting:!p.route.length&&(state.assembly.active||a.rest)&&Math.hypot(p.x-target.x,p.y-target.y)<1};
    }
    const renderAgents=state.agents.map(a=>advanceActor(a,targetFor(a)));
    renderAgents.push(advanceActor(leader,state.assembly.active?W.hostSeats.leader:{x:835,y:212}));renderAgents.sort((a,b)=>a.p.y-b.p.y);
    drawStationMarkers();let playerDrawn=false;
    for(const {a,p,moving,sitting} of renderAgents){if(!playerDrawn&&p.y>state.player.y){drawPlayer(timestamp/1000);playerDrawn=true;}ctx.save();ctx.translate(p.x,p.y);const scale=a.id==='codex-leader'?1:state.assembly.active?.68:.85;ctx.scale(scale,scale);character(0,0,a,animationTime,moving,sitting);ctx.restore();}
    if(!playerDrawn)drawPlayer(timestamp/1000);ctx.restore();requestAnimationFrame(draw);
  }
  canvas.onclick=e=>{
    if($('modal').open)return;const bounds=canvas.getBoundingClientRect(),x=(e.clientX-bounds.left-viewport.width/2)/viewport.scale+camera.x,y=(e.clientY-bounds.top-viewport.height/2)/viewport.scale+camera.y;
    if(x<W.bounds.left||x>W.bounds.right||y<W.bounds.top||y>W.bounds.bottom)return;
    const playerSeat=W.stationAt(x,y);if(playerSeat?.seat){goTo(playerSeat);return;}
    const leaderAt=positions.get(leader.id)||{x:835,y:212};if(Math.hypot(x-leaderAt.x,y-leaderAt.y+12)<30){goTo(W.stations.find(s=>s.id==='leadership'));return;}
    let nearest=null,best=22;for(const a of state.agents){const p=positions.get(a.id);if(!p)continue;const distance=Math.hypot(p.x-x,p.y-12-y);if(distance<best){best=distance;nearest=a;}}
    const station=W.stationAt(x,y);
    if(nearest)goTo({agent:nearest.id,name:nearest.name});else if(station)goTo(station);else{stand();pending=null;route=W.path(state.player,{x,y});if(route.length){$('route-status').textContent='Caminhando · Esc cancela';canvas.focus({preventScroll:true});}}
  };
  window.FirmaGame={get player(){return state.player;},get moving(){return walking||route.length>0;},get destination(){return pending?.id||pending?.agent||null;},get seated(){return seated;},get leaderPosition(){const p=positions.get(leader.id);return p?{x:p.x,y:p.y,moving:!!p.route.length}:null;},get agentPositions(){return [...positions].filter(([id])=>id!==leader.id).map(([id,p])=>({id,x:p.x,y:p.y}));},sit,stand,goTo,project,interact:interactNearby};
  setZoom(zoom);requestAnimationFrame(draw);
})();
