(()=>{'use strict';
const C=window.GraveCore,canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),frame=document.querySelector('.frame');ctx.imageSmoothingEnabled=false;
const W=320,H=180,STEP=20;let state='title',last=0,acc=0,tick=0,camera=0,score=0,checkpoint=36,keys={},pressed={},audio=null;
const solids=[
 {x:0,y:151,w:420,h:29},{x:455,y:151,w:230,h:29},{x:720,y:151,w:240,h:29},{x:995,y:151,w:405,h:29},
 {x:125,y:123,w:45,h:8},{x:208,y:106,w:54,h:8},{x:315,y:128,w:60,h:8},{x:474,y:118,w:60,h:8},{x:580,y:91,w:52,h:8},
 {x:755,y:122,w:65,h:8},{x:850,y:95,w:56,h:8},{x:1010,y:124,w:55,h:8},{x:1115,y:105,w:70,h:8},{x:1245,y:126,w:65,h:8}
];
const ladders=[{x:230,y:106,w:10,h:45},{x:598,y:91,w:10,h:60},{x:872,y:95,w:10,h:56},{x:1142,y:105,w:10,h:46}];
const player={x:36,y:125,w:12,h:26,vx:0,vy:0,jumpVx:0,grounded:false,armoured:true,lives:3,invuln:0,state:'alive',deathTimer:0,fireCd:0,face:1,crouch:false,onLadder:false};
let enemies=[],bolts=[],enemyBolts=[],particles=[],platform,boss,portal,toast='';let toastTime=0;
function enemy(type,x,y){const defs={risen:[12,18,2],thorn:[16,18,3],wing:[16,10,2],charger:[20,28,6]};const d=defs[type];return{type,x,y,w:d[0],h:d[1],hp:d[2],vx:0,vy:0,t:Math.floor(x)%80,alive:true,emerge:type==='risen'?55:0,face:-1};}
function reset(full=true){if(full){score=0;checkpoint=36;player.lives=3;}Object.assign(player,{x:checkpoint,y:110,vx:0,vy:0,jumpVx:0,armoured:true,invuln:50,state:'alive',deathTimer:0,fireCd:0,face:1});
 enemies=[enemy('risen',165,133),enemy('thorn',340,133),enemy('wing',465,68),enemy('risen',548,133),enemy('thorn',650,133),enemy('wing',770,62),enemy('charger',900,123),enemy('risen',1040,133),enemy('thorn',1165,133)];
 bolts=[];enemyBolts=[];particles=[];platform={x:676,y:125,w:42,h:7,dir:1};boss=enemy('charger',1280,113);boss.w=26;boss.h=38;boss.hp=16;boss.maxHp=16;boss.boss=true;portal={x:1350,y:108,w:26,h:43,open:false};camera=C.clamp(player.x-80,0,1080);toast='FIND THE DAWN SEAL';toastTime=110;}
function snd(kind){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);const now=audio.currentTime;const p={fire:[660,.06,'square'],hit:[150,.14,'sawtooth'],jump:[280,.08,'square'],armour:[90,.24,'sawtooth'],death:[70,.5,'square'],key:[880,.45,'triangle'],step:[110,.04,'square']}[kind];o.type=p[2];o.frequency.setValueAtTime(p[0],now);if(kind==='key')o.frequency.exponentialRampToValueAtTime(1320,now+p[1]);else o.frequency.exponentialRampToValueAtTime(Math.max(35,p[0]/2),now+p[1]);g.gain.setValueAtTime(.055,now);g.gain.exponentialRampToValueAtTime(.001,now+p[1]);o.start();o.stop(now+p[1]);}catch{}}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=i/n*Math.PI*2;particles.push({x,y,vx:Math.cos(a)*(Math.random()*1.8+.4),vy:Math.sin(a)*(Math.random()*1.8+.4),life:25+Math.random()*18,color});}}
function hurt(){const result=C.applyHit(player);if(result==='ignored')return;if(result==='armour'){snd('armour');burst(player.x+6,player.y+9,'#f8df9e',18);frame.classList.add('shake');setTimeout(()=>frame.classList.remove('shake'),250);toast='ARMOUR SHATTERED';toastTime=70;}else{snd('death');burst(player.x+6,player.y+8,'#ff6347',28);frame.classList.add('shake');setTimeout(()=>frame.classList.remove('shake'),250);}}
function respawn(){if(player.lives<=0){showOverlay('QUEST ENDED',`Score ${score.toString().padStart(6,'0')}`,'gameover');return;}Object.assign(player,{x:checkpoint,y:100,vx:0,vy:0,state:'alive',armoured:true,invuln:90});}
function shoot(){if(player.fireCd||bolts.filter(b=>b.alive).length>=3||player.state!=='alive')return;player.fireCd=14;bolts.push({x:player.x+(player.face>0?13:-1),y:player.y+(player.crouch?18:9),vx:player.face*3.3,r:2,life:105,alive:true});snd('fire');for(let i=0;i<5;i++)particles.push({x:player.x+(player.face>0?14:0),y:player.y+9,vx:player.face*(.5+Math.random()),vy:(Math.random()-.5),life:8,color:'#ffcf73'});}
function updatePlayer(){if(player.state==='dead'){if(--player.deathTimer<=0)respawn();return;}if(player.invuln>0)player.invuln--;if(player.fireCd>0)player.fireCd--;const left=keys.left||keys.KeyA||keys.ArrowLeft,right=keys.right||keys.KeyD||keys.ArrowRight,down=keys.down||keys.KeyS||keys.ArrowDown,up=keys.jump||keys.KeyW||keys.ArrowUp||keys.KeyZ;
 const ladder=ladders.find(l=>C.overlap(player,l));player.onLadder=!!ladder&&(up||down||player.onLadder);player.crouch=!!down&&player.grounded;
 if(player.onLadder){player.vy=(down?1:0)-(up?1:0);player.vx=0;if(ladder)player.x+=(ladder.x+ladder.w/2-(player.x+player.w/2))*.25;if(!ladder)player.onLadder=false;}else{if(player.grounded){player.vx=(right?1.25:0)-(left?1.25:0);if(player.vx)player.face=Math.sign(player.vx);}else player.vx=player.jumpVx;player.vy=Math.min(player.vy+.19,4.6);}
 if((pressed.jump||pressed.KeyW||pressed.ArrowUp||pressed.KeyZ)&&player.grounded&&!down){const dir=left?-1:right?1:player.face;C.fixedJump(player,dir);player.vx=player.jumpVx;snd('jump');}
 if(pressed.fire||pressed.Space||pressed.KeyX)shoot();if(player.crouch)player.vx=0;
 const movingSolids=solids.concat(platform);C.moveAndCollide(player,player.vx,player.vy,movingSolids);player.x=C.clamp(player.x,0,1388-player.w);if(player.y>190)hurt();
 if(player.x>740&&checkpoint<738){checkpoint=738;toast='EMBER MARK LIT';toastTime=100;snd('key');}
 for(const e of enemies.concat(boss.alive?[boss]:[]))if(e.alive&&C.overlap(player,e))hurt();for(const b of enemyBolts)if(C.projectileHit(b,player)){b.alive=false;hurt();}
}
function updateEnemy(e){if(!e.alive)return;e.t++;e.face=player.x<e.x?-1:1;if(e.emerge>0){e.emerge--;return;}if(e.type==='risen'){e.vx=e.face*.28;if(e.t%170===0)e.vy=-2.4;}else if(e.type==='thorn'){e.vx=0;if(e.t%95===0){const dx=player.x-e.x,dy=player.y-e.y,d=Math.hypot(dx,dy)||1;enemyBolts.push({x:e.x+8,y:e.y+5,vx:dx/d*1.55,vy:dy/d*1.55,r:2,life:180,alive:true});}}else if(e.type==='wing'){e.vx=e.face*.62;e.vy=Math.sin(e.t*.08)*.55;}else if(e.type==='charger'){const near=Math.abs(player.x-e.x)<145;e.vx=e.face*(near?(e.boss?1.05:1.45):.22);if(e.boss&&e.t%82===0){for(const a of [-.35,0,.35])enemyBolts.push({x:e.x+12,y:e.y+8,vx:e.face*1.5,vy:a,r:3,life:160,alive:true});}}
 if(e.type==='wing'){e.x+=e.vx;e.y+=e.vy;}else{e.vy=Math.min(e.vy+.18,4);C.moveAndCollide(e,e.vx,e.vy,solids.concat(platform));}
}
function updateProjectiles(){for(const b of bolts){b.x+=b.vx;b.life--;if(b.life<=0||solids.some(s=>b.x>s.x&&b.x<s.x+s.w&&b.y>s.y&&b.y<s.y+s.h))b.alive=false;for(const e of enemies.concat(boss.alive?[boss]:[]))if(e.alive&&C.projectileHit(b,e)){b.alive=false;e.hp--;snd('hit');burst(b.x,b.y,'#69d1c5',5);if(e.hp<=0){e.alive=false;score+=e.boss?2500:({risen:100,thorn:200,wing:250,charger:500}[e.type]);burst(e.x+e.w/2,e.y+e.h/2,e.boss?'#ffcf73':'#d65e6c',e.boss?35:14);if(e.boss){portal.open=true;toast='THE DAWN SEAL AWAKENS';toastTime=130;snd('key');}}break;}}
 for(const b of enemyBolts){b.x+=b.vx;b.y+=b.vy;b.life--;if(b.life<=0)b.alive=false;}bolts=bolts.filter(b=>b.alive);enemyBolts=enemyBolts.filter(b=>b.alive);
}
function update(){if(state!=='play')return;tick++;platform.x+=platform.dir*.45;if(platform.x>714||platform.x<670)platform.dir*=-1;updatePlayer();enemies.forEach(updateEnemy);updateEnemy(boss);updateProjectiles();for(const p of particles){p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life--;}particles=particles.filter(p=>p.life>0);if(toastTime>0)toastTime--;camera+=((C.clamp(player.x-95,0,1080))-camera)*.12;if(portal.open&&C.overlap(player,portal)){score+=5000;showOverlay('DAWN RESTORED',`The Briar Warden falls. Final score ${score.toString().padStart(6,'0')}`,'win');snd('key');}pressed={};}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x-camera),Math.round(y),w,h)}
function screenRect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function text(t,x,y,c='#f8df9e',align='left'){ctx.fillStyle=c;ctx.font='7px monospace';ctx.textAlign=align;ctx.fillText(t,x,y)}
function drawBackground(){
 const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#090d24');grad.addColorStop(.55,'#29304b');grad.addColorStop(1,'#522d46');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 const mx=258-camera*.025;ctx.fillStyle='#fff4c7';ctx.beginPath();ctx.arc(mx,31,18,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d9cda8';ctx.fillRect(mx-7,22,4,3);ctx.fillRect(mx+6,35,3,4);ctx.fillStyle='#12172e';ctx.beginPath();ctx.arc(mx+8,24,17,0,Math.PI*2);ctx.fill();
 for(let i=0;i<34;i++){const x=(i*97-camera*.055)%430;screenRect(x<0?x+430:x,18+(i*23)%67,i%5===0?2:1,1,i%4?'#8792b7':'#e7d9ad');}
 // Distant castle and hills.
 const cx=205-camera*.09;screenRect(cx,79,62,72,'#171a31');screenRect(cx+5,62,13,89,'#171a31');screenRect(cx+43,68,14,83,'#171a31');screenRect(cx+9,55,5,9,'#171a31');screenRect(cx+47,60,5,10,'#171a31');for(let y=86;y<136;y+=15)for(let x=0;x<3;x++)screenRect(cx+12+x*17,y,3,6,'#62506a');
 ctx.fillStyle='#151a2e';ctx.beginPath();ctx.moveTo(0,143);for(let x=0;x<=W;x+=24)ctx.lineTo(x,104+((x+Math.floor(camera*.12))%63)*.35);ctx.lineTo(W,180);ctx.lineTo(0,180);ctx.fill();
 // Midground crooked trees and gravestones.
 for(let i=0;i<13;i++){const x=((i*92-camera*.36)%430+430)%430-40,y=138-(i%3)*3;screenRect(x+17,y-52,6,55,'#242139');screenRect(x+8,y-43,13,5,'#242139');screenRect(x+4,y-48,5,10,'#242139');screenRect(x+21,y-34,14,5,'#242139');screenRect(x+32,y-42,5,12,'#242139');}
 for(let x=18;x<1400;x+=47){const h=11+(x%4)*2;rect(x,151-h,13,h,'#51455b');rect(x+2,153-h,9,2,'#7c6974');rect(x+5,145-h,3,5,'#322d43');}
 // Ground fog ribbons.
 ctx.globalAlpha=.17;for(let i=0;i<4;i++){ctx.fillStyle='#b6c6c9';ctx.beginPath();ctx.ellipse(70+i*95-(camera*.18%95),139+i%2*9,72,6,0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
}
function drawWorld(){
 for(const s of solids){rect(s.x,s.y,s.w,s.h,'#29283b');rect(s.x,s.y,s.w,3,'#89906d');rect(s.x,s.y+3,s.w,3,'#53604f');for(let x=s.x+3;x<s.x+s.w;x+=12){rect(x,s.y+8+(x%3)*5,8,4,'#3d3847');rect(x+1,s.y+9+(x%3)*5,6,1,'#554c58');}}
 for(const l of ladders){rect(l.x-1,l.y,3,l.h,'#6c453c');rect(l.x+l.w-2,l.y,3,l.h,'#6c453c');for(let y=l.y+3;y<l.y+l.h;y+=7){rect(l.x,y,l.w,2,'#c48757');rect(l.x+1,y,l.w-2,1,'#e1ae72');}}
 rect(platform.x-2,platform.y-2,platform.w+4,2,'#d8c078');rect(platform.x,platform.y,platform.w,platform.h,'#4b6f65');for(let x=platform.x+4;x<platform.x+platform.w;x+=8)rect(x,platform.y+2,4,2,'#82b39c');
 // Checkpoint brazier.
 rect(735,133,10,4,'#4a3442');rect(738,126,4,25,'#8c5b47');const flame=tick%10<5?0:2;rect(738,122-flame,4,7+flame,'#ff653f');rect(739,119-flame,2,6,'#ffd16b');
 if(portal.open){const pulse=2+Math.sin(tick*.13)*2;ctx.globalAlpha=.35;rect(portal.x-pulse,portal.y-pulse,portal.w+pulse*2,portal.h+pulse*2,'#68f6d2');ctx.globalAlpha=1;rect(portal.x,portal.y,portal.w,portal.h,'#c8aa70');rect(portal.x+4,portal.y+4,portal.w-8,portal.h-4,'#18263e');rect(portal.x+8,portal.y+8,portal.w-16,portal.h-8,'#69d1c5');}else{rect(portal.x,portal.y,portal.w,portal.h,'#3a3447');rect(portal.x+4,portal.y+4,portal.w-8,portal.h-4,'#211f31');rect(portal.x+10,portal.y+15,6,6,'#69546a');}
}
function drawEntity(e){if(!e.alive)return;const rise=e.emerge>0?Math.max(0,e.h-e.emerge/3):0,y=e.y+rise,h=e.y+e.h-y;if(h<=0)return;const flip=e.face>0?1:-1,eye=e.face>0?e.x+e.w-5:e.x+3;
 if(e.type==='risen'){rect(e.x+2,y+3,e.w-4,h-3,'#52705d');rect(e.x,y+7,e.w,h-9,'#65836a');rect(e.x+3,y,e.w-5,8,'#829477');rect(eye,y+3,2,2,'#ffc94e');rect(e.x+(flip>0?9:-3),y+10,6,3,'#8ca17a');rect(e.x+1,e.y+e.h-3,4,3,'#303a35');rect(e.x+8,e.y+e.h-3,4,3,'#303a35');}
 else if(e.type==='thorn'){rect(e.x+3,y+7,10,h-7,'#41634e');rect(e.x+1,y+2,14,10,'#9e3f5b');rect(e.x+4,y,3,4,'#d86670');rect(e.x+10,y-2,3,5,'#d86670');rect(eye,y+5,2,2,'#ffe06f');for(let i=0;i<3;i++)rect(e.x-2+i*8,e.y+e.h-4,6,2,'#668059');}
 else if(e.type==='wing'){const flap=tick%12<6?0:4;rect(e.x+4,y+2,8,8,'#6e578a');rect(e.x+6,y,6,4,'#b29ad2');rect(eye,y+2,2,2,'#ffde64');rect(e.x-7,y+flap,11,3,'#8a72a8');rect(e.x-4,y+3+flap,8,3,'#6e578a');rect(e.x+12,y+flap,11,3,'#8a72a8');rect(e.x+12,y+3+flap,8,3,'#6e578a');}
 else{const body=e.boss?'#8b3e4b':'#8c503e',metal=e.boss?'#c56c51':'#c27a56';rect(e.x+3,y+9,e.w-6,h-9,body);rect(e.x+1,y+14,e.w-2,8,metal);rect(e.x+4,y,e.w-8,12,'#554052');rect(e.x+1,y+2,5,4,'#d5af67');rect(e.x+e.w-6,y+2,5,4,'#d5af67');rect(eye,y+6,3,2,'#ffcf52');rect(e.x+(flip>0?e.w-1:-5),y+17,7,5,'#c56c51');rect(e.x+3,e.y+e.h-4,7,4,'#33293a');rect(e.x+e.w-10,e.y+e.h-4,7,4,'#33293a');}
}
function drawPlayer(){if(player.state==='dead'||(player.invuln>0&&tick%6<3))return;const crouch=player.crouch?7:0,y=player.y+crouch,walk=player.grounded&&Math.abs(player.vx)>.1?Math.floor(tick/6)%2:0,dir=player.face;
 // Cape behind the body.
 rect(player.x+(dir>0?-3:8),y+8,7,13-crouch,'#6f2944');rect(player.x+(dir>0?-4:9),y+17-crouch,7,5,'#9a3e50');
 // Boots and legs.
 rect(player.x+1,y+20-crouch+walk,4,6-walk,'#393348');rect(player.x+8,y+20-crouch+(1-walk),4,5+walk,'#393348');
 if(player.armoured){rect(player.x+1,y+7,11,14-crouch,'#a8b1b6');rect(player.x+3,y+8,7,11-crouch,'#d9ddcf');rect(player.x,y+9,3,7,'#707b86');}else{rect(player.x+1,y+7,11,14-crouch,'#a74450');rect(player.x+3,y+8,7,11-crouch,'#df7960');}
 // Helmet/head plume.
 rect(player.x+2,y,9,8,player.armoured?'#cbd2cf':'#c96b58');rect(player.x+1,y+3,11,4,player.armoured?'#78828c':'#8f3f4a');rect(player.x+4,y-3,4,4,'#d74d54');rect(player.x+6,y-5,4,3,'#f07b58');rect(player.x+(dir>0?9:2),y+4,2,2,'#ffda65');
 // Gauntlet and glowing bolt launcher.
 rect(player.x+(dir>0?10:-3),y+10,5,4,player.armoured?'#d9ddcf':'#d97861');rect(player.x+(dir>0?13:-6),y+10,5,3,'#4fb4ad');rect(player.x+(dir>0?17:-7),y+11,2,1,'#b9fff0');
}
function render(){drawBackground();drawWorld();enemies.forEach(drawEntity);drawEntity(boss);for(const b of bolts){rect(b.x-4,b.y-1,7,3,'#3f8f91');rect(b.x-1,b.y-2,5,5,'#baffdf');}for(const b of enemyBolts){ctx.globalAlpha=.3;rect(b.x-b.r-2,b.y-b.r-2,b.r*2+4,b.r*2+4,'#ff4f56');ctx.globalAlpha=1;rect(b.x-b.r,b.y-b.r,b.r*2,b.r*2,'#ff9b54');}for(const p of particles)rect(p.x,p.y,p.life>18?2:1,p.life>18?2:1,p.color);drawPlayer();const vignette=ctx.createRadialGradient(W/2,H/2,55,W/2,H/2,185);vignette.addColorStop(.55,'#0000');vignette.addColorStop(1,'#03030bae');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);ctx.fillStyle='#090b17e8';ctx.fillRect(0,0,W,15);screenRect(0,14,W,1,'#786276');text(`✦ ${score.toString().padStart(6,'0')}`,7,10,'#ffdb80');text(`LIVES ${Math.max(0,player.lives)}  ${player.armoured?'◆ ARMOUR':'◇ EXPOSED'}`,313,10,player.armoured?'#cde5dc':'#ff846b','right');if(boss.alive&&player.x>1100){screenRect(85,19,150,10,'#100d19');screenRect(88,22,144,4,'#3e2638');screenRect(88,22,144*(boss.hp/boss.maxHp),4,'#d65e6c');text('BRIAR WARDEN',160,35,'#ffcf73','center');}if(toastTime>0){screenRect(73,147,174,18,'#090b17dc');screenRect(76,150,168,12,'#33283e');text(toast,160,159,'#ffcf73','center');}}
function loop(t){const dt=Math.min(80,t-last);last=t;acc+=dt;while(acc>=STEP){update();acc-=STEP;}render();requestAnimationFrame(loop)}
function start(){reset(true);state='play';document.querySelector('#title').classList.add('hidden');document.querySelector('#overlay').classList.add('hidden');audio=audio||new(window.AudioContext||window.webkitAudioContext)();audio.resume();}
function showOverlay(title,body,kind='pause'){state=kind;document.querySelector('#overlayTitle').textContent=title;document.querySelector('#overlayText').textContent=body;document.querySelector('#overlayKicker').textContent=kind==='win'?'QUEST COMPLETE':kind==='gameover'?'THE WILDS CLAIM YOU':'A MOMENT OF SILENCE';document.querySelector('#resume').textContent=kind==='pause'?'RESUME':'PLAY AGAIN';document.querySelector('#overlay').classList.remove('hidden');}
function togglePause(){if(state==='play')showOverlay('PAUSED','The burial wilds wait.','pause');else if(state==='pause'){state='play';document.querySelector('#overlay').classList.add('hidden');}}
const map={KeyA:'KeyA',KeyD:'KeyD',KeyS:'KeyS',KeyW:'KeyW',ArrowLeft:'ArrowLeft',ArrowRight:'ArrowRight',ArrowDown:'ArrowDown',ArrowUp:'ArrowUp',KeyZ:'KeyZ',KeyX:'KeyX',Space:'Space'};
addEventListener('keydown',e=>{if(map[e.code]){if(!keys[map[e.code]])pressed[map[e.code]]=true;keys[map[e.code]]=true;e.preventDefault();}if((e.code==='KeyP'||e.code==='Escape')&&state!=='title')togglePause();});addEventListener('keyup',e=>{if(map[e.code])keys[map[e.code]]=false;});
document.querySelector('#start').onclick=start;document.querySelector('#resume').onclick=()=>{if(state==='pause')togglePause();else start();};document.querySelector('#restart').onclick=start;
document.querySelectorAll('#touch button').forEach(b=>{const k=b.dataset.key;const on=e=>{e.preventDefault();if(!keys[k])pressed[k]=true;keys[k]=true;};const off=e=>{e.preventDefault();keys[k]=false;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
reset(true);requestAnimationFrame(loop);
})();
