const WebSocket=require('ws');

async function main(){
  const target=await fetch('http://127.0.0.1:9223/json/new?http://127.0.0.1:4173/games/vector-frontline/',{method:'PUT'}).then(r=>r.json());
  const ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject)});
  let id=0,errors=[];const pending=new Map();
  ws.on('message',raw=>{const msg=JSON.parse(raw);if(msg.id&&pending.has(msg.id)){const {resolve,reject}=pending.get(msg.id);pending.delete(msg.id);msg.error?reject(new Error(msg.error.message)):resolve(msg.result)}if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.text)});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});ws.send(JSON.stringify({id:call,method,params}))});
  await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await new Promise(r=>setTimeout(r,700));
  await send('Runtime.evaluate',{expression:"document.querySelector('#play').click()"});await new Promise(r=>setTimeout(r,150));
  const points=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const c=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}};return{lf:c('[data-key=lf]'),rf:c('[data-key=rf]'),fire:c('[data-key=fire]')}})()`});
  const {lf,rf,fire}=points.result.value;
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...lf,id:1},{...rf,id:2}]});await new Promise(r=>setTimeout(r,100));
  const held=await send('Runtime.evaluate',{returnByValue:true,expression:"[...document.querySelectorAll('[data-key=lf],[data-key=rf]')].every(b=>b.classList.contains('pressed'))"});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await new Promise(r=>setTimeout(r,50));
  const released=await send('Runtime.evaluate',{returnByValue:true,expression:"[...document.querySelectorAll('#touch button')].every(b=>!b.classList.contains('pressed'))"});
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...fire,id:3}]});const firing=await send('Runtime.evaluate',{returnByValue:true,expression:"document.querySelector('[data-key=fire]').classList.contains('pressed')"});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const layout=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const n=document.querySelector('#touch'),r=n.getBoundingClientRect();return{visible:getComputedStyle(n).display==='grid',inside:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,viewport:[innerWidth,innerHeight],rect:[r.left,r.top,r.right,r.bottom]}})()`});
  ws.close();
  if(!held.result.value||!released.result.value||!firing.result.value||!layout.result.value.visible||!layout.result.value.inside||errors.length)throw new Error(JSON.stringify({held:held.result.value,released:released.result.value,firing:firing.result.value,layout:layout.result.value,errors}));
  console.log(JSON.stringify({held:true,released:true,firing:true,layout:layout.result.value,errors},null,2));
}

main().catch(e=>{console.error(e);process.exitCode=1});
