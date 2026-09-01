const $ = id => document.getElementById(id);
let data = JSON.parse(localStorage.getItem('skyLandV2') || 'null');
let dialogue = false;
let P = {x:18, y:72, speed:0.045, target:null};
const keys = Object.create(null);

function sync(){
  if(!data) return;
  $('lv').textContent=data.lv;
  $('exp').textContent=data.exp;
  $('coin').textContent=data.coin;
  $('day').textContent=data.day;
}
function save(){
  localStorage.setItem('skyLandV2', JSON.stringify(data));
  sync();
}
function addXP(n){
  data.exp += n;
  while(data.exp >= data.lv*100){
    data.exp -= data.lv*100;
    data.lv++;
  }
  save();
}
function openModal(html){
  dialogue=true;
  $('modalContent').innerHTML=html;
  $('modal').classList.remove('hidden');
}
function closeModal(){
  dialogue=false;
  $('modal').classList.add('hidden');
}
$('close').addEventListener('click', e=>{e.preventDefault();e.stopPropagation();closeModal()});
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))closeModal()});

function startGame(){
  const input=$('nameInput');
  const name=input.value.trim();
  if(!name){
    input.focus();
    input.classList.add('inputError');
    return;
  }
  input.classList.remove('inputError');

  data={name,lv:1,exp:0,coin:100,day:1,hair:'normal',clothes:'normal',found:[]};
  localStorage.setItem('skyLandV2',JSON.stringify(data));
  $('start').classList.add('hidden');
  $('game').classList.remove('hidden');
  sync();
  applyLook();

  openModal('<h2>🌊 PROLOGUE — 目覚め</h2><p>波の音が聞こえる。</p><p>あなたは見知らぬビーチに立っていた。</p><p>SYSTEM：PLAYER DATAを確認……登録完了。</p><p>海岸の先に、古い街が見える。</p><button class="action" id="beginExplore">探索を始める</button>');
  setTimeout(()=>{
    const b=$('beginExplore');
    if(b)b.addEventListener('click',closeModal);
  },0);
}

$('startBtn').addEventListener('click',e=>{
  e.preventDefault();
  e.stopPropagation();
  startGame();
});
$('nameInput').addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    e.preventDefault();
    startGame();
  }
});
$('nameInput').addEventListener('input',()=> $('nameInput').classList.remove('inputError'));

function walkable(x,y){
  if(x<4||x>96||y<61||y>88)return false;
  const blocked=[[8,22,58,77],[36,50,54,77],[82,98,52,76]];
  return !blocked.some(r=>x>r[0]&&x<r[1]&&y>r[2]&&y<r[3]);
}
function move(nx,ny){
  if(walkable(nx,ny)){P.x=nx;P.y=ny}
}
function render(){
  $('player').style.left=P.x+'%';
  $('player').style.top=P.y+'%';
}

document.addEventListener('keydown',e=>{
  if(dialogue || e.target.matches('input,textarea')) return;
  const k=e.key.toLowerCase();
  if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
    e.preventDefault();
    keys[k]=true;
    P.target=null;
  }
});
document.addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});

$('world').addEventListener('click',e=>{
  if(dialogue||e.target.closest('.point'))return;
  const r=$('world').getBoundingClientRect();
  P.target={x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};
});

function updateMovement(dt){
  if(dialogue)return;
  let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0);
  let dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
  if(dx||dy){
    const len=Math.hypot(dx,dy);
    move(P.x+dx/len*P.speed*dt,P.y+dy/len*P.speed*dt);
    P.target=null;
  }else if(P.target){
    const tx=P.target.x-P.x,ty=P.target.y-P.y,d=Math.hypot(tx,ty);
    if(d<.35)P.target=null;
    else move(P.x+tx/d*P.speed*dt,P.y+ty/d*P.speed*dt);
  }
}
let last=performance.now();
function loop(now){
  const dt=Math.min(40,now-last);last=now;
  updateMovement(dt);render();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

document.querySelectorAll('.point').forEach(b=>b.addEventListener('click',e=>{
  e.stopPropagation();
  const msg=b.dataset.msg;
  if(!data)return;
  if(!data.found.includes(msg)){data.found.push(msg);addXP(10);openModal('<h2>🔎 発見</h2><p>'+msg+'</p><p>探索XP +10</p>')}
  else openModal('<h2>🔎 発見</h2><p>'+msg+'</p>');
}));

document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{
  if(b.dataset.panel==='profile')profile();
  if(b.dataset.panel==='test')test();
  if(b.dataset.panel==='gacha')gacha();
  if(b.dataset.panel==='story')story();
  if(b.dataset.panel==='save'){save();openModal('<h2>💾 SAVE</h2><p>保存しました。</p>')}
}));

