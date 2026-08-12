const WebSocket=require('ws');
async function main(){
 const target=await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:4173/games/box-of-elements/',{method:'PUT'}).then(r=>r.json()),ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,no)=>{ws.once('open',ok);ws.once('error',no)});let id=0;const pending=new Map(),errors=[];
 ws.on('message',raw=>{const m=JSON.parse(raw);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.no(m.error):p.ok(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)});
 const send=(method,params={})=>new Promise((ok,no)=>{const n=++id;pending.set(n,{ok,no});ws.send(JSON.stringify({id:n,method,params}))});
 await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});await new Promise(r=>setTimeout(r,800));
 await send('Runtime.evaluate',{expression:`window.__perf={frames:0,maxGap:0,last:performance.now()};(function watch(t){const p=window.__perf;p.frames++;p.maxGap=Math.max(p.maxGap,t-p.last);p.last=t;requestAnimationFrame(watch)})(performance.now())`});
 const samples=[];for(let i=0;i<4;i++){await new Promise(r=>setTimeout(r,5000));const s=await send('Runtime.evaluate',{returnByValue:true,expression:`({...window.__perf,particles:document.querySelector('#stats').textContent,visibility:document.visibilityState})`});samples.push(s.result.value)}
 console.log(JSON.stringify({samples,errors},null,2));ws.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
