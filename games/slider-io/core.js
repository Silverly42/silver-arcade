(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SliderCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TAU=Math.PI*2;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
  const angleDelta=(from,to)=>{let d=(to-from+Math.PI)%TAU-Math.PI;return d<-Math.PI?d+TAU:d};
  const lerpAngle=(from,to,t)=>from+angleDelta(from,to)*clamp(t,0,1);
  const rank=(snakes,id)=>[...snakes].sort((a,b)=>b.score-a.score).findIndex(s=>s.id===id)+1;
  const collides=(head,segments,radius,skip=7)=>segments.slice(skip).some(p=>dist2(head,p)<radius*radius);
  const aiLevel=alive=>alive<=5?3:alive<=10?2:1;
  return {TAU,clamp,dist2,angleDelta,lerpAngle,rank,collides,aiLevel};
});
