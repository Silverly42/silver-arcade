(() => {
  'use strict';
  const canvas = document.querySelector('#world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const W = canvas.width, H = canvas.height, N = W * H;
  const EMPTY=0,SAND=1,WATER=2,SOIL=3,SEED=4,WOOD=5,FIRE=6,OIL=7,LAVA=8,STONE=9,ICE=10,STEAM=11,SMOKE=12,ACID=13,SALT=14,GLASS=15,METAL=16,PLANT=17,BUG=18,SPARK=19,TNT=20,POWDER=21,CLONE=22,VOID=23,LIGHTNING=24,SLIME=25,RAINBOW=26;
  const mats = [
    ['Eraser','#071115'],['Sand','#d7b86c'],['Water','#3c8bd9'],['Soil','#79533a'],['Seed','#a7d45b'],
    ['Wood','#a36d3d'],['Fire','#ff6b35'],['Oil','#4c4039'],['Lava','#ef3d24'],['Stone','#737b7d'],
    ['Ice','#a7e9ff'],['Steam','#c9e6e2'],['Smoke','#596164'],['Acid','#89e346'],['Salt','#e8e4d5'],
    ['Glass','#8fc6c5'],['Metal','#aab3bc'],['Plant','#39a84a'],['Critter','#f49bc4'],['Spark','#fff06a'],
    ['TNT','#e12525'],['Gunpowder','#302d32'],['Clone','#be63ff'],['Void','#120820'],['Lightning','#fffbd1'],
    ['Slime','#39ef8a'],['Rainbow','#ff4da6']
  ];
  const color = mats.map(m => m[1]);
  const grid = new Uint8Array(N), life = new Uint16Array(N);
  let selected=SAND, brush=4, paused=false, speed=1, drawing=false, count=0, tick=0;
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

  function updatePowder(x,y){const d=chance(.5)?-1:1;if(move(x,y,x,y+1)||move(x,y,x+d,y+1)||move(x,y,x-d,y+1))return;const below=inside(x,y+1)?grid[idx(x,y+1)]:STONE;if(below===WATER||below===OIL||below===ACID)swap(idx(x,y),idx(x,y+1));}
  function updateLiquid(x,y,range=3){if(move(x,y,x,y+1))return;const d=chance(.5)?-1:1;for(let s=1;s<=range;s++)if(move(x,y,x+d*s,y)){return}for(let s=1;s<=range;s++)if(move(x,y,x-d*s,y)){return}}
  function updateGas(x,y){const d=Math.floor(Math.random()*3)-1;if(move(x,y,x+d,y-1))return;move(x,y,x+(chance(.5)?-1:1),y);}
  function near(x,y,type){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if((xx||yy)&&inside(x+xx,y+yy)&&grid[idx(x+xx,y+yy)]===type)return [x+xx,y+yy];return null}
  function burnAround(x,y){for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++){if(!inside(x+xx,y+yy))continue;const i=idx(x+xx,y+yy),v=grid[i];if((v===WOOD||v===PLANT||v===SEED||v===OIL||v===POWDER)&&chance(v===OIL?.3:v===POWDER?.8:.025)){grid[i]=FIRE;life[i]=0}if(v===TNT)life[i]=Math.max(life[i],1)}}
  function updateCell(x,y){const i=idx(x,y),v=grid[i];if(!v)return;life[i]++;
    if(v===SAND||v===SALT||v===SOIL||v===POWDER){updatePowder(x,y);return}
    if(v===WATER){if(near(x,y,LAVA)){grid[i]=STEAM;const p=near(x,y,LAVA);if(p)set(p[0],p[1],STONE);return}if(chance(.0003))set(x,y,ICE);else updateLiquid(x,y,4);return}
    if(v===OIL){updateLiquid(x,y,5);return}
    if(v===ACID){for(const t of [WOOD,PLANT,SEED,BUG,METAL,STONE]){const p=near(x,y,t);if(p&&chance(.08)){set(p[0],p[1],EMPTY);if(chance(.15))set(x,y,EMPTY);return}}updateLiquid(x,y,3);return}
    if(v===LAVA){burnAround(x,y);const p=near(x,y,WATER);if(p){set(p[0],p[1],STEAM);set(x,y,STONE);return}if(life[i]>900&&chance(.03)){grid[i]=STONE;return}updateLiquid(x,y,1);return}
    if(v===FIRE){burnAround(x,y);const p=near(x,y,WATER);if(p){grid[i]=STEAM;return}if(life[i]>25+Math.random()*75){grid[i]=chance(.55)?SMOKE:EMPTY;life[i]=0;return}if(empty(x,y-1)&&chance(.35))set(x,y-1,FIRE);return}
    if(v===STEAM||v===SMOKE){if(v===STEAM&&life[i]>180&&chance(.03)){grid[i]=WATER;return}if(v===SMOKE&&life[i]>130&&chance(.08)){grid[i]=EMPTY;return}updateGas(x,y);return}
    if(v===ICE){if(near(x,y,FIRE)||near(x,y,LAVA)){grid[i]=WATER;life[i]=0}return}
    if(v===SEED){if(y+1<H&&(grid[idx(x,y+1)]===SOIL||grid[idx(x,y+1)]===SAND)&&near(x,y,WATER)&&life[i]>15){grid[i]=PLANT;life[i]=0}else updatePowder(x,y);return}
    if(v===PLANT){if(near(x,y,FIRE)||near(x,y,LAVA)){grid[i]=FIRE;life[i]=0;return}if(life[i]%35===0&&chance(.55)){const spots=[[0,-1],[-1,0],[1,0]];const q=spots[Math.floor(Math.random()*spots.length)];if(empty(x+q[0],y+q[1]))set(x+q[0],y+q[1],PLANT)}return}
    if(v===BUG){if(near(x,y,FIRE)||near(x,y,LAVA)||near(x,y,ACID)){grid[i]=SMOKE;return}const food=near(x,y,PLANT);if(food){set(food[0],food[1],BUG);set(x,y,EMPTY);return}const d=chance(.5)?-1:1;if(!move(x,y,x+d,y)&&chance(.4))move(x,y,x,y-1);if(empty(x,y+1))move(x,y,x,y+1);return}
    if(v===SPARK){const m=near(x,y,METAL);if(m&&life[i]<18){set(m[0],m[1],SPARK,life[i]+1);set(x,y,METAL);return}burnAround(x,y);if(life[i]>8)grid[i]=EMPTY;return}
    if(v===TNT){if(near(x,y,FIRE)||near(x,y,SPARK)||near(x,y,LAVA)||life[i]>1){if(life[i]>18)explode(x,y,9)}else life[i]=0;return}
    if(v===CLONE){let source=null;for(let r=1;r<5&&!source;r++)for(let yy=-r;yy<=r;yy++)for(let xx=-r;xx<=r;xx++){if(!inside(x+xx,y+yy))continue;const q=grid[idx(x+xx,y+yy)];if(q&&q!==CLONE&&q!==VOID&&q!==TNT){source=q;break}}if(source&&tick%3===0){const spots=[[0,-1],[1,0],[-1,0],[0,1]];for(const q of spots)if(empty(x+q[0],y+q[1])&&chance(.28))set(x+q[0],y+q[1],source)}return}
    if(v===VOID){for(let yy=-2;yy<=2;yy++)for(let xx=-2;xx<=2;xx++)if((xx||yy)&&inside(x+xx,y+yy)&&chance(.18)){const q=idx(x+xx,y+yy);if(grid[q]!==VOID)grid[q]=EMPTY}return}
    if(v===LIGHTNING){burnAround(x,y);for(let yy=-1;yy<=1;yy++)for(let xx=-1;xx<=1;xx++)if(inside(x+xx,y+yy)&&grid[idx(x+xx,y+yy)]===TNT)life[idx(x+xx,y+yy)]=2;if(life[i]>18||y===H-1){grid[i]=EMPTY;return}if(empty(x,y+1))move(x,y,x,y+1);else{const d=chance(.5)?-1:1;if(!move(x,y,x+d,y+1))move(x,y,x-d,y+1)}return}
    if(v===SLIME){const p=near(x,y,WATER);if(p&&chance(.03)){set(p[0],p[1],SLIME);return}if(tick%3===0)updateLiquid(x,y,1);return}
    if(v===RAINBOW)return;
  }
  function step(){tick++;const reverse=tick%2;for(let y=H-1;y>=0;y--){if(reverse){for(let x=0;x<W;x++)updateCell(x,y)}else{for(let x=W-1;x>=0;x--)updateCell(x,y)}}}
  function render(){const img=ctx.createImageData(W,H),d=img.data;count=0;for(let i=0;i<N;i++){const v=grid[i];if(v)count++;let hex=color[v],n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(v===RAINBOW){const h=(i*7+tick*4)%360;const c=`hsl(${h} 90% 60%)`;ctx.fillStyle=c;const m=c.match(/\d+/g);r=255*Math.abs(Math.sin(h*.017));g=255*Math.abs(Math.sin((h+120)*.017));b=255*Math.abs(Math.sin((h+240)*.017))}const noise=((i*13+tick*7)%9)-4;if(v!==EMPTY){r+=noise;g+=noise;b+=noise}d[i*4]=r;d[i*4+1]=g;d[i*4+2]=b;d[i*4+3]=255}ctx.putImageData(img,0,0);document.querySelector('#stats').textContent=`${count.toLocaleString()} particles`}
  let last=0;function loop(t){if(t-last>33){if(!paused)for(let i=0;i<speed;i++)step();render();last=t}requestAnimationFrame(loop)}
  function paint(e){const r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*W/r.width),y=Math.floor((e.clientY-r.top)*H/r.height),v=e.buttons===2?EMPTY:selected;for(let yy=-brush;yy<=brush;yy++)for(let xx=-brush;xx<=brush;xx++)if(xx*xx+yy*yy<=brush*brush&&inside(x+xx,y+yy)&&chance(.88))set(x+xx,y+yy,v)}
  canvas.addEventListener('pointerdown',e=>{drawing=true;canvas.setPointerCapture(e.pointerId);paint(e)});canvas.addEventListener('pointermove',e=>{if(drawing)paint(e)});canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const panel=document.querySelector('#materials');mats.forEach((m,i)=>{const b=document.createElement('button');b.className='material'+(i===selected?' active':'');b.innerHTML=`<i style="background:${m[1]}"></i>${m[0]}`;b.onclick=()=>{selected=i;document.querySelectorAll('.material').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelector('#selectedName').textContent=m[0]};panel.appendChild(b)});
  document.querySelector('#brush').oninput=e=>{brush=+e.target.value;document.querySelector('#brushValue').textContent=brush};
  document.querySelector('#pause').onclick=e=>{paused=!paused;e.currentTarget.textContent=paused?'▶ Play':'⏸ Pause'};
  document.querySelector('#speed').onclick=e=>{speed=speed===1?2:speed===2?4:1;e.currentTarget.textContent=`${speed}× Speed`};
  document.querySelector('#clear').onclick=()=>{if(confirm('Clear the entire world?')){grid.fill(0);life.fill(0)}};
  document.querySelector('#save').onclick=()=>{localStorage.setItem('box-of-elements-save',JSON.stringify(Array.from(grid)));document.querySelector('#save').textContent='Saved!';setTimeout(()=>document.querySelector('#save').textContent='Save',900)};
  document.querySelector('#load').onclick=()=>{try{const a=JSON.parse(localStorage.getItem('box-of-elements-save')||localStorage.getItem('living-worlds-save'));if(a&&a.length===N)grid.set(a)}catch{alert('That save could not be loaded.')}};
  function seedWorld(){grid.fill(0);for(let x=0;x<W;x++){const ground=H-18+Math.floor(Math.sin(x*.13)*4+Math.random()*3);for(let y=ground;y<H;y++)set(x,y,y===ground?SOIL:STONE)}for(let x=8;x<55;x++)for(let y=H-30;y<H-20;y++)if((x-31)**2+(y-(H-20))**2<150)set(x,y,WATER);for(let i=0;i<30;i++)set(65+Math.floor(Math.random()*80),H-22-Math.floor(Math.random()*4),SEED);for(let i=0;i<8;i++)set(70+Math.floor(Math.random()*70),H-25,BUG)}
  document.querySelector('#random').onclick=seedWorld;seedWorld();requestAnimationFrame(loop);
})();
