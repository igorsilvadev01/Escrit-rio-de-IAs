/* Private integration controls. No key, token or login URL is saved in the browser. */
(()=>{
  'use strict';
  const A=window.FirmaAccess,U=window.FirmaUI,$=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let meta=null,panel='',loginTimer=null,loginWindow=null,checking=false;
  const names={leadership:'Líder · Codex',planning:'Planejar',development:'Desenvolver',testing:'Testar / revisar',publishing:'Preparar postagem'};
  const consent='<label class="ai-consent"><input type="checkbox" name="confirm" required> Autorizo enviar o briefing, as instruções, o contexto e a entrega anterior aprovada ao provedor selecionado. Entendo que pode consumir créditos ou gerar cobrança.</label>';
  const limits='<p class="detail-note">Esta integração produz texto, planos, código proposto e revisões. Não executa shell/testes, não edita arquivos e não publica. Revise tudo antes de usar.</p>';
  function stopPolling(){clearInterval(loginTimer);loginTimer=null;}
  function show(title,html,submit,callback){stopPolling();U.openModal(title,html,submit,callback,true);if(panel==='connections')planNote();}
  async function action(name,payload={}){const data=await A.ai(name,{projectId:window.FirmaProjects?.current||'firma',...payload});if(data.state)U.applyRemote(data);if(data.ai)meta=data.ai;return data;}
  async function read(){meta=await A.aiStatus();return meta;}
  function provider(id){return meta.providers.find(p=>p.id===id);}
  function planNote(){
    const p=provider('codex'),note=document.createElement('p');note.id='ai-codex-plan';note.className='detail-note';
    const plan=p?.account?.plan;
    note.textContent=p?.connected?'Codex · plano da conta: '+(plan||'não informado pelo provedor')+'. Modelo e assinatura são informações diferentes.':'Codex desconectado · plano da conta não verificado. Entre com ChatGPT para consultar. Não é possível inferir Pro pelo modelo configurado.';
    $('modal-content').querySelector('.ai-provider-grid')?.after(note);
  }
  async function open(){
    if(!A.isAdmin)return;await read();panel='connections';
    show('Central de IAs reais',`<p class="dialog-intro">Conecte suas contas por métodos oficiais. Não informe a senha de ChatGPT ou Google aqui. Nenhuma ordem é enviada só por conectar.</p><div class="ai-provider-grid">${meta.providers.map(p=>`<section class="ai-provider-card"><h3>${esc(p.name)}</h3><span class="ai-connection-status" data-ai-status="${p.id}">${p.connected?'Conectado':'Não conectado'}</span><p>${p.id==='ollama'?'Modelos instalados neste PC. Conecta ao Ollama local; nenhum download é iniciado pela Firma.':p.id==='codex'?'Login oficial do ChatGPT, separado do IDE. O acesso e os limites dependem do plano.':'Conexão por chave de API. A assinatura do chat não é convertida em créditos de API.'}</p><small>${esc(p.source)}</small><div class="ai-card-actions"><button type="button" class="primary-button" data-ai-connect="${p.id}">${p.id==='ollama'?'Detectar modelos locais':p.id==='codex'?'Entrar com ChatGPT':'Conectar API'}</button>${p.id==='codex'?'<button type="button" class="secondary-button" data-ai-check>Verificar sessão</button>':''}${p.connected?`<button type="button" class="text-button" data-ai-disconnect="${p.id}">Desconectar</button>`:''}</div><a class="ai-external-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${p.id==='ollama'?'Configurar Ollama':p.id==='codex'?'Como funciona':'Criar chave na conta oficial'} ↗</a></section>`).join('')}</div><h3 class="room-subtitle">Escolha inicial por função — ajustável à sua conta</h3><div class="ai-role-list">${Object.entries(meta.roles).map(([id,c])=>`<div><b>${esc(names[id])}</b><span>${esc(provider(c.provider).name)} · ${esc(c.model||'Modelo padrão da conta')}</span><small>${esc(meta.recommendations[id].reason)}</small></div>`).join('')}</div><p class="detail-note">Não existe uma IA universalmente melhor. Estas são recomendações por especialidade, não um benchmark próprio. Modelos disponíveis e cotas variam por conta.</p><p class="ai-usage">${meta.usage.used} / ${meta.usage.limit} chamadas iniciadas hoje (UTC) · ${meta.pending} na fila · ${meta.running?'1 em execução':'nenhuma em execução'}</p><div class="ai-card-actions"><button type="button" class="secondary-button" data-ai-settings>Configurar funções e limites</button><button type="button" class="primary-button" data-ai-order>Dar ordem ao Codex</button><button type="button" class="secondary-button" data-ai-flow>Criar fluxo real</button><button type="button" class="text-button" data-ai-refresh>Atualizar conexões</button></div><p class="detail-note">Chaves de API digitadas ficam somente na memória do servidor e somem quando ele reinicia. Para uso persistente, configure GEMINI_API_KEY no ambiente do servidor. Nunca coloque chaves no GitHub. O Codex guarda sua própria sessão na área privada local, fora dos backups do jogo.</p>${limits}`,null,null);
  }
  async function connect(id){if(id==='ollama'){await action('connect',{provider:'ollama'});await open();U.toast('Modelos locais detectados. Escolha um modelo nas funções.');return;}
    if(id==='codex'){
      loginWindow=window.open('about:blank','firma-codex-login','popup,width=600,height=760');
      try{
        const data=await action('codex.login');
        if(data.login?.connected){loginWindow?.close();await action('codex.check');await open();U.toast('Conta Codex conectada.');return;}
        const url=new URL(data.login.authUrl);if(url.protocol!=='https:'||!['auth.openai.com','chatgpt.com'].includes(url.hostname))throw Error('Endereço de autenticação inesperado.');
        if(loginWindow)loginWindow.location=url.href;
        panel='codex-login';show('Entrar com ChatGPT / Codex',`<p class="dialog-intro">Conclua o login na página oficial da OpenAI. A Firma não recebe sua senha. Nenhuma ordem será enviada automaticamente.</p><a class="primary-button" href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">Abrir login oficial ↗</a><p id="ai-login-status" role="status">Aguardando a autenticação…</p><button type="button" class="secondary-button" data-ai-cancel-login>Cancelar login</button>`,null,null);
        let checks=0;loginTimer=setInterval(async()=>{if(checking||panel!=='codex-login')return;if(++checks>75){stopPolling();$('ai-login-status').textContent='Tempo de espera encerrado. Verifique a sessão ou tente novamente.';return;}checking=true;try{await action('codex.check');if(provider('codex').connected){stopPolling();await open();U.toast('ChatGPT / Codex conectado.');}}catch{if($('ai-login-status'))$('ai-login-status').textContent='Ainda aguardando. Conclua o login ou cancele para tentar novamente.';}finally{checking=false;}},4000);
      }catch(error){loginWindow?.close();throw error;}return;
    }
    if(!meta)await read();const p=provider(id);if(!p)return;
    panel='connect';show('Conectar '+p.name,`<p class="dialog-intro">Crie uma chave na plataforma oficial e cole abaixo. Não use a senha do chat. A verificação consulta os modelos disponíveis, sem gerar uma resposta de IA.</p><a class="ai-external-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Abrir plataforma oficial ↗</a><label>Chave de API (deixe vazio para usar variável de ambiente)<input type="password" name="apiKey" autocomplete="off" spellcheck="false" maxlength="1000"></label><p class="detail-note">A chave digitada fica somente na memória do servidor, não em localStorage, backup ou repositório. O uso posterior pode ser cobrado pelo provedor.</p>`,'Verificar e conectar',async data=>{const key=data.get('apiKey').trim();const input=$('modal-content').querySelector('[name="apiKey"]');if(input)input.value='';await action('connect',{provider:id,...(key?{key}:{})});await open();U.toast(p.name+' conectado.');});
  }
  async function settings(){
    await read();panel='settings';
    show('Funções e limites de IA',`<p class="dialog-intro">Codex permanece na liderança. Nas outras funções, você pode usar os modelos disponíveis nas suas contas, inclusive Codex em todas as salas.</p>${Object.entries(meta.roles).map(([id,c])=>`<div class="ai-role-form"><h3>${esc(names[id])}</h3><label>Provedor<select name="${id}-provider" data-ai-role="${id}">${meta.providers.filter(p=>id!=='leadership'||p.id==='codex').map(p=>`<option value="${p.id}" ${c.provider===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><label>ID do modelo (Codex: vazio usa o padrão)<input name="${id}-model" list="ai-models-${id}" maxlength="100" value="${esc(c.model)}"><datalist id="ai-models-${id}">${provider(c.provider).models.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</datalist></label></div>`).join('')}<div class="form-grid"><label>Máximo de chamadas por dia (UTC)<input type="number" name="dailyLimit" min="1" max="100" required value="${meta.dailyLimit}"></label><label>Limite de tokens de saída por chamada API<input type="number" name="maxTokens" min="512" max="65536" required value="${meta.maxTokens}"></label></div><p class="detail-note">O limite conta tentativas, inclusive as que falham após o envio. Não é um teto de gasto em dinheiro. O Codex usa os limites do cliente/plano, não este limite de tokens. Modelos de raciocínio podem atingir o limite antes de produzir a resposta. Não há repetição automática em caso de erro.</p>`,'Salvar configurações',async data=>{const roles={};for(const id of Object.keys(names))roles[id]={provider:data.get(id+'-provider'),model:data.get(id+'-model').trim()};await action('settings',{roles,dailyLimit:Number(data.get('dailyLimit')),maxTokens:Number(data.get('maxTokens'))});await open();});
  }
  async function queue(id){
    await read();const task=U.state.tasks.find(t=>t.id===id);if(!task)return;panel='queue';
    if(['running','pending','ready'].includes(task.execution?.status)){
      show('Acompanhar ordem real',`<p class="dialog-intro">${esc(task.title)}</p><p>Estado: ${esc(task.execution.status)} · ${esc(task.execution.provider)}</p><p class="detail-note">Aguardando pode significar dependência, reunião ou pausa. Uma chamada já enviada pode terminar mesmo com o escritório pausado; a entrega espera a retomada para ir à revisão.</p><button type="button" class="secondary-button" data-ai-cancel-task="${esc(id)}">Cancelar ordem</button><button type="button" class="text-button" data-ai-task="${esc(id)}">Atualizar estado</button><p class="detail-note">Cancelar não garante estorno do consumo já realizado.</p>`,null,null);return;
    }
    const c=meta.roles[FirmaEngine.taskDepartment(task)],p=provider(c.provider);
    show('Confirmar ordem para IA real',`<h3>${esc(task.title)}</h3><p class="dialog-intro">${esc(p.name)} · ${esc(c.model||'Modelo padrão da conta')} · ${p.connected?'Conexão pronta':'Conecte este provedor antes de enviar'}</p><p class="detail-note">Se havia progresso simulado ou rascunho nesta missão, ele será substituído pela execução real. A próxima etapa só é liberada após sua aprovação.</p>${consent}${limits}`,'Autorizar e enviar ordem',async data=>{await action('queue',{id,confirm:data.get('confirm')==='on'});U.closeModal();U.toast('Ordem real autorizada. Acompanhe a missão na sala.');});
  }
  async function order(){
    await read();panel='order';show('Ordem ao líder Codex',`<p class="dialog-intro">O Codex responderá de verdade com orientação, riscos e próximos passos. A resposta aparece como uma missão de planejamento para sua revisão, acompanhada pelo planejador da equipe.</p><label>Qual é a sua ordem?<textarea name="goal" required maxlength="3000" placeholder="Descreva o objetivo, contexto e restrições."></textarea></label>${consent}${limits}`,'Enviar ao Codex',async data=>{await action('advice',{goal:data.get('goal'),confirm:data.get('confirm')==='on'});U.closeModal();U.toast('Ordem enviada para a fila do Codex.');});
  }
  async function flow(){
    await read();panel='flow';show('Fluxo de trabalho com IAs reais',`<p class="dialog-intro">Cria quatro ordens: planejar → desenvolver → revisar/testar → preparar postagem. As etapas seguintes recebem o resultado anterior aprovado. É necessário conectar os provedores de todas as funções.</p><label>Objetivo da entrega<textarea name="goal" required maxlength="200"></textarea></label><p class="detail-note">São até quatro chamadas iniciais, mais as revisões que você autorizar. Aprovar uma etapa libera a próxima chamada já autorizada. A sala de Testar faz análise e propõe testes; não executa comandos.</p>${consent}${limits}`,'Autorizar fluxo de quatro etapas',async data=>{await action('flow',{goal:data.get('goal'),confirm:data.get('confirm')==='on'});U.closeModal();U.toast('Quatro ordens reais autorizadas, com revisão entre as etapas.');});
  }
  async function agentOrder(id){
    await read();const agent=U.state.agents.find(a=>a.id===id);if(!agent)return;const c=meta.roles[FirmaEngine.departmentOf(agent)],p=provider(c.provider);
    panel='agent-order';show('Ordem para '+agent.name,`<p class="dialog-intro">${esc(agent.role)} · ${esc(p.name)} · ${esc(c.model||'Modelo padrão da conta')}. A mensagem vira uma tarefa real deste especialista, com resposta no quadro da sala.</p><label>O que este especialista deve fazer?<textarea name="goal" required maxlength="3000"></textarea></label>${consent}${limits}`,'Autorizar ordem real',async data=>{await action('agent.order',{id,goal:data.get('goal'),confirm:data.get('confirm')==='on'});U.closeModal();U.toast('Ordem real registrada para '+agent.name+'.');});
  }
  document.addEventListener('click',async event=>{
    if(!A.isAdmin)return;const b=event.target.closest('button');if(!b)return;
    try{
      if(b.dataset.aiConnect)await connect(b.dataset.aiConnect);
      if(b.hasAttribute('data-ai-refresh'))await open();
      if(b.hasAttribute('data-ai-check')){await action('codex.check');await open();}
      if(b.dataset.aiDisconnect){await action('disconnect',{provider:b.dataset.aiDisconnect});await open();}
      if(b.hasAttribute('data-ai-cancel-login')){await action('codex.cancel');loginWindow?.close();await open();}
      if(b.hasAttribute('data-ai-settings'))await settings();
      if(b.hasAttribute('data-ai-order'))await order();
      if(b.hasAttribute('data-ai-flow'))await flow();
      if(b.dataset.aiTask)await queue(b.dataset.aiTask);
      if(b.dataset.aiCancelTask){await action('cancel',{id:b.dataset.aiCancelTask});U.closeModal();U.toast('Ordem cancelada. O consumo já realizado pode ser cobrado.');}
    }catch(error){if($('modal').open)$('modal-error').textContent=error.message;else U.toast(error.message);}
  });
  $('modal-content').addEventListener('change',event=>{const id=event.target.dataset.aiRole;if(!id||!meta)return;const p=provider(event.target.value);$('modal-content').querySelector('[name="'+id+'-model"]').value='';$('ai-models-'+id).innerHTML=p.models.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');});
  $('modal').addEventListener('close',()=>{panel='';stopPolling();});
  window.FirmaAI={open,order,flow,queue,agentOrder};
})();
