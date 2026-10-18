/* Original canvas pixel art inspired by the user's cozy woodland game reference. */
(() => {
  'use strict';
  const ink='#342b2c',wood='#9b6749',timber='#d7a474',paper='#efce96';
  function draw(ctx,W,state,time){
    const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    const label=(s,x,y,size=8,color=ink)=>{ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.fillText(s,Math.round(x),Math.round(y));};
    function tree(x,y,i){box(x-7,y-1,15,16,'#5c4031');box(x-3,y,7,17,'#8f5d3b');box(x-21,y-30,42,27,'#334d35');box(x-25,y-24,49,17,'#334d35');box(x-21,y-34,41,25,'#477544');box(x-16,y-39,30,24,'#5c8b49');box(x-20,y-24,15,8,'#6b9a50');box(x+7,y-18,13,8,'#3f693c');box(x-8,y-35,12,5,'#7ba459');if(i%3===0){box(x+10,y-22,5,5,'#dba65d');box(x-11,y-13,4,4,'#e2bf68');}}
    // Grass tiles and hand placed dashes are deterministic, so the world doesn't flicker.
    box(0,0,W.width,W.height,'#7cb35a');
    for(let y=0;y<W.height;y+=16)for(let x=0;x<W.width;x+=16){const n=(x*13+y*7)%97;box(x,y,16,16,n<32?'#80b85c':n<58?'#79af55':'#85ba60');if(n<14){box(x+5,y+9,2,3,'#a4d076');box(x+8,y+7,2,5,'#a4d076');}}
    // All entrances share this one little dirt lane. No distant wings.
    box(51,197,644,39,'#67964c');box(53,200,640,33,'#bc8d60');box(53,204,640,25,'#d6aa77');
    box(260,198,25,218,'#bc8d60');box(264,200,17,218,'#d6aa77');
    for(let i=0;i<25;i++){const x=57+i*25;box(x,210+(i%3)*5,5,2,i%2?'#bd9569':'#e9c18a');}
    // A small pond, bridge and fence give the office the same garden feel as the reference.
    box(49,406,150,48,'#4c7545');box(54,410,140,40,'#c9b384');box(59,414,130,30,'#467dba');box(63,414,124,5,'#79bcdb');
    for(let i=0;i<8;i++)box(63+i*15,425+(i%2)*8,9,3,'#376da4');
    box(121,405,33,51,ink);box(124,407,27,47,wood);for(let y=409;y<452;y+=7)box(125,y,25,5,timber);
    for(let x=304;x<672;x+=36){box(x,414,28,5,'#79513a');box(x+2,412,27,3,'#c68d58');box(x-3,404,7,22,'#734d37');box(x-2,402,5,20,'#e1ad72');}
    for(const [i,p] of W.scenery.trees.entries())tree(p.x,p.y,i);
    for(let i=0;i<38;i++){const x=28+(i*137)%740,y=28+(i*73)%414;if(x>63&&x<707&&y>54&&y<383||x>45&&x<200&&y>400)continue;box(x,y,5,5,'#e5ebba');box(x+2,y+2,2,2,'#ecc55b');}
    // Cutaway wooden cabins. Adjoining walls and paired doors are real collision geometry.
    for(const r of W.rooms){
      box(r.x-3,r.y-4,r.w+6,r.h+9,ink);box(r.x,r.y,r.w,r.h,'#b7865d');
      for(let y=r.y+22;y<r.y+r.h;y+=11){box(r.x+3,y,r.w-6,10,(Math.floor(y/11)%2)?'#d5ad79':'#dfba86');for(let x=r.x+10+(Math.floor(y/11)%2)*23;x<r.x+r.w-12;x+=46)box(x,y,1,10,'#be956b');}
      box(r.x,r.y,r.w,23,'#704d3a');box(r.x+2,r.y+2,r.w-4,18,timber);box(r.x+5,r.y+5,r.w-10,13,paper);
      box(r.x+7,r.y+7,10,9,r.color);label(r.number,r.x+8,r.y+14,6);
      label(r.id==='leadership'?'VOCÊ + CODEX':r.name.toUpperCase(),r.x+22,r.y+15,r.id==='leadership'?10:8);
      if(r.seats.length){label('EQUIPE '+state.agents.filter(a=>a.department===r.id).length,r.x+8,r.y+r.h-6,5,'#77553b');const bottom=r.y>200,y=bottom?r.y-4:r.y+r.h;box(r.door.x-20,y,40,5,'#6d4832');box(r.door.x-17,y,34,3,'#e9c08a');}
    }
    // Render the narrow shared passage over adjoining cutaway room outlines.
    box(76,206,332,16,'#d6aa77');box(240,202,4,28,'#d6aa77');
    box(404,202,8,28,'#d6aa77');box(404,206,8,16,'#ebc38f');
    function desk(d,accent,title){
      box(d.x+2,d.y+4,d.w,d.h,ink);box(d.x,d.y,d.w,d.h,wood);box(d.x+2,d.y+2,d.w-4,d.h-6,timber);box(d.x+4,d.y+d.h-5,4,9,'#754e35');box(d.x+d.w-9,d.y+d.h-5,4,9,'#754e35');
      const mx=d.x+Math.floor(d.w/2)-11;box(mx-2,d.y-10,26,19,ink);box(mx,d.y-8,22,14,'#446e6a');box(mx+2,d.y-6,18,9,accent);box(mx+4,d.y-4,11,2,'#e7efc5');box(mx+8,d.y+9,5,4,'#5c5848');box(mx+3,d.y+13,15,2,'#665d49');
      box(mx,d.y+18,24,5,'#eee0b8');box(d.x+d.w-8,d.y+9,5,7,'#eee0b8');
      if(title){box(d.x+2,d.y+33,d.w-2,10,ink);box(d.x+3,d.y+34,d.w-4,8,paper);label(title,d.x+7,d.y+40,6);}
    }
    for(const d of W.workDesks)desk(d,'#8fc7bb');
    for(const board of W.boards){box(board.x,board.y,board.w,board.h,ink);box(board.x+2,board.y+2,board.w-4,board.h-4,'#6c654c');box(board.x+4,board.y+4,board.w-8,board.h-8,'#e5d7ab');for(let i=0;i<3;i++){box(board.x+6,board.y+6+i*6,3,3,'#77976b');box(board.x+11,board.y+7+i*6,6,1,'#9b805d');}}
    desk(W.furniture.leaderDesk,'#a3bd76','CODEX');desk(W.furniture.adminDesk,'#81b8bd','SUA MESA');
    const shelf=W.furniture.leaderShelf;box(shelf.x,shelf.y,shelf.w,shelf.h,ink);box(shelf.x+2,shelf.y+2,shelf.w-4,shelf.h-4,wood);for(let row=0;row<2;row++)for(let i=0;i<3;i++)box(shelf.x+4+i*4,shelf.y+5+row*17,3,12,['#b6bc81','#af7e67','#8ca8ac'][i]);
    const meeting=W.meetingArea;label('MESA DA EQUIPE',meeting.x+54,meeting.y+13,7,'#765238');
    for(const seat of W.meetingSeats){box(seat.x-6,seat.y-8,12,13,ink);box(seat.x-4,seat.y-6,8,9,'#a97d53');box(seat.x-4,seat.y-5,8,3,'#cfa36b');}
    for(const [who,seat] of Object.entries(W.hostSeats)){box(seat.x-9,seat.y-10,18,17,ink);box(seat.x-7,seat.y-8,14,13,who==='player'?'#789c86':'#d5b268');}
    const t=W.furniture.meetingTable;box(t.x,t.y+3,t.w,t.h,ink);box(t.x,t.y,t.w,t.h,wood);box(t.x+2,t.y+2,t.w-4,t.h-5,'#dfb783');box(t.x+18,t.y+5,17,9,'#edddb2');box(t.x+t.w-23,t.y+5,7,7,'#f5dfad');
    label(state.assembly.active?'REUNIÃO EM ANDAMENTO':'FIRMA · FEITA EM EQUIPE',t.x+8,t.y+t.h+12,6,'#735139');
    // Tiny moving water glints are the only background animation.
    if(Math.floor(time)%3===0){box(77,433,4,2,'#a5d5df');box(170,421,5,2,'#a5d5df');}
  }
  function sprite(ctx,o){
    const box=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);},phase=o.phase||0;
    const stride=o.walking?Math.round(Math.sin(o.time*13+phase)*2):0,bounce=o.walking?Math.round(Math.sin(o.time*13)*1):0;
    ctx.save();ctx.translate(0,bounce+(o.sitting?3:0));
    box(-11,10,23,4,'#334a3677');
    box(-8,0,7,o.sitting?7:12,ink);box(2,0,7,o.sitting?7:12,ink);box(-9,10+stride,9,4,'#352e32');box(2,10-stride,9,4,'#352e32');
    box(-10,-15,21,19,ink);box(-8,-13,17,14,o.shirt);box(-7,-11,4,9,'#ffffff20');
    box(-14,-12-stride,5,12,ink);box(-13,-10-stride,4,8,o.skin);box(11,-12+stride,5,12,ink);box(11,-10+stride,4,8,o.skin);
    box(-12,-35,25,23,ink);box(-10,-32,21,18,o.skin);box(-10,-37,21,9,o.hair);box(-13,-32,7,11,o.hair);box(8,-32,6,10,o.hair);box(-8,-39,16,5,ink);box(-7,-37,14,5,o.hair);box(-7,-34,7,3,'#ffffff19');
    if(o.facing==='up')box(-10,-29,21,14,o.hair);else{const dx=o.facing==='left'?-2:o.facing==='right'?2:0;box(-6+dx,-24,3,5,ink);box(4+dx,-24,3,5,ink);box(-5+dx,-24,1,1,'#fff1d2');box(5+dx,-24,1,1,'#fff1d2');box(-8,-18,4,2,'#c88672');box(6,-18,3,2,'#c88672');}
    if(o.player){box(-3,-48,7,3,'#f3d078');box(-1,-45,3,3,'#f3d078');}
    ctx.restore();const name=o.name,width=name.length*5+10;box(-width/2,19,width,12,ink);box(-width/2+1,20,width-2,10,o.player?'#f5d38b':'#e5c393');ctx.fillStyle=ink;ctx.font='bold 7px monospace';ctx.fillText(name,-width/2+5,28);
  }
  window.FirmaVillage={draw,sprite};
})();
