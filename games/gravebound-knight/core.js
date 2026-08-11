(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GraveCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function moveAndCollide(body,dx,dy,solids){
    body.x+=dx;
    for(const s of solids)if(overlap(body,s)){body.x=dx>0?s.x-body.w:s.x+s.w;body.vx=0;}
    body.y+=dy;body.grounded=false;
    for(const s of solids)if(overlap(body,s)){if(dy>0){body.y=s.y-body.h;body.grounded=true;}else if(dy<0)body.y=s.y+s.h;body.vy=0;}
    return body;
  }
  function fixedJump(body,direction){if(!body.grounded)return false;body.vy=-4.2;body.jumpVx=direction*1.25;body.grounded=false;return true;}
  function canDamage(player){return player.invuln<=0&&player.state==='alive';}
  function applyHit(player){if(!canDamage(player))return 'ignored';player.invuln=90;player.vy=-3.8;if(player.armoured){player.armoured=false;return 'armour';}player.state='dead';player.deathTimer=75;player.lives--;return 'death';}
  function projectileHit(p,target){return p.alive&&overlap({x:p.x-p.r,y:p.y-p.r,w:p.r*2,h:p.r*2},target);}
  return {clamp,overlap,moveAndCollide,fixedJump,canDamage,applyHit,projectileHit};
});

