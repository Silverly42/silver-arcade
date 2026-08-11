(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VectorCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TAU=Math.PI*2;
  function wrapAngle(a){a%=TAU;return a<0?a+TAU:a}
  function angleDelta(a,b){let d=wrapAngle(b)-wrapAngle(a);if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d}
  function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
  function clampWorld(p,size){p.x=Math.max(-size,Math.min(size,p.x));p.z=Math.max(-size,Math.min(size,p.z));return p}
  function project(point,camera,width,height,fov=430){const dx=point.x-camera.x,dz=point.z-camera.z,s=Math.sin(camera.a),c=Math.cos(camera.a),side=dx*c-dz*s,forward=dx*s+dz*c;if(forward<=1)return null;const scale=fov/forward;return{x:width/2+side*scale,y:height*.54-(point.y||0)*scale,scale,depth:forward}}
  function hitCircle(a,b,r){return distance(a,b)<=r}
  return{wrapAngle,angleDelta,distance,clampWorld,project,hitCircle};
});
