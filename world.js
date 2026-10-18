/* Compact village office. Furniture, doors, clicks and routes use the same geometry. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.FirmaEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.FirmaWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  const width=800,height=480,bounds=E.officeLayout.bounds,spawn=E.officeLayout.spawn,step=8,radius=6,layoutScale=1;
  const rooms=[
    {id:'planning',name:'Planejar',number:'01',color:'#86ad68',x:80,y:70,w:160,h:132,door:{x:214,y:206}},
    {id:'development',name:'Desenvolver',number:'02',color:'#6f9cb0',x:244,y:70,w:160,h:132,door:{x:270,y:206}},
    {id:'testing',name:'Testar',number:'03',color:'#d6a764',x:80,y:230,w:160,h:132,door:{x:214,y:226}},
    {id:'publishing',name:'Postar',number:'04',color:'#b0879b',x:244,y:230,w:160,h:132,door:{x:270,y:226}},
    {id:'leadership',name:'Você & Codex',number:'05',color:'#d6bb72',x:408,y:70,w:280,h:292,door:{x:404,y:216}}
  ];
  for(const room of rooms)room.seats=room.id==='leadership'?[]:Array.from({length:6},(_,i)=>({x:room.x+[28,84,136][i%3],y:room.y+(i<3?84:114)}));
  const workDesks=rooms.filter(r=>r.seats.length).flatMap(r=>[14,82].map(offset=>({x:r.x+offset,y:r.y+38,w:50,h:25,room:r.id})));
  const boards=rooms.filter(r=>r.seats.length).map(r=>({x:r.x+132,y:r.y+35,w:22,h:28,id:r.id}));
  const furniture={leaderDesk:{x:432,y:114,w:70,h:28},adminDesk:{x:560,y:114,w:84,h:28},leaderShelf:{x:658,y:105,w:20,h:38},meetingTable:{x:490,y:282,w:124,h:18}};
  const leaderHome={x:468,y:174},meetingArea={x:420,y:206,w:252,h:148};
  const meetingSeats=Array.from({length:24},(_,i)=>({x:432+(i%6)*44,y:[234,258,318,342][Math.floor(i/6)]}));
  const hostSeats={player:{x:452,y:291},leader:{x:650,y:291}};
  const playerSeats={
    meeting:{id:'leadership',name:'Sua cadeira de reunião',verb:'Sentar na reunião',...hostSeats.player,seat:'meeting',area:{x:441,y:280,w:22,h:22}},
    admin:{id:'admin',name:'Sua cadeira ao lado do Codex',verb:'Sentar na sua mesa',x:610,y:174,seat:'admin',area:{x:599,y:163,w:22,h:22}}
  };
  const walls=[
    {x:76,y:66,w:616,h:5},{x:76,y:362,w:616,h:5},
    {x:76,y:66,w:5,h:136},{x:76,y:230,w:5,h:137},
    ...[240,404].flatMap(x=>[{x,y:66,w:4,h:136},{x,y:230,w:4,h:137}]),
    {x:688,y:66,w:5,h:301},
    ...[202,226].flatMap(y=>[{x:76,y,w:118,h:4},{x:234,y,w:16,h:4},{x:290,y,w:118,h:4}])
  ];
  const scenery={trees:[[38,45],[130,32],[215,28],[320,32],[430,28],[550,24],[720,46],[750,130],[746,230],[740,335],[690,425],[350,425],[245,431],[40,330]].map(([x,y])=>({x,y}))};
  const obstacles=[...walls,...workDesks,...boards,...Object.values(furniture),...scenery.trees.map(p=>({x:p.x-6,y:p.y,w:12,h:14})),{x:54,y:410,w:65,h:40},{x:156,y:410,w:38,h:40}];
  const stations=rooms.filter(r=>r.seats.length).map(room=>({id:room.id,name:room.name,verb:'Usar computador de '+room.name,icon:({planning:'◇',development:'⌘',testing:'✓',publishing:'↗'})[room.id],x:room.door.x,y:room.y+(room.y>200?24:110),marker:{x:room.x+143,y:room.y+38},area:{...boards.find(b=>b.id===room.id)},panel:room.id}));
  stations.push(
    {id:'leadership',name:'Codex · sala compartilhada',verb:'Conversar com Codex',icon:'★',...leaderHome,marker:{x:466,y:110},area:{x:428,y:101,w:78,h:46},panel:'leadership'},
    {id:'admin',name:'Sua mesa · junto ao Codex',verb:'Usar sua mesa',icon:'⌨',x:610,y:174,marker:{x:602,y:110},area:{x:556,y:101,w:92,h:46},panel:'admin'}
  );
  const meetingStation={id:'leadership',name:'Mesa de reunião',verb:'Gerenciar reunião',x:474,y:291,area:{...furniture.meetingTable}};
  function roomForStation(id){return rooms.find(r=>r.id===(id==='admin'?'leadership':id));}
  function meetingSeat(index){return {...meetingSeats[index%meetingSeats.length]};}
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
  function stationAt(x,y){return [...Object.values(playerSeats),meetingStation,...stations].find(s=>x>=s.area.x&&x<=s.area.x+s.area.w&&y>=s.area.y&&y<=s.area.y+s.area.h);}
  return{width,height,bounds,spawn,layoutScale,scenery,rooms,roomAt,roomForStation,workDesks,boards,furniture,walls,obstacles,stations,leaderHome,meetingArea,meetingSeats,meetingSeat,hostSeats,playerSeats,meetingStation,agentSeat,walkable,nearest,clearSegment,path,move,stationAt};
});
