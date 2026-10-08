// Legende: # Baum  . Weg  G hohes Gras  W Wasser  C Akku-Station  B Tor zur AGI  > < Übergang
const MAPS={
  wiese:{
    name:"Startwiese",
    rows:[
      "####################",
      "#..GGGG....WWW..GGG#",
      "#..GGGG....WWW..GGG#",
      "#..........WWW.....#",
      "#.##.GGG........##.#",
      "#.##.GGG..GGG...##.#",
      "#....GGG..GGG......#",
      "#..................#",
      "#GGG.....##....GGG.#",
      "#GGG.....##....GGG.#",
      "#GGG...........GGG.#",
      "#..................>",
      "#.....C............#",
      "####################"
    ],
    station:{x:6,y:11},
    warps:[{x:19,y:11,to:"wald",tx:1,ty:11,dir:"r"}],
    npcs:[
      {id:"prof",kind:"prof",x:2,y:7,name:"Prof. Prompt",body:"#C3F36B",dir:"r"},
      {id:"shop",kind:"shop",x:14,y:7,name:"Token-Händler",body:"#8B8D8E",dir:"l"},
      {id:"ben",kind:"trainer",x:9,y:6,name:"Azubi Ben",body:"#292A2C",dir:"d",reward:25,
        lines:["Ich lerne gerade für die KI-Prüfung!","Drei Fragen. Wer zwei richtig hat, gewinnt."],
        after:["Gut gemacht! Ich muss noch mehr üben."]},
      {id:"lena",kind:"talk",x:18,y:4,name:"Lena",body:"#E9E7E4",dir:"l",
        lines:["Tipp: Ein Prompt mit Rolle, Kontext und Format liefert meist bessere Antworten.","Die 3-C-Methode: Context, Command, Constraints."]},
      {id:"tom",kind:"talk",x:2,y:2,name:"Tom",body:"#8B8D8E",dir:"d",
        lines:["Im hohen Gras leben wilde KI-Tools.","Jede richtige Antwort schwächt sie. Dann wirfst du einen Prompt-Ball."]}
    ]
  },
  wald:{
    name:"Datenwald",
    rows:[
      "####################",
      "#GGGG..WWW..GGGGGG.#",
      "#GGGG..WWW..GGGGGG.#",
      "#GGGG......GGGGGGG.#",
      "#...##.GGG..##.....#",
      "#.G.##.GGG..##.GGG.#",
      "#.G........GG..GGG.#",
      "#.GGG..###.GG..GGG.#",
      "#.GGG..#B#.....GG..#",
      "#......#.#.GGG.....#",
      "#GGG.......GGG.GGG.#",
      "<GGG...........GGG.#",
      "#...C..............#",
      "####################"
    ],
    station:{x:4,y:11},
    warps:[{x:0,y:11,to:"wiese",tx:18,ty:11,dir:"l"}],
    npcs:[
      {id:"dana",kind:"trainer",x:6,y:6,name:"Data Scientist Dana",body:"#C3F36B",dir:"d",reward:35,
        lines:["Daten sind mein Leben.","Beantworte mir drei Fragen!"],
        after:["Respekt. Du kennst dich aus."]},
      {id:"ninja",kind:"trainer",x:3,y:9,name:"Prompt-Ninja",body:"#292A2C",dir:"r",reward:35,
        lines:["Ein Prompt, ein Versuch.","Zeig, was du weißt."],
        after:["Du bist schneller als mein Prompt."]},
      {id:"sage",kind:"talk",x:14,y:12,name:"Alte Weise",body:"#E9E7E4",dir:"u",
        lines:["Merke: Halluzinationen sind plausibel klingende, aber falsche Antworten.","Gegen Halluzinationen helfen Grounding und RAG.","Hinter dem Tor im Norden wartet die AGI. Fange vorher alle 12 Tools."]},
      {id:"fox",kind:"talk",x:12,y:3,name:"Wanderer",body:"#8B8D8E",dir:"l",
        lines:["Der Akku-Station kannst du jederzeit vertrauen. Sie lädt dich auf und speichert dein Spiel."]}
    ]
  }
};
Object.values(MAPS).forEach(m=>{
  m.h=m.rows.length;
  m.w=Math.max(...m.rows.map(r=>r.length));
  m.rows=m.rows.map(r=>r.padEnd(m.w,"#").slice(0,m.w));
});
