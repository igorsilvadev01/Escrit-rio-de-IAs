/* Walkable office geometry and A* routes. Shared by the canvas and Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FirmaWorld=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const width=1200,height=960,bounds={left:43,right:1157,top:76,bottom:910};
  const spawn={x:495,y:330},step=10,radius=9;
  const rooms=[
    {id:'planning',name:'Planejar',number:'01',color:'#57d8ff',x:44,y:76,w:290,h:210,door:{x:190,y:290},seats:[{x:95,y:190},{x:202,y:190},{x:95,y:258},{x:202,y:258},{x:278,y:200},{x:242,y:258}]},
    {id:'development',name:'Desenvolver',number:'02',color:'#6c9cff',x:356,y:76,w:294,h:210,door:{x:495,y:290},seats:[{x:410,y:190},{x:535,y:190},{x:410,y:258},{x:535,y:258},{x:602,y:200},{x:564,y:258}]},
    {id:'testing',name:'Testar',number:'03',color:'#ffad66',x:44,y:378,w:290,h:232,door:{x:190,y:370},seats:[{x:95,y:490},{x:202,y:490},{x:95,y:558},{x:202,y:558},{x:278,y:500},{x:242,y:576}]},
    {id:'publishing',name:'Postar',number:'04',color:'#c795ff',x:356,y:378,w:294,h:232,door:{x:495,y:370},seats:[{x:410,y:490},{x:535,y:490},{x:410,y:558},{x:535,y:558},{x:602,y:500},{x:564,y:576}]},
    {id:'leadership',name:'Líder · Codex',number:'05',color:'#ffd15c',x:724,y:76,w:432,h:534,door:{x:710,y:330},seats:[]},
    {id:'rest',name:'Descanso',number:'06',color:'#ffbd91',x:44,y:678,w:1112,h:232,door:{x:495,y:670},seats:[]}
  ];
  const obstacles=[
    {x:338,y:64,w:12,h:222},{x:338,y:370,w:12,h:248},
    {x:650,y:64,w:10,h:222},{x:650,y:370,w:10,h:248},
    {x:708,y:64,w:10,h:236},{x:708,y:360,w:10,h:258},
    ...[286,370].flatMap(y=>[{x:36,y,w:124,h:8},{x:216,y,w:249,h:8},{x:525,y,w:135,h:8}]),
    ...[{x:66,y:130},{x:190,y:130},{x:384,y:130},{x:510,y:130},{x:66,y:430},{x:190,y:430},{x:384,y:430},{x:510,y:430}].map(p=>({...p,w:84,h:39})),
    {x:260,y:226,w:46,h:19},{x:584,y:226,w:46,h:19},
    {x:260,y:524,w:46,h:19},{x:584,y:524,w:46,h:19},
    {x:790,y:140,w:88,h:40},{x:1000,y:180,w:104,h:78},{x:850,y:430,w:180,h:30},
    ...[610,670].flatMap(y=>[{x:36,y,w:429,h:8},{x:525,y,w:639,h:8}]),
    {x:500,y:720,w:200,h:25},
    ...[100,350,650,950].map(x=>({x:x+20,y:810,w:60,h:16}))
  ];
  const stations=rooms.map(room=>{
    const point=({planning:{x:282,y:264},development:{x:606,y:264},testing:{x:282,y:563},publishing:{x:606,y:563},leadership:{x:835,y:267},rest:{x:550,y:780}})[room.id];
    return {id:room.id,name:room.name,verb:room.id==='leadership'?'Conversar com Codex':room.id==='rest'?'Visitar sala de descanso':'Abrir sala '+room.name,icon:({planning:'◇',development:'⌘',testing:'✓',publishing:'↗',leadership:'★',rest:'☕'})[room.id],...point,marker:{x:point.x,y:point.y-(room.id==='leadership'?93:32)},area:room.id==='rest'?{x:500,y:720,w:200,h:25}:room.id==='leadership'?{x:785,y:136,w:105,h:102}:{x:point.x-24,y:point.y-52,w:50,h:40},panel:room.id};
  });
  const meetingArea={x:734,y:350,w:412,h:252};
  const meetingSeats=Array.from({length:24},(_,i)=>(i<12?{x:[800,912,1024,856,968,1080][Math.floor(i/2)],y:i%2?490:400}:{x:800+((i-12)%6)*56,y:i<18?540:590}));
  const hostSeats={player:{x:800,y:450},leader:{x:1100,y:450}};
  const restSeats=Array.from({length:24},(_,i)=>({x:[100,350,650,950][Math.floor(i/6)]+(i%3)*50,y:i%6<3?780:860}));
  const playerSeats={
    meeting:{id:'leadership',name:'Sua cadeira de reunião',verb:'Sentar na reunião',...hostSeats.player,seat:'meeting',area:{x:785,y:435,w:30,h:30}},
    rest:{id:'rest',name:'Sua poltrona de descanso',verb:'Sentar e descansar',x:550,y:860,seat:'rest',area:{x:535,y:845,w:30,h:30}}
  };
  const meetingStation={id:'leadership',name:'Sala de reunião',verb:'Gerenciar reunião',x:790,y:420,area:{x:850,y:430,w:180,h:30}};
  function meetingSeat(index){return {...meetingSeats[index%meetingSeats.length]};}
  function restSeat(index){return {...restSeats[index%restSeats.length]};}
  function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h);}
  function agentSeat(agent,index=0){const room=rooms.find(r=>r.id===agent.department)||rooms[0];const seat=room.seats[index%room.seats.length];if(walkable(seat.x,seat.y))return {...seat};return nearest(seat);}
  function walkable(x,y){return Number.isFinite(x)&&Number.isFinite(y)&&x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom&&!obstacles.some(o=>x>o.x-radius&&x<o.x+o.w+radius&&y>o.y-radius&&y<o.y+o.h+radius);}
  function nearest(point){
    let result=null,best=Infinity;
    for(let y=80;y<=bounds.bottom;y+=step)for(let x=50;x<=bounds.right;x+=step){if(!walkable(x,y))continue;const d=(point.x-x)**2+(point.y-y)**2;if(d<best){best=d;result={x,y};}}
    return result;
  }
  function clearSegment(a,b){const length=Math.hypot(b.x-a.x,b.y-a.y),count=Math.max(1,Math.ceil(length/3));for(let i=0;i<=count;i++)if(!walkable(a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count))return false;return true;}
  function path(start,destination){
    if(!walkable(start.x,start.y)||!Number.isFinite(destination.x)||!Number.isFinite(destination.y))return [];
    const a=nearest(start),b=nearest(destination),key=p=>p.x+','+p.y;
    if(!a||!b||!clearSegment(start,a))return [];
    const open=[a],cost=new Map([[key(a),0]]),came=new Map(),closed=new Set();
    while(open.length){
      open.sort((u,v)=>(cost.get(key(u))+Math.abs(u.x-b.x)+Math.abs(u.y-b.y))-(cost.get(key(v))+Math.abs(v.x-b.x)+Math.abs(v.y-b.y)));
      const current=open.shift(),id=key(current);if(closed.has(id))continue;
      if(id===key(b)){
        const route=[b];let next=id;while(came.has(next)){const previous=came.get(next);route.push(previous);next=key(previous);}route.reverse();
        if(walkable(destination.x,destination.y)&&clearSegment(b,destination))route.push({x:destination.x,y:destination.y});
        return route;
      }
      closed.add(id);
      for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
        const next={x:current.x+dx,y:current.y+dy},nextId=key(next),value=cost.get(id)+step;
        if(!walkable(next.x,next.y)||closed.has(nextId)||!clearSegment(current,next))continue;
        if(!cost.has(nextId)||value<cost.get(nextId)){cost.set(nextId,value);came.set(nextId,current);open.push(next);}
      }
    }
    return [];
  }
  function move(position,dx,dy){
    const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));let x=position.x,y=position.y;
    for(let i=0;i<count;i++){if(walkable(x+dx/count,y))x+=dx/count;if(walkable(x,y+dy/count))y+=dy/count;}
    return {x,y};
  }
  function stationAt(x,y){return [...Object.values(playerSeats),meetingStation,...stations].find(s=>x>=s.area.x&&x<=s.area.x+s.area.w&&y>=s.area.y&&y<=s.area.y+s.area.h);}
  return {width,height,bounds,hostSeats,restSeats,restSeat,playerSeats,spawn,rooms,roomAt,agentSeat,meetingArea,meetingSeats,meetingSeat,meetingStation,obstacles,stations,walkable,nearest,clearSegment,path,move,stationAt};
});
