/* The app boots only after an explicit visit or a verified admin session. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  $('show-login').disabled=$('visit-office').disabled=true;
  let session=null,setupToken=new URLSearchParams(location.hash.slice(1)).get('configurar')||'',queue=Promise.resolve(),started=false,legacy=null;
  if(setupToken)history.replaceState(null,'',location.pathname+location.search);
  const status=message=>$('access-status').textContent=message;
  const error=message=>$('access-error').textContent=message;
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(10000),...options,headers:{...options.headers}});
    const data=await response.json();if(!response.ok){const failure=new Error(data.error||'Não foi possível conectar ao escritório.');failure.status=response.status;throw failure;}return data;
  }
  function post(url,payload,authenticated=false){return request(url,{method:'POST',keepalive:payload?.action==='player',headers:{'Content-Type':'application/json',...(authenticated?{'X-Firma-CSRF':session.csrf}:{})},body:JSON.stringify(payload)});}
  function form(name){for(const id of ['access-choices','login-form','setup-form','legacy-choice'])$(id).hidden=id!==name;error('');}
  function choices(){form('access-choices');$('access-heading').textContent='Como você quer entrar?';$('access-description').textContent='Um espaço para criar. Uma porta aberta para conhecer.';status('Escritório disponível para visitas.');}
  function login(){form('login-form');$('access-heading').textContent='Seu escritório espera por você.';$('access-description').textContent='Entre com o acesso exclusivo do administrador.';status(session?.setupRequired?'Primeiro acesso? Abra Iniciar Firma.bat para configurar seu login.':'Administração reservada ao proprietário.');$('login-username').focus();}
  function setup(){form('setup-form');$('access-heading').textContent='Este escritório é seu.';$('access-description').textContent='Configure seu único acesso de administrador.';status('Escolha uma senha que só você conhece.');}
  function loadScript(src){return new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=()=>reject(new Error('Não foi possível carregar o escritório. Atualize a página.'));document.body.append(script);});}
  async function start(role){
    if(!window.FirmaVillage||!window.FirmaWorld)throw new Error('Os arquivos do novo cenário não foram carregados. Feche o servidor antigo com Ctrl+C, abra Iniciar Firma.bat novamente e atualize esta página com Ctrl+F5.');
    if(started)return;status('Abrindo o escritório…');
    const initial=await request('/api/state'+(role==='visitor'?'?public=1':''));
    const access={role,initial,username:session.username||'',get isAdmin(){return role==='admin';},
      async read(){const data=await request('/api/state'+(role==='visitor'?'?public=1':''));if(role==='admin'&&data.role!=='admin'){location.reload();throw new Error('Sua sessão expirou. Entre novamente.');}return data;},
      command(action,payload={}){if(role!=='admin')return Promise.reject(new Error('A visita é somente leitura. Entre como administrador para alterar o escritório.'));const task=queue.then(()=>post('/api/action',{action,payload},true));queue=task.catch(()=>{});return task;},
      async logout(){if(role==='admin')await post('/api/logout',{},true);location.reload();},
      login(){location.assign('/?login=1');},
      async aiStatus(){if(role!=='admin')throw new Error('Conexões reservadas ao administrador.');return request('/api/ai/status');},
      ai(action,payload={}){if(role!=='admin')return Promise.reject(new Error('Conexões reservadas ao administrador.'));return request('/api/ai/action',{method:'POST',signal:AbortSignal.timeout(30000),headers:{'Content-Type':'application/json','X-Firma-CSRF':session.csrf},body:JSON.stringify({action,payload})});},
      async studioRead(resource){if(role!=='admin')throw new Error('Bancada reservada ao administrador.');return request('/api/studio/'+resource);},
      studio(action,payload={}){if(role!=='admin')return Promise.reject(new Error('Bancada reservada ao administrador.'));return post('/api/studio/action',{action,payload},true);},
      async companyRead(resource='status'){if(role!=='admin')throw new Error('Projetos reservados ao administrador.');return request('/api/company/'+resource);},
      company(action,payload={}){if(role!=='admin')return Promise.reject(new Error('Projetos reservados ao administrador.'));return request('/api/company/action',{method:'POST',signal:AbortSignal.timeout(60000),headers:{'Content-Type':'application/json','X-Firma-CSRF':session.csrf},body:JSON.stringify({action,payload})});},
      async backup(){if(role!=='admin')throw new Error('Backup reservado ao administrador.');return request('/api/backup');}
    };
    window.FirmaAccess=access;started=true;
    document.body.classList.toggle('visitor',role==='visitor');$('access-role').textContent=role==='admin'?'ADMIN · '+session.username:'VISITANTE';$('session-exit').textContent=role==='admin'?'Sair':'Login';
    $('session-exit').onclick=()=>{if(role==='visitor')access.login();else access.logout().catch(e=>window.FirmaUI?.toast(e.message));};
    await loadScript('activity.js');await loadScript('ui.js');await loadScript('ai-ui.js');if(role==='admin')await loadScript('company-ui.js');await loadScript('scene-controls.js');await loadScript('app.js');if(role==='admin')await loadScript('studio.js');$('access-gate').hidden=true;document.body.classList.remove('gated');
  }
  async function enterAdmin(){
    session=await request('/api/session');
    try{const raw=localStorage.getItem('firma-office-v2')||localStorage.getItem('firma-office-v1');if(raw&&session.legacyImportAvailable&&sessionStorage.getItem('firma-legacy-dismissed')!=='yes')legacy=window.FirmaEngine.migrate(JSON.parse(raw));}catch{legacy=null;}
    if(legacy){form('legacy-choice');$('access-heading').textContent='Seu escritório anterior está aqui.';$('access-description').textContent='Traga seus agentes e missões para a nova versão.';status('Seus dados antigos serão preservados neste navegador.');return;}
    await start('admin');
  }
  async function busy(formElement,callback){const buttons=[...formElement.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);error('');try{await callback();}catch(e){error(e.message);status('Confira os dados e tente novamente.');}finally{buttons.forEach(b=>b.disabled=false);}}
  $('show-login').onclick=login;document.querySelectorAll('[data-access-back]').forEach(b=>b.onclick=choices);
  $('visit-office').onclick=()=>busy($('access-choices'),()=>start('visitor'));
  $('login-form').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{await post('/api/login',{username:$('login-username').value,password:$('login-password').value});$('login-password').value='';await enterAdmin();});};
  $('setup-form').onsubmit=e=>{e.preventDefault();busy(e.target,async()=>{if($('setup-password').value!==$('setup-confirm').value)throw new Error('As senhas precisam ser iguais.');await post('/api/setup',{token:setupToken,username:$('setup-username').value,password:$('setup-password').value});setupToken='';$('setup-password').value=$('setup-confirm').value='';await enterAdmin();});};
  $('import-legacy').onclick=()=>busy($('legacy-choice'),async()=>{await post('/api/action',{action:'restore',payload:{state:legacy}},true);legacy=null;await start('admin');});
  $('skip-legacy').onclick=()=>busy($('legacy-choice'),async()=>{await post('/api/action',{action:'legacy.dismiss'},true);sessionStorage.setItem('firma-legacy-dismissed','yes');legacy=null;await start('admin');});
  window.addEventListener('hashchange',()=>{const token=new URLSearchParams(location.hash.slice(1)).get('configurar');if(token&&!started&&session?.setupRequired){setupToken=token;history.replaceState(null,'',location.pathname+location.search);setup();}else if(location.hash==='#login'){if(started)location.reload();else login();}});
  request('/api/session').then(async data=>{session=data;$('show-login').disabled=$('visit-office').disabled=false;if(session.role==='admin'){await enterAdmin();return;}if(setupToken&&session.setupRequired)setup();else if(location.hash==='#login'||new URLSearchParams(location.search).get('login')==='1'){history.replaceState(null,'',location.pathname);login();}else choices();}).catch(e=>{error(e.message);status('Inicie a Firma usando Iniciar Firma.bat. O login precisa do servidor Node.js.');$('show-login').disabled=$('visit-office').disabled=true;});
})();
