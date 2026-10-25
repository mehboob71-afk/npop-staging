/* NPOP Sales Entry save/submit workflow v3 */
(function(){
'use strict';
const RESTAURANTS=['Main Street','Meadowvale','Financial','400 Queen','1402 Queen','Royal West','Midland'];
const BRANDS=['Popeyes',"Osmow's"];
const MONEY_KEYS=['net','discount','tax1','tax2','debit','paid','paidTax','deliveryCharge'];
const BILL_KEYS=['b100','b50','b20','b10','b5','s100','s50','s20','s10','s5'];
const COIN_KEYS=['c2','c1'];
const ALL_KEYS=MONEY_KEYS.concat(BILL_KEYS,COIN_KEYS);
const p=()=>document.getElementById('screen-sales');
const flash=m=>typeof npopFlash==='function'?npopFlash(m):(typeof toast==='function'?toast(m):null);
const persist=()=>typeof npopPersist==='function'&&npopPersist();
const clone=v=>JSON.parse(JSON.stringify(v));
const today=()=>{const d=new Date(),o=d.getTimezoneOffset();return new Date(d-o*60000).toISOString().slice(0,10)};
const money=v=>'$ '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});

function managers(){return (Array.isArray(npopTest.employees)?npopTest.employees:[]).filter(e=>e.status==='Active'&&(e.position==='Manager'||e.position==='RGM')).map(e=>e.name).filter(Boolean)}
function emptyDraft(){return {net:0,covers:0,discount:0,tax1:0,tax2:0,debit:0,paid:0,paidTax:0,deliveryCharge:0,b100:0,b50:0,b20:0,b10:0,b5:0,s100:0,s50:0,s20:0,s10:0,s5:0,c2:0,c1:0,notes:'',paidReceiptName:'',paidReceiptMeta:null}}

