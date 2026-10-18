'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {CodexBridge,command}=require('../codex-bridge.cjs');
test('official app-server bridge initializes, logs in, denies tool approvals and collects completed output',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firma-bridge-')),bridge=new CodexBridge(dir,{launch:{bin:process.execPath,args:[path.join(__dirname,'mock-codex.cjs')]}});
  try{
    await bridge.start();assert.equal(bridge.account,null);const login=await bridge.loginStart();assert.match(login.authUrl,/^https:\/\/auth.openai.com\//);
    const models=await bridge.models();assert.equal(models[0].id,'qa-codex');
    const deltas=[];const result=await bridge.run({system:'Líder da Firma.',prompt:'Faça um plano.',model:'qa-codex',signal:new AbortController().signal,onDelta:d=>deltas.push(d)});assert.equal(result.text,'Proposta do Codex de QA.');assert.equal(result.model,'qa-codex');assert.equal(deltas.join(''),'Proposta do Codex de QA.');
    await bridge.logout();assert.equal(bridge.account,null);
  }finally{bridge.close();await new Promise(resolve=>setTimeout(resolve,100));fs.rmSync(dir,{recursive:true,force:true});}
});
test('installed Codex handshake uses an empty isolated home, with no account, tokens or model calls',{skip:!command()},async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firma-bridge-smoke-')),bridge=new CodexBridge(dir);
  try{await bridge.start();assert.equal(bridge.account,null);assert.equal(bridge.home,path.join(dir,'codex'));}
  finally{bridge.close();await new Promise(resolve=>setTimeout(resolve,500));fs.rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
});
