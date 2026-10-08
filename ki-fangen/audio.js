const Sound=(()=>{
  let ctx=null,sfx=true,music=false,timer=null,beat=0;
  const LEAD=[392,440,523,440,392,330,392,440,523,587,523,440,392,330,294,330];
  const BASS=[98,98,110,110,87,87,98,98];
  function ac(){
    if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ctx=new A()}
    if(ctx.state==="suspended")ctx.resume();
    return ctx;
  }
  function tone(f,d,type,delay,vol,isMusic){
    if(isMusic?!music:!sfx)return;
    const a=ac();if(!a)return;
    const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+(delay||0);
    o.type=type||"square";o.frequency.value=f;
    g.gain.setValueAtTime(vol||.05,t);
    g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.02);
  }
  const seq=(notes,d,type)=>notes.forEach((f,i)=>tone(f,d,type,i*d));
  function tick(){
    tone(LEAD[beat%LEAD.length],.22,"triangle",0,.035,true);
    if(beat%2===0)tone(BASS[(beat/2|0)%BASS.length],.4,"sine",0,.05,true);
    beat++;
  }
  function startMusic(){if(!timer)timer=setInterval(tick,280)}
  function stopMusic(){clearInterval(timer);timer=null}
  return{
    unlock:()=>ac(),
    ok:()=>seq([523,659,784],.08),
    no:()=>seq([220,165],.14,"sawtooth"),
    click:()=>tone(660,.05),
    step:()=>tone(120,.04,"triangle",0,.03),
    encounter:()=>seq([392,330,392,330,523,659],.07),
    heal:()=>seq([392,494,587,784],.1,"triangle"),
    catch:()=>seq([523,659,784,1047,784,1047],.1),
    level:()=>seq([523,659,784,1047,1319],.09,"triangle"),
    buy:()=>seq([880,1175],.06),
    setSfx:v=>{sfx=v},
    setMusic:v=>{music=v;v?(ac(),startMusic()):stopMusic()},
    get sfx(){return sfx},
    get music(){return music}
  };
})();
