const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const files = {'/':'index.html','/index.html':'index.html','/style.css':'style.css','/app.js':'app.js','/engine.js':'engine.js','/ui.js':'ui.js','/work.css':'work.css'};
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
const server = http.createServer((req,res)=>{
  const file = files[new URL(req.url,'http://localhost').pathname];
  if(!file){res.writeHead(404);return res.end('Não encontrado');}
  fs.readFile(path.join(root,file),(err,data)=>{if(err){res.writeHead(500);return res.end('Não foi possível carregar o arquivo');}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);});
});
server.listen(3000,'127.0.0.1',()=>{
  console.log('Firma está pronta: http://localhost:3000');
  if(process.argv.includes('--open') && process.platform==='win32'){
    const browser=require('node:child_process').spawn('explorer.exe',['http://localhost:3000'],{stdio:'ignore',windowsHide:true});
    browser.on('error',()=>console.log('Abra http://localhost:3000 no navegador.'));
  }
});
server.on('error',err=>{console.error(err.code==='EADDRINUSE'?'A porta 3000 já está em uso. Feche a outra instância e tente novamente.':err.message);process.exitCode=1;});
