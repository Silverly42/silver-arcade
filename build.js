const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const out = path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for (const item of ['index.html','games.json','games']) fs.cpSync(path.join(root,item),path.join(out,item),{recursive:true});
console.log('Built dist/');
