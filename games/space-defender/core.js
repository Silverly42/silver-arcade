(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SpaceCore=api})(globalThis,function(){
  const TAU=Math.PI*2;
  const wrap=(v,max)=>(v%max+max)%max;
  const dist2=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy};
  const collides=(a,b,pad=0)=>dist2(a,b)<(a.r+b.r+pad)**2;
  const waveAsteroids=wave=>Math.min(5+wave,14);
  const scoreFor=size=>size===3?20:size===2?50:100;
  const splitSpec=(asteroid,rng=Math.random)=>asteroid.size<=1?[]:[-1,1].map(sign=>({x:asteroid.x,y:asteroid.y,size:asteroid.size-1,r:asteroid.r*.58,vx:asteroid.vx+Math.cos(asteroid.spin+sign)*55,vy:asteroid.vy+Math.sin(asteroid.spin+sign)*55,spin:rng()*TAU,rot:0,vr:(rng()-.5)*2.4}));
  const safeTeleport=(width,height,hazards,rng=Math.random)=>{let best={x:width/2,y:height/2},bestClear=-1;for(let i=0;i<48;i++){const p={x:50+rng()*Math.max(1,width-100),y:70+rng()*Math.max(1,height-120)},clear=hazards.reduce((m,h)=>Math.min(m,Math.sqrt(dist2(p,h))-(h.r||3)),Infinity);if(clear>bestClear){best=p;bestClear=clear}if(clear>115)return p}return best};
  return{TAU,wrap,dist2,collides,waveAsteroids,scoreFor,splitSpec,safeTeleport};
});
