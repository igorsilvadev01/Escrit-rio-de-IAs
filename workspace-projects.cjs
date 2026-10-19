'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const CODE=/\.(?:js|cjs|mjs|html|css|json|md|bat|txt|ts|tsx|jsx|py|svg)$/i;
const PRIVATE=/(?:^|\/)(?:\.|node_modules|artifacts|dist|coverage)(?:\/|$)|(?:secret|credential|token|password|lockfile)|(?:^|\/)\.[^/]+/i;
class ProjectWorkspace{
  constructor(root,dataDir,clean){this.root=root;this.dataDir=dataDir;this.clean=clean;this.file=path.join(dataDir,'projects.json');this.data=fs.existsSync(this.file)?JSON.parse(fs.readFileSync(this.file,'utf8')):{projects:[],prompts:[]};}
  save(){const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify(this.data),{mode:0o600});fs.renameSync(temp,this.file);}
  list(){return [{id:'firma',name:'Firma · escritório',description:'Código do jogo e documentação',path:this.root},...this.data.projects.map(p=>({...p,path:path.join(this.root,'projects',p.id)}))];}
  base(id='firma'){
    if(id==='firma')return this.root;
    if(!this.data.projects.some(p=>p.id===id)||!/^[a-z0-9-]+$/.test(id))throw Error('Projeto não encontrado.');
    const folder=path.join(this.root,'projects'),dir=path.join(folder,id);
    for(const target of [folder,dir])if(fs.lstatSync(target).isSymbolicLink())throw Error('Pasta vinculada não permitida.');
    return fs.realpathSync(dir);
  }
  validate(name){if(typeof name!=='string'||!name||name.length>200||/[\\:\x00-\x1f]/.test(name)||PRIVATE.test(name)||!CODE.test(name)||name.split('/').some(s=>!s||s==='.'||s==='..'||/[. ]$/.test(s)||/^(?:con|prn|aux|nul|com\d|lpt\d)(?:\.|$)/i.test(s)))throw Error('Use um caminho relativo de código ou documentação, sem pastas privadas.');}
  target(name,id='firma',create=false){
    this.validate(name);const root=this.base(id),parts=name.split('/');if(id==='firma'&&parts.length>1&&!['docs','tests'].includes(parts[0]))throw Error('Crie um projeto para usar pastas próprias.');
    let file=root;
    for(let i=0;i<parts.length;i++){file=path.join(file,parts[i]);if(fs.existsSync(file)){const stat=fs.lstatSync(file);if(stat.isSymbolicLink())throw Error('Links não são permitidos.');if(i<parts.length-1&&!stat.isDirectory())throw Error('Pasta inválida.');}else if(!create)throw Error('Arquivo não encontrado.');}
    const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Arquivo fora do projeto.');
    if(fs.existsSync(file)){const stat=fs.statSync(file);if(!stat.isFile()||stat.nlink!==1||stat.size>300000)throw Error('Arquivo indisponível ou acima de 300 KB.');}
    return file;
  }
  read(name,id='firma'){const file=this.target(name,id),raw=fs.readFileSync(file,'utf8'),text=this.clean(raw);return {path:name,project:id,text,editable:raw===text,modified:fs.statSync(file).mtimeMs,hash:crypto.createHash('sha256').update(raw).digest('hex')};}
  files(id='firma'){
    const result=[],root=this.base(id);const walk=(dir,prefix='',depth=0)=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(result.length>=600)return;const name=prefix+entry.name;if(PRIVATE.test(name)||entry.isSymbolicLink())continue;if(entry.isDirectory()&&depth<5&&(id!=='firma'||prefix||['docs','tests'].includes(entry.name)))walk(path.join(dir,entry.name),name+'/',depth+1);if(entry.isFile()&&CODE.test(name))try{this.target(name,id);result.push({path:name,size:fs.statSync(path.join(dir,entry.name)).size});}catch{}}};walk(root);return result.sort((a,b)=>a.path.localeCompare(b.path));
  }
  create(p){
    const name=String(p.name||'').trim().slice(0,60);if(!name)throw Error('Dê um nome ao projeto.');if(this.data.projects.length>=40)throw Error('Limite de 40 projetos atingido.');
    const folder=path.join(this.root,'projects');if(fs.existsSync(folder)&&fs.lstatSync(folder).isSymbolicLink())throw Error('Pasta vinculada não permitida.');fs.mkdirSync(folder,{recursive:true});
    const id=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,35)+'-'+crypto.randomBytes(4).toString('hex');
    const dir=path.join(folder,id);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'README.md'),'# '+name+'\n\n'+String(p.description||'').slice(0,1500)+'\n');
    fs.writeFileSync(path.join(dir,'index.html'),'<!doctype html>\n<html lang="pt-BR">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+name.replace(/[<>&"]/g,'')+'</title></head>\n<body>\n  <h1>Meu novo projeto</h1>\n</body>\n</html>\n');
    const project={id,name,description:String(p.description||'').slice(0,1500),createdAt:new Date().toISOString()};this.data.projects.push(project);this.save();return {project:this.list().find(p=>p.id===id)};
  }
  write(p){
    if(p.confirm!==true)throw Error('Confirme o salvamento local.');if(typeof p.text!=='string'||Buffer.byteLength(p.text)>300000)throw Error('Conteúdo acima de 300 KB.');
    const id=p.project||'firma',file=this.target(p.path,id,true),exists=fs.existsSync(file);
    if(exists){const current=this.read(p.path,id);if(!current.editable)throw Error('Arquivo com credenciais ocultadas: edição indisponível.');if(!p.hash||p.hash!==current.hash)throw Error('O arquivo mudou no disco. Reabra para comparar antes de salvar.');const backups=path.join(this.dataDir,'file-backups');fs.mkdirSync(backups,{recursive:true});fs.copyFileSync(file,path.join(backups,crypto.randomUUID()+path.extname(file)));}
    else if(p.hash)throw Error('Arquivo removido do disco. Crie-o novamente com outro nome.');
    fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,p.text,{encoding:'utf8',flag:exists?'w':'wx'});return this.read(p.path,id);
  }
  prompt(p){const title=String(p.title||'').trim().slice(0,80),text=String(p.text||'').trim().slice(0,6000);if(!title||!text)throw Error('Preencha nome e conteúdo do prompt.');if(this.data.prompts.length>=60)throw Error('Limite de 60 prompts atingido.');const prompt={id:crypto.randomUUID(),title,text:this.clean(text)};this.data.prompts.push(prompt);this.save();return {prompt};}
}
module.exports={ProjectWorkspace};
