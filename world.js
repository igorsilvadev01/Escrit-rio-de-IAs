/* Compact village office. Furniture, doors, clicks and routes use the same geometry. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.FirmaEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.FirmaWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const width=720,height=480,bounds=E.officeLayout.bounds,spawn=E.officeLayout.spawn,step=8,radius=6,layoutScale=1;
  const floor=[{x:72,y:64,w:336,h:304},{x:408,y:144,w:190,h:144}];
  const rooms=[
    {id:'planning',name:'Planejar',number:'01',color:'#86ad68',x:80,y:70,w:160,h:132,door:{x:214,y:206}},
    {id:'development',name:'Desenvolver',number:'02',color:'#b39261',x:244,y:70,w:160,h:132,door:{x:270,y:206}},
    {id:'testing',name:'Testar',number:'03',color:'#d6a764',x:80,y:230,w:160,h:132,door:{x:214,y:226}},
    {id:'publishing',name:'Postar',number:'04',color:'#a68a92',x:244,y:230,w:160,h:132,door:{x:270,y:226}},
    {id:'leadership',name:'Você & Codex',number:'05',color:'#d6bb72',x:408,y:150,w:184,h:132,door:{x:404,y:216}}
  ];
  for(const room of rooms)room.seats=room.id==='leadership'?[]:Array.from({length:6},(_,i)=>({x:room.x+[28,84,136][i%3],y:room.y+(i<3?84:114)}));
  for(const r of rooms.filter(r=>r.seats.length))r.seats=Array.from({length:6},(_,i)=>({x:r.x+26+(i%3)*48,y:r.y+(i<3?70:116)}));
  const workDesks=rooms.filter(r=>r.seats.length).flatMap(r=>r.seats.map((p,i)=>({x:p.x-16,y:r.y+(i<3?36:82),w:32,h:18,room:r.id})));
  const chairs=rooms.flatMap(r=>r.seats.map(p=>({...p,room:r.id})));
  const boards=rooms.filter(r=>r.seats.length).map(r=>({x:r.x+134,y:r.y+5,w:20,h:23,id:r.id}));
  const furniture={leaderDesk:{x:422,y:188,w:62,h:25},adminDesk:{x:504,y:188,w:70,h:25}};
  const leaderHome={x:450,y:246};
  const playerSeats={
    admin:{id:'admin',name:'Sua cadeira ao lado do Codex',verb:'Sentar na sua mesa',x:535,y:246,seat:'admin',area:{x:524,y:235,w:22,h:22}},
    rest:{id:'rest',name:'Seu banco no café',verb:'Sentar no cantinho do café',x:562,y:368,seat:'rest',area:{x:552,y:358,w:20,h:20}}
  };
  const exit={x:40,y:216};
  const lounge={x:424,y:306,w:162,h:86,name:'Cantinho do café',color:'#b3bc7d',seats:[{x:450,y:350},{x:482,y:350},{x:514,y:350}],chat:[{x:450,y:378},{x:482,y:378}],coffee:{x:535,y:320,w:38,h:20}};
  const walls=[];
  const scenery={trees:[[38,45],[130,32],[215,28],[320,32],[430,28],[550,24],[650,46],[670,130],[666,230],[660,335],[610,425],[350,425],[245,431],[40,330]].map(([x,y])=>({x,y}))};
  const obstacles=[...walls,...workDesks,...boards,...Object.values(furniture),lounge.coffee,...scenery.trees.map(p=>({x:p.x-6,y:p.y,w:12,h:14})),{x:54,y:410,w:65,h:40},{x:156,y:410,w:38,h:40}];
  const stations=rooms.filter(r=>r.seats.length).map(room=>({id:room.id,name:room.name,verb:'Usar computador de '+room.name,icon:({planning:'◇',development:'⌘',testing:'✓',publishing:'↗'})[room.id],x:room.x+146,y:room.y+64,marker:{x:room.x+143,y:room.y+38},area:{...boards.find(b=>b.id===room.id)},panel:room.id}));
  stations.push(
    {id:'leadership',name:'Codex · espaço compartilhado',verb:'Conversar com Codex',icon:'★',...leaderHome,marker:{x:451,y:182},area:{x:418,y:175,w:70,h:46},panel:'leadership'},
    {id:'admin',name:'Sua mesa · junto ao Codex',verb:'Usar sua mesa',icon:'⌨',x:535,y:246,marker:{x:539,y:182},area:{x:500,y:175,w:78,h:46},panel:'admin'},
    {id:'rest',name:'Cantinho do café',verb:'Visitar o cantinho do café',icon:'☕',x:552,y:358,marker:{x:554,y:319},area:{...lounge.coffee},panel:'rest'}
  );
  function roomForStation(id){return id==='rest'?lounge:rooms.find(r=>r.id===(id==='admin'?'leadership':id));}
  function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
  function agentSeat(agent,index=0){const room=rooms.find(r=>r.id===agent.department&&r.seats.length)||rooms[0],seat=room.seats[index%room.seats.length];return walkable(seat.x,seat.y)?{...seat}:nearest(seat);}
  function walkable(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom&&!obstacles.some(o=>x>o.x-radius&&x<o.x+o.w+radius&&y>o.y-radius&&y<o.y+o.h+radius);}
  function nearest(point){let result=null,best=Infinity;for(let y=bounds.top;y<=bounds.bottom;y+=step)for(let x=bounds.left;x<=bounds.right;x+=step){if(!walkable(x,y))continue;const d=(point.x-x)**2+(point.y-y)**2;if(d<best){best=d;result={x,y};}}return result;}
  function clearSegment(a,b){const length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(1,Math.ceil(length/2));for(let i=0;i<=count;i++)if(!walkable(a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count))return false;return true;}
  function path(start,destination){
    if(!walkable(start.x,start.y)||!Number.isFinite(destination.x)||!Number.isFinite(destination.y))return [];
    if(walkable(destination.x,destination.y)&&clearSegment(start,destination))return [{x:destination.x,y:destination.y}];
    const a=nearest(start),b=nearest(destination),key=p=>p.x+','+p.y;
    if(!a||!b||!clearSegment(start,a))return [];
    const open=[a],cost=new Map([[key(a),0]]),came=new Map(),closed=new Set();
    while(open.length){
      open.sort((u,v)=>(cost.get(key(u))+Math.abs(u.x-b.x)+Math.abs(u.y-b.y))-(cost.get(key(v))+Math.abs(v.x-b.x)+Math.abs(v.y-b.y)));
      const current=open.shift(),id=key(current);if(closed.has(id))continue;
      if(id===key(b)){const route=[b];let next=id;while(came.has(next)){const previous=came.get(next);route.push(previous);next=key(previous);}route.reverse();if(walkable(destination.x,destination.y)&&clearSegment(b,destination))route.push({x:destination.x,y:destination.y});return route;}
      closed.add(id);
      for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const next={x:current.x+dx,y:current.y+dy},nextId=key(next),value=cost.get(id)+step;if(!walkable(next.x,next.y)||closed.has(nextId)||!clearSegment(current,next))continue;if(!cost.has(nextId)||value<cost.get(nextId)){cost.set(nextId,value);came.set(nextId,current);open.push(next);}}
    }return [];
  }
  function move(position,dx,dy){const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));let x=position.x,y=position.y;for(let i=0;i<count;i++){if(walkable(x+dx/count,y))x+=dx/count;if(walkable(x,y+dy/count))y+=dy/count;}return{x,y};}
  function stationAt(x,y){return [...Object.values(playerSeats),...stations].find(s=>x>=s.area.x&&x<=s.area.x+s.area.w&&y>=s.area.y&&y<=s.area.y+s.area.h);}
  return{width,height,bounds,spawn,floor,layoutScale,scenery,rooms,roomAt,roomForStation,workDesks,chairs,boards,furniture,walls,obstacles,stations,leaderHome,playerSeats,lounge,exit,agentSeat,walkable,nearest,clearSegment,path,move,stationAt};
});
