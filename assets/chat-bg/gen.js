// Generate music chat background PNGs using headless browser
const http = require('http');
const fs = require('fs');

const html = `<!DOCTYPE html>
<html><head><style>body{margin:0;overflow:hidden}</style></head>
<body><canvas id="c"></canvas>
<script>
const icons = [
  // Note
  (c,s)=>{c.beginPath();c.arc(0,0,s*.3,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(s*.28,0);c.lineTo(s*.28,-s*.8);c.stroke()},
  // Double note
  (c,s)=>{c.beginPath();c.arc(0,0,s*.22,0,Math.PI*2);c.fill();c.beginPath();c.arc(s*.45,.1*s,s*.22,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(s*.22,0);c.lineTo(s*.22,-s*.65);c.lineTo(s*.67,-s*.55);c.lineTo(s*.67,.08*s);c.stroke()},
  // Headphones
  (c,s)=>{c.beginPath();c.arc(0,-s*.15,s*.45,Math.PI,0);c.stroke();c.beginPath();c.roundRect(-s*.52,-s*.05,s*.18,s*.35,s*.06);c.stroke();c.beginPath();c.roundRect(s*.34,-s*.05,s*.18,s*.35,s*.06);c.stroke()},
  // Guitar
  (c,s)=>{c.beginPath();c.ellipse(0,s*.2,s*.28,s*.38,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(0,-s*.18);c.lineTo(0,-s*.8);c.stroke();c.beginPath();c.moveTo(-s*.12,-s*.8);c.lineTo(s*.12,-s*.8);c.stroke();c.beginPath();c.arc(0,s*.2,s*.07,0,Math.PI*2);c.stroke()},
  // Microphone
  (c,s)=>{c.beginPath();c.ellipse(0,-s*.28,s*.18,s*.28,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(0,0);c.lineTo(0,s*.45);c.stroke();c.beginPath();c.moveTo(-s*.18,s*.45);c.lineTo(s*.18,s*.45);c.stroke();c.beginPath();c.arc(0,-.02*s,s*.28,Math.PI,0);c.stroke()},
  // Vinyl
  (c,s)=>{c.beginPath();c.arc(0,0,s*.42,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.14,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.04,0,Math.PI*2);c.fill();c.beginPath();c.arc(0,0,s*.28,.3,1.1);c.stroke();c.beginPath();c.arc(0,0,s*.35,2,3.2);c.stroke()},
  // Speaker
  (c,s)=>{c.beginPath();c.roundRect(-s*.32,-s*.42,s*.64,s*.84,s*.06);c.stroke();c.beginPath();c.arc(0,-s*.08,s*.2,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,-s*.08,s*.07,0,Math.PI*2);c.fill();c.beginPath();c.arc(0,s*.24,s*.09,0,Math.PI*2);c.stroke()},
  // Cassette
  (c,s)=>{c.beginPath();c.roundRect(-s*.48,-s*.28,s*.96,s*.56,s*.04);c.stroke();c.beginPath();c.arc(-s*.16,0,s*.13,0,Math.PI*2);c.stroke();c.beginPath();c.arc(s*.16,0,s*.13,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-s*.22,s*.28);c.lineTo(-s*.13,s*.13);c.lineTo(s*.13,s*.13);c.lineTo(s*.22,s*.28);c.stroke()},
  // Turntable
  (c,s)=>{c.beginPath();c.roundRect(-s*.48,-s*.38,s*.96,s*.76,s*.04);c.stroke();c.beginPath();c.arc(-s*.08,0,s*.26,0,Math.PI*2);c.stroke();c.beginPath();c.arc(-s*.08,0,s*.04,0,Math.PI*2);c.fill();c.beginPath();c.moveTo(s*.22,-s*.12);c.lineTo(-s*.03,-.01*s);c.stroke()},
  // Treble clef
  (c,s)=>{c.beginPath();c.moveTo(s*.08,s*.45);c.bezierCurveTo(s*.08,s*.15,-s*.28,s*.08,-s*.18,-s*.12);c.bezierCurveTo(-s*.08,-s*.35,s*.28,-s*.28,s*.12,-s*.03);c.bezierCurveTo(-.01*s,s*.18,-s*.12,s*.12,s*.03,s*.45);c.stroke();c.beginPath();c.moveTo(s*.03,-s*.03);c.lineTo(s*.03,-s*.55);c.stroke()},
  // Piano
  (c,s)=>{c.beginPath();c.roundRect(-s*.38,-s*.22,s*.76,s*.44,s*.03);c.stroke();for(let i=1;i<4;i++){c.beginPath();c.moveTo(-s*.38+i*s*.19,-s*.22);c.lineTo(-s*.38+i*s*.19,s*.22);c.stroke()}c.fillRect(-s*.26,-s*.22,s*.1,s*.26);c.fillRect(-s*.02,-s*.22,s*.1,s*.26);c.fillRect(s*.16,-s*.22,s*.1,s*.26)},
  // Saxophone
  (c,s)=>{c.beginPath();c.moveTo(-s*.08,-s*.55);c.quadraticCurveTo(s*.28,-s*.25,s*.12,s*.1);c.quadraticCurveTo(-.02*s,s*.45,-s*.18,s*.35);c.stroke();c.beginPath();c.arc(-s*.18,s*.35,s*.1,0,Math.PI*2);c.stroke()},
  // Trumpet
  (c,s)=>{c.beginPath();c.moveTo(-s*.45,0);c.lineTo(s*.18,0);c.stroke();c.beginPath();c.moveTo(s*.18,-s*.13);c.quadraticCurveTo(s*.45,-s*.18,s*.45,0);c.quadraticCurveTo(s*.45,s*.18,s*.18,s*.13);c.stroke();c.fillRect(-s*.18,-s*.04,s*.05,s*.12);c.fillRect(-s*.05,-s*.04,s*.05,s*.15);c.fillRect(s*.08,-s*.04,s*.05,s*.12)},
  // Radio
  (c,s)=>{c.beginPath();c.roundRect(-s*.38,-s*.28,s*.76,s*.56,s*.05);c.stroke();c.beginPath();c.arc(-s*.04,s*.03,s*.16,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-s*.08,-s*.28);c.lineTo(s*.22,-s*.5);c.stroke();c.fillRect(s*.12,-s*.18,s*.14,s*.06);c.fillRect(s*.12,-s*.05,s*.14,s*.06)},
  // EQ bars
  (c,s)=>{[.3,.55,.75,.45,.65,.35,.5].forEach((h,i)=>{c.fillRect(-s*.42+i*s*.12,s*.35-h*s*.7,s*.07,h*s*.7)})},
  // Drum
  (c,s)=>{c.beginPath();c.ellipse(0,-s*.22,s*.32,s*.1,0,0,Math.PI*2);c.stroke();c.beginPath();c.ellipse(0,s*.22,s*.32,s*.1,0,Math.PI,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-s*.32,-s*.22);c.lineTo(-s*.32,s*.22);c.moveTo(s*.32,-s*.22);c.lineTo(s*.32,s*.22);c.stroke()},
  // Maracas
  (c,s)=>{c.beginPath();c.arc(-s*.13,-s*.18,s*.18,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-s*.13,0);c.lineTo(-s*.13,s*.4);c.stroke();c.beginPath();c.arc(s*.18,-s*.13,s*.16,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(s*.18,.02*s);c.lineTo(s*.18,s*.4);c.stroke()},
  // Star
  (c,s)=>{c.beginPath();for(let i=0;i<5;i++){const a=Math.PI*2*i/5-Math.PI/2,b=Math.PI*2*(i+.5)/5-Math.PI/2;c.lineTo(Math.cos(a)*s*.32,Math.sin(a)*s*.32);c.lineTo(Math.cos(b)*s*.13,Math.sin(b)*s*.13)}c.closePath();c.stroke()},
  // Dots/sparkle
  (c,s)=>{const r=s*.04;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.beginPath();c.arc(s*.14,-s*.08,r*.7,0,Math.PI*2);c.fill();c.beginPath();c.arc(-s*.1,s*.07,r*.5,0,Math.PI*2);c.fill()},
  // Sound wave
  (c,s)=>{c.beginPath();for(let x=-s*.38;x<s*.38;x+=1.5)c.lineTo(x,Math.sin(x*.18)*s*.12);c.stroke()},
  // CD
  (c,s)=>{c.beginPath();c.arc(0,0,s*.38,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.1,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,s*.25,.4,1);c.stroke();c.beginPath();c.arc(0,0,s*.32,2.2,3.2);c.stroke()},
];

function draw(color) {
  const canvas = document.getElementById('c');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  const W=1080, H=1920;
  
  const grad = ctx.createRadialGradient(W/2,H/3,0,W/2,H/2,W*.85);
  grad.addColorStop(0,'#141d26');
  grad.addColorStop(1,'#0b1118');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);
  
  ctx.strokeStyle=color;
  ctx.fillStyle=color;
  ctx.lineWidth=1.8;
  ctx.lineCap='round';
  ctx.lineJoin='round';
  
  let seed=42;
  function rand(){seed=(seed*16807)%2147483647;return seed/2147483647}
  
  const cell=95;
  const cols=Math.ceil(W/cell)+1;
  const rows=Math.ceil(H/cell)+1;
  
  for(let r=0;r<rows;r++){
    for(let co=0;co<cols;co++){
      const x=co*cell+(r%2?cell/2:0)+rand()*25-12;
      const y=r*cell+rand()*25-12;
      const idx=Math.floor(rand()*icons.length);
      const sz=24+rand()*16;
      const rot=rand()*Math.PI*2;
      const op=0.12+rand()*0.18;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(rot);
      ctx.globalAlpha=op;
      try{icons[idx](ctx,sz)}catch(e){}
      ctx.restore();
    }
  }
  ctx.globalAlpha=1;
  return canvas.toDataURL('image/png');
}

window._draw = draw;
</script></body></html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
});

server.listen(9876, () => console.log('Server on 9876'));
