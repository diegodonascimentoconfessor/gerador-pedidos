(()=>{
const $=id=>document.getElementById(id);
const brl=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' ');
const dec=n=>n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=s=>{s=String(s).replace(/[^\d,.]/g,'');const li=Math.max(s.lastIndexOf(','),s.lastIndexOf('.'));if(li<0)return parseFloat(s)||0;return parseFloat(s.slice(0,li).replace(/[.,]/g,'')+'.'+s.slice(li+1))||0};
const today=()=>new Date().toISOString().slice(0,10);
const fdate=d=>d?d.split('-').reverse().join('/'):'';
const K_CUR='ferr_atual',K_HIST='ferr_hist';

const SEED={
 co:{n:'Ferragens Santa Elisa',s:'Parafusos, Porcas e Arruelas: A Fixação Correta',p:'Tel./WhatsApp: (00) 0000-0000'},
 o:{d:'A XWM Sr. Francisco Mendes (Chico)',c:'Bira Parafusos',dt:today(),n:'0001',t:'cls',ob:'Pagamento: 28 dias.\nEntrega: retirada no balcão.\nValidade deste orçamento: 7 dias.'},
 it:[
  {q:100,d:'Bucha 6x10',u:2},{q:200,d:'Bucha 8x10 longa',u:3},
  {q:500,d:'Parafuso sextavado 1/4 x 2"',u:0.85},{q:400,d:'Parafuso Phillips chato 4,2 x 32',u:0.2},
  {q:300,d:'Porca sextavada M8',u:0.45},{q:300,d:'Porca sextavada 5/16',u:0.5},
  {q:600,d:'Arruela lisa 5/16',u:0.15},{q:500,d:'Arruela de pressão M8',u:0.18}
 ]
};
let S;
const load=()=>{try{return JSON.parse(localStorage.getItem(K_CUR))}catch(e){return null}};
const save=()=>{try{localStorage.setItem(K_CUR,JSON.stringify(S))}catch(e){}};
S=load()||JSON.parse(JSON.stringify(SEED));

/* ---- ícone por descrição ---- */
const kind=d=>{d=d.toLowerCase();return /bucha/.test(d)?'bucha':/porca/.test(d)?'porca':/arruela/.test(d)?'arruela':'parafuso'};
const ico=(k,cls)=>`<svg class="i ${cls||''}" viewBox="0 0 48 48"><use href="#s-${k}"/></svg>`;

/* ---- parser de texto solto ---- */
function parse(t){
 const isN=x=>/^[\d.,]+$/.test(x)&&/\d/.test(x);
 const L=[];
 t.split(/\r?\n/).map(l=>l.trim()).forEach(l=>{
  if(!l||/^(valor\s+)?total\b/i.test(l))return;
  if(L.length&&/^valor\b/i.test(l))L[L.length-1]+=' '+l; /* linha quebrada no celular */
  else L.push(l);
 });
 return L.map(l=>{
  l=l.replace(/R\$\s*/gi,'');
  const mv=l.match(/\bvalor\s*:?\s*([\d.,]*\d)/i),mt=l.match(/\btotal\s*:?\s*([\d.,]*\d)/i);
  const ki=l.search(/\b(valor|total)\b/i);
  let u=null,txt=l;
  if(ki>0){txt=l.slice(0,ki).trim();if(mv)u=num(mv[1])}
  else{
   const cols=l.split(/\t+/).map(c=>c.trim()).filter(Boolean);
   if(cols.length>=2&&isN(cols[1])){txt=cols[0];u=num(cols[1])}
  }
  let q=1,rest=txt,m=txt.match(/^(\d+)\s*(?:pç\.?|pcs|pct|pc|und|unid\w*|un\.?|cx)?\s+(.+)$/i);
  if(m){q=parseInt(m[1],10);rest=m[2]}
  const tk=rest.split(/\s+/);
  if(u===null){
   if(ki>0){u=mt?Math.round(num(mt[1])/q*100)/100:0}
   else{
    u=0;const a=tk[tk.length-1],b=tk[tk.length-2];
    if(tk.length>2&&isN(a)&&isN(b)&&Math.abs(q*num(b)-num(a))<0.5){tk.pop();u=num(tk.pop())}
    else if(tk.length>1&&isN(a))u=num(tk.pop());
   }
  }
  let d=tk.join(' ')
   .replace(/\s+\(/g,'(').replace(/\(\s+/g,'(').replace(/\s+\)/g,')')
   .replace(/([\d)])\s*x\s*(\d)/gi,'$1x$2').replace(/\s+/g,' ').trim();
  d=d.charAt(0).toUpperCase()+d.slice(1);
  return {q,d,u};
 });
}

/* ---- editor ---- */
function fillForm(){
 $('cn').value=S.co.n;$('cs').value=S.co.s;$('cp').value=S.co.p;
 $('od').value=S.o.d;$('oc').value=S.o.c;$('odt').value=S.o.dt;$('on').value=S.o.n;$('ot').value=S.o.t;$('ob').value=S.o.ob;
 rows();
}
function rows(){
 $('rows').innerHTML=S.it.map((x,i)=>`<div class="row" data-i="${i}">
  ${ico(kind(x.d),'ic')}
  <input data-f="d" value="${esc(x.d)}" aria-label="Descrição">
  <input data-f="q" type="number" min="0" step="1" value="${x.q}" aria-label="Quantidade">
  <input data-f="u" inputmode="decimal" value="${dec(x.u)}" aria-label="Valor unitário">
  <button data-a="up" title="Subir">↑</button><button data-a="dn" title="Descer">↓</button><button data-a="rm" title="Excluir">✕</button></div>`).join('')||'<div class="hint">Nenhum item. Use a entrada rápida ou adicione manualmente.</div>';
 render();
}
const total=()=>S.it.reduce((a,x)=>a+x.q*x.u,0);

/* ---- folha A4 ---- */
function render(){
 const sh=$('sheet'),min=S.o.t==='min';
 sh.className=min?'min':'';
 const body=S.it.map((x,i)=>`<tr><td class="c">${i+1}</td><td class="c">${x.q.toLocaleString('pt-BR')}</td>
  <td class="dc">${ico(kind(x.d),'ti')}${esc(x.d)}</td><td class="n">${dec(x.u)}</td><td class="n">${dec(x.q*x.u)}</td></tr>`).join('');
 sh.innerHTML=`
 <svg class="i wm" viewBox="0 0 96 48" preserveAspectRatio="xMidYMid meet"><g transform="scale(.9) translate(0 2)"><use href="#s-parafuso" x="0" width="48" height="48"/><use href="#s-porca" x="42" width="48" height="48"/></g></svg>
 <div class="hd"><div class="logo">${ico('porca')}</div>
  <div><h1>${esc(S.co.n)}</h1><div class="sl">${esc(S.co.s)}</div><div class="ph">${esc(S.co.p)}</div></div>
  <div class="deco">${ico('parafuso')}${ico('porca')}${ico('arruela')}${ico('bucha')}</div></div>
 <div class="band"></div>
 <h2 class="ttl">Pedido de compra / Orçamento nº ${esc(S.o.n)}</h2>
 <div class="meta"><div><b>Destinatário</b>${esc(S.o.d)}</div><div><b>Cliente</b>${esc(S.o.c)}</div>
  <div><b>Data</b>${fdate(S.o.dt)}</div><div><b>Nº do pedido</b>${esc(S.o.n)}</div></div>
 <table><thead><tr><th class="c" style="width:9%">Item</th><th class="c" style="width:10%">Qtd.</th><th class="dc">Descrição</th><th class="n" style="width:17%">Valor unit. (R$)</th><th class="n" style="width:17%">Total (R$)</th></tr></thead><tbody>${body}</tbody></table>
 <div class="tt"><div><small>VALOR TOTAL GERAL</small>${brl(total())}</div></div>
 <div class="obs"><b>Observações e condições de pagamento</b>${esc(S.o.ob)}</div>
 <div class="sig"><div>Emitente: ${esc(S.co.n)}</div><div>Conferência / assinatura do cliente</div></div>`;
 $('te').textContent='Total: '+brl(total());
 fit();
}
function fit(){const w=$('pv').clientWidth-32,sw=210/25.4*96;$('sheet').style.zoom=Math.min(1,w/sw)}
addEventListener('resize',fit);

/* ---- eventos: campos ---- */
const bind=(id,fn)=>$(id).addEventListener('input',e=>{fn(e.target.value);save();render()});
bind('cn',v=>S.co.n=v);bind('cs',v=>S.co.s=v);bind('cp',v=>S.co.p=v);
bind('od',v=>S.o.d=v);bind('oc',v=>S.o.c=v);bind('odt',v=>S.o.dt=v);bind('on',v=>S.o.n=v);bind('ob',v=>S.o.ob=v);
$('ot').addEventListener('change',e=>{S.o.t=e.target.value;save();render()});

/* ---- eventos: tabela ---- */
$('rows').addEventListener('input',e=>{
 const r=e.target.closest('.row');if(!r)return;const i=+r.dataset.i,f=e.target.dataset.f,x=S.it[i];
 if(f==='d'){x.d=e.target.value;r.querySelector('.ic').innerHTML=`<use href="#s-${kind(x.d)}"/>`}
 else if(f==='q')x.q=Math.max(0,parseInt(e.target.value,10)||0);
 else x.u=num(e.target.value);
 save();render();
});
$('rows').addEventListener('focusout',e=>{if(e.target.dataset.f==='u'){const i=+e.target.closest('.row').dataset.i;e.target.value=dec(S.it[i].u)}});
$('rows').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;const i=+b.closest('.row').dataset.i,a=b.dataset.a;
 if(a==='rm')S.it.splice(i,1);
 else if(a==='up'&&i>0)[S.it[i-1],S.it[i]]=[S.it[i],S.it[i-1]];
 else if(a==='dn'&&i<S.it.length-1)[S.it[i+1],S.it[i]]=[S.it[i],S.it[i+1]];
 save();rows();
});
$('ba').onclick=()=>{S.it.push({q:1,d:'',u:0});save();rows();const l=$('rows').querySelectorAll('input[data-f=d]');l[l.length-1].focus()};
$('bp').onclick=()=>{const r=parse($('qt').value);if(!r.length)return;S.it.push(...r);$('qt').value='';save();rows()};
$('bl').onclick=()=>$('qt').value='';

