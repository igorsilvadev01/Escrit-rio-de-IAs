const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.FIRMA_PLAYWRIGHT||'playwright');
const server=require('./browser-server.cjs').office();
(async()=>{let browser;const errors=[];try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.FIRMA_BROWSER?{executablePath:process.env.FIRMA_BROWSER}:{})});await server.authorizeBrowser(browser);
  const page=await browser.newPage({viewport:{width:1512,height:982}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);await page.locator('#modal[open]').waitFor();await page.locator('#modal-submit').click();await page.waitForFunction(()=>window.FirmaStudio&&!document.getElementById('modal').open);
  assert.equal(await page.evaluate(()=>FirmaWorld.rooms.length),5);assert.equal(await page.locator('[data-destination="rest"]').count(),0);assert.equal(await page.locator('[data-destination="admin"]').count(),1);
  fs.mkdirSync('artifacts',{recursive:true});await page.screenshot({path:path.resolve('artifacts/firma-village-desktop.png'),fullPage:true});
  for(const id of ['planning','development','testing','publishing','leadership','admin']){
    await page.evaluate(id=>FirmaGame.goTo(FirmaWorld.stations.find(s=>s.id===id)),id);await page.locator('#studio[open]').waitFor({timeout:8000});assert.equal(await page.evaluate(()=>FirmaStudio.room),id);await page.locator('#st-close').click();
  }
  await page.evaluate(()=>FirmaGame.goTo(FirmaWorld.playerSeats.admin));await page.waitForFunction(()=>FirmaGame.seated==='admin',{},{timeout:8000});assert.equal(await page.evaluate(()=>FirmaWorld.roomAt(FirmaGame.player.x,FirmaGame.player.y).id),'leadership');
  await page.evaluate(()=>FirmaGame.openStation('admin','chat'));await page.locator('#studio[open]').waitFor();assert.equal(await page.locator('#st-role').inputValue(),'development');await page.screenshot({path:path.resolve('artifacts/firma-village-shared-office.png'),fullPage:true});await page.locator('#st-close').click();
  await page.evaluate(async()=>{const s=FirmaEngine.migrate(FirmaUI.state);for(const department of Object.keys(FirmaEngine.departments))while(s.agents.filter(a=>a.department===department).length<6)s.agents.push({...s.agents[0],id:'qa-'+s.agents.length,name:'QA '+s.agents.length,department});await FirmaAccess.command('restore',{state:s});await FirmaAccess.command('simulation',{paused:true});await FirmaUI.sync();});
  await page.waitForFunction(()=>FirmaGame.agentPositions.length===24);await page.evaluate(()=>FirmaUI.interact({id:'leadership'}));await page.locator('[data-action="assembly-start"]').click();
  await page.waitForFunction(()=>FirmaGame.seated==='meeting'&&FirmaGame.agentPositions.every((p,i)=>{const s=FirmaWorld.meetingSeat(i);return Math.hypot(p.x-s.x,p.y-s.y)<1;}),{},{timeout:18000});
  assert.equal(await page.evaluate(()=>new Set(FirmaGame.agentPositions.map(p=>p.x+','+p.y)).size),24);await page.screenshot({path:path.resolve('artifacts/firma-village-meeting.png'),fullPage:true});
  await page.evaluate(()=>FirmaUI.interact({id:'leadership'}));await page.locator('[data-action="assembly-end"]').click();await page.locator('#close-modal').click();
  await page.waitForFunction(()=>FirmaGame.agentPositions.every(p=>FirmaWorld.roomAt(p.x,p.y)?.id===FirmaUI.state.agents.find(a=>a.id===p.id).department),{},{timeout:18000});
  await page.evaluate(async()=>{const s=FirmaEngine.migrate(FirmaUI.state);for(const a of s.agents){a.rest=true;a.autoRest=false;}await FirmaAccess.command('restore',{state:s});await FirmaUI.sync();});
  assert.equal(await page.evaluate(()=>FirmaGame.agentPositions.every(p=>FirmaWorld.roomAt(p.x,p.y)?.id===FirmaUI.state.agents.find(a=>a.id===p.id).department)),true);
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(url);await mobile.waitForFunction(()=>window.FirmaStudio);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await mobile.screenshot({path:path.resolve('artifacts/firma-village-mobile.png'),fullPage:true});
  await mobile.evaluate(()=>FirmaGame.openStation('admin','chat'));await mobile.locator('#studio[open]').waitFor();assert.equal(await mobile.evaluate(()=>document.getElementById('studio').scrollWidth<=document.getElementById('studio').clientWidth),true);
  assert.deepEqual(errors,[]);console.log('PASS: five adjacent rooms, six physical terminals, shared Codex/admin office, removed lounge, 24-person assembly/return, pauses at own desks, themed desktop/mobile and workstation; no browser errors.');
}finally{await browser?.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
