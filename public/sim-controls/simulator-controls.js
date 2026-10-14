
'use strict';
const FIXTURE = {"skus":[{"id":"SIM-COLA","itemName":"コーラ / Cola","itemKeyword":"コーラ / Cola","eanCode":"4900000000016","volume":500,"isImageAvailable":true},{"id":"SIM-WATER","itemName":"天然水 / Mineral Water","itemKeyword":"天然水 / Mineral Water","eanCode":"4900000000023","volume":550,"isImageAvailable":true},{"id":"SIM-TEA","itemName":"緑茶 / Green Tea","itemKeyword":"緑茶 / Green Tea","eanCode":"4900000000030","volume":600,"isImageAvailable":true},{"id":"SIM-COFFEE","itemName":"ブラックコーヒー / Black Coffee","itemKeyword":"ブラックコーヒー / Black Coffee","eanCode":"4900000000047","volume":390,"isImageAvailable":true},{"id":"SIM-SPORTS","itemName":"スポーツドリンク / Sports Drink","itemKeyword":"スポーツドリンク / Sports Drink","eanCode":"4900000000054","volume":500,"isImageAvailable":true},{"id":"SIM-ORANGE","itemName":"オレンジジュース / Orange Juice","itemKeyword":"オレンジジュース / Orange Juice","eanCode":"4900000000061","volume":450,"isImageAvailable":true},{"id":"SIM-ENERGY","itemName":"エナジードリンク / Energy Drink","itemKeyword":"エナジードリンク / Energy Drink","eanCode":"4900000000078","volume":355,"isImageAvailable":true},{"id":"SIM-SPARKLING","itemName":"炭酸水 / Sparkling Water","itemKeyword":"炭酸水 / Sparkling Water","eanCode":"4900000000085","volume":500,"isImageAvailable":true},{"id":"SIM-MILKTEA","itemName":"ミルクティー / Milk Tea","itemKeyword":"ミルクティー / Milk Tea","eanCode":"4900000000092","volume":440,"isImageAvailable":true},{"id":"SIM-LEMON","itemName":"レモンソーダ / Lemon Soda","itemKeyword":"レモンソーダ / Lemon Soda","eanCode":"4900000000108","volume":500,"isImageAvailable":true},{"id":"SIM-GRAPE","itemName":"グレープソーダ / Grape Soda","itemKeyword":"グレープソーダ / Grape Soda","eanCode":"4900000000115","volume":500,"isImageAvailable":true}],"lanes":[{"id":"S1-R1-L01","slot":{"posX":1.5,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":11},{"id":"S1-R1-L02","slot":{"posX":1.4000000000000001,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":10},{"id":"S1-R1-L03","slot":{"posX":1.3,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":9},{"id":"S1-R1-L04","slot":{"posX":1.2000000000000002,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":8},{"id":"S1-R1-L05","slot":{"posX":1.1,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":7},{"id":"S1-R1-L06","slot":{"posX":1,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":6},{"id":"S1-R1-L07","slot":{"posX":0.9,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":5},{"id":"S1-R1-L08","slot":{"posX":0.8,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":4},{"id":"S1-R1-L09","slot":{"posX":0.7000000000000001,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":3},{"id":"S1-R1-L10","slot":{"posX":0.6000000000000001,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":2},{"id":"S1-R1-L11","slot":{"posX":0.5,"posY":0,"posZ":0},"isBlackList":false,"cabinet":1,"row":1,"lane":1},{"id":"S1-R2-L01","slot":{"posX":1.5,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":15},{"id":"S1-R2-L02","slot":{"posX":1.4000000000000001,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":14},{"id":"S1-R2-L03","slot":{"posX":1.3,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":13},{"id":"S1-R2-L04","slot":{"posX":1.2000000000000002,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":12},{"id":"S1-R2-L05","slot":{"posX":1.1,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":11},{"id":"S1-R2-L06","slot":{"posX":1,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":10},{"id":"S1-R2-L07","slot":{"posX":0.9,"posY":0,"posZ":0.12},"isBlackList":true,"cabinet":1,"row":2,"lane":9},{"id":"S1-R2-L08","slot":{"posX":0.8,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":8},{"id":"S1-R2-L09","slot":{"posX":0.7000000000000001,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":7},{"id":"S1-R2-L10","slot":{"posX":0.6000000000000001,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":6},{"id":"S1-R2-L11","slot":{"posX":0.5,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":5},{"id":"S1-R2-L12","slot":{"posX":0.3999999999999999,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":4},{"id":"S1-R2-L13","slot":{"posX":0.30000000000000004,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":3},{"id":"S1-R2-L14","slot":{"posX":0.19999999999999996,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":2},{"id":"S1-R2-L15","slot":{"posX":0.10000000000000009,"posY":0,"posZ":0.12},"isBlackList":false,"cabinet":1,"row":2,"lane":1},{"id":"S1-R3-L01","slot":{"posX":1.5,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":15},{"id":"S1-R3-L02","slot":{"posX":1.4000000000000001,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":14},{"id":"S1-R3-L03","slot":{"posX":1.3,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":13},{"id":"S1-R3-L04","slot":{"posX":1.2000000000000002,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":12},{"id":"S1-R3-L05","slot":{"posX":1.1,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":11},{"id":"S1-R3-L06","slot":{"posX":1,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":10},{"id":"S1-R3-L07","slot":{"posX":0.9,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":9},{"id":"S1-R3-L08","slot":{"posX":0.8,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":8},{"id":"S1-R3-L09","slot":{"posX":0.7000000000000001,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":7},{"id":"S1-R3-L10","slot":{"posX":0.6000000000000001,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":6},{"id":"S1-R3-L11","slot":{"posX":0.5,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":5},{"id":"S1-R3-L12","slot":{"posX":0.3999999999999999,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":4},{"id":"S1-R3-L13","slot":{"posX":0.30000000000000004,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":3},{"id":"S1-R3-L14","slot":{"posX":0.19999999999999996,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":2},{"id":"S1-R3-L15","slot":{"posX":0.10000000000000009,"posY":0,"posZ":0.24},"isBlackList":false,"cabinet":1,"row":3,"lane":1},{"id":"S1-R4-L01","slot":{"posX":1.5,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":15},{"id":"S1-R4-L02","slot":{"posX":1.4000000000000001,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":14},{"id":"S1-R4-L03","slot":{"posX":1.3,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":13},{"id":"S1-R4-L04","slot":{"posX":1.2000000000000002,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":12},{"id":"S1-R4-L05","slot":{"posX":1.1,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":11},{"id":"S1-R4-L06","slot":{"posX":1,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":10},{"id":"S1-R4-L07","slot":{"posX":0.9,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":9},{"id":"S1-R4-L08","slot":{"posX":0.8,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":8},{"id":"S1-R4-L09","slot":{"posX":0.7000000000000001,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":7},{"id":"S1-R4-L10","slot":{"posX":0.6000000000000001,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":6},{"id":"S1-R4-L11","slot":{"posX":0.5,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":5},{"id":"S1-R4-L12","slot":{"posX":0.3999999999999999,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":4},{"id":"S1-R4-L13","slot":{"posX":0.30000000000000004,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":3},{"id":"S1-R4-L14","slot":{"posX":0.19999999999999996,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":2},{"id":"S1-R4-L15","slot":{"posX":0.10000000000000009,"posY":0,"posZ":0.36},"isBlackList":false,"cabinet":1,"row":4,"lane":1},{"id":"S1-R5-L01","slot":{"posX":1.5,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":15},{"id":"S1-R5-L02","slot":{"posX":1.4000000000000001,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":14},{"id":"S1-R5-L03","slot":{"posX":1.3,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":13},{"id":"S1-R5-L04","slot":{"posX":1.2000000000000002,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":12},{"id":"S1-R5-L05","slot":{"posX":1.1,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":11},{"id":"S1-R5-L06","slot":{"posX":1,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":10},{"id":"S1-R5-L07","slot":{"posX":0.9,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":9},{"id":"S1-R5-L08","slot":{"posX":0.8,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":8},{"id":"S1-R5-L09","slot":{"posX":0.7000000000000001,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":7},{"id":"S1-R5-L10","slot":{"posX":0.6000000000000001,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":6},{"id":"S1-R5-L11","slot":{"posX":0.5,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":5},{"id":"S1-R5-L12","slot":{"posX":0.3999999999999999,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":4},{"id":"S1-R5-L13","slot":{"posX":0.30000000000000004,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":3},{"id":"S1-R5-L14","slot":{"posX":0.19999999999999996,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":2},{"id":"S1-R5-L15","slot":{"posX":0.10000000000000009,"posY":0,"posZ":0.48},"isBlackList":false,"cabinet":1,"row":5,"lane":1}]};
// The simulator runs inside the React tab (`simulator/src/browser/`); this tab reaches it over a BroadcastChannel.
const CHANNEL_NAME = 'tx-storefront-simulator';
const tr = window.studyText;
const locale = window.studyLocale;
const $ = id => document.getElementById(id);
let currentState = null;
let verified = false;
let sending = false;
let reading = false;

let selectedRow = 1;
let selectedLaneId = FIXTURE.lanes[0].id;
const mutations = Array.from(document.querySelectorAll('[data-mutation]'));
const laneLabel = lane => tr(`棚${lane.cabinet}・${lane.row}段目・${lane.lane}レーン`, `Shelf ${lane.cabinet} · row ${lane.row} · lane ${lane.lane}`);
const skuName = id => FIXTURE.skus.find(sku => sku.id === id)?.itemName || id || tr('なし', 'None');
const selectedLane = () => FIXTURE.lanes.find(lane => lane.id === selectedLaneId);
const selectedSku = () => FIXTURE.skus.find(sku => sku.id === $('sku').value);

function setConnection(message, tone='') {
  $('connection').textContent=message;
  $('connection').className=`status ${tone}`;
}
function updateButtons() {
  mutations.forEach(button => {button.disabled = !verified || sending;});
  $('scan').disabled = !verified || sending;
  $('add').disabled = !verified || sending;
  $('refresh').disabled = reading || sending;
  $('scan-hint').textContent = !verified ? tr('シミュレーターの接続を確認してください。', 'Check the simulator connection.') : tr(`送信するJAN：${selectedSku()?.eanCode ?? '—'}。RS作業中、または棚割で商品を変更する場所を選んでから送ってください。受付結果はReactで確認します。`, `JAN to send: ${selectedSku()?.eanCode ?? '—'}. Start RS, or select a face to change in the layout editor, then send the scan. Check acceptance in React.`);
}
function renderLanes() {
  const tabs = $('row-tabs'); tabs.replaceChildren();
  [...new Set(FIXTURE.lanes.map(lane=>lane.row))].sort((a,b)=>b-a).forEach(row=>{
    const button=document.createElement('button');button.type='button';button.textContent=tr(`${row}段目`, `Row ${row}`);
    button.setAttribute('aria-pressed',String(row===selectedRow));
    button.addEventListener('click',()=>{selectedRow=row;selectedLaneId=FIXTURE.lanes.find(lane=>lane.row===row).id;renderLanes();});tabs.append(button);
  });
  const tray=$('lanes');tray.replaceChildren();
  FIXTURE.lanes.filter(lane=>lane.row===selectedRow).forEach(lane=>{
    const button=document.createElement('button');button.type='button';button.className=lane.isBlackList?'excluded':'';
    button.setAttribute('aria-pressed',String(lane.id===selectedLaneId));button.setAttribute('aria-label',`${laneLabel(lane)}、${lane.id}`);
    const number=document.createElement('span');number.className='number';number.textContent=lane.lane;
    const sub=document.createElement('span');sub.className='sub';sub.textContent=lane.isBlackList?tr('初期使用停止','Initially disabled'):tr('レーン','Lane');button.append(number,sub);
    button.addEventListener('click',()=>{selectedLaneId=lane.id;renderLanes();});tray.append(button);
  });
  const lane=selectedLane();$('location-label').textContent=laneLabel(lane);$('location-id').textContent=lane.id;
  $('location-note').textContent=lane.isBlackList?tr('この位置はfixture初期値で使用停止です。イベントを送っても使用停止は解除しません。','This lane is initially disabled in the fixture. Sending an event does not re-enable it.'):tr('選択した場所へ追加・取り出し・エラーのイベントを送ります。','Addition, removal and error events apply to this selected lane.');
}
function renderState(state) {
  currentState=state;
  const active=Array.isArray(state.requests)?state.requests.filter(item=>![10,20].includes(Number(item.status))):[];
  const mr=active.find(item=>Number(item.requestType)===13);
  $('rs-state').textContent=state.currentRestockingId || tr('作業なし','No active task');
  $('mr-state').textContent=mr?`${mr.requestId} / status ${mr.status}`:tr('作業なし','No active task');
  $('accepted-sku').textContent=skuName(state.currentRestockingSku);
  $('shelf-state').textContent=`${state.shelfConnected?tr('接続','Connected'):tr('未接続','Disconnected')} / ${state.scannerConnected?tr('接続','Connected'):tr('未接続','Disconnected')}`;
  $('robot-state').textContent=`status ${state.robot?.status ?? '—'} / mode ${state.robot?.opMode ?? '—'}`;
  $('updated').textContent=new Date().toLocaleTimeString(locale());
  $('state-json').textContent=JSON.stringify(state,null,2);
}
const channel = new BroadcastChannel(CHANNEL_NAME);
const pending = new Map();
channel.addEventListener('message', ({data}) => {
  // Several React tabs each answer; the first reply wins.
  const settle = data?.type === 'response' && pending.get(data.id);
  if (!settle) return;
  pending.delete(data.id); settle(data);
});
async function request(path, method='GET', params={}) {
  const id = crypto.randomUUID();
  const reply = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Object.assign(new Error('timeout'), {name:'AbortError'})); }, 3000);
    pending.set(id, data => { clearTimeout(timer); resolve(data); });
    channel.postMessage({type:'request', id, method, path, params: Object.fromEntries(Object.entries(params).map(([key,value])=>[key,String(value)]))});
  });
  const data = reply.body;
  if (reply.status >= 400 || data.ok === false) throw new Error(`${reply.status}: ${data.error || data.errorMessage || tr('送信できませんでした','Request failed')}`);
  return data;
}
function readableError(error) {return error?.name==='AbortError'?tr('React画面が応答しません。','The React app does not answer.'):error?.message || String(error);}
async function refreshState() {
  if(reading || sending)return;
  reading=true;updateButtons();
  try {
    const health=await request('/healthz');
    const catalog=await request('/sim/catalog');
    const requiredRoutes=['GET /sim/state','POST /sim/scanner/scan','POST /sim/lane/add','POST /sim/lane/remove','POST /sim/scenario/stock-error','POST /sim/scenario/constraint-error','POST /sim/scenario/clear-errors','POST /sim/reset'];
    if(health.ok!==true || !Array.isArray(catalog.routes) || !requiredRoutes.every(route=>catalog.routes.includes(route)))throw new Error(tr('シミュレーターを確認できません。','Could not verify the simulator.'));
    if(!Array.isArray(catalog.skus)||!Array.isArray(catalog.lanes)||!FIXTURE.skus.every(sku=>catalog.skus.some(item=>item.id===sku.id&&item.eanCode===sku.eanCode))||!FIXTURE.lanes.every(lane=>catalog.lanes.includes(lane.id)))throw new Error(tr('商品・レーンのfixtureが一致しません。操作パネルを更新してください。','Product/lane fixtures differ. Refresh the control panel.'));
    const state=await request('/sim/state');
    if(typeof state.stockLocations!=='number'||!Array.isArray(state.requests))throw new Error(tr('状態応答の形式が一致しません。','Unexpected state response format.'));
    renderState(state);verified=true;setConnection(tr('React画面のシミュレーターに接続済み','Connected to the simulator in the React tab'),'ok');
  } catch(error) {verified=false;setConnection(tr(`${readableError(error)} 同じブラウザの別タブでReact画面を開いてから、状態を取り直してください。`, `${readableError(error)} Open the React app in another tab of this browser, then refresh the state.`),'bad');}
  finally {reading=false;updateButtons();}
}
function logResult(title,path,params,data,error) {
  $('empty-log')?.remove();
  const item=document.createElement('li');if(error)item.className='error';
  const time=document.createElement('time');time.textContent=new Date().toLocaleTimeString(locale());
  const heading=document.createElement('strong');heading.textContent=`${error?tr('送信失敗','Send failed'):tr('送信成功','Sent')}：${title}`;
  const description=document.createElement('span');description.textContent=error || `POST ${path}${Object.keys(params).length?'?'+new URLSearchParams(params):''}`;
  item.append(time,heading,description);
  if(data){const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=tr('API応答','API response');const pre=document.createElement('pre');pre.textContent=JSON.stringify(data,null,2);details.append(summary,pre);item.append(details);}
  $('log').prepend(item);while($('log').children.length>12)$('log').lastElementChild.remove();
}
async function send(path,params,title) {
  if(!verified||sending)return false;
  sending=true;updateButtons();
  let ok=false;
  try {const data=await request(path,'POST',params);logResult(title,path,params,data);ok=true;}
  catch(error) {const message=readableError(error);logResult(title,path,params,null,message);setConnection(tr(`送信に失敗しました：${message}`, `Send failed: ${message}`),'bad');}
  finally {sending=false;updateButtons();}
  await refreshState();return ok;
}

FIXTURE.skus.forEach(sku=>{const option=document.createElement('option');option.value=sku.id;option.textContent=`${sku.itemName} · ${sku.volume}mL`; $('sku').append(option);});
$('sku').value=FIXTURE.skus.find(sku=>sku.id==='SIM-TEA')?.id || FIXTURE.skus[0].id;
const updateSku=()=>{$('jan').textContent=`${selectedSku().id} / JAN ${selectedSku().eanCode}`;updateButtons();};
$('sku').addEventListener('change',updateSku);updateSku();renderLanes();
$('refresh').addEventListener('click',()=>void refreshState());
$('scan').addEventListener('click',async()=>{
  const sku=selectedSku();if(!sku)return;
  await send('/sim/scanner/scan',{code:sku.eanCode},tr(`${sku.itemName}をスキャン`, `Scan ${sku.itemName}`));
});
$('add').addEventListener('click',()=>void send('/sim/lane/add',{lane:selectedLaneId,sku:selectedSku().id},tr(`${laneLabel(selectedLane())}へ${selectedSku().itemName}を1本追加`, `Add one ${selectedSku().itemName} to ${laneLabel(selectedLane())}`)));
$('remove').addEventListener('click',()=>{
  const count=Number($('remove-count').value);
  if(!Number.isInteger(count)||count<1||count>99){$('remove-count').setCustomValidity(tr('1〜99の整数を入力してください。','Enter a whole number from 1 to 99.'));$('remove-count').reportValidity();return;}
  $('remove-count').setCustomValidity('');void send('/sim/lane/remove',{lane:selectedLaneId,count},tr(`${laneLabel(selectedLane())}のロボット側から${count}本を取り出し`, `Remove ${count} units from the robot side of ${laneLabel(selectedLane())}`));
});
$('remove-count').addEventListener('input',()=>$('remove-count').setCustomValidity(''));
$('error-kind').addEventListener('change',()=>$('constraint-note').classList.toggle('hidden',!$('error-kind').value.startsWith('constraint:')));
$('error').addEventListener('click',()=>{
  const [kind,value]=$('error-kind').value.split(':');
  void send(`/sim/scenario/${kind==='constraint'?'constraint-error':'stock-error'}`,{lane:selectedLaneId,[kind==='constraint'?'reason':'cause']:value},tr(`${laneLabel(selectedLane())}に模擬エラー`, `Simulate an error at ${laneLabel(selectedLane())}`));
});
$('clear-errors').addEventListener('click',()=>void send('/sim/scenario/clear-errors',{},tr('全レーンの模擬エラーを消去','Clear simulated errors in all lanes')));
const detectionLabel=()=>$('detection-kind').selectedOptions[0].textContent;
$('detect-stop').addEventListener('click',()=>void send('/sim/robot/detection',{cause:$('detection-kind').value},tr(`${detectionLabel()}を検知してロボットが停止`,`Robot stops on detection: ${detectionLabel()}`)));
$('detect-only').addEventListener('click',()=>void send('/sim/robot/detection',{cause:$('detection-kind').value,stopped:'0'},tr(`${detectionLabel()}を検知（停止なし）`,`Detection without stopping: ${detectionLabel()}`)));
$('detect-clear').addEventListener('click',()=>void send('/sim/robot/detection',{cause:'clear'},tr('検知を解除','Clear detection')));
$('estop-press').addEventListener('click',()=>void send('/sim/robot/e-stop',{value:'1'},tr('非常停止ボタンを押す','Press the emergency stop')));
$('estop-reset').addEventListener('click',()=>void send('/sim/robot/e-stop',{value:'2'},tr('非常停止：リセットが必要','Emergency stop: needs reset')));
$('estop-release').addEventListener('click',()=>void send('/sim/robot/e-stop',{value:'0'},tr('非常停止を解除','Release the emergency stop')));
const robotStateLabel=()=>$('robot-work-state').selectedOptions[0].textContent;
$('robot-state-set').addEventListener('click',()=>{const [value,teleopCode]=$('robot-work-state').value.split(':');void send('/sim/robot/status',teleopCode?{value,teleopCode}:{value},tr(`ロボットを「${robotStateLabel()}」にする`,`Set the robot to "${robotStateLabel()}"`));});
$('resume-fault-set').addEventListener('click',()=>void send('/sim/faults',{method:'StartRobotOperation2',mode:'error',error:$('resume-fault').value},tr(`以後の再開を失敗させる：${$('resume-fault').selectedOptions[0].textContent}`,`Make resuming fail: ${$('resume-fault').selectedOptions[0].textContent}`)));
$('resume-fault-clear').addEventListener('click',()=>void send('/sim/faults/clear',{method:'StartRobotOperation2'},tr('再開の失敗を解除','Stop making resuming fail')));
$('reset').addEventListener('click',async()=>{
  if(!confirm(tr('デモ全体を初期値に戻します。現在の作業・在庫・エラーは消えます。実行しますか？','Reset the whole demo? Current tasks, stock changes and errors will be cleared.')))return;
  if(await send('/sim/reset',{},tr('デモ全体を初期化','Reset the whole demo')))setConnection(tr('初期化しました。React画面を再読み込みしてください。','Reset complete. Reload the React app.'),'ok');
});
window.onStudyLanguage(() => {
  renderLanes(); updateButtons();
  if (currentState) renderState(currentState);
  $('remove-count').setCustomValidity('');
  void refreshState();
});
void refreshState();
setInterval(()=>{if(!document.hidden)void refreshState();},5000);