/* ---- histórico ---- */
const hist=()=>{try{return JSON.parse(localStorage.getItem(K_HIST))||[]}catch(e){return[]}};
function hlist(){
 const h=hist();
 $('hs').innerHTML=h.length?h.map(x=>`<option value="${x.id}">${esc(x.t)}</option>`).join(''):'<option value="">(nenhum pedido salvo)</option>';
}
$('bs').onclick=()=>{
 const h=hist(),t=`Nº ${S.o.n} — ${S.o.c||'sem cliente'} — ${fdate(S.o.dt)} — ${brl(total())}`;
 const ex=h.find(x=>x.k===S.o.n+'|'+S.o.c),data=JSON.parse(JSON.stringify(S));
 if(ex){ex.t=t;ex.s=data}else h.unshift({id:'p'+Date.now(),k:S.o.n+'|'+S.o.c,t,s:data});
 try{localStorage.setItem(K_HIST,JSON.stringify(h))}catch(e){alert('Não foi possível salvar no navegador.')}
 hlist();
};
$('bc').onclick=()=>{const x=hist().find(x=>x.id===$('hs').value);if(x){S=x.s;save();fillForm()}};
$('bx').onclick=()=>{const id=$('hs').value;if(!id||!confirm('Excluir o pedido selecionado?'))return;localStorage.setItem(K_HIST,JSON.stringify(hist().filter(x=>x.id!==id)));hlist()};
$('bn').onclick=()=>{
 const n=String((parseInt(S.o.n,10)||0)+1).padStart(4,'0');
 S={co:S.co,o:{d:'',c:'',dt:today(),n,t:S.o.t,ob:''},it:[]};save();fillForm();
};
$('bi').onclick=()=>print();
$('be').onclick=async()=>{
 try{
  const [c,j]=await Promise.all([fetch('style.css').then(r=>r.text()),fetch('app.js').then(r=>r.text())]);
  let h='<!DOCTYPE html>\n'+document.documentElement.outerHTML;
  h=h.replace(/<link rel="stylesheet" href="style.css">/,()=>'<style>\n'+c+'</style>').replace(/<script src="app.js"><\/script>/,()=>'<script>\n'+j+'<\/script>');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([h],{type:'text/html'}));
  a.download='pedidos-santa-elisa-unico.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }catch(e){alert('O navegador bloqueou a leitura dos arquivos locais. Para levar o app a outro computador, copie a pasta com index.html, style.css e app.js.')}
};

fillForm();hlist();
})();