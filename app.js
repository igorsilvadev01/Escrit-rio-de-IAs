(() => {
  'use strict';
  const ui=window.FirmaUI,state=ui.state,$=id=>document.getElementById(id),agentDetail=ui.agentDetail;
  let zoom=1;
  function setZoom(value){zoom=Math.min(1.6,Math.max(.8,value));$('zoom-value').textContent=Math.round(zoom*100)+'%';}
  $('zoom-in').onclick=()=>setZoom(zoom+.1);$('zoom-out').onclick=()=>setZoom(zoom-.1);
  // The scene uses integer-aligned shapes, entirely drawn locally without external assets.
  const canvas=$('office-canvas'),ctx=canvas.getContext('2d');
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
  function targetFor(a,i){
    const status=ui.status(a).key;
    if(status==='meeting'){const slots=[{x:95,y:275},{x:207,y:275},{x:95,y:350},{x:207,y:350}];return slots[i%4];}
    if(a.rest)return {x:715+(i%4)*47,y:498+Math.floor(i/4)*29};
    const slots=[{x:355,y:290},{x:535,y:290},{x:355,y:449},{x:535,y:449}];
    if(i<4)return slots[i];
    return {x:290+((i-4)%6)*61,y:537+Math.floor((i-4)/6)*27};
  }
  function character(x,y,a,time,walking=false){const phase=Array.from(a.id).reduce((sum,c)=>sum+c.charCodeAt(0),0);ctx.save();ctx.translate(Math.round(x),Math.round(y));const bounce=walking?Math.round(Math.sin(time*9)*2):Math.round(Math.sin(time*2+phase)*.6);ctx.translate(0,bounce);rect(-10,11,23,5,'#2b342b55');rect(-7,1,6,13,'#354337');rect(3,1,6,13,'#354337');rect(-9,12,9,4,'#27312b');rect(2,12,10,4,'#27312b');rect(-10,-16,21,19,a.color);rect(-14,-12,5,13,'#c5a17a');rect(10,-12,5,13,'#c5a17a');rect(-7,-31,16,16,'#d5b58a');rect(-9,-34,20,9,'#4f493a');rect(-9,-28,5,10,'#4f493a');rect(7,-28,4,8,'#4f493a');if(phase%3===1){rect(-6,-25,6,4,'#353e34');rect(2,-25,6,4,'#353e34');rect(0,-24,2,1,'#353e34');}else{rect(-3,-24,2,2,'#3b4333');rect(4,-24,2,2,'#3b4333');}rect(-1,-19,4,1,'#9f7956');if(!walking&&!a.rest&&Math.sin(time*1.3+phase)>.6){rect(14,-48,28,18,'#e1e5cf');rect(14,-31,5,4,'#e1e5cf');text('···',18,-36,'#536345',12);}const nameWidth=a.name.length*6+14;rect(-nameWidth/2,23,nameWidth,17,'#232d24e6');text(a.name,-nameWidth/2+7,35,'#d7dec7',10);const status=ui.status(a);text(status.key==='review'?'REVISAR':status.key==='blocked'?'AGUARDA':status.key==='meeting'?'REUNIAO':status.key==='idle'?'LIVRE':'',-nameWidth/2+4,49,status.key==='review'?'#f1cb82':'#bfcba8',8);rect(-nameWidth/2-1,27,3,8,a.rest?'#d1b579':'#b8d690');ctx.restore();}
  let lastFrame=0,animationTime=0;
  function draw(timestamp){const dt=lastFrame?Math.min((timestamp-lastFrame)/1000,.05):0;lastFrame=timestamp;if(!ui.paused)animationTime+=dt*state.speed;
    ctx.imageSmoothingEnabled=false;rect(0,0,1000,660,'#29322b');ctx.save();ctx.translate(500,330);ctx.scale(zoom,zoom);ctx.translate(-500,-330);
    // Drop shadow, outer walls and staggered oak floorboards.
    rect(44,93,921,524,'#1d281f');rect(35,82,920,524,'#3e4c38');rect(48,100,894,487,'#a38c62');
    for(let row=0;row<24;row++){const y=109+row*20;for(let col=-1;col<14;col++){const x=48+col*73+(row%2)*36;if(x<48||x+72>942)continue;rect(x,y,72,19,['#af976b','#b29b70','#a99166','#baa176'][(row*3+col*7)%4]);rect(x+9,y+7,34,1,'#8b79521f');rect(x+48,y+13,15,1,'#e0c39022');}}
    rect(48,82,894,74,'#718466');rect(48,149,894,9,'#596d4c');rect(48,158,894,6,'#384a35');rect(35,82,13,505,'#566749');rect(942,82,13,524,'#4c6145');rect(35,587,920,18,'#667451');rect(48,583,894,6,'#d2b98a');
    windowFrame(105,92,115);windowFrame(311,92,115);windowFrame(518,92,115);windowFrame(778,92,111);
    // Soft patches of daylight.
    ctx.globalAlpha=.12;ctx.fillStyle='#f9e6a5';ctx.beginPath();ctx.moveTo(115,166);ctx.lineTo(220,166);ctx.lineTo(303,324);ctx.lineTo(165,324);ctx.fill();ctx.beginPath();ctx.moveTo(520,166);ctx.lineTo(630,166);ctx.lineTo(707,325);ctx.lineTo(575,325);ctx.fill();ctx.globalAlpha=1;
    // Left meeting room.
    rect(59,183,189,222,'#8e9a74');rect(65,189,176,207,'#929f7b');for(let y=194;y<394;y+=11)line(69,y,237,y,'#a7b38a',1);rect(72,196,164,5,'#727e5d');wallLabel('SALA DE IDEIAS',91,220);
    chair(102,267);chair(201,267);chair(102,342);chair(201,342);rect(112,251,81,114,'#5b6244');rect(109,246,81,114,'#ceb787');rect(115,252,69,101,'#d8c194');line(116,301,183,301,'#bca776');rect(130,271,25,32,'#e6e0bd');rect(134,276,17,2,'#a6b194');rect(134,281,13,2,'#a6b194');rect(161,320,13,15,'#658b7e');rect(119,333,12,12,'#f0e1b4');
    rect(248,166,8,239,'#5a7058');rect(250,171,3,225,'#a3b8a188');rect(58,405,198,7,'#5a7058');for(let x=65;x<245;x+=47){rect(x,180,2,224,'#cad3b14f');rect(x,405,42,2,'#b0bf9b');}rect(181,405,57,7,'#c0a679');
    // Central work zone.
    wallLabel('FAZENDO ACONTECER',365,193);desk(301,238);desk(480,238);desk(301,396);desk(480,396);chair(355,292);chair(535,292);chair(355,450);chair(535,450);
    plant(278,191);plant(644,192);plant(282,509,true);plant(637,510,true);
    // Whiteboard and product shelf.
    rect(688,172,224,9,'#556348');rect(704,188,164,91,'#59694f');rect(709,191,154,79,'#e0dec0');rect(717,201,52,3,'#79937a');rect(717,211,76,2,'#b4bba0');rect(721,226,23,20,'#d9bd7c');rect(754,226,23,20,'#a5bd9c');rect(787,226,23,20,'#c5a5a0');rect(821,226,23,20,'#b4bcc1');rect(715,268,140,5,'#b2b59a');rect(808,267,14,3,'#647f6f');
    bookshelf(718,310);plant(882,344,true);wallLabel('BOAS IDEIAS COMEÇAM AQUI',701,383);
    // Kitchen corner.
    rect(64,459,154,89,'#72654a');rect(64,450,154,20,'#d5c49b');rect(70,473,66,68,'#a99b73');rect(141,473,70,68,'#a99b73');rect(126,485,3,13,'#5f6850');rect(148,485,3,13,'#5f6850');rect(78,417,38,36,'#424c3e');rect(83,422,28,15,'#83927b');rect(87,440,19,5,'#242e25');rect(89,445,14,8,'#e1d3af');rect(127,439,16,15,'#d5dfc0');rect(157,439,12,14,'#d3dfc6');rect(181,435,23,17,'#707f59');plant(193,438);wallLabel('CAFÉ & CONEXÕES',80,571);
    // Lounge rug, sofa, coffee table.
    rect(683,422,234,139,'#7d8661');rect(691,430,218,123,'#89916c');for(let y=434;y<549;y+=8)line(696,y,903,y,'#9ba17a');rect(705,438,166,47,'#455b48');rect(706,432,164,46,'#617b60');rect(711,439,48,35,'#829474');rect(764,439,48,35,'#859774');rect(817,439,46,35,'#819570');rect(699,430,15,50,'#6c8366');rect(864,430,14,50,'#6c8366');rect(722,475,5,10,'#444d35');rect(852,475,5,10,'#444d35');rect(765,510,80,34,'#61694b');rect(760,505,80,31,'#c0ab7c');rect(770,510,26,17,'#dcd5ac');rect(807,512,10,11,'#e8ddbd');rect(809,511,6,3,'#695d41');plant(911,446);wallLabel('RECARREGANDO AS IDEIAS',716,578);
    // Small personal touches.
    rect(74,174,30,32,'#b7a77a');rect(79,179,20,22,'#d5d2ad');rect(84,188,10,9,'#85956e');rect(88,182,5,9,'#a6ad80');rect(265,544,380,3,'#8b795a44');
    const renderAgents=state.agents.map((a,i)=>{const target=targetFor(a,i);let p=positions.get(a.id);if(!p){p={x:target.x,y:target.y};positions.set(a.id,p);}const moving=!ui.paused&&Math.sin(animationTime*.08+i*1.8)>.88;const tx=target.x+(moving?Math.sin(animationTime*.25+i)*38:0),ty=target.y+(moving?25:0);if(!ui.paused){const factor=Math.min(1,dt*state.speed*2);p.x+=(tx-p.x)*factor;p.y+=(ty-p.y)*factor;}return{a,p,moving};}).sort((a,b)=>a.p.y-b.p.y);
    for(const {a,p,moving} of renderAgents)character(p.x,p.y,a,animationTime,moving);ctx.restore();requestAnimationFrame(draw);
  }
  canvas.onclick=e=>{const bounds=canvas.getBoundingClientRect(),x=((e.clientX-bounds.left)*1000/bounds.width-500)/zoom+500,y=((e.clientY-bounds.top)*660/bounds.height-330)/zoom+330;let nearest=null,best=40;for(const a of state.agents){const p=positions.get(a.id);if(!p)continue;const d=Math.hypot(p.x-x,p.y-10-y);if(d<best){best=d;nearest=a;}}if(nearest)agentDetail(nearest.id);else if(x>=55&&x<=255&&y>=180&&y<=410)ui.meeting();else if(x>=700&&x<=890&&y>=185&&y<=280)ui.changeView('tasks');else if(x>=60&&x<=220&&y>=415&&y<=550)ui.changeView('team');};
  requestAnimationFrame(draw);
})();
