
(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero=$('#hero'),idea=$('#idea'),modes=$('#modes'),agents=$('#agents'),workflow=$('#workflow');
const progress=$('#pageProgress'),header=$('#header');let mouseX=0,mouseY=0,orbitPhase=0,orbitLast=performance.now(),orbitFrozenUntil=0,selectedAgent=3,agentPositions=[];
const heroEmblem=$('#heroEmblem'),emblemMain=$('#emblemMain'),heroLead=$('#heroLead'),human=$('#humanHero'),robot=$('#robotHero');const pieces=$$('.piece');const sculpt=$('#ideaSculpture'),blocks=$$('.idea-block');
const stepEls=$$('.idea-step'),mode1=$('#modeOne'),mode2=$('#modeTwo'),workCards=$$('.work-card'),workTrack=$('#workflowTrack'),meter=$$('#stepMeter i');
const agentData=[
{name:'Planning',icon:'◎',text:'Organizes ideas into clear priorities, scope, and a practical project direction.',points:['Clarify goals and milestones','Break down project phases','Suggest next steps']},
{name:'Research',icon:'⌕',text:'Explores supporting context and information to help a project start with better understanding.',points:['Find useful references','Compare approaches','Surface important considerations']},
{name:'Design',icon:'✦',text:'Helps shape features, interaction ideas, and a clear experience for the people using the project.',points:['Structure UI ideas','Improve communication','Review user flows']},
{name:'Development',icon:'⌘',text:'Supports technical problem-solving and the path from project plans to practical implementation.',points:['Guide implementation','Review coding approaches','Connect features to requirements']},
{name:'Testing',icon:'✓',text:'Looks for issues, edge cases, and improvements that make the final project more reliable.',points:['Identify testing scenarios','Review behavior','Suggest quality improvements']},
{name:'Documentation',icon:'▤',text:'Helps explain the project clearly, from requirements and technical decisions to progress updates.',points:['Organize project notes','Summarize decisions','Prepare clear explanations']},
{name:'Deployment',icon:'↗',text:'Supports planning the steps needed to deliver a project to people who will use it.',points:['Map release steps','Identify deployment risks','Clarify handoff tasks']},
{name:'Monitoring',icon:'◉',text:'Helps think about feedback, ongoing quality, and opportunities to improve after delivery.',points:['Track outcomes','Organize feedback','Suggest next improvements']}
];
const field=$('#orbitField'),stage=$('#orbitStage'),panel=$('#agentPanel'),line=$('#agentLine'),nodes=[];
agentData.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='agent-node';b.innerHTML=`<span class="node-icon">${a.icon}</span><span>${a.name}</span>`;b.setAttribute('aria-label',`${a.name} agent`);b.addEventListener('mouseenter',()=>chooseAgent(i,true));b.addEventListener('focus',()=>chooseAgent(i,true));b.addEventListener('click',()=>chooseAgent(i,true));field.appendChild(b);nodes.push(b)});
function chooseAgent(i,freeze=false){selectedAgent=i;if(freeze)orbitFrozenUntil=performance.now()+4300;nodes.forEach((n,j)=>n.classList.toggle('active',i===j));let a=agentData[i];$('#agentName').textContent=a.name;$('#agentDescription').textContent=a.text;$('#agentCount').textContent=String(i+1).padStart(2,'0')+' / 08';$('#agentBullets').replaceChildren(...a.points.map(p=>{let li=document.createElement('li');li.textContent=p;return li}));}
chooseAgent(3);
function chapterProgress(el){const r=el.getBoundingClientRect(),span=Math.max(1,r.height-innerHeight);return clamp(-r.top/span)}
function visibleRatio(el){const r=el.getBoundingClientRect();return clamp((innerHeight-r.top)/(innerHeight+r.height))}
function renderScroll(){const y=scrollY,doc=Math.max(1,document.documentElement.scrollHeight-innerHeight);progress.style.transform=`scaleX(${clamp(y/doc)})`;
let hp=chapterProgress(hero);let reveal=smooth(.16,.38,hp),fade=smooth(.45,.61,hp),white=smooth(.76,.98,hp);
heroEmblem.style.transform=`translate(calc(-50% + ${mouseX*(1-hp)*14}px),calc(-50% + ${mouseY*(1-hp)*11}px)) perspective(900px) rotateY(${hp*235}deg) rotateX(${hp*19}deg) rotateZ(${hp*14}deg) scale(${1+hp*.92})`;
heroEmblem.style.opacity=1-smooth(.62,.76,hp);emblemMain.style.opacity=1-smooth(.27,.58,hp);
pieces.forEach((piece,i)=>{const split=smooth(.18,.6,hp);piece.style.opacity=split*(1-smooth(.6,.76,hp));piece.style.transform=`translate3d(${(i-2)*71*split}px,${((i%2)*2-1)*32*split}px,${i*35*split}px) rotateY(${(i-2)*39*split}deg) rotateX(${(i%2?1:-1)*38*split}deg) skew(-12deg)`});
heroLead.style.opacity=1-smooth(.17,.39,hp);heroLead.style.transform=`translateX(-50%) translateY(${-hp*105}px) scale(${1-hp*.14})`;
human.style.transform=`translate3d(${mouseX*10-hp*180}px,${hp*30}px,0) scale(${1+hp*.17})`;robot.style.transform=`translate3d(${mouseX*-10+hp*180}px,${hp*30}px,0) scale(${1+hp*.17})`;human.style.opacity=.84*(1-smooth(.19,.54,hp));robot.style.opacity=.83*(1-smooth(.19,.54,hp));
$('#heroGrid').style.transform=`perspective(570px) rotateX(${69-hp*16}deg) translateY(${hp*-95}px)`;
const heroShift=$('#heroShift');heroShift.style.opacity=smooth(.42,.53,hp)*(1-smooth(.995,1,hp));heroShift.style.color=white>.42?'#181615':'#f4f2ef';heroShift.style.transform=`translateY(${(1-smooth(.4,.62,hp))*150}px) scale(${.73+hp*.38})`;
$('#heroWipe').style.transform=`translateY(${(1-white)*104}%)`;$('#heroCounter').textContent=String(Math.min(7,Math.floor(hp*7))).padStart(2,'0');
// The next pinned chapter enters from below over roughly one viewport; bridge
// the approved THINK BIGGER typography over that gap, then gently hand it off.
const bridge=$('#handoffBridge'), ideaTop=idea.getBoundingClientRect().top;
const bridgePresence=smooth(.955,.985,hp)*smooth(innerHeight*.38,innerHeight*.78,stepEls[0].getBoundingClientRect().top);
bridge.style.opacity=bridgePresence;
bridge.style.visibility=bridgePresence>.003?'visible':'hidden';
bridge.style.transform=`translateY(${-(1-smooth(innerHeight*.10,innerHeight*.55,ideaTop))*48}px)`;

let ip=chapterProgress(idea);let segments=[[0,.38],[.28,.73],[.62,1.12]];stepEls.forEach((el,i)=>{let [a,b]=segments[i],opacity=smooth(a,a+.105,ip)*(1-smooth(b-.12,b,ip));if(i===0)opacity=1-smooth(.28,.38,ip);if(i===2)opacity=smooth(.63,.77,ip);el.style.opacity=opacity;el.style.transform=`translate(-50%,calc(-50% + ${i===0?(1-smooth(0,.12,ip))*24-(smooth(b-.13,b,ip))*90:(1-smooth(a,a+.18,ip))*120-(smooth(b-.13,b,ip))*90}px)) scale(${i===0?.96+.04*smooth(0,.12,ip):.89+.11*smooth(a,a+.18,ip)})`;el.classList.toggle('visible',opacity>.15)});$('#ideaProgress').style.transform=`scaleX(${ip})`;
blocks.forEach((b,i)=>{let x=(i-2)*106+Math.sin(ip*4.5+i*2)*45,y=(i%2?1:-1)*43+Math.cos(ip*6+i)*47,rz=(i-2)*15+ip*110,ry=(i-2)*30+ip*300; b.style.transform=`translate3d(${x}px,${y}px,${(2-i)*20}px) rotateY(${ry}deg) rotateX(${(i%2?1:-1)*28}deg) rotateZ(${rz}deg) scale(${1+.16*Math.sin(ip*4+i)})`});sculpt.style.opacity=.21+.22*(1-ip);
let mp=chapterProgress(modes);let m1=smooth(.03,.4,mp),m2=smooth(.21,.58,mp);mode1.style.transform=`translate3d(${(1-m1)*-140}px,${(1-m1)*75}px,${-150+150*m1}px) rotateY(${(1-m1)*-26}deg)`;mode1.style.opacity=.25+.75*m1;mode2.style.transform=`translate3d(${(1-m2)*160}px,${(1-m2)*75}px,${-170+170*m2}px) rotateY(${(1-m2)*25}deg)`;mode2.style.opacity=.23+.77*m2;
let wp=chapterProgress(workflow);let startX=innerWidth*.08,trackW=workTrack.scrollWidth,endX=innerWidth-trackW-innerWidth*.06;workTrack.style.transform=`translate3d(${lerp(startX,endX,wp)}px,0,0)`;let idx=Math.min(4,Math.floor(wp*5));workCards.forEach((card,i)=>{let active=i===idx;card.classList.toggle('current',active);card.style.transform=`perspective(1000px) rotateY(${(i-idx)*-6}deg) translateY(${active?-18:0}px)`});meter.forEach((e,i)=>e.classList.toggle('active',i<=idx));$('#workflowCount').textContent=String(idx+1).padStart(2,'0')+' / 05';
const ideaRect=idea.getBoundingClientRect(),workflowRect=workflow.getBoundingClientRect();const isLight=ideaRect.top<=innerHeight*.45&&ideaRect.bottom>innerHeight*.3 || workflowRect.top<=innerHeight*.45&&workflowRect.bottom>innerHeight*.3 || $('#outro').getBoundingClientRect().top<innerHeight*.5;header.classList.toggle('light',isLight);
}
function renderOrbit(now){const dt=Math.min(.06,(now-orbitLast)/1000);orbitLast=now;if(now>orbitFrozenUntil&&!reduced)orbitPhase+=dt*.033;
const fr=field.getBoundingClientRect(),st=stage.getBoundingClientRect(),pn=panel.getBoundingClientRect();const w=fr.width,h=fr.height,mobile=innerWidth<=680;const cx=w*.50,cy=h-(mobile?3:25),rx=w*(mobile?.44:.42),ry=h*(mobile?.72:.76);agentPositions=[];
nodes.forEach((node,i)=>{const t=((i+.5)/nodes.length+orbitPhase)%1,angle=Math.PI*(1-t);const outward=i===selectedAgent?18:0;const size=node.getBoundingClientRect().width||71;const nx=cx+(rx+outward)*Math.cos(angle),ny=cy-(ry+outward)*Math.sin(angle);let edge=clamp(Math.min(t,1-t)*13);let opacity= i===selectedAgent?1: .40+.60*edge;node.style.transform=`translate3d(${nx-size/2}px,${ny-size/2}px,0) scale(${i===selectedAgent?1.14:1})`;node.style.opacity=opacity.toFixed(3);node.style.pointerEvents=edge>.08?'auto':'none';agentPositions.push({x:nx+fr.left-st.left,y:ny+fr.top-st.top})});
if(!mobile){const p=agentPositions[selectedAgent],x2=pn.left-st.left+5,y2=pn.top-st.top+76;if(p){const mid=x2-46;line.setAttribute('d',`M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${mid.toFixed(1)} ${p.y.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`)}}
requestAnimationFrame(renderOrbit)}
let ticking=false;function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(()=>{renderScroll();ticking=false})}}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);addEventListener('mousemove',e=>{mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2},{passive:true});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');observer.unobserve(e.target)}}),{threshold:.15});$$('.feature').forEach(e=>observer.observe(e));
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>{let type=b.dataset.mode;let target=type==='normal'?$('#modeOne'):$('#modeTwo');target.style.borderColor='#ff8e31';target.style.boxShadow='0 0 60px rgba(255,111,13,.26)';$('#toastTitle').textContent=type==='normal'?'Normal AI Chat':'Project AI';$('#toastBody').textContent=type==='normal'?'Use Normal AI Chat for quick questions, explanations, brainstorming, and everyday conversations.':'Use Project AI when your question belongs to a specific project and you want help with planning, organization, and step-by-step development.';$('#modeInfo').hidden=false}));
$('#toastClose').addEventListener('click',()=>{$('#modeInfo').hidden=true});
// Friendly local preview warning if workspace is not running is conveyed in page footer; no backend calls are faked.
renderScroll();requestAnimationFrame(renderOrbit);
})();