function profile(){
  openModal('<h2>👤 PROFILE</h2><p>NAME：'+data.name+'</p><p>LV：'+data.lv+'　EXP：'+data.exp+'</p>'+
  '<h3>💇 髪型</h3><button class="action" onclick="equip(\\'hair\\',\\'normal\\')">通常</button><button class="action" onclick="equip(\\'hair\\',\\'blue\\')">BLUE HAIR</button>'+
  '<h3>👕 服</h3><button class="action" onclick="equip(\\'clothes\\',\\'normal\\')">通常服</button><button class="action" onclick="equip(\\'clothes\\',\\'city\\')">CITY JACKET</button><button class="action" onclick="equip(\\'clothes\\',\\'beach\\')">BEACH STYLE</button>'+
  '<h3>🏷️ 称号</h3><p>'+(data.found.length>=1?'「旅人」 ':'')+(data.found.length>=3?'「観察者」':'')+'</p>');
}
function equip(type,val){data[type]=val;save();applyLook();profile()}
function applyLook(){
  if(!data)return;
  $('player').querySelector('.hair').style.background=data.hair==='blue'?'#25a9ff':'#273a92';
  $('player').querySelector('.body').style.background=data.clothes==='city'?'#354554':data.clothes==='beach'?'#f2a84b':'#168fd0';
}

const questions=[
['正確性','12 × 8 は？',['96','86','108'],'96'],
['合理性','10分で100EXP、20分で250EXP。効率が高いのは？',['10分','20分','同じ'],'20分'],
['観察力','「SKY LAND」の中にある英字で、Sはいくつ？',['0','1','2'],'1'],
['発想','道を最短にするなら、まず何を確認する？',['地図','勘','何も確認しない'],'地図'],
['正確性','1時間は何分？',['30','60','100'],'60'],
['観察力','「BEACH」の文字数は？',['4','5','6'],'5']
];
function test(){
  const q=questions[Math.floor(Math.random()*questions.length)];
  openModal('<h2>🧠 '+q[0]+'</h2><p>'+q[1]+'</p>'+q[2].map(a=>'<button class="action answerBtn" data-a="'+a+'">'+a+'</button>').join(''));
  document.querySelectorAll('.answerBtn').forEach(b=>b.onclick=()=>answer(b.dataset.a,q[3]));
}
function answer(a,c){
  if(a===c){addXP(25);openModal('<h2>✅ 正解！</h2><p>XP +25</p>')}
  else openModal('<h2>❌ 不正解</h2><p>答え：'+c+'</p>');
}
function gacha(){
  openModal('<h2>🎰 GACHA</h2><div id="slot" class="gacha">🎰</div><p>💠 '+data.coin+'</p><button class="action" id="spinBtn">回す（10💠）</button>');
  $('spinBtn').onclick=spin;
}
function spin(){
  if(data.coin<10){openModal('<h2>💠 コイン不足</h2>');return}
  data.coin-=10;save();
  const arr=['👕 CITY JACKET','💇 BLUE HAIR','🏷️ 星読み','✨ UNKNOWN ITEM','👕 BEACH STYLE'];
  const slot=$('slot');slot.classList.add('spin');let i=0;
  const timer=setInterval(()=>{
    slot.textContent=arr[Math.floor(Math.random()*arr.length)];
    if(++i>12){
      clearInterval(timer);slot.classList.remove('spin');
      const got=slot.textContent;
      if(got.includes('JACKET'))data.clothes='city';
      if(got.includes('BLUE'))data.hair='blue';
      if(!data.found.includes(got))data.found.push(got);
      save();applyLook();
      slot.insertAdjacentHTML('afterend','<p>✨ '+got+' を獲得！</p>');
    }
  },100);
}
function story(){
  openModal('<h2>📖 STORY</h2><p>あなたはビーチから海岸へ向かって歩き始めた。</p><p>古い街には、まだ誰も知らない秘密が眠っている。</p><p>次に何をするかは、あなた次第だ。</p>');
}

if(data){
  $('start').classList.add('hidden');
  $('game').classList.remove('hidden');
  sync();
  applyLook();
}
