(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VectorCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const TAU=Math.PI*2;function wrapAngle(a){a%=TAU;return a<0?a+TAU:a}function angleDelta(a,b){let d=wrapAngle(b)-wrapAngle(a);return d>Math.PI?d-TAU:d<-Math.PI?d+TAU:d}function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296)}
function treadMotion(left,right){left=Math.max(-1,Math.min(1,left));right=Math.max(-1,Math.min(1,right));return{drive:(left+right)/2,turn:(left-right)/2}}
function circleBox(x,z,r,b){const qx=Math.max(b.x-b.w/2,Math.min(x,b.x+b.w/2)),qz=Math.max(b.z-b.d/2,Math.min(z,b.z+b.d/2));return(x-qx)**2+(z-qz)**2<r*r}
function blocked(entity,obstacles,size=720){if(Math.abs(entity.x)>size||Math.abs(entity.z)>size)return true;return obstacles.some(o=>circleBox(entity.x,entity.z,entity.r||10,o))}
function segmentBox(a,b,o){let t0=0,t1=1;const dx=b.x-a.x,dz=b.z-a.z;for(const [p,q] of [[-dx,a.x-(o.x-o.w/2)],[dx,(o.x+o.w/2)-a.x],[-dz,a.z-(o.z-o.d/2)],[dz,(o.z+o.d/2)-a.z]]){if(p===0&&q<0)return false;const r=q/p;if(p<0){if(r>t1)return false;if(r>t0)t0=r}else if(p>0){if(r<t0)return false;if(r<t1)t1=r}}return true}
function project(point,camera,width,height,fov=520){const dx=point.x-camera.x,dz=point.z-camera.z,s=Math.sin(camera.a),c=Math.cos(camera.a),side=dx*c-dz*s,forward=dx*s+dz*c;if(forward<=2)return null;const scale=fov/forward;return{x:width/2+side*scale,y:height*.56-(point.y||0)*scale,scale,depth:forward}}
return{wrapAngle,angleDelta,distance,rng,treadMotion,circleBox,blocked,segmentBox,project};});
