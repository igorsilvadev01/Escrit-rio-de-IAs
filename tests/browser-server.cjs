// Isolated real backend for browser QA. Never uses the owner's files or credentials.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createFirmaServer}=require('../server.cjs');
function office(ai,options={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'firma-browser-test-'));
  const app=createFirmaServer({...options,dataDir:dir,...(ai?{ai}:{})}),server=app.server;
  server.on('close',()=>{if(path.dirname(dir)===os.tmpdir()&&path.basename(dir).startsWith('firma-browser-test-'))fs.rmSync(dir,{recursive:true,force:true});});
  server.setupToken=()=>app.setupToken;
  server.authorizeBrowser=async browser=>{
    const url=`http://127.0.0.1:${server.address().port}`;
    const response=await fetch(url+'/api/setup',{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({token:app.setupToken,username:'igor',password:'Uma senha longa para QA 2026!'})});
    if(response.status!==201)throw Error('Could not initialize browser QA owner');
    const token=response.headers.get('set-cookie').split(';')[0].split('=')[1],newPage=browser.newPage.bind(browser);
    browser.newPage=async options=>{const page=await newPage(options);await page.context().addCookies([{name:'firma_session',value:token,url,httpOnly:true,sameSite:'Strict'}]);return page;};
  };
  return server;
}
module.exports={office};
