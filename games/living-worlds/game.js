(() => {
  'use strict';
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d', { alpha: false });
  let W = canvas.width, H = canvas.height, N = W * H;
  const EMPTY=0,SAND=1,WATER=2,SOIL=3,SEED=4,WOOD=5,FIRE=6,OIL=7,LAVA=8,STONE=9,ICE=10,STEAM=11,SMOKE=12,ACID=13,SALT=14,GLASS=15,METAL=16,PLANT=17,BUG=18,SPARK=19,TNT=20,POWDER=21,CLONE=22,VOID=23,LIGHTNING=24,SLIME=25,RAINBOW=26,SNOW=27,MUD=28,WAX=29,FUSE=30,BOMB=31,MERCURY=32,FOAM=33,OBSIDIAN=34,CLOUD=35,VIRUS=36,ANTIMATTER=37,CONCRETE=38,QUARTZITE=39,BASALT=40,SULFUR=41,COPPER_ORE=42,CRYSTAL=43;
  const mats = [
    ['Eraser','#071115'],['Sand','#d7b86c'],['Water','#3c8bd9'],['Soil','#79533a'],['Seed','#a7d45b'],
    ['Wood','#a36d3d'],['Fire','#ff6b35'],['Oil','#4c4039'],['Lava','#ef3d24'],['Stone','#737b7d'],
    ['Ice','#a7e9ff'],['Steam','#c9e6e2'],['Smoke','#596164'],['Acid','#89e346'],['Salt','#e8e4d5'],
    ['Glass','#8fc6c5'],['Metal','#aab3bc'],['Plant','#39a84a'],['Critter','#f49bc4'],['Spark','#fff06a'],
    ['TNT','#e12525'],['Gunpowder','#302d32'],['Removed','#071115'],['Void','#120820'],['Lightning','#dff8ff'],
    ['Slime','#39ef8a'],['Rainbow','#ff4da6'],['Snow','#e9f8ff'],['Mud','#65452f'],['Wax','#f4c95d'],
    ['Fuse','#bd7b3a'],['Bomb','#292d35'],['Mercury','#c9d0d6'],['Foam','#f3fff8'],['Obsidian','#271c38'],
    ['Cloud','#b9c8cc'],['Virus','#aaff2c'],['Antimatter','#ff2bd6'],['Concrete','#94918a'],
    ['Quartzite','#d8cbd0'],['Basalt','#34383d'],['Sulfur','#e7d83a'],['Copper Ore','#8c5b43'],['Crystal','#9de8ee']
  ];
  const color = mats.map(m => m[1]);
  let grid = new Uint8Array(N), life = new Uint16Array(N);
  let selected=SAND, brush=4, paused=false, speed=1, drawing=false, count=0, tick=0, inspectMode=false, lastPaint=null;
  let mineralTime=180, ambientTemp=20, brushShape='circle', brushSolid=true;
  const reactionEnabled=new Uint8Array(256).fill(1),movementEnabled=new Uint8Array(256).fill(1);
  const hiddenElements=new Set([QUARTZITE,BASALT,SULFUR,COPPER_ORE,CRYSTAL,OBSIDIAN]);
  let contextElement=EMPTY,lastTapAt=0,lastTapCell=null;
  const idx=(x,y)=>x+y*W, inside=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
  const swap=(a,b)=>{const g=grid[a],l=life[a];grid[a]=grid[b];life[a]=life[b];grid[b]=g;life[b]=l};
  const set=(x,y,v,age=0)=>{if(inside(x,y)){const i=idx(x,y);grid[i]=v;life[i]=age}};
  const empty=(x,y)=>inside(x,y)&&grid[idx(x,y)]===EMPTY;
  const move=(x,y,nx,ny)=>{if(empty(nx,ny)){swap(idx(x,y),idx(nx,ny));return true}return false};
  const chance=n=>Math.random()<n;

  function explode(x,y,radius){
    for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
      const d=Math.hypot(xx,yy);if(d>radius||!inside(x+xx,y+yy))continue;
      const i=idx(x+xx,y+yy),v=grid[i];
      if(v===TNT&&!(xx===0&&yy===0)){life[i]=Math.max(life[i],14);continue}
      if(d<radius*.42){grid[i]=chance(.45)?FIRE:EMPTY;life[i]=0}
      else if(v!==METAL&&v!==GLASS&&chance((radius-d)/radius+.2)){grid[i]=chance(.55)?FIRE:SMOKE;life[i]=0}
    }
  }

  function updatePowder(x,y){if(move(x,y,x,y+1))return;const d=chance(.5)?-1:1;if(move(x,y,x+d,y+1)||move(x,y,x-d,y+1))return;const below=inside(x,y+1)?grid[idx(x,y+1)]:STONE;if(below===WATER||below===OIL||below===ACID)swap(idx(x,y),idx(x,y+1));}
  function updateLiquid(x,y,range=3){if(move(x,y,x,y+1))return;const d=chance(.5)?-1:1;for(let s=1;s<=range;s++)if(move(x,y,x+d*s,y)){return}for(let s=1;s<=range;s++)if(move(x,y,x-d*s,y)){return}}
  function updateGas(x,y){const d=Math.floor(Math.random()*3)-1;if(move(x,y,x+d,y-1))return;move(x,y,x+(chance(.5)?-1:1),y);}
  function near(x,y,type){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&inside(x+xx,y+yy)&&grid[idx(x+xx,y+yy)]===type)return [x+xx,y+yy];return null}
  const hot=(x,y)=>near(x,y,FIRE)||near(x,y,LAVA)||near(x,y,LIGHTNING);
  function burnAround(x,y){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!inside(x+xx,y+yy))continue;const i=idx(x+xx,y+yy),v=grid[i];if(!reactionEnabled[v])continue;const burnChance=v===OIL?.38:(v===POWDER||v===FUSE)?.86:v===PLANT||v===SEED?.12:v===WOOD?.065:v===WAX?.09:0;if(burnChance&&chance(burnChance)){grid[i]=FIRE;life[i]=0}if(v===TNT||v===BOMB)life[i]=Math.max(life[i],1)}}
  function updateCell(x,y){const i=idx(x,y),v=grid[i];if(!v)return;life[i]++;
    if(!movementEnabled[v])return;
    if(!reactionEnabled[v]){if([SAND,SALT,SOIL,POWDER,SNOW,SEED,FUSE,BOMB,SULFUR,COPPER_ORE,ANTIMATTER].includes(v))updatePowder(x,y);else if([WATER,OIL,ACID,LAVA,SLIME,MUD,MERCURY,CONCRETE].includes(v))updateLiquid(x,y,v===WATER||v===OIL||v===MERCURY?5:2);else if([STEAM,SMOKE,FOAM,CLOUD,FIRE].includes(v))updateGas(x,y);return}
    if(v===SAND||v===SALT||v===SOIL||v===POWDER||v===SNOW||v===SULFUR||v===COPPER_ORE){if(v===SAND&&near(x,y,LAVA)){if(life[i]>mineralTime){grid[i]=QUARTZITE;life[i]=0}return}if(v===SALT&&near(x,y,LAVA)&&life[i]>mineralTime*.7){grid[i]=CRYSTAL;life[i]=0;return}if(v===SOIL&&near(x,y,LAVA)&&life[i]>mineralTime){grid[i]=chance(.72)?BASALT:(chance(.55)?COPPER_ORE:SULFUR);life[i]=0;return}if(v===SNOW&&(hot(x,y)||ambientTemp>0)&&chance(ambientTemp>0?.08:1)){grid[i]=WATER;life[i]=0;return}updatePowder(x,y);return}
    if(v===WATER){if(near(x,y,LAVA)){grid[i]=STEAM;const p=near(x,y,LAVA);if(p)set(p[0],p[1],OBSIDIAN);return}if((near(x,y,FIRE)||ambientTemp>=100)&&life[i]>18&&chance(ambientTemp>=100?.12:1)){grid[i]=STEAM;life[i]=0;return}const salt=near(x,y,SALT);if(salt&&chance(.12)){set(salt[0],salt[1],EMPTY);return}const dirt=near(x,y,SOIL);if(dirt&&chance(.015)){set(dirt[0],dirt[1],MUD);if(chance(.35))grid[i]=MUD;return}if(ambientTemp<0&&life[i]>30&&chance(.0008+Math.abs(ambientTemp)*.00008)){set(x,y,ICE);life[i]=0}else updateLiquid(x,y,4);return}
    if(v===OIL){updateLiquid(x,y,5);return}
    if(v===ACID){for(const t of [WOOD,PLANT,SEED,BUG,METAL,STONE]){const p=near(x,y,t);if(p&&chance(.08)){set(p[0],p[1],EMPTY);if(chance(.15))set(x,y,EMPTY);return}}updateLiquid(x,y,3);return}
    if(v===LAVA){burnAround(x,y);const p=near(x,y,WATER);if(p){set(p[0],p[1],STEAM);set(x,y,OBSIDIAN);return}if(life[i]>900+ambientTemp*4&&chance(.03)){grid[i]=chance(.82)?BASALT:(chance(.55)?SULFUR:COPPER_ORE);life[i]=0;return}updateLiquid(x,y,1);return}
    if(v===FIRE){if(reactionEnabled[v])burnAround(x,y);const p=near(x,y,WATER);if(p&&reactionEnabled[v]){grid[i]=STEAM;return}const fireLife=35+(ambientTemp+100)*.25;if(life[i]>fireLife+Math.random()*45){grid[i]=chance(.2)?SMOKE:EMPTY;life[i]=0;return}const drift=chance(.48)?0:(chance(.5)?-1:1);if(empty(x+drift,y-1)&&chance(.78)){move(x,y,x+drift,y-1);return}if(chance(.025))grid[i]=SMOKE;return}
    if(v===STEAM||v===SMOKE){if(v===STEAM&&life[i]>Math.max(25,180-ambientTemp)&&chance(ambientTemp<100?.03:.004)){grid[i]=WATER;return}if(v===SMOKE&&life[i]>130&&chance(.08)){grid[i]=EMPTY;return}updateGas(x,y);return}
    if(v===ICE){if(hot(x,y)||(ambientTemp>0&&chance(.002+ambientTemp*.0002))){grid[i]=WATER;life[i]=0}return}
    if(v===SEED){if(y+1<H&&(grid[idx(x,y+1)]===SOIL||grid[idx(x,y+1)]===SAND)&&near(x,y,WATER)&&life[i]>15){grid[i]=PLANT;life[i]=0}else updatePowder(x,y);return}
    if(v===PLANT){if(near(x,y,FIRE)||near(x,y,LAVA)){grid[i]=FIRE;life[i]=0;return}if(life[i]<22&&empty(x,y+1)){updatePowder(x,y);return}if(life[i]%35===0&&chance(.55)){const spots=[[0,-1],[-1,0],[1,0]];const q=spots[Math.floor(Math.random()*spots.length)];if(empty(x+q[0],y+q[1]))set(x+q[0],y+q[1],PLANT,22)}return}
    if(v===BUG){if(near(x,y,FIRE)||near(x,y,LAVA)||near(x,y,ACID)){grid[i]=SMOKE;return}const food=near(x,y,PLANT);if(food){set(food[0],food[1],BUG);set(x,y,EMPTY);return}const d=chance(.5)?-1:1;if(!move(x,y,x+d,y)&&chance(.4))move(x,y,x,y-1);if(empty(x,y+1))move(x,y,x,y+1);return}
    if(v===SPARK){const m=near(x,y,METAL);if(m&&life[i]<18){set(m[0],m[1],SPARK,life[i]+1);set(x,y,METAL);return}burnAround(x,y);if(life[i]>8)grid[i]=EMPTY;return}
    if(v===TNT){if(near(x,y,FIRE)||near(x,y,SPARK)||near(x,y,LAVA)||life[i]>1){if(life[i]>18)explode(x,y,9)}else life[i]=0;return}
    if(v===CLONE){grid[i]=EMPTY;return}
    if(v===VOID){for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++)if((xx||yy)&&inside(x+xx,y+yy)&&chance(.18)){const q=idx(x+xx,y+yy);if(grid[q]!==VOID)grid[q]=EMPTY}return}
    if(v===LIGHTNING){burnAround(x,y);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(inside(x+xx,y+yy)&&grid[idx(x+xx,y+yy)]===TNT)life[idx(x+xx,y+yy)]=2;if(life[i]>5)grid[i]=EMPTY;return}
    if(v===SLIME){const p=near(x,y,WATER);if(p&&chance(.03)){set(p[0],p[1],SLIME);return}if(tick%3===0)updateLiquid(x,y,1);return}
    if(v===RAINBOW)return;
    if(v===MUD){if(hot(x,y)&&life[i]>55){grid[i]=STONE;life[i]=0;return}if(tick%2===0)updateLiquid(x,y,1);return}
    if(v===WAX){if(hot(x,y)){grid[i]=OIL;life[i]=1}return}
    if(v===FUSE){if(near(x,y,FIRE)||near(x,y,SPARK)){grid[i]=FIRE;life[i]=0}else updatePowder(x,y);return}
    if(v===BOMB){if(near(x,y,FIRE)||near(x,y,SPARK)||near(x,y,LIGHTNING)||life[i]>1){if(life[i]>10)explode(x,y,15)}else{life[i]=0;updatePowder(x,y)}return}
    if(v===MERCURY){updateLiquid(x,y,6);return}
    if(v===FOAM){const p=near(x,y,FIRE);if(p){set(p[0],p[1],SMOKE);if(chance(.3))grid[i]=EMPTY;return}if(life[i]>500&&chance(.02)){grid[i]=EMPTY;return}if(tick%4===0)updateGas(x,y);return}
    if(v===CLOUD){if(life[i]>100&&chance(.012))set(x,y,WATER);else if(tick%5===0)updateGas(x,y);return}
    if(v===VIRUS){const immune=[EMPTY,VIRUS,VOID,RAINBOW,GLASS,METAL,OBSIDIAN];for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!inside(x+xx,y+yy))continue;const q=idx(x+xx,y+yy);if(!immune.includes(grid[q])&&chance(.035))set(x+xx,y+yy,VIRUS)}if(life[i]>450&&chance(.03))grid[i]=EMPTY;return}
    if(v===ANTIMATTER){for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++){if(!inside(x+xx,y+yy)||(xx===0&&yy===0))continue;const q=idx(x+xx,y+yy);if(grid[q]!==EMPTY&&grid[q]!==ANTIMATTER&&chance(.3)){grid[q]=EMPTY;grid[i]=chance(.35)?LIGHTNING:EMPTY;return}}updatePowder(x,y);return}
    if(v===CONCRETE){if(life[i]<90)updateLiquid(x,y,1);return}
    if(v===QUARTZITE){if(reactionEnabled[v]&&near(x,y,LAVA)&&life[i]>mineralTime*1.4){grid[i]=CRYSTAL;life[i]=0}return}
    if(v===BASALT){if(reactionEnabled[v]&&near(x,y,ACID)&&chance(.004)){grid[i]=SAND;life[i]=0}return}
    if(v===SULFUR){if(reactionEnabled[v]&&hot(x,y)){grid[i]=FIRE;life[i]=18;return}updatePowder(x,y);return}
    if(v===COPPER_ORE){if(reactionEnabled[v]&&near(x,y,ACID)&&life[i]>mineralTime*.6){grid[i]=METAL;life[i]=0;return}updatePowder(x,y);return}
    if(v===CRYSTAL){if(reactionEnabled[v]&&near(x,y,LIGHTNING)&&chance(.12))set(x,y,SPARK);return}
  }
  function step(){tick++;const reverse=tick%2;for(let y=H-1;y>=0;y--){if(reverse){for(let x=0;x<W;x++)updateCell(x,y)}else{for(let x=W-1;x>=0;x--)updateCell(x,y)}}}
  function render(){const img=ctx.createImageData(W,H),d=img.data;count=0;for(let i=0;i<N;i++){const v=grid[i];if(v)count++;let hex=color[v],n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(v===RAINBOW){const h=(i*7+tick*4)%360;r=255*Math.abs(Math.sin(h*.017));g=255*Math.abs(Math.sin((h+120)*.017));b=255*Math.abs(Math.sin((h+240)*.017))}if(v===FIRE){const heat=Math.min(1,life[i]/55);r=255;g=190-heat*135;b=45-heat*35}const noise=((i*13+v*17)%9)-4;if(v!==EMPTY&&v!==LIGHTNING){r+=noise;g+=noise;b+=noise}d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255}ctx.putImageData(img,0,0);document.querySelector('#stats').textContent=`${count.toLocaleString()} particles · ${W}×${H}`}
  let last=0;function loop(t){if(t-last>33){if(!paused)for(let i=0;i<speed;i++)step();render();last=t}requestAnimationFrame(loop)}
  function stamp(x,y,v){for(let yy=-brush;yy<=brush;yy++)for(let xx=-brush;xx<=brush;xx++){const inShape=brushShape==='square'||xx*xx+yy*yy<=brush*brush;if(inShape&&inside(x+xx,y+yy)&&(brushSolid||chance(.88)))set(x+xx,y+yy,v)}}
  function strikeLightning(targetX,targetY){let x=Math.max(1,Math.min(W-2,targetX));for(let y=0;y<=targetY&&y<H;y++){x=Math.max(1,Math.min(W-2,x+(chance(.42)?(chance(.5)?-1:1):0)));set(x,y,LIGHTNING);if(chance(.12)&&inside(x+(chance(.5)?-1:1),y))set(x+(chance(.5)?-1:1),y,LIGHTNING);const below=y+1<H?grid[idx(x,y+1)]:STONE;if(below!==EMPTY&&below!==LIGHTNING){burnAround(x,y);if(below===TNT||below===BOMB)life[idx(x,y+1)]=2;break}}}
  function pointerCell(e){const r=canvas.getBoundingClientRect();return {x:Math.floor((e.clientX-r.left)*W/r.width),y:Math.floor((e.clientY-r.top)*H/r.height),r}}
  function inspect(e){const {x,y,r}=pointerCell(e),box=document.querySelector('#inspector');box.hidden=!inspectMode;if(!inspectMode)return;box.textContent=inside(x,y)?mats[grid[idx(x,y)]][0]:'Outside';box.style.left=`${e.clientX-r.left}px`;box.style.top=`${e.clientY-r.top}px`}
  function paint(e){const p=pointerCell(e),v=e.buttons===2?EMPTY:selected;if(selected===LIGHTNING&&v!==EMPTY){strikeLightning(p.x,p.y);lastPaint=p;return}const from=lastPaint||p,steps=Math.max(1,Math.ceil(Math.hypot(p.x-from.x,p.y-from.y)/(Math.max(1,brush*.45))));for(let s=0;s<=steps;s++)stamp(Math.round(from.x+(p.x-from.x)*s/steps),Math.round(from.y+(p.y-from.y)*s/steps),v);lastPaint=p}
  function openElementMenu(e){const p=pointerCell(e),v=inside(p.x,p.y)?grid[idx(p.x,p.y)]:EMPTY;contextElement=v;document.querySelector('#elementMenuTitle').textContent=`${mats[v][0]} controls`;document.querySelector('#elementReactions').checked=!!reactionEnabled[v];document.querySelector('#elementMovement').checked=!!movementEnabled[v];document.querySelector('#elementMenu').showModal()}
  canvas.addEventListener('pointerdown',e=>{if(e.button===2){e.preventDefault();openElementMenu(e);return}if(e.pointerType==='touch'){const p=pointerCell(e),now=Date.now(),same=lastTapCell&&Math.abs(p.x-lastTapCell.x)<=brush&&Math.abs(p.y-lastTapCell.y)<=brush;if(same&&now-lastTapAt<420){e.preventDefault();openElementMenu(e);lastTapAt=0;return}lastTapAt=now;lastTapCell=p}if(inspectMode){inspect(e);return}drawing=true;lastPaint=null;canvas.setPointerCapture(e.pointerId);paint(e)});canvas.addEventListener('pointermove',e=>{inspect(e);if(drawing)paint(e)});canvas.addEventListener('pointerleave',()=>document.querySelector('#inspector').hidden=true);canvas.addEventListener('pointerup',()=>{drawing=false;lastPaint=null});canvas.addEventListener('pointercancel',()=>{drawing=false;lastPaint=null});document.addEventListener('contextmenu',e=>e.preventDefault());
  const panel=document.querySelector('#materials');mats.forEach((m,i)=>{if(i===CLONE)return;const b=document.createElement('button');b.className='material'+(i===selected?' active':'')+(hiddenElements.has(i)?' hidden-element':'');b.dataset.element=i;b.innerHTML=`<i style="background:${m[1]}"></i>${m[0]}`;b.onclick=()=>{selected=i;inspectMode=false;document.querySelector('#pinpointer').setAttribute('aria-pressed','false');document.querySelectorAll('.material').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#selectedName').textContent=m[0]};panel.appendChild(b)});
  document.querySelector('#brush').oninput=e=>{brush=+e.target.value;document.querySelector('#brushValue').textContent=brush};
  document.querySelector('#temperature').oninput=e=>{ambientTemp=+e.target.value;document.querySelector('#temperatureValue').textContent=`${ambientTemp}°C`};
  document.querySelector('#pause').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'▶ Play':'⏸ Pause'};
  document.querySelector('#speed').onclick=e=>{speed=speed===1?2:speed===2?4:1;e.currentTarget.textContent=`${speed}× Speed`};
  document.querySelector('#pinpointer').onclick=e=>{inspectMode=!inspectMode;e.currentTarget.setAttribute('aria-pressed',String(inspectMode));e.currentTarget.textContent=inspectMode?'⌖ Inspecting':'⌖ Pinpointer';canvas.style.cursor=inspectMode?'help':'crosshair'};
  document.querySelector('#options').onclick=()=>document.querySelector('#optionsMenu').showModal();
  document.querySelector('#mineralTime').onchange=e=>mineralTime=+e.target.value;
  document.querySelector('#showHidden').onchange=e=>document.querySelectorAll('.material').forEach(b=>{if(hiddenElements.has(+b.dataset.element))b.classList.toggle('hidden-element',!e.target.checked)});
  document.querySelector('#elementReactions').onchange=e=>reactionEnabled[contextElement]=e.target.checked?1:0;
  document.querySelector('#elementMovement').onchange=e=>movementEnabled[contextElement]=e.target.checked?1:0;
  document.querySelector('#brushShape').onchange=e=>brushShape=e.target.value;
  document.querySelector('#brushSolid').onchange=e=>brushSolid=e.target.checked;
  document.querySelector('#clear').onclick=()=>{if(confirm('Clear the entire world?')){grid.fill(0);life.fill(0)}};
  document.querySelector('#save').onclick=()=>{localStorage.setItem('box-of-elements-save',JSON.stringify({width:W,height:H,cells:Array.from(grid)}));document.querySelector('#save').textContent='Saved!';setTimeout(()=>document.querySelector('#save').textContent='Save',900)};
  function resizeWorld(width,height,preserve=false){const old=grid,oldW=W,oldH=H;W=width;H=height;N=W*H;canvas.width=W;canvas.height=H;canvas.style.aspectRatio=`${W}/${H}`;grid=new Uint8Array(N);life=new Uint16Array(N);if(preserve){const copyW=Math.min(W,oldW),copyH=Math.min(H,oldH);for(let y=0;y<copyH;y++)grid.set(old.subarray(y*oldW,y*oldW+copyW),y*W)}}
  document.querySelector('#mapSize').onchange=e=>{const [w,h]=e.target.value.split('x').map(Number);if(confirm(`Start a new ${e.target.options[e.target.selectedIndex].text.toLowerCase()} map?`)){resizeWorld(w,h);seedWorld()}else e.target.value=`${W}x${H}`};
  document.querySelector('#load').onclick=()=>{try{const saved=JSON.parse(localStorage.getItem('box-of-elements-save')||localStorage.getItem('living-worlds-save'));const cells=Array.isArray(saved)?saved:saved?.cells;if(!cells)throw Error();if(!Array.isArray(saved)&&saved.width&&saved.height){resizeWorld(saved.width,saved.height);const option=`${W}x${H}`;if(document.querySelector(`#mapSize option[value="${option}"]`))document.querySelector('#mapSize').value=option}if(cells.length===N)grid.set(cells);else throw Error()}catch{alert('That save does not match this map size or could not be loaded.')}};
  function seedWorld(){
    grid.fill(0);life.fill(0);
    const groundDepth=Math.max(22,Math.floor(H*.22)),base=H-groundDepth,ground=new Int32Array(W);
    const pondX=Math.floor(W*.22),pondRadius=Math.max(15,Math.floor(W*.075)),pondDepth=Math.max(5,Math.floor(H*.045));
    let drift=0;
    for(let x=0;x<W;x++){
      drift=Math.max(-3,Math.min(3,drift+(chance(.44)?(chance(.5)?-1:1):0)));
      const distance=Math.abs(x-pondX),bowl=distance<pondRadius?Math.round((1-distance/pondRadius)*pondDepth):0;
      ground[x]=Math.min(H-3,base+Math.round(Math.sin(x*.055)*3+Math.sin(x*.017)*5+drift*.45)+bowl);
      for(let y=ground[x];y<H;y++)set(x,y,y===ground[x]?SOIL:STONE);
    }
    const waterline=base-1;
    for(let x=Math.max(0,pondX-pondRadius);x<=Math.min(W-1,pondX+pondRadius);x++)for(let y=waterline;y<ground[x];y++)set(x,y,WATER);
    const placeOnGround=(type,minX,maxX)=>{const x=Math.max(0,Math.min(W-1,minX+Math.floor(Math.random()*Math.max(1,maxX-minX))));set(x,ground[x]-1,type)};
    for(let i=0;i<W/5;i++)placeOnGround(SEED,Math.floor(W*.38),Math.floor(W*.94));
    for(let i=0;i<W/24;i++)placeOnGround(BUG,Math.floor(W*.45),Math.floor(W*.92));
  }
  document.querySelector('#random').onclick=seedWorld;seedWorld();requestAnimationFrame(loop);
})();
