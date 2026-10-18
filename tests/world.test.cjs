const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('../world.js');
const E=require('../engine.js');

test('all office stations are walkable and reachable from the entrance',()=>{
  assert.ok(W.walkable(W.spawn.x,W.spawn.y));
  for(const station of W.stations){
    assert.ok(W.walkable(station.x,station.y),station.id+' must be walkable');
    const path=W.path(W.spawn,station);
    assert.ok(path.length,station.id+' must be reachable');
    let previous=W.spawn;
    for(const point of path){assert.ok(W.clearSegment(previous,point),station.id+' cannot cut through furniture');previous=point;}
    assert.ok(Math.hypot(previous.x-station.x,previous.y-station.y)<1,station.id+' must arrive at its interaction point');
  }
});

test('all six rooms are entered through doors instead of crossing glass walls',()=>{
  assert.equal(W.rooms.length,6);
  for(const room of W.rooms){const route=W.path(W.spawn,W.stations.find(s=>s.id===room.id));assert.ok(route.some(p=>Math.hypot(p.x-room.door.x,p.y-room.door.y)<=25),room.id+' must use its door');for(const point of route)assert.ok(W.walkable(point.x,point.y));}
  assert.equal(W.walkable(342,200),false);
});

test('keyboard movement cannot tunnel through furniture or leave the office',()=>{
  let player={x:160,y:150};
  player=W.move(player,-300,0);
  assert.ok(player.x>=159,'the desk stops movement');
  player=W.move(W.spawn,0,500);
  assert.ok(player.y<=W.bounds.bottom);
  assert.equal(W.walkable(95,150),false);
  assert.equal(W.walkable(NaN,300),false);
  assert.deepEqual(W.path(W.spawn,{x:NaN,y:10}),[]);
});

test('clicking furniture chooses a reachable adjacent point',()=>{
  const path=W.path(W.spawn,{x:100,y:150});
  assert.ok(path.length);
  const end=path.at(-1);
  assert.ok(W.walkable(end.x,end.y));
  assert.notDeepEqual(end,{x:100,y:150});
});

test('player data survives backups, and old saves receive a usable character',()=>{
  const state=E.create();
  assert.equal(state.player.name,'Você');
  Object.assign(state.player,{name:'Igor',color:'#aabbcc',skin:'#c89570',hair:'#342d2b',x:800,y:298,visited:['planning','testing'],immersive:true});
  assert.deepEqual(E.migrate(JSON.parse(JSON.stringify(state))).player,state.player);
  delete state.player;
  assert.equal(E.migrate(state).player.x,W.spawn.x);
  state.player={name:'',color:'not a color',x:Infinity,y:NaN,visited:['planning','planning',false],layout:'rooms-v1'};
  const clean=E.migrate(state).player;
  assert.equal(clean.name,'Você');assert.equal(clean.color,'#c3ed8b');assert.deepEqual(clean.visited,['planning']);assert.equal(clean.x,W.spawn.x);
});

test('department seats are reachable and never put agents in another room',()=>{for(const room of W.rooms.filter(r=>E.departments[r.id]))for(let i=0;i<6;i++){const seat=W.agentSeat({department:room.id},i);assert.equal(W.roomAt(seat.x,seat.y)?.id,room.id);assert.ok(W.walkable(seat.x,seat.y));assert.ok(W.path(W.spawn,seat).length);}});
test('24 distinct meeting seats are reachable from every production room without crossing furniture',()=>{
  assert.equal(new Set(W.meetingSeats.map(p=>p.x+','+p.y)).size,24);
  for(let i=0;i<24;i++){const seat=W.meetingSeat(i);assert.ok(W.walkable(seat.x,seat.y));assert.equal(W.roomAt(seat.x,seat.y).id,'leadership');
    const start=W.agentSeat({department:['planning','development','testing','publishing'][i%4]},i%6);
    const route=W.path(start,seat);assert.ok(route.length);let p=start;for(const next of route){assert.ok(W.clearSegment(p,next));p=next;}
    assert.ok(W.path(seat,start).length);
  }
  assert.equal(W.stationAt(920,440).name,'Sala de reunião');
});
test('hosts have two reserved reachable seats and lounge has 25 accessible places',()=>{
  const places=[...W.meetingSeats,...Object.values(W.hostSeats)];
  assert.equal(new Set(places.map(p=>p.x+','+p.y)).size,26);
  for(const p of Object.values(W.hostSeats)){assert.ok(W.walkable(p.x,p.y));assert.ok(W.path(W.spawn,p).length);assert.equal(W.roomAt(p.x,p.y).id,'leadership');}
  const lounge=[...W.restSeats,W.playerSeats.rest];assert.equal(new Set(lounge.map(p=>p.x+','+p.y)).size,25);
  for(let i=0;i<lounge.length;i++){const p=lounge[i];assert.ok(W.walkable(p.x,p.y));assert.equal(W.roomAt(p.x,p.y).id,'rest');const from=W.meetingSeat(i%24);assert.ok(W.path(from,p).length);assert.ok(W.path(p,from).length);}
  const s=E.create();Object.assign(s.player,{x:550,y:860,visited:['rest']});assert.equal(E.migrate(s).player.y,860);assert.deepEqual(E.migrate(s).player.visited,['rest']);
});

