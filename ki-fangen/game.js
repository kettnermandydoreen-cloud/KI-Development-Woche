(()=>{
const T=32,VW=15,VH=10,W=T*VW,H=T*VH,MV=150;
const KEY="kiFaengerV2",SET="kiFaengerSet";
const $=id=>document.getElementById(id);
const cv=$("cv");cv.width=W;cv.height=H;
const g=cv.getContext("2d");
const DIRS={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
const OPP={u:"d",d:"u",l:"r",r:"l"};
const SOLID="#WCB";
const REGION=TOOLS.map((t,i)=>i<6?"wiese":"wald");
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const rnd=n=>Math.random()*n|0;

let S=null,mode="title",mv=null,held=[],clock=0,steps=0;
let dlg=null,B=null;
const settings=(()=>{try{return JSON.parse(localStorage.getItem(SET))||{}}catch(e){return{}}})();
if(settings.sfx===undefined)settings.sfx=true;

function fresh(){return{mapId:"wiese",x:2,y:11,dir:"r",hp:3,lv:1,xp:0,tokens:20,balls:5,bars:1,caught:[],beaten:[],asked:[],flags:{}}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));return s&&s.mapId&&MAPS[s.mapId]?Object.assign(fresh(),s):null}catch(e){return null}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function saveSet(){try{localStorage.setItem(SET,JSON.stringify(settings))}catch(e){}}
const maxHp=()=>Math.min(6,3+Math.floor(S.lv/2));
const need=()=>S.lv*30;
const map=()=>MAPS[S.mapId];
const tile=(x,y,m)=>{m=m||map();return x<0||y<0||x>=m.w||y>=m.h?"#":m.rows[y][x]};
const npcAt=(x,y)=>map().npcs.find(n=>n.x===x&&n.y===y);

function pips(el,n,max){el.innerHTML="";for(let i=0;i<max;i++){const p=document.createElement("div");p.className="pip"+(i<n?"":" off");el.appendChild(p)}}
function hud(){
  pips($("hHp"),S.hp,maxHp());
  $("hLv").textContent=S.lv;
  $("hXp").style.width=Math.min(100,S.xp/need()*100)+"%";
  $("hTok").textContent=S.tokens;
  $("hBall").textContent=S.balls;
  $("hBar").textContent=S.bars;
  $("hMap").textContent=map().name;
  $("dexCount").textContent="("+S.caught.length+"/"+TOOLS.length+")";
}
function gainXp(n){
  S.xp+=n;let up=false;
  while(S.xp>=need()){S.xp-=need();S.lv++;up=true;S.hp=maxHp()}
  if(up)Sound.level();
  return up;
}

/* ---------- Dialog ---------- */
function say(name,lines,cb){
  dlg={lines:lines.slice(),i:0,cb};
  mode="dialog";
  $("dName").textContent=name;
  $("dText").textContent=dlg.lines[0];
  $("dialog").hidden=false;
}
function advance(){
  if(!dlg)return;
  Sound.click();
  dlg.i++;
  if(dlg.i<dlg.lines.length){$("dText").textContent=dlg.lines[dlg.i];return}
  const cb=dlg.cb;dlg=null;$("dialog").hidden=true;mode="world";
  if(cb)cb();
}

/* ---------- Interaktion ---------- */
function interact(){
  if(mode==="dialog")return advance();
  if(mode!=="world"||mv)return;
  const [dx,dy]=DIRS[S.dir],fx=S.x+dx,fy=S.y+dy;
  const n=npcAt(fx,fy);
  if(n)return talk(n);
  const c=tile(fx,fy);
  if(c==="C")return station();
  if(c==="B")return gate();
}
function talk(n){
  n.dir=OPP[S.dir];
  if(n.kind==="prof"){
    if(!S.flags.prof){
      S.flags.prof=1;S.balls+=3;S.tokens+=10;save();hud();
      return say(n.name,["Willkommen, Fänger! Ich bin Professor Prompt.","Im hohen Gras leben wilde KI-Tools. Beantworte ihre Fragen, bis sie erschöpft sind. Dann wirf einen Prompt-Ball.","Hier: 3 Prompt-Bälle und 10 Tokens. Viel Erfolg!"]);
    }
    const left=TOOLS.length-S.caught.length;
    return say(n.name,left?["Du hast "+S.caught.length+" von "+TOOLS.length+" Tools. Noch "+left+" fehlen.","Im Datenwald im Osten leben die selteneren Tools.","Lade an der Akku-Station auf, wenn deine Energie knapp wird."]:["Alle Tools gefangen! Im Datenwald wartet das Tor zur AGI."]);
  }
  if(n.kind==="shop")return say(n.name,["Tokens gegen Ausrüstung. Schau dich um!"],openShop);
  if(n.kind==="trainer"){
    if(S.beaten.includes(n.id))return say(n.name,n.after);
    return say(n.name,n.lines,()=>startBattle({type:"trainer",npc:n}));
  }
  say(n.name,n.lines);
}
function station(){
  S.hp=maxHp();save();hud();Sound.heal();
  say("Akku-Station",["Energie vollständig aufgeladen.","Spielstand gespeichert."]);
}
function gate(){
  if(S.caught.length<TOOLS.length)return say("Tor zur AGI",["Das Tor ist versiegelt.","Fange erst alle "+TOOLS.length+" KI-Tools. ("+S.caught.length+"/"+TOOLS.length+")"]);
  if(S.flags.agi)return say("Tor zur AGI",["Die AGI ist besiegt. Du bist KI-Meister!"]);
  say("Tor zur AGI",["Das Tor öffnet sich. Die AGI erscheint.","Beantworte 4 von 5 Fragen richtig."],()=>startBattle({type:"boss"}));
}

/* ---------- Bewegung ---------- */
function tryMove(d){
  if(mode!=="world"||mv)return;
  S.dir=d;
  const [dx,dy]=DIRS[d],tx=S.x+dx,ty=S.y+dy;
  const c=tile(tx,ty);
  if(SOLID.includes(c)||npcAt(tx,ty))return;
  mv={fx:S.x,fy:S.y,tx,ty,t:0};
}
function arrive(){
  S.x=mv.tx;S.y=mv.ty;mv=null;steps++;
  Sound.step();
  const m=map(),c=tile(S.x,S.y);
  const w=m.warps.find(w=>w.x===S.x&&w.y===S.y);
  if(w)return warp(w);
  for(const n of m.npcs){
    if(n.kind!=="trainer"||S.beaten.includes(n.id))continue;
    const [dx,dy]=DIRS[n.dir],ddx=S.x-n.x,ddy=S.y-n.y;
    const dist=Math.abs(ddx)+Math.abs(ddy);
    if(dist>0&&dist<=3&&(ddx===0||ddy===0)&&Math.sign(ddx)===dx&&Math.sign(ddy)===dy){
      let clear=true;
      for(let i=1;i<dist;i++)if(SOLID.includes(tile(n.x+dx*i,n.y+dy*i)))clear=false;
      if(clear){held=[];return say(n.name,["!"].concat(n.lines),()=>startBattle({type:"trainer",npc:n}))}
    }
  }
  if(c==="G"&&Math.random()<.15){
    const open=TOOLS.filter((t,i)=>!S.caught.includes(t.n)&&REGION[i]===S.mapId);
    if(open.length){held=[];encounter(open[rnd(open.length)])}
  }
}
function warp(w){
  mode="trans";held=[];
  $("fade").classList.add("on");
  setTimeout(()=>{
    S.mapId=w.to;S.x=w.tx;S.y=w.ty;S.dir=w.dir;save();hud();
    $("fade").classList.remove("on");mode="world";
  },280);
}
function encounter(tool){
  mode="trans";Sound.encounter();
  $("fade").className="flash";
  setTimeout(()=>{$("fade").className="";startBattle({type:"wild",tool})},650);
}

/* ---------- Kampf ---------- */
function nextQ(){
  const free=a=>a.filter(q=>!S.asked.includes(q[0]));
  let pool=B.tool?free(B.tool.q):[];
  if(!pool.length)pool=free(GLOSS);
  if(!pool.length){S.asked=S.asked.filter(a=>!GLOSS.some(q=>q[0]===a));pool=GLOSS.slice()}
  const q=pool[rnd(pool.length)];
  S.asked.push(q[0]);
  return q;
}
function act(list){
  const box=$("bAct");box.innerHTML="";
  list.forEach(([label,fn,primary,disabled])=>{
    const b=document.createElement("button");
    b.textContent=label;if(primary)b.className="primary";if(disabled)b.disabled=true;
    b.onclick=()=>{Sound.unlock();Sound.click();fn()};
    box.appendChild(b);
  });
}
function sprite(){
  const c=$("bfSprite"),x=c.getContext("2d");
  x.imageSmoothingEnabled=false;x.clearRect(0,0,96,96);
  x.drawImage(toolSprite(B.type==="boss"?"AGI":B.type==="trainer"?B.npc.name:B.tool.n,96),0,0);
}
function startBattle(o){
  B=Object.assign({wrongs:0,right:0,asked:0,done:false},o);
  if(B.type==="wild"){B.goal=3;B.total=99;$("bfKind").textContent=B.tool.k+" · "+B.tool.f;$("bfName").textContent="Wildes "+B.tool.n;$("bfLabel").textContent="Stärke"}
  else if(B.type==="trainer"){B.goal=2;B.total=3;$("bfKind").textContent="Trainer";$("bfName").textContent=B.npc.name;$("bfLabel").textContent="Treffer nötig"}
  else{B.goal=4;B.total=5;$("bfKind").textContent="Endgegner";$("bfName").textContent="Die AGI";$("bfLabel").textContent="Treffer nötig"}
  B.left=B.goal;
  sprite();
  $("world").hidden=true;$("battle").hidden=false;mode="battle";
  $("bMsg").textContent=B.type==="wild"?B.tool.d:"Der Kampf beginnt.";
  askQ();
}
function bpips(){pips($("bfPips"),B.left,B.goal);pips($("bmPips"),S.hp,maxHp());hud()}
function askQ(){
  B.q=nextQ();B.asked++;B.done=false;
  const [qt,opts,ok]=B.q;
  const mixed=shuffle(opts.map((o,i)=>({o,c:i===ok})));
  $("bQ").textContent=qt;
  const box=$("bOpts");box.innerHTML="";
  mixed.forEach(m=>{
    const b=document.createElement("button");b.textContent=m.o;b.dataset.c=m.c;
    b.onclick=()=>{Sound.unlock();answer(b,m.c)};
    box.appendChild(b);
  });
  bpips();
  const list=[];
  if(S.bars>0&&S.hp<maxHp())list.push(["Riegel essen ("+S.bars+")",eat]);
  if(B.type==="wild")list.push(["Fliehen",leave]);
  act(list);
}
function eat(){
  if(B.done||S.bars<1)return;
  S.bars--;S.hp=Math.min(maxHp(),S.hp+2);Sound.heal();save();
  $("bMsg").textContent="Lecker! +2 Energie.";askQuestionUIKeep();
}
function askQuestionUIKeep(){
  bpips();
  const list=[];
  if(S.bars>0&&S.hp<maxHp())list.push(["Riegel essen ("+S.bars+")",eat]);
  if(B.type==="wild")list.push(["Fliehen",leave]);
  act(list);
}
function answer(btn,right){
  if(B.done)return;B.done=true;
  [...$("bOpts").children].forEach(b=>{b.disabled=true;if(b.dataset.c==="true")b.classList.add("ok")});
  if(right){
    B.left--;B.right++;S.tokens+=2;gainXp(4);Sound.ok();
    $("bMsg").textContent="Richtig! +2 Tokens.";
    shake();
  }else{
    S.hp--;B.wrongs++;btn.classList.add("no");Sound.no();
    $("bMsg").textContent="Falsch! Du verlierst 1 Energie.";
  }
  bpips();save();
  if(S.hp<=0)return blackout();
  if(B.left<=0)return won();
  if(B.type!=="wild"&&B.wrongs>B.total-B.goal){
    $("bMsg").textContent="Verloren. Lerne noch etwas und komm wieder.";
    return act([["Zurück zur Karte",leave,true]]);
  }
  act([["Weiter",askQ,true]]);
}
function shake(){const c=$("bfSprite");c.classList.remove("shake");void c.offsetWidth;c.classList.add("shake")}
function won(){
  if(B.type==="wild"){
    $("bMsg").textContent=B.tool.n+" ist erschöpft! Wirf einen Prompt-Ball.";
    return ballUI();
  }
  const n=B.npc;
  if(B.type==="trainer"){
    S.beaten.push(n.id);S.tokens+=n.reward;
    const up=gainXp(15);
    $("bMsg").textContent="Gewonnen! "+n.reward+" Tokens erhalten."+(up?" Level "+S.lv+"!":"");
    bpips();save();
    return act([["Zurück zur Karte",leave,true]]);
  }
  S.flags.agi=1;gainXp(100);save();
  $("bMsg").textContent="Die AGI ist besiegt!";
  act([["Weiter",()=>{leave();showEnd()},true]]);
}
function ballUI(){
  if(S.balls>0)act([["Prompt-Ball werfen ("+S.balls+")",throwBall,true],["Fliehen",leave]]);
  else{$("bMsg").textContent+=" Du hast keine Prompt-Bälle mehr.";act([["Tool entkommt lassen",leave,true]])}
}
function throwBall(){
  S.balls--;save();hud();act([]);
  $("bMsg").textContent="Der Prompt-Ball fliegt …";
  let n=0;
  const t=setInterval(()=>{
    shake();Sound.click();n++;
    if(n<3)return;
    clearInterval(t);
    setTimeout(()=>{
      if(Math.random()<.15){
        $("bMsg").textContent=B.tool.n+" ist ausgebrochen!";Sound.no();
        return ballUI();
      }
      S.caught.push(B.tool.n);S.tokens+=5;
      const up=gainXp(20);
      Sound.catch();
      const c=$("bfSprite");c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");
      let msg="Gefangen! "+B.tool.n+" ist jetzt im KI-Dex."+(up?" Level "+S.lv+"!":"");
      if(S.caught.length===TOOLS.length)msg+=" Alle Tools gefangen! Das Tor im Datenwald ist offen.";
      $("bMsg").textContent=msg;
      bpips();save();
      act([["Zurück zur Karte",leave,true]]);
    },450);
  },450);
}
function blackout(){
  const lost=Math.floor(S.tokens/2);S.tokens-=lost;
  $("bMsg").textContent="Energie leer! Du verlierst "+lost+" Tokens und wachst an der Akku-Station auf.";
  act([["Weiter",()=>{
    leave();
    const m=map();S.x=m.station.x;S.y=m.station.y;S.dir="d";S.hp=maxHp();save();hud();
  },true]]);
}
function leave(){
  B=null;mode="world";
  $("battle").hidden=true;$("world").hidden=false;
  save();hud();
}

/* ---------- Menüs ---------- */
function openModal(id){mode="modal";$(id).hidden=false}
function closeModals(){
  document.querySelectorAll(".overlay").forEach(o=>{if(o.id!=="title")o.hidden=true});
  if(mode==="modal")mode="world";
}
function openShop(){
  $("shopTok").textContent=S.tokens;$("shopMsg").textContent="";
  openModal("modalShop");
}
function buy(k){
  const price=k==="ball"?10:15;
  if(S.tokens<price){$("shopMsg").textContent="Zu wenig Tokens.";Sound.no();return}
  S.tokens-=price;if(k==="ball")S.balls++;else S.bars++;
  Sound.buy();save();hud();
  $("shopTok").textContent=S.tokens;
  $("shopMsg").textContent="Gekauft.";
}
function openDex(){
  if(mode!=="world")return;
  const grid=$("dexGrid");grid.innerHTML="";
  $("dexDetail").textContent="Wähle ein Tool aus.";
  TOOLS.forEach((t,i)=>{
    const has=S.caught.includes(t.n);
    const b=document.createElement("button");
    b.className="dexcard"+(has?" got":"");
    b.appendChild(toolSprite(t.n,64,!has));
    const s=document.createElement("strong");s.textContent=has?t.n:"???";b.appendChild(s);
    const m=document.createElement("small");m.textContent=has?t.k:"Nicht gefangen";b.appendChild(m);
    b.onclick=()=>{
      grid.querySelectorAll(".dexcard").forEach(c=>c.classList.remove("sel"));b.classList.add("sel");
      $("dexDetail").textContent=has?t.n+" · "+t.k+" · "+t.f+". "+t.d:"Lebt in: "+MAPS[REGION[i]].name+". Besiege es im hohen Gras.";
    };
    grid.appendChild(b);
  });
  openModal("modalDex");
}
function showEnd(){
  $("endText").textContent="Du hast alle "+TOOLS.length+" KI-Tools gefangen und die AGI besiegt. Level "+S.lv+", "+S.tokens+" Tokens. Du darfst weiter durch die Welt streifen.";
  openModal("modalEnd");
}
function sfxLabel(){$("btnSfx").textContent="Effekte: "+(Sound.sfx?"an":"aus");$("btnSfx").setAttribute("aria-pressed",Sound.sfx)}
function musicLabel(){$("btnMusic").textContent="Musik: "+(Sound.music?"an":"aus");$("btnMusic").setAttribute("aria-pressed",Sound.music)}
function toggleMusic(){Sound.setMusic(!Sound.music);settings.music=Sound.music;saveSet();musicLabel()}
function newGame(){S=fresh();save();$("title").hidden=true;mode="world";hud();
  say("Prof. Prompt",["Tipp: Sprich mit allen Leuten. Der Professor wartet links von dir."])}

/* ---------- Zeichnen ---------- */
function hash(x,y){let h=(Math.imul(x+7,73856093)^Math.imul(y+13,19349663))>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return h}
function drawTile(c,x,y,px,py,t){
  const h=hash(x,y);
  if(c==="G"){
    g.fillStyle="#8B8D8E";g.fillRect(px,py,T,T);
    g.fillStyle="#7a7c7d";g.fillRect(px,py+T-6,T,6);
    g.fillStyle="#E9E7E4";
    for(let i=0;i<4;i++){
      const bx=px+3+i*7+((h>>i)&3);
      const sw=Math.round(Math.sin(t/380+x+i+y*.5)*2);
      g.fillRect(bx+sw,py+6+((h>>(i+4))&3),2,10);
      g.fillRect(bx+sw/2,py+16+((h>>(i+4))&3),2,6);
    }
    return;
  }
  g.fillStyle=c==="W"?"#292A2C":"#F5F4F2";g.fillRect(px,py,T,T);
  if(c==="."||c==="C"||c===">"||c==="<"||c==="B"){
    g.fillStyle="#E9E7E4";g.fillRect(px,py,T,T);
    g.fillStyle="#d8d5d1";
    if(h&1)g.fillRect(px+(h>>3&15)+4,py+(h>>7&15)+4,3,3);
    if(h&4)g.fillRect(px+(h>>11&15)+6,py+(h>>5&15)+8,2,2);
  }
  if(c==="#"){
    g.fillStyle="#292A2C";g.fillRect(px,py,T,T);
    g.fillStyle="#3a3c3f";g.fillRect(px+3,py+3,T-6,T-8);
    g.fillStyle="#4a4d50";g.fillRect(px+7,py+6,T-16,T-16);
    g.fillStyle="#C3F36B";
    if(h&2)g.fillRect(px+8+(h>>4&7),py+8+(h>>8&7),4,3);
    g.fillStyle="#1d1e20";g.fillRect(px+T/2-2,py+T-6,4,6);
  }else if(c==="W"){
    g.fillStyle="#8B8D8E";
    for(let i=0;i<3;i++){
      const wx=px+((i*11+Math.floor(t/140)+(h&7))%T);
      g.fillRect(Math.min(wx,px+T-8),py+6+i*10,8,2);
    }
  }else if(c==="C"){
    g.fillStyle="#292A2C";g.fillRect(px+4,py+3,T-8,T-5);
    g.fillStyle="#C3F36B";g.fillRect(px+8,py+7,T-16,T-18);
    g.fillStyle="#292A2C";
    g.fillRect(px+14,py+9,4,2);g.fillRect(px+12,py+11,4,2);g.fillRect(px+14,py+13,4,2);
    g.fillStyle=(Math.floor(t/400)%2)?"#C3F36B":"#8B8D8E";g.fillRect(px+10,py+T-8,12,3);
  }else if(c==="B"){
    g.fillStyle="#292A2C";g.fillRect(px,py,T,T);
    g.fillStyle=S&&S.caught.length>=TOOLS.length?"#C3F36B":"#8B8D8E";
    g.fillRect(px+3,py+3,T-6,3);g.fillRect(px+3,py+3,3,T-3);g.fillRect(px+T-6,py+3,3,T-3);
    g.font="bold 11px Georgia,serif";g.textAlign="center";g.textBaseline="middle";
    g.fillText("AGI",px+T/2,py+T/2+2);
  }else if(c===">"||c==="<"){
    g.fillStyle="#C3F36B";
    const a=c===">"?1:-1,cx=px+T/2;
    g.fillRect(cx-6*a-(a<0?4:0)+(a<0?0:0),py+T/2-2,10,4);
    for(let i=0;i<4;i++)g.fillRect(cx+(2+i)*a-(a<0?2:0),py+T/2-4+i,2,8-i*2);
  }
}
function drawChar(px,py,body,dir,walk,mark,t){
  const b=walk?-Math.round(Math.abs(Math.sin(walk*Math.PI))*2):0;
  g.fillStyle="rgba(41,42,44,.3)";g.fillRect(px+8,py+25,16,4);
  g.fillStyle="#292A2C";g.fillRect(px+9,py+4+b,14,21);
  g.fillStyle="#F5F4F2";g.fillRect(px+10,py+5+b,12,10);
  g.fillStyle=body;g.fillRect(px+10,py+15+b,12,9);
  g.fillStyle="#292A2C";
  if(dir==="u")g.fillRect(px+10,py+5+b,12,6);
  else{
    g.fillRect(px+10,py+5+b,12,3);
    const ex=dir==="l"?[11,14]:dir==="r"?[17,20]:[12,18];
    ex.forEach(e=>g.fillRect(px+e,py+9+b,2,3));
  }
  g.fillRect(px+10,py+24,4,3);g.fillRect(px+18,py+24,4,3);
  if(mark){
    g.fillStyle="#C3F36B";g.fillRect(px+11,py-6+Math.round(Math.sin(t/200)*1.5),10,10);
    g.strokeStyle="#292A2C";g.lineWidth=1;g.strokeRect(px+11.5,py-5.5+Math.round(Math.sin(t/200)*1.5),9,9);
    g.fillStyle="#292A2C";g.font="bold 9px Georgia,serif";g.textAlign="center";g.textBaseline="middle";
    g.fillText("!",px+16,py-1+Math.round(Math.sin(t/200)*1.5));
  }
}
function render(){
  const m=map();
  let ppx=S.x*T,ppy=S.y*T,walk=0;
  if(mv){const k=Math.min(1,mv.t/MV);ppx=(mv.fx+(mv.tx-mv.fx)*k)*T;ppy=(mv.fy+(mv.ty-mv.fy)*k)*T;walk=k}
  const camX=Math.max(0,Math.min(m.w*T-W,Math.round(ppx+T/2-W/2)));
  const camY=Math.max(0,Math.min(m.h*T-H,Math.round(ppy+T/2-H/2)));
  g.fillStyle="#292A2C";g.fillRect(0,0,W,H);
  const x0=Math.floor(camX/T),y0=Math.floor(camY/T);
  for(let y=y0;y<=Math.min(m.h-1,y0+VH);y++)for(let x=x0;x<=Math.min(m.w-1,x0+VW);x++)
    drawTile(m.rows[y][x],x,y,x*T-camX,y*T-camY,clock);
  const actors=m.npcs.map(n=>({y:n.y*T,f:()=>drawChar(n.x*T-camX,n.y*T-camY,n.body,n.dir,0,n.kind==="trainer"&&!S.beaten.includes(n.id),clock)}));
  actors.push({y:ppy,f:()=>drawChar(Math.round(ppx)-camX,Math.round(ppy)-camY,"#C3F36B",S.dir,walk,false,clock)});
  actors.sort((a,b)=>a.y-b.y).forEach(a=>a.f());
}

/* ---------- Schleife ---------- */
let last=0;
function loop(ts){
  const dt=Math.min(50,ts-last);last=ts;clock=ts;
  if(S&&mode!=="title"){
    if(mode==="world"){
      if(mv){mv.t+=dt;if(mv.t>=MV)arrive()}
      else if(held.length)tryMove(held[held.length-1]);
    }
    if(!$("world").hidden)render();
  }
  requestAnimationFrame(loop);
}

/* ---------- Eingabe ---------- */
const KMAP={ArrowUp:"u",w:"u",W:"u",ArrowDown:"d",s:"d",S:"d",ArrowLeft:"l",a:"l",A:"l",ArrowRight:"r",d:"r",D:"r"};
addEventListener("keydown",e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  Sound.unlock();
  if(e.key==="Escape"){closeModals();return}
  if(mode==="title")return;
  const d=KMAP[e.key];
  if(d&&(mode==="world"||mode==="dialog")){e.preventDefault();if(!held.includes(d))held.push(d);return}
  if(e.key==="m"||e.key==="M"){toggleMusic();return}
  if(e.key==="i"||e.key==="I"){mode==="modal"?closeModals():openDex();return}
  if((e.key==="e"||e.key==="E"||e.key==="Enter"||e.key===" ")&&(mode==="world"||mode==="dialog")){
    if(document.activeElement&&document.activeElement.tagName==="BUTTON"&&mode==="world")return;
    e.preventDefault();if(!e.repeat)interact();
  }
});
addEventListener("keyup",e=>{const d=KMAP[e.key];if(d)held=held.filter(x=>x!==d)});
addEventListener("blur",()=>{held=[]});
document.querySelectorAll("#pad button").forEach(b=>{
  const d=b.dataset.d;
  const on=e=>{e.preventDefault();Sound.unlock();if(!held.includes(d))held.push(d)};
  const off=()=>{held=held.filter(x=>x!==d)};
  b.addEventListener("pointerdown",on);
  ["pointerup","pointerleave","pointercancel"].forEach(ev=>b.addEventListener(ev,off));
});
$("btnA").onclick=()=>{Sound.unlock();interact()};
$("dialog").onclick=advance;
$("btnDex").onclick=()=>{Sound.unlock();Sound.click();openDex()};
$("btnSfx").onclick=()=>{Sound.setSfx(!Sound.sfx);settings.sfx=Sound.sfx;saveSet();sfxLabel();Sound.click()};
$("btnMusic").onclick=()=>{Sound.unlock();toggleMusic()};
$("btnReset").onclick=()=>{
  if(!confirm("Fortschritt wirklich löschen und neu starten?"))return;
  try{localStorage.removeItem(KEY)}catch(e){}
  if(B){B=null;$("battle").hidden=true;$("world").hidden=false}
  closeModals();dlg=null;$("dialog").hidden=true;mv=null;held=[];
  newGame();
};
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>{Sound.click();closeModals()});
document.querySelectorAll("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
$("btnEndClose").onclick=closeModals;
$("btnContinue").onclick=()=>{
  Sound.unlock();S=load();$("title").hidden=true;mode="world";held=[];
  if(S.hp>maxHp()||S.hp<1)S.hp=maxHp();
  hud();
  if(settings.music){Sound.setMusic(true);musicLabel()}
};
$("btnNew").onclick=()=>{Sound.unlock();if(load()&&!confirm("Gespeicherten Fortschritt überschreiben?"))return;newGame();if(settings.music){Sound.setMusic(true);musicLabel()}};

Sound.setSfx(settings.sfx);sfxLabel();musicLabel();
const has=load();
$("btnContinue").disabled=!has;
if(!has)$("btnContinue").classList.remove("primary"),$("btnNew").classList.add("primary");
S=has||fresh();
requestAnimationFrame(loop);
})();
