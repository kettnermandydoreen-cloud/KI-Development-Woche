function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rngFrom(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}

// Erzeugt für jeden Namen ein eigenes, symmetrisches Pixelwesen.
function toolSprite(name,size,hidden){
  const cv=document.createElement("canvas");
  cv.width=cv.height=size;
  const x=cv.getContext("2d");
  const N=7,cell=size/(N+2),r=rngFrom(hashStr(name));
  x.fillStyle=hidden?"#8B8D8E":"#292A2C";
  x.fillRect(0,0,size,size);
  if(hidden){
    x.fillStyle="#F5F4F2";
    x.font="bold "+Math.round(size*.5)+"px Georgia,serif";
    x.textAlign="center";x.textBaseline="middle";
    x.fillText("?",size/2,size/2+size*.03);
    return cv;
  }
  const lime="#C3F36B",paper="#F5F4F2";
  const px=(i,j,c)=>{x.fillStyle=c;x.fillRect(Math.floor(i*cell),Math.floor(j*cell),Math.ceil(cell),Math.ceil(cell))};
  for(let j=0;j<N;j++)for(let i=0;i<4;i++){
    const v=r();
    if(v>.42){
      const c=v>.85?paper:lime;
      px(1+i,1+j,c);px(1+N-1-i,1+j,c);
    }
  }
  for(let j=1;j<=N;j++)px(4,j,lime);
  px(3,3,paper);px(5,3,paper);
  x.fillStyle="#292A2C";
  x.fillRect(Math.floor(3*cell+cell*.3),Math.floor(3*cell+cell*.3),Math.ceil(cell*.45),Math.ceil(cell*.45));
  x.fillRect(Math.floor(5*cell+cell*.3),Math.floor(3*cell+cell*.3),Math.ceil(cell*.45),Math.ceil(cell*.45));
  return cv;
}
