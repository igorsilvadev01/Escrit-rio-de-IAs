'use strict';
const readline=require('node:readline');let signedIn=false,thread=false;
const send=message=>process.stdout.write(JSON.stringify(message)+'\n');
readline.createInterface({input:process.stdin}).on('line',line=>{
  const m=JSON.parse(line);if(m.method==='initialized')return;
  if(m.id===99){if(m.result?.decision!=='decline')process.exit(4);send({method:'item/completed',params:{threadId:'qa-thread',item:{type:'agentMessage',text:'Proposta do Codex de QA.'}}});send({method:'turn/completed',params:{threadId:'qa-thread',turn:{id:'qa-turn',status:'completed'}}});return;}
  let result={};
  if(m.method==='account/read')result={account:signedIn?{type:'chatgpt',planType:'test'}:null};
  else if(m.method==='account/login/start'){signedIn=true;result={authUrl:'https://auth.openai.com/firma-qa',loginId:'qa-login'};}
  else if(m.method==='account/logout')signedIn=false;
  else if(m.method==='model/list')result={data:[{id:'qa-codex',model:'qa-codex',displayName:'QA Codex'}]};
  else if(m.method==='thread/start'){
    if(m.params.sandbox!=='read-only'||m.params.approvalPolicy!=='never'||m.params.config['features.shell_tool']!==false)process.exit(3);
    thread=true;result={thread:{id:'qa-thread'},model:'qa-codex'};
  }else if(m.method==='turn/start'){if(!thread||m.params.sandboxPolicy.type!=='readOnly'||m.params.sandboxPolicy.networkAccess!==false)process.exit(5);result={turn:{id:'qa-turn'}};}
  send({id:m.id,result});
  if(m.method==='turn/start'){send({method:'item/agentMessage/delta',params:{threadId:'qa-thread',delta:'Proposta do Codex de QA.'}});send({id:99,method:'item/commandExecution/requestApproval',params:{threadId:'qa-thread'}});}
});