function ensure(){
 npopTest.salesRecords=Array.isArray(npopTest.salesRecords)?npopTest.salesRecords:[];
 npopTest.salesDraft=Object.assign(emptyDraft(),npopTest.salesDraft||{});
 ALL_KEYS.forEach(k=>{if(!Number.isFinite(Number(npopTest.salesDraft[k])))npopTest.salesDraft[k]=0});
 if(!Number.isFinite(Number(npopTest.salesDraft.covers)))npopTest.salesDraft.covers=0;
 if(typeof npopTest.salesDraft.notes!=='string')npopTest.salesDraft.notes='';
 COIN_KEYS.forEach(k=>npopTest.salesDraft[k]=0);
 npopTest.salesMeta=npopTest.salesMeta||{};
 npopTest.salesMeta.brand=npopTest.salesMeta.brand||'Popeyes';
 npopTest.salesMeta.restaurant=npopTest.salesMeta.restaurant||'Main Street';
 npopTest.salesMeta.businessDate=npopTest.salesMeta.businessDate||today();
 const ms=managers(); if(!ms.includes(npopTest.salesMeta.manager))npopTest.salesMeta.manager=ms[0]||'';
 npopTest.salesDraftStatus=npopTest.salesDraftStatus||'Draft';
 npopTest.salesAudit=Array.isArray(npopTest.salesAudit)?npopTest.salesAudit:[];
 persist();
}
function calc(d){
 const taxes=(+d.tax1||0)+(+d.tax2||0);
 const adjustedNetSales=(+d.net||0)+(+d.discount||0);
 const expectedCash=(+d.net||0)+taxes-(+d.debit||0)-(+d.paid||0);
 const cashOnHand=(+d.b100||0)*100+(+d.b50||0)*50+(+d.b20||0)*20+(+d.b10||0)*10+(+d.b5||0)*5;
 const safeCount=(+d.s100||0)*100+(+d.s50||0)*50+(+d.s20||0)*20+(+d.s10||0)*10+(+d.s5||0)*5;
 return {taxes,adjustedNetSales,expectedCash,cashOnHand,safeCount,cashDeposit:expectedCash-cashOnHand,overShort:cashOnHand-expectedCash};
}
function audit(action,extra){
 npopTest.salesAudit.unshift(Object.assign({action,at:new Date().toISOString(),restaurant:npopTest.salesMeta.restaurant,businessDate:npopTest.salesMeta.businessDate,manager:npopTest.salesMeta.manager},extra||{}));
 npopTest.salesAudit=npopTest.salesAudit.slice(0,100);
}
function metaSelect(id,left,width,vals,val,type){
 let e=document.getElementById(id);if(e)return e;
 e=document.createElement(type==='date'?'input':'select');e.id=id;e.className='sales-v2-meta';e.style.left=left+'%';e.style.top='2.15%';e.style.width=width+'%';
 if(type==='date'){e.type='date';e.value=val}else vals.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;o.selected=v===val;e.appendChild(o)});
 p().appendChild(e);return e;
}
function sync(){
 const d=npopTest.salesDraft;
 ALL_KEYS.forEach(k=>{const e=document.getElementById('sales_'+k);if(e&&!e.disabled)d[k]=Number(e.value||0)});
 d.c2=0;d.c1=0;
 const covers=document.getElementById('sales_covers');if(covers)d.covers=Math.max(0,Math.floor(Number(covers.value||0)));
 const notes=document.getElementById('sales_v2_notes');if(notes)d.notes=notes.value||'';
 [['brand','sales_v2_brand'],['restaurant','sales_v2_rest'],['businessDate','sales_v2_date'],['manager','sales_v2_mgr']].forEach(x=>{const e=document.getElementById(x[1]);if(e)npopTest.salesMeta[x[0]]=e.value});
 d.calculations=calc(d);persist();return d.calculations;
}
function outputs(c){
 const set=(id,v,cl)=>{const e=document.getElementById(id);if(e){e.textContent=money(v);if(cl)e.className='npop-output '+cl}};
 set('sales_totalTax',c.taxes,'blue');set('sales_expected',c.expectedCash,'green');set('sales_cash',c.cashOnHand,'blue');set('sales_safe',c.safeCount,'green');set('sales_deposit',c.cashDeposit,'blue');
 const coin=document.getElementById('sales_coin');if(coin){coin.textContent=money(0);coin.style.opacity='.35'}
 const s=document.getElementById('sales_short');if(s){const balanced=Math.abs(c.overShort)<.005,label=balanced?'BALANCED':(c.overShort<0?'SHORT':'OVER');s.textContent=balanced?label:(label+' '+money(Math.abs(c.overShort)));s.className='npop-output '+(c.overShort<0?'red':'green')}
}
function populate(){
 const d=npopTest.salesDraft,m=npopTest.salesMeta;
 ALL_KEYS.forEach(k=>{const e=document.getElementById('sales_'+k);if(e)e.value=COIN_KEYS.includes(k)?0:Number(d[k]||0)});
 const covers=document.getElementById('sales_covers');if(covers)covers.value=Number(d.covers||0);
 const notes=document.getElementById('sales_v2_notes');if(notes)notes.value=d.notes||'';
 [['sales_v2_brand','brand'],['sales_v2_rest','restaurant'],['sales_v2_date','businessDate'],['sales_v2_mgr','manager']].forEach(x=>{const e=document.getElementById(x[0]);if(e)e.value=m[x[1]]||''});
 outputs(calc(d));
}
function lock(on){
 const s=p();if(!s)return;
 s.querySelectorAll('.npop-field,.sales-v2-meta,.sales-v2-notes,input[type=file]').forEach(e=>e.disabled=!!on);
 const a=[...s.querySelectorAll('.actionspot')];[1,2,3].forEach(i=>{if(a[i]){a[i].style.pointerEvents=on?'none':'auto';a[i].style.opacity=on?'.55':'1'}});
 let b=document.getElementById('sales_v2_lock');
 if(on&&!b){b=document.createElement('div');b.id='sales_v2_lock';b.className='sales-v2-lock';b.textContent='SUBMITTED · LOCKED';s.appendChild(b)}
 else if(!on&&b)b.remove();
}
function blank(rest){
 npopTest.salesDraft=emptyDraft();
 npopTest.salesMeta={brand:npopTest.salesMeta.brand||'Popeyes',restaurant:rest||npopTest.salesMeta.restaurant||'Main Street',businessDate:npopTest.salesMeta.businessDate||today(),manager:npopTest.salesMeta.manager||managers()[0]||''};
 npopTest.salesDraftStatus='Draft';npopTest.salesSavedDraft=null;persist();populate();lock(false);
}
function validate(){
 const d=npopTest.salesDraft,m=npopTest.salesMeta,err=[];
 if(!m.restaurant||!RESTAURANTS.includes(m.restaurant))err.push('Select a valid restaurant');
 if(!m.businessDate)err.push('Business Date is required');
 if(m.businessDate>today())err.push('Business Date cannot be in the future');
 if(!managers().includes(m.manager))err.push('Select a Manager/RGM from the employee list');
 if((+d.net||0)<=0)err.push('Net Sale must be greater than zero');
 MONEY_KEYS.concat(BILL_KEYS).forEach(k=>{if((+d[k]||0)<0)err.push('Amounts cannot be negative')});
 if((+d.paid||0)>0&&!d.paidReceiptName)err.push('Paid Out receipt is required before submit');
 if(npopTest.salesRecords.some(r=>r.status==='Submitted'&&r.restaurant===m.restaurant&&r.businessDate===m.businessDate))err.push('A submitted entry already exists for this restaurant and date');
 return [...new Set(err)];
}
function saveDraft(){
 const calculations=sync();
 npopTest.salesSavedDraft={draft:clone(npopTest.salesDraft),meta:clone(npopTest.salesMeta),calculations:clone(calculations),savedAt:new Date().toISOString()};
 npopTest.salesDraftStatus='Draft';audit('Draft Saved');persist();flash('Draft saved');
}
function submit(next){
 const calculations=sync();outputs(calculations);const errors=validate();if(errors.length){flash(errors[0]);return}
 const m=clone(npopTest.salesMeta),d=clone(npopTest.salesDraft),now=new Date().toISOString(),suffix=String(Date.now()).slice(-6);
 const id='SALE-'+m.businessDate.replace(/-/g,'')+'-'+suffix,depositNumber='DEP-'+m.businessDate.replace(/-/g,'')+'-'+suffix;
 const record={id,version:1,status:'Submitted',locked:true,brand:m.brand,restaurant:m.restaurant,businessDate:m.businessDate,manager:m.manager,submittedAt:now,netSale:+d.net||0,covers:+d.covers||0,discount:+d.discount||0,adjustedNetSales:calculations.adjustedNetSales,tax1:+d.tax1||0,tax2:+d.tax2||0,totalTaxes:calculations.taxes,debitCredit:+d.debit||0,paidOut:+d.paid||0,paidOutHST:+d.paidTax||0,deliveryCharge:+d.deliveryCharge||0,expectedCash:calculations.expectedCash,cashOnHand:calculations.cashOnHand,cashDeposit:calculations.cashDeposit,overShort:calculations.overShort,safeCount:calculations.safeCount,notes:d.notes||'',paidOutReceiptName:d.paidReceiptName||'',paidOutReceiptMeta:d.paidReceiptMeta||null,depositSlip:{number:depositNumber,generatedAt:now,status:'Generated'}};
 npopTest.salesRecords.unshift(record);npopTest.salesDraftStatus='Submitted';npopTest.lastSubmittedSalesId=id;npopTest.salesSavedDraft=null;audit('Submitted',{recordId:id,depositSlip:depositNumber});persist();
 if(next){const i=RESTAURANTS.indexOf(m.restaurant),r=RESTAURANTS[(i<0?0:i+1)%RESTAURANTS.length];blank(r);flash('Submitted · deposit slip generated · next restaurant ready')}
 else{lock(true);flash('Sales entry submitted · deposit slip generated · record locked')}
}
function disableCoins(){COIN_KEYS.forEach(k=>{const e=document.getElementById('sales_'+k);if(e){e.value=0;e.disabled=true;e.style.opacity='.18';e.title='Coins removed from final Sales Entry rules'}})}
function boot(){
 ensure();const s=p();if(!s||!document.getElementById('sales_net'))return false;
 if(!document.getElementById('salesWorkflowV2Styles')){const st=document.createElement('style');st.id='salesWorkflowV2Styles';st.textContent='#screen-sales .sales-v2-meta{position:absolute;z-index:28;height:3.7%;border:0;border-radius:6px;background:#fff;color:#102749;font:600 clamp(8px,.78vw,13px) Arial;padding:0 7px;outline:none;box-shadow:inset 0 0 0 1px rgba(214,224,236,.7)}#screen-sales .sales-v2-notes{position:absolute;z-index:28;border:0;background:#fff;color:#314761;font:500 clamp(8px,.72vw,12px) Arial;padding:7px;resize:none;outline:none;border-radius:4px}#screen-sales .sales-v2-lock{position:absolute;z-index:31;left:63.4%;top:2%;width:9%;height:4.2%;display:flex;align-items:center;justify-content:center;border-radius:8px;background:#eaf8ef;color:#087a3f;font:800 clamp(8px,.72vw,12px) Arial;border:1px solid #bde7cd}';document.head.appendChild(st)}
 const ms=managers(),brand=metaSelect('sales_v2_brand',13,8.2,BRANDS,npopTest.salesMeta.brand),rest=metaSelect('sales_v2_rest',22.45,9.45,RESTAURANTS,npopTest.salesMeta.restaurant),date=metaSelect('sales_v2_date',33.15,10.8,[],npopTest.salesMeta.businessDate,'date'),mgr=metaSelect('sales_v2_mgr',45.35,13,ms.length?ms:[''],npopTest.salesMeta.manager);
 date.max=today();
 let notes=document.getElementById('sales_v2_notes');if(!notes){notes=document.createElement('textarea');notes.id='sales_v2_notes';notes.className='sales-v2-notes';notes.maxLength=500;Object.assign(notes.style,{left:'49.45%',top:'84.3%',width:'25.9%',height:'6.7%'});s.appendChild(notes)}
 [brand,rest,date,mgr].forEach(x=>x.onchange=()=>outputs(sync()));notes.oninput=sync;
 ALL_KEYS.forEach(k=>{const x=document.getElementById('sales_'+k);if(x&&!COIN_KEYS.includes(k))x.oninput=()=>outputs(sync())});disableCoins();
 const fi=s.querySelector('input[type=file].npop-live');if(fi){fi.accept='.jpg,.jpeg,.png,.pdf';fi.onchange=()=>{const f=fi.files&&fi.files[0];npopTest.salesDraft.paidReceiptName=f?f.name:'';npopTest.salesDraft.paidReceiptMeta=f?{name:f.name,size:f.size,type:f.type,lastModified:f.lastModified}:null;audit(f?'Paid Out Receipt Selected':'Paid Out Receipt Cleared');persist();flash(f?'Paid Out receipt selected':'Paid Out receipt cleared')}};
 const a=[...s.querySelectorAll('.actionspot')];
 if(a[0])a[0].onclick=e=>{e.preventDefault();e.stopPropagation();if(npopTest.salesDraftStatus==='Submitted'){blank(npopTest.salesMeta.restaurant);flash('New sales entry started')}else if(npopTest.salesSavedDraft){npopTest.salesDraft=clone(npopTest.salesSavedDraft.draft);npopTest.salesMeta=clone(npopTest.salesSavedDraft.meta);audit('Changes Discarded');persist();populate();lock(false);flash('Unsaved changes discarded')}else{blank(npopTest.salesMeta.restaurant);flash('Sales entry reset')}};
 if(a[1])a[1].onclick=e=>{e.preventDefault();e.stopPropagation();saveDraft()};
 if(a[2])a[2].onclick=e=>{e.preventDefault();e.stopPropagation();submit(false)};
 if(a[3])a[3].onclick=e=>{e.preventDefault();e.stopPropagation();submit(true)};
 populate();lock(npopTest.salesDraftStatus==='Submitted');
 window.NPOPSales={calculate:()=>calc(npopTest.salesDraft),validate,saveDraft,submit:()=>submit(false),records:()=>clone(npopTest.salesRecords),audit:()=>clone(npopTest.salesAudit)};
 return true;
}
let tries=0,t=setInterval(()=>{tries++;if(boot()||tries>40)clearInterval(t)},100);
})();