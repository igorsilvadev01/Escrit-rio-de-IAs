'use strict';
// Declarative role contracts. The model proposes files; Company executes the fixed local tools.
const contracts={
  leadership:{name:'Coordenar',output:'Planos e decisões em Markdown, texto ou JSON',extensions:['md','txt','json']},
  planning:{name:'Planejar',output:'Requisitos, referências com origem e planos em Markdown, texto ou JSON',extensions:['md','txt','json']},
  development:{name:'Desenvolver',output:'Arquivos de código e documentação do projeto'},
  testing:{name:'Verificar',output:'Testes, scripts de verificação e relatórios; resultados executados ficam nas evidências'},
  publishing:{name:'Preparar conteúdo',output:'Arquivos de conteúdo e páginas para revisão; publicação externa indisponível'}
};
function validateProposal(role,file,workspace){
  workspace.validate(file.path);
  if(typeof file.content!=='string'||Buffer.byteLength(file.content)>300000)throw Error('Arquivo proposto acima do limite.');
  const allowed=contracts[role]?.extensions;
  if(allowed&&!allowed.includes(file.path.split('.').at(-1).toLowerCase()))throw Error('Esta função prepara documentos e planos. Atribua alterações de código ao desenvolvimento.');
}
module.exports={contracts,validateProposal};
