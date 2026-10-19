'use strict';
// Fixed official endpoints; no caller-controlled URLs or browser-held credentials.
const catalog={
  codex:{name:'ChatGPT / Codex',auth:'oauth',url:'https://learn.chatgpt.com/docs/app-server'},
  gemini:{name:'Gemini',auth:'api-key',url:'https://aistudio.google.com/apikey'},
  ollama:{name:'Ollama · local',auth:'local',url:'https://docs.ollama.com/quickstart'}
};
const defaults={
  leadership:{provider:'codex',model:'',reason:'Liderança e orientação técnica com Codex.'},
  planning:{provider:'gemini',model:'gemini-3.8-flash',reason:'Planejamento, requisitos e escopo dentro das cotas disponíveis da conta Gemini.'},
  development:{provider:'codex',model:'',reason:'Especialista em código; nesta versão entrega propostas para revisão.'},
  testing:{provider:'gemini',model:'gemini-3.8-flash',reason:'Revisão técnica e casos de teste propostos, sem execução automática.'},
  publishing:{provider:'gemini',model:'gemini-3.8-flash',reason:'Rascunhos de conteúdo e checklist para publicação após revisão humana.'}
};
const modelValid=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,99}$/.test(value);
function providerError(status){
  const error=new Error(status===401||status===403?'Credencial recusada ou acesso não permitido.':status===429?'Limite de uso atingido. Confira cotas e faturamento no provedor.':status===404?'Modelo não disponível para esta conta. Escolha outro modelo.':'Falha no provedor. Confira a conexão e tente novamente manualmente.');
  error.code=status===429?'quota':status===401||status===403?'authentication':'provider';return error;
}
async function jsonRequest(fetcher,url,{headers={},signal,...options}={}){
  const controller=AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(180000)]);
  const response=await fetcher(url,{...options,headers:{'Content-Type':'application/json',...headers},redirect:'error',signal:controller});
  if(!response.ok){await response.body?.cancel?.();throw providerError(response.status);}
  const reader=response.body?.getReader?.();let data='';
  if(reader){const decoder=new TextDecoder();let size=0;for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>2_000_000){await reader.cancel();throw Error('Resposta acima do limite permitido.');}data+=decoder.decode(value,{stream:true});}data+=decoder.decode();}
  else data=await response.text();
  try{return JSON.parse(data);}catch{throw Error('O provedor retornou uma resposta inválida.');}
}
async function listModels(provider,key,fetcher=fetch){
  if(provider==='ollama'){const r=await jsonRequest(fetcher,'http://127.0.0.1:11434/api/tags',{signal:AbortSignal.timeout(5000)});return (r.models||[]).map(m=>({id:m.name,name:m.name})).filter(m=>modelValid(m.id));}
  if(provider==='gemini'){const r=await jsonRequest(fetcher,'https://generativelanguage.googleapis.com/v1beta/models?pageSize=100',{signal:AbortSignal.timeout(15000),headers:{'x-goog-api-key':key}});return (r.models||[]).filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>({id:String(m.name).replace(/^models\//,''),name:m.displayName||m.name})).filter(m=>modelValid(m.id));}
  throw Error('Provedor inválido.');
}
async function generate(provider,{key,model,system,prompt,maxTokens,signal},fetcher=fetch){
  if(!modelValid(model))throw Error('Escolha um modelo válido.');
  if(provider==='ollama')return localChat({model,system,messages:[{role:'user',text:prompt}],maxTokens,signal},fetcher);
  let r,text,usage,finish;
  if(provider==='gemini'){
    r=await jsonRequest(fetcher,'https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',headers:{'x-goog-api-key':key},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:maxTokens}}),signal});
    const candidate=r.candidates?.[0];text=(candidate?.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('\n');usage=r.usageMetadata;finish=candidate?.finishReason;if(finish!=='STOP')throw Error('A resposta foi bloqueada, interrompida ou atingiu o limite. Revise o briefing ou aumente o limite.');
  }else throw Error('Provedor inválido.');
  if(!text?.trim()||text.length>120000)throw Error('Resposta vazia ou acima do limite permitido.');
  const tokens=Number(usage?.totalTokenCount??((usage?.input_tokens||0)+(usage?.output_tokens||0)))||0;
  return {text,model,usage:{tokens}};
}
// Genuine provider SSE: never simulate streaming from an already completed answer.
async function generateStream(provider,{key,model,system,messages,maxTokens,signal,onDelta},fetcher=fetch){
  if(provider==='ollama')return localChat({model,system,messages,maxTokens,signal},fetcher);
  if(provider!=='gemini')return generate(provider,{key,model,system,prompt:JSON.stringify(messages),maxTokens,signal},fetcher);
  if(!modelValid(model))throw Error('Escolha um modelo válido.');
  const response=await fetcher('https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':streamGenerateContent?alt=sse',{
    method:'POST',redirect:'error',signal:AbortSignal.any([signal,AbortSignal.timeout(180000)]),
    headers:{'Content-Type':'application/json','x-goog-api-key':key},
    body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents:messages.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.text}]})),generationConfig:{maxOutputTokens:maxTokens}})
  });
  if(!response.ok){await response.body?.cancel?.();throw providerError(response.status);}
  const reader=response.body?.getReader();if(!reader)throw Error('Streaming indisponível no provedor.');
  let buffer='',text='',finish='',tokens=0,bytes=0;const decoder=new TextDecoder();
  function event(block){
    const data=block.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trimStart()).join('\n');if(!data||data==='[DONE]')return;
    let value;try{value=JSON.parse(data);}catch{throw Error('Evento de streaming inválido.');}
    if(value.error)throw Error('O provedor interrompeu a resposta. Verifique acesso e cotas.');
    const candidate=value.candidates?.[0];
    const delta=(candidate?.content?.parts||[]).filter(p=>typeof p.text==='string'&&!p.thought).map(p=>p.text).join('');
    if(delta){text+=delta;if(text.length>120000)throw Error('Resposta acima do limite permitido.');onDelta?.(delta);}
    if(candidate?.finishReason)finish=candidate.finishReason;
    if(value.usageMetadata?.totalTokenCount)tokens=value.usageMetadata.totalTokenCount;
  }
  try{
    for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>2_000_000)throw Error('Streaming acima do limite permitido.');buffer+=decoder.decode(value,{stream:true});buffer=buffer.replace(/\r\n/g,'\n');let end;while((end=buffer.indexOf('\n\n'))!==-1){event(buffer.slice(0,end));buffer=buffer.slice(end+2);}}
    buffer+=decoder.decode();if(buffer.trim())event(buffer);
  }finally{await reader.cancel().catch(()=>{});}
  if(finish!=='STOP'||!text.trim())throw Error('Resposta incompleta ou bloqueada. O texto parcial não é uma entrega concluída.');
  return {text,model,usage:{tokens}};
}
async function localChat({model,system,messages,maxTokens,signal},fetcher){
  if(!modelValid(model))throw Error('Modelo local inválido.');
  const r=await jsonRequest(fetcher,'http://127.0.0.1:11434/api/chat',{method:'POST',signal,body:JSON.stringify({model,stream:false,messages:[{role:'system',content:system},...messages.map(m=>({role:m.role,content:m.text}))],options:{num_predict:maxTokens}})});
  if(r.done!==true||r.done_reason&&r.done_reason!=='stop'||typeof r.message?.content!=='string'||!r.message.content.trim()||r.message.content.length>120000)throw Error('Resposta local incompleta ou acima do limite.');
  return {text:r.message.content,model:r.model||model,usage:{tokens:(Number(r.prompt_eval_count)||0)+(Number(r.eval_count)||0)}};
}
module.exports={catalog,defaults,modelValid,listModels,generate,generateStream};
