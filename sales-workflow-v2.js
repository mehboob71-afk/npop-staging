/* NPOP Sales Entry save/submit workflow v2 */
(function(){
  'use strict';
  const REST=['Main Street','Meadowvale','Financial','400 Queen','1402 Queen','Royal West','Midland'];
  const BRANDS=['Popeyes',"Osmow's"];
  const KEYS=['net','discount','tax1','tax2','debit','paid','paidTax','b100','b50','b20','b10','b5','c2','c1','s100','s50','s20','s10','s5'];
  const p=()=>document.getElementById('screen-sales');
  const flash=m=>typeof npopFlash==='function'?npopFlash(m):typeof toast==='function'?toast(m):null;
  const save=()=>typeof npopPersist==='function'&&npopPersist();
  const clone=v=>JSON.parse(JSON.stringify(v));
  const today=()=>{let d=new Date(),o=d.getTimezoneOffset();return new Date(d-o*60000).toISOString().slice(0,10)};
  const money=v=>'$ '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  function managers(){return (npopTest.employees||[]).filter(e=>e.status==='Active'&&(e.position==='Manager'||e.position==='RGM')).map(e=>e.name)}
  function ensure(){
    npopTest.salesRecords=Array.isArray(npopTest.salesRecords)?npopTest.salesRecords:[];
    npopTest.salesDraft=npopTest.salesDraft||{};KEYS.forEach(k=>{if(!Number.isFinite(Number(npopTest.salesDraft[k])))npopTest.salesDraft[k]=0});
    if(typeof npopTest.salesDraft.notes!=='string')npopTest.salesDraft.notes='';
    npopTest.salesMeta=npopTest.salesMeta||{};
    npopTest.salesMeta.brand=npopTest.salesMeta.brand||'Popeyes';
    npopTest.salesMeta.restaurant=npopTest.salesMeta.restaurant||'Main Street';
    npopTest.salesMeta.businessDate=npopTest.salesMeta.businessDate||today();
    let ms=managers();if(!ms.includes(npopTest.salesMeta.manager))npopTest.salesMeta.manager=ms[0]||'';
    npopTest.salesDraftStatus=npopTest.salesDraftStatus||'Draft';save();
  }
  function calc(d){
    let taxes=+d.tax1||0;taxes+=+d.tax2||0;
    let adjusted=(+d.net||0)+(+d.discount||0);
    let expected=(+d.net||0)+taxes-(+d.debit||0)-(+d.paid||0);
    let cash=(+d.b100||0)*100+(+d.b50||0)*50+(+d.b20||0)*20+(+d.b10||0)*10+(+d.b5||0)*5;
    let coins=(+d.c2||0)*25+(+d.c1||0)*25;
    let safeBills=(+d.s100||0)*100+(+d.s50||0)*50+(+d.s20||0)*20+(+d.s10||0)*10+(+d.s5||0)*5;
    return {taxes,adjustedNetSales:adjusted,expectedCash:expected,cashOnHand:cash,safeCount:coins+safeBills,cashDeposit:expected-cash,overShort:cash-expected};
  }
  function metaSelect(id,left,width,vals,val,type){
    let e=document.getElementById(id);if(e)return e;e=document.createElement(type==='date'?'input':'select');
    e.id=id;e.className='sales-v2-meta';e.style.left=left+'%';e.style.top='2.15%';e.style.width=width+'%';
    if(type==='date'){e.type='date';e.value=val}else vals.forEach(v=>{let o=document.createElement('option');o.value=v;o.textContent=v;o.selected=v===val;e.appendChild(o)});
    p().appendChild(e);return e;
  }
  function sync(){
    let d=npopTest.salesDraft;KEYS.forEach(k=>{let e=document.getElementById('sales_'+k);if(e)d[k]=Number(e.value||0)});
    let n=document.getElementById('sales_v2_notes');if(n)d.notes=n.value||'';
    [['brand','sales_v2_brand'],['restaurant','sales_v2_rest'],['businessDate','sales_v2_date'],['manager','sales_v2_mgr']].forEach(x=>{let e=document.getElementById(x[1]);if(e)npopTest.salesMeta[x[0]]=e.value});
    d.calculations=calc(d);save();return d.calculations;
  }
  function outputs(c){
    const set=(id,v,cl)=>{let e=document.getElementById(id);if(e){e.textContent=money(v);if(cl)e.className='npop-output '+cl}};
    set('sales_totalTax',c.taxes,'blue');set('sales_expected',c.expectedCash,'green');set('sales_cash',c.cashOnHand,'blue');set('sales_safe',c.safeCount,'green');set('sales_deposit',c.cashDeposit,'blue');
    let s=document.getElementById('sales_short');if(s){let lab=Math.abs(c.overShort)<.005?'BALANCED':c.overShort<0?'SHORT':'OVER';s.textContent=lab+' '+money(Math.abs(c.overShort));s.className='npop-output '+(c.overShort<0?'red':'green')}
  }
  function populate(){
    let d=npopTest.salesDraft,m=npopTest.salesMeta;KEYS.forEach(k=>{let e=document.getElementById('sales_'+k);if(e)e.value=Number(d[k]||0)});
    let n=document.getElementById('sales_v2_notes');if(n)n.value=d.notes||'';
    let map=[['sales_v2_brand','brand'],['sales_v2_rest','restaurant'],['sales_v2_date','businessDate'],['sales_v2_mgr','manager']];map.forEach(x=>{let e=document.getElementById(x[0]);if(e)e.value=m[x[1]]||''});outputs(calc(d));
  }
  function lock(on){
    let s=p();s.querySelectorAll('.npop-field,.sales-v2-meta,.sales-v2-notes,input[type=file]').forEach(e=>e.disabled=!!on);
    let a=[...s.querySelectorAll('.actionspot')];[1,2,3].forEach(i=>{if(a[i]){a[i].style.pointerEvents=on?'none':'auto';a[i].style.opacity=on?'.55':'1'}});
    let b=document.getElementById('sales_v2_lock');if(on&&!b){b=document.createElement('div');b.id='sales_v2_lock';b.className='sales-v2-lock';b.textContent='SUBMITTED · LOCKED';s.appendChild(b)}else if(!on&&b)b.remove();
  }
  function blank(rest){
    let d=npopTest.salesDraft;Object.keys(d).forEach(k=>delete d[k]);Object.assign(d,{net:0,discount:0,tax1:0,tax2:0,debit:0,paid:0,paidTax:0,b100:0,b50:0,b20:0,b10:0,b5:0,c2:0,c1:0,s100:0,s50:0,s20:0,s10:0,s5:0,notes:'',paidReceiptName:''});
    npopTest.salesMeta={brand:npopTest.salesMeta.brand||'Popeyes',restaurant:rest||'Main Street',businessDate:npopTest.salesMeta.businessDate||today(),manager:npopTest.salesMeta.manager||managers()[0]||''};
    npopTest.salesDraftStatus='Draft';npopTest.salesSavedDraft=null;save();populate();lock(false);
  }
  function validate(){
    let d=npopTest.salesDraft,m=npopTest.salesMeta,err=[];
    if(!m.businessDate)err.push('Business Date is required');if(!managers().includes(m.manager))err.push('Select a Manager/RGM from the employee list');
    if((+d.net||0)<=0)err.push('Net Sales must be greater than zero');KEYS.forEach(k=>{if((+d[k]||0)<0)err.push('Amounts cannot be negative')});
    if((+d.paid||0)>0&&!d.paidReceiptName)err.push('Paid Out receipt is required before submit');
    if(npopTest.salesRecords.some(r=>r.status==='Submitted'&&r.restaurant===m.restaurant&&r.businessDate===m.businessDate))err.push('A submitted entry already exists for this restaurant and date');
    return err;
  }
  function submit(next){
    let c=sync();outputs(c);let e=validate();if(e.length){flash(e[0]);return}
    let m=clone(npopTest.salesMeta),d=clone(npopTest.salesDraft),now=new Date().toISOString(),id='SALE-'+m.businessDate.replace(/-/g,'')+'-'+String(Date.now()).slice(-6);
    npopTest.salesRecords.unshift({id,version:1,status:'Submitted',locked:true,brand:m.brand,restaurant:m.restaurant,businessDate:m.businessDate,manager:m.manager,submittedAt:now,netSale:+d.net||0,discount:+d.discount||0,adjustedNetSales:c.adjustedNetSales,tax1:+d.tax1||0,tax2:+d.tax2||0,totalTaxes:c.taxes,debitCredit:+d.debit||0,paidOut:+d.paid||0,paidOutHST:+d.paidTax||0,expectedCash:c.expectedCash,cashOnHand:c.cashOnHand,cashDeposit:c.cashDeposit,overShort:c.overShort,safeCount:c.safeCount,notes:d.notes||'',paidOutReceiptName:d.paidReceiptName||'',depositSlip:{number:'DEP-'+m.businessDate.replace(/-/g,'')+'-'+String(Date.now()).slice(-5),generatedAt:now}});
    npopTest.salesDraftStatus='Submitted';npopTest.lastSubmittedSalesId=id;save();
    if(next){let i=REST.indexOf(m.restaurant),r=REST[(i<0?0:i+1)%REST.length];blank(r);flash('Submitted · deposit slip generated · next restaurant ready')}else{lock(true);flash('Sales entry submitted · deposit slip generated · record locked')}
  }
  function boot(){
    ensure();let s=p();if(!s||!document.getElementById('sales_net'))return false;
    if(!document.getElementById('salesWorkflowV2Styles')){let st=document.createElement('style');st.id='salesWorkflowV2Styles';st.textContent='#screen-sales .sales-v2-meta{position:absolute;z-index:28;height:3.7%;border:0;border-radius:6px;background:#fff;color:#102749;font:600 clamp(8px,.78vw,13px) Arial;padding:0 7px;outline:none;box-shadow:inset 0 0 0 1px rgba(214,224,236,.7)}#screen-sales .sales-v2-notes{position:absolute;z-index:28;border:0;background:#fff;color:#314761;font:500 clamp(8px,.72vw,12px) Arial;padding:7px;resize:none;outline:none;border-radius:4px}#screen-sales .sales-v2-lock{position:absolute;z-index:31;left:63.4%;top:2%;width:9%;height:4.2%;display:flex;align-items:center;justify-content:center;border-radius:8px;background:#eaf8ef;color:#087a3f;font:800 clamp(8px,.72vw,12px) Arial;border:1px solid #bde7cd}';document.head.appendChild(st)}
    let ms=managers();let brand=metaSelect('sales_v2_brand',13,8.2,BRANDS,npopTest.salesMeta.brand),rest=metaSelect('sales_v2_rest',22.45,9.45,REST,npopTest.salesMeta.restaurant),date=metaSelect('sales_v2_date',33.15,10.8,[],npopTest.salesMeta.businessDate,'date'),mgr=metaSelect('sales_v2_mgr',45.35,13,ms.length?ms:[''],npopTest.salesMeta.manager);
    let notes=document.getElementById('sales_v2_notes');if(!notes){notes=document.createElement('textarea');notes.id='sales_v2_notes';notes.className='sales-v2-notes';notes.maxLength=500;Object.assign(notes.style,{left:'49.45%',top:'84.3%',width:'25.9%',height:'6.7%'});s.appendChild(notes)}
    [brand,rest,date,mgr].forEach(x=>x.onchange=()=>{let c=sync();outputs(c)});notes.oninput=sync;KEYS.forEach(k=>{let x=document.getElementById('sales_'+k);if(x)x.addEventListener('input',()=>outputs(sync()))});
    let fi=s.querySelector('input[type=file].npop-live');if(fi)fi.onchange=()=>{let f=fi.files&&fi.files[0];npopTest.salesDraft.paidReceiptName=f?f.name:'';npopTest.salesDraft.paidReceiptMeta=f?{name:f.name,size:f.size,type:f.type}:null;save();flash(f?'Paid Out receipt selected':'Paid Out receipt cleared')};
    let a=[...s.querySelectorAll('.actionspot')];
    if(a[0])a[0].onclick=e=>{e.preventDefault();e.stopPropagation();if(npopTest.salesDraftStatus==='Submitted'){blank(npopTest.salesMeta.restaurant);flash('New sales entry started')}else if(npopTest.salesSavedDraft){Object.keys(npopTest.salesDraft).forEach(k=>delete npopTest.salesDraft[k]);Object.assign(npopTest.salesDraft,clone(npopTest.salesSavedDraft.draft));Object.assign(npopTest.salesMeta,clone(npopTest.salesSavedDraft.meta));save();populate();flash('Unsaved changes discarded')}else{blank(npopTest.salesMeta.restaurant);flash('Sales entry reset')}};
    if(a[1])a[1].onclick=e=>{e.preventDefault();e.stopPropagation();sync();npopTest.salesSavedDraft={draft:clone(npopTest.salesDraft),meta:clone(npopTest.salesMeta),savedAt:new Date().toISOString()};npopTest.salesDraftStatus='Draft';save();flash('Draft saved')};
    if(a[2])a[2].onclick=e=>{e.preventDefault();e.stopPropagation();submit(false)};if(a[3])a[3].onclick=e=>{e.preventDefault();e.stopPropagation();submit(true)};
    populate();lock(npopTest.salesDraftStatus==='Submitted');return true;
  }
  let tries=0,t=setInterval(()=>{tries++;if(boot()||tries>40)clearInterval(t)},100);
})();