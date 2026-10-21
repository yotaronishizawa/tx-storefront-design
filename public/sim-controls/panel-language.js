/* Shared review language; changing it never changes the simulator state. */
(() => {
  const translations = {
    'StoreApp｜デモ入力': 'StoreApp | Demo simulator input',
    '実機の代わりに、イベントを送る': 'Send simulated events to the app',
    'このページはデモ用シミュレーターの操作パネルです。同じブラウザの別タブで開いたReact画面へ、スキャン、棚への追加・取り出し、エラーの模擬イベントを送ります。': 'This panel drives the demo simulator. It sends scans, stock additions/removals and errors to the React app open in another tab of the same browser.',
    'Reactホーム ↗': 'React home ↗',
    '在庫棚にいれる ↗': 'RS · Restock the stock shelf ↗',
    '在庫棚からとりだす ↗': 'MR · Take items out ↗',
    '比較ページに戻る': 'Back to the comparison',
    '初期化は不要': 'No reset required',
    '作業の開始・終了は、React画面で': 'Start and finish tasks in the React app',
    'ログインは': 'Sign in with ',
    '、店舗は': ', store ',
    '。Reactで「在庫棚にいれる」または「在庫棚からとりだす」を開き、作業を開始してから、このページで模擬イベントを送ります。': '. Open RS or MR in React and start the task before sending events here.',
    'ここでは人の入退室・手元・売場への陳列完了を生成しません。HTTPの送信成功と、React側での受付・作業完了は別です。': 'This does not simulate a person entering/leaving, physical handling, or completion on the sales shelf. A successful HTTP response does not establish acceptance or task completion in React.',
    'スキャンする商品': 'Product to scan',
    'スキャナーからJANが届いたことを再現します。選んだ商品は、下の「1本追加」にも使います。': 'Simulate a JAN barcode arriving from the scanner. The selected product is also used by Add one unit below.',
    '商品': 'Product',
    '選んだ商品のスキャンを送る': 'Scan the selected product',
    'シミュレーターへ接続しています。': 'Connecting to the simulator.',
    '棚割の商品検索にも使えます。Reactの棚割編集で対象フェイスを選んでから送ると、JANで候補を絞ります。RSの開始は不要です。商品を選んで確定するまでは棚割を変更しません。': 'Also works for product lookup in the layout editor. Select a face in React, then send the barcode to filter candidates. No RS task is needed. The layout changes only after you choose and confirm a product.',
    'スキャンだけでは、在庫は増えません。': 'Scanning alone does not increase stock.',
    'Reactでスキャン受付と商品を確認し、次に下でレーンを選んで「1本追加」を押してください。同じ商品を続けて入れるときは、追加だけを繰り返せます。': 'Check the accepted product in React, select a lane below, and press Add one unit. Repeat additions when restocking the same product.',
    'スキャンはSKUの申告、追加は棚の変化の模擬イベントです。手元の実物や売場への陳列完了を検知するものではありません。': 'A scan identifies the SKU; an addition simulates a shelf change. Neither detects the physical item in hand or placement on the sales shelf.',
    'イベントを送るレーン': 'Lane receiving the event',
    'Reactと同じ位置・番号で選べます。上から5→1段、各段は左から番号の大きい順です。最下段は11レーン、ほかは15レーンです。左右へスクロールできます。': 'Positions and labels match React. Rows run 5 to 1 from top to bottom, with descending lane numbers from left to right. Row 1 has 11 lanes; other rows have 15. Scroll horizontally to inspect them.',
    '選んだ商品を1本追加する': 'Add one unit of the selected product',
    '棚でその商品の追加を検知したイベントを送ります。スキャンを受理したことにはなりません。受付SKUと違う商品を追加すると、現物と申告が食い違うケースになります。': 'Send a shelf addition event. This does not accept a barcode scan. Adding a product different from the accepted SKU simulates a mismatch between the declared item and the shelf.',
    'ロボット側から取り出す本数': 'Units to remove from the robot side',
    'ロボット側からの取り出しを送る': 'Send a removal from the robot side',
    'MRでの手取り出しを再現します。ロボットが取り出す側から指定本数を除きます。本数が足りない場合は残っている分まで。売場への陳列は完了扱いにしません。': 'Simulate manual removal during MR, starting from the robot side. Remove the requested count, limited to available stock. This does not mark placement on the sales shelf complete.',
    'エラー表示を試す': 'Try an error state',
    '上で選んだレーンへ送ります。解決手順の完了や、使用停止の解除を代行する操作ではありません。': 'Apply to the selected lane. These actions do not complete a recovery procedure or re-enable a disabled lane.',
    'エラーの種類': 'Error type',
    '本数と重さが合わない：補充中の不整合（S000606）': 'Count/weight mismatch during restocking (S000606)',
    'スキャンなしの投入（S000603）': 'Added without scanning (S000603)',
    'スキャンなしの取り出し（S000604）': 'Removed without scanning (S000604)',
    '原因不明の不整合（S000699）': 'Mismatch with unknown cause (S000699)',
    '商品がレーン幅に合わない（S000602）': 'Product exceeds lane width (S000602)',
    '商品がレーン高さに合わない（S000601）': 'Product exceeds lane height (S000601)',
    '選んだエラーを発生させる': 'Trigger the selected error',
    '全レーンの模擬エラーを消す': 'Clear simulated errors in all lanes',
    '寸法エラーfixtureはレモンソーダをレーン先頭へ追加します。既に先頭にあれば本数を変えず、理由だけを変更します。エラーを消しても追加した商品は残ります。': 'The dimension-error fixture adds Lemon Soda at the front of the lane. If it is already first, only the error reason changes. Clearing the error leaves the added product in place.',
    'エラーがある間、アプリが投入本数の数え上げを抑止する場合があります。エラー解除と本数・使用停止の状態は分けて確認してください。': 'The app may suppress addition counts while an error exists. Check error clearance, counts, and disabled-lane status separately.',
    'シミュレーターの状態': 'Simulator state',
    '固定': ' only',
    '表示中は5秒ごとに取得します。': 'Refreshes every five seconds while visible.',
    '接続確認中': 'Checking connection',
    '受付SKU': 'Accepted SKU',
    '棚 / scanner': 'Shelf / scanner',
    'ロボット': 'Robot',
    '更新時刻': 'Updated',
    '状態を取り直す': 'Refresh state',
    'API応答を表示': 'View API response',
    '未取得': 'Not received',
    'デモ全体を初期化する': 'Reset the whole demo',
    '通常の試用には不要です。作業・在庫・エラーをfixture初期値へ戻します。接続中のReactへ初期化はpushされないので、実行後はReactを再読み込みしてください。': 'Usually unnecessary. Restore tasks, inventory, and errors to the initial fixture. Reset is not pushed to connected React sessions; reload the React app afterwards.',
    '初期値に戻す…': 'Reset to the initial fixture…',
    '送信結果': 'Event results',
    '直近12件。POST成功はイベント送信の応答です。最終的な画面・SKU受付・終了結果はReact側で確認してください。': 'Last 12 events. POST success confirms transmission only. Check the resulting UI, SKU acceptance, and completion in React.',
    'まだイベントを送っていません。': 'No events sent yet.',
    'SKUと位置対応は2026-10-06の': 'Product and location mappings were checked against the 2026-10-06 ',
    'と照合。接続時にcatalogのSKU・JAN・レーンIDも照合します。ID末尾の番号は画面のレーン番号と逆です（例：': ' fixtures. SKU, JAN, and lane IDs are checked against the catalog on connection. The lane-ID suffix runs opposite to the displayed lane number (for example: ',
    'S1-R1-L01 → 棚1・1段目・11レーン': 'S1-R1-L01 → shelf 1, row 1, lane 11',
    '）。状態APIは件数と作業状態を返すため、現在の各レーンの在庫一覧はReact画面で確認してください。': '). The state API returns counts and task state; inspect current lane inventory in React.',
    '棚の段': 'Shelf row',
    'レーン': 'Lane',
    'ロボットの状態・検知・非常停止': 'Robot state, detection and emergency stop',
    'ロボットの状態': 'Robot state',
    '動作中（通常）': 'Working (normal)',
    '停止中': 'At rest',
    'オペレーター待ち：在庫棚で掴み損ね': 'Operator request: failed grasp at stock',
    'オペレーター待ち：運搬中に掴み損ね': 'Operator request: dropped on the way',
    'オペレーター待ち：売場で異常を検知': 'Operator request: anomaly on display',
    'オペレーター待ち：売場の認識失敗': 'Operator request: display not recognised',
    'オペレーター待ち：在庫棚の認識失敗': 'Operator request: stock not recognised',
    'オペレーター待ち：在庫切れ': 'Operator request: empty stock',
    'オペレーター待ち：在庫の詰まり（手前）': 'Operator request: stuck stock (near)',
    'オペレーター待ち：在庫の詰まり（奥）': 'Operator request: stuck stock (far)',
    'オペレーター待ち：過負荷（店舗で直せない）': 'Operator request: overload (store cannot fix)',
    '起動待ち（要対応には出ない）': 'Not started (no attention)',
    '起動失敗（要対応には出ない）': 'Failed to start (no attention)',
    '内部の通信異常（要対応には出ない）': 'Internal connection error (no attention)',
    'ロボット異常（要対応には出ない）': 'Robot error (no attention)',
    'この状態にする': 'Set this state',
    '再開（ロボット開始）を失敗させる理由': 'Reason resuming (robot start) fails',
    '棚の角度を変更中': 'Shelves tilting',
    '在庫補充中': 'Restocking open',
    '品出し中': 'Manual replenishment open',
    'オペレーター対応中': 'Operator in control',
    'サーバーエラー': 'Server error',
    '以後の再開を失敗させる': 'Make resuming fail from now on',
    '再開の失敗を解除する': 'Stop making resuming fail',
    'ロボットが人・障害物・落下飲料を検知して止まった状態や、非常停止ボタンの状態を再現します。Reactのホームに約3秒で反映されます。': 'Simulate the robot stopping because it detects a person, an obstacle or a fallen drink, and the emergency stop state. The React home picks it up within about 3 seconds.',
    '検知の種類': 'Detection',
    '人（ウォークイン内に人がいる）': 'Person (someone in the walk-in)',
    '障害物': 'Obstacle',
    '落下飲料': 'Fallen drink',
    '検知してロボットが止まる': 'Detect and stop the robot',
    '検知だけ（止まらない）': 'Detect without stopping',
    '検知を解除する（直った）': 'Clear detection (fixed)',
    '非常停止ボタンを押す': 'Press the emergency stop',
    '解除したがリセットが必要': 'Released, needs reset',
    '非常停止を解除する': 'Release the emergency stop',
    '「検知だけ」は、補充中に店員が中にいるときのような、ロボットを止めない検知です。': '"Detect without stopping" is detection that does not stop the robot, such as staff inside while restocking.',
  };
  const key = 'storeapp-study-language';
  const query = new URL(location.href).searchParams.get('lang');
  let stored; try { stored = localStorage.getItem(key); } catch {}
  let language = ['ja', 'en'].includes(query) ? query : stored === 'en' ? 'en' : 'ja';
  const nodes = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (!node.parentElement?.closest('script,style') && translations[node.data.trim()]) {
      nodes.push({node, original: node.data, english: translations[node.data.trim()]});
    }
  }
  const labels = [...document.querySelectorAll('[aria-label]')].map(node => ({node, original: node.getAttribute('aria-label')}));
  const listeners = [];
  window.studyText = (ja, en) => language === 'en' ? en : ja;
  window.studyLocale = () => language === 'en' ? 'en-US' : 'ja-JP';
  window.onStudyLanguage = listener => listeners.push(listener);
  const controls = document.createElement('nav');
  controls.setAttribute('aria-label', 'Language / 言語');
  controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin:0 0 16px';
  for (const [value, label] of [['ja', '日本語'], ['en', 'English']]) {
    const button = document.createElement('button');
    button.type = 'button'; button.lang = value; button.textContent = label;
    button.dataset.language = value;
    button.addEventListener('click', () => { language = value; apply(); });
    controls.append(button);
  }
  document.querySelector('.wrap').prepend(controls);
  function apply() {
    document.documentElement.lang = language;
    for (const item of nodes) if (item.node.isConnected) item.node.data = language === 'en' ? item.english : item.original;
    for (const item of labels) item.node.setAttribute('aria-label', language === 'en' ? translations[item.original] || item.original : item.original);
    controls.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    try { localStorage.setItem(key, language); } catch {}
    const url = new URL(location.href); url.searchParams.set('lang', language);
    try { history.replaceState(null, '', url); } catch {}
    document.querySelectorAll('a[href^="index.html"]').forEach(link => { link.href = `index.html?task=home&lang=${language}`; });
    listeners.forEach(listener => listener());
  }
  apply();
})();
