'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../scene-model.js'),E=require('../engine.js');
test('shared depth order places actors on either side of furniture and hit selection follows the foreground',()=>{
  const area={x:0,y:0,w:30,h:80},items=[{id:'front',y:50,area},{id:'desk',y:40,area},{id:'back',y:30,area}];
  assert.deepEqual(S.depth(items).map(i=>i.id),['back','desk','front']);assert.deepEqual(items.map(i=>i.id),['front','desk','back']);assert.equal(S.hit(items,10,20).id,'front');assert.equal(S.hit(items,31,20),null);
});
test('scene states respect project context and never give visitor task details or fake generation percent',()=>{
  const state=E.create(),task=state.tasks[0];task.projectId='private-a';task.title='PRIVATE_TITLE';task.status='working';task.execution={kind:'real',status:'running'};
  assert.equal(S.indicator(state,task.agent,{projectId:'private-b'}).taskId,null);
  const visible=S.indicator(state,task.agent,{projectId:'private-a'});assert.equal(visible.kind,'running');assert.ok(!visible.label.includes('%'));assert.equal(visible.animation,'typing');
  const visitor=S.indicator(state,task.agent,{admin:false,projectId:'private-a'});assert.equal(visitor.taskId,null);assert.equal(visitor.symbol,'');assert.ok(!JSON.stringify(visitor).includes('PRIVATE_TITLE'));assert.equal(S.resolveTask(state,task.id,{admin:false,projectId:'private-a'}),null);
  task.workStatus='validation_failed';assert.equal(S.indicator(state,task.agent,{projectId:'private-a'}).kind,'error');task.workStatus='review';assert.equal(S.indicator(state,task.agent,{projectId:'private-a'}).kind,'review');
});
test('local visual preferences clamp input and audio stays opt-in',()=>{
  const prefs=S.preferences({camera:'bad',mode:'bad',zoom:500,volume:-1,lighting:'bad',sound:'true',material:'bad',reduceMotion:true});assert.equal(prefs.camera,'overview');assert.equal(prefs.mode,'ambient');assert.equal(prefs.zoom,2.4);assert.equal(prefs.volume,0);assert.equal(prefs.sound,false);assert.equal(prefs.lighting,'auto');assert.equal(prefs.material,'oak');assert.equal(prefs.reduceMotion,true);
});
