(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TankCore=api})(globalThis,function(){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const circleRect=(c,r)=>{const x=clamp(c.x,r.x,r.x+r.w),y=clamp(c.y,r.y,r.y+r.h),dx=c.x-x,dy=c.y-y;return dx*dx+dy*dy<c.r*c.r};
const circleCircle=(a,b)=>{const dx=a.x-b.x,dy=a.y-b.y;return dx*dx+dy*dy<(a.r+b.r)**2};
const blocked=(tank,walls,other)=>walls.some(w=>circleRect(tank,w))||(other&&circleCircle(tank,other));
const shellWallHit=(shell,wall)=>{const next={x:shell.x+shell.vx,y:shell.y+shell.vy,r:shell.r};if(!circleRect(next,wall))return null;const hitX=shell.x<=wall.x-shell.r||shell.x>=wall.x+wall.w+shell.r;const hitY=shell.y<=wall.y-shell.r||shell.y>=wall.y+wall.h+shell.r;return{vx:hitX?-shell.vx:shell.vx,vy:hitY?-shell.vy:shell.vy}};
const layouts=[
[{x:260,y:110,w:30,h:170},{x:670,y:320,w:30,h:170},{x:390,y:265,w:180,h:30}],
[{x:220,y:150,w:210,h:28},{x:530,y:422,w:210,h:28},{x:466,y:235,w:28,h:130}],
[{x:175,y:270,w:180,h:28},{x:605,y:270,w:180,h:28},{x:466,y:90,w:28,h:125},{x:466,y:385,w:28,h:125}],
[{x:270,y:100,w:28,h:150},{x:270,y:350,w:28,h:150},{x:662,y:100,w:28,h:150},{x:662,y:350,w:28,h:150},{x:405,y:286,w:150,h:28}],
];
return{clamp,circleRect,circleCircle,blocked,shellWallHit,layouts};});
