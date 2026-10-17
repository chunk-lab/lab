// ===== 地名辞書（国・主要都市・日本の都道府県など）：英語（大文字）|日本語 =====
export let GEO_RAW;
export let GEO; 
export function geoLook(np){ const k=String(np||'').toLowerCase().replace(/^the /,''); return GEO[k]||GEO['the '+k]||null; }
export let CAPW;
export function geoCap(s){ let t=String(s||''); const low=t.toLowerCase(); for(const k of Object.keys(GEO)){ if(k.length>2&&low.includes(k)){ const re=new RegExp('\\b'+k.replace(/[.]/g,'\\.')+'\\b','i'); t=t.replace(re,m=>GEO[k].en.replace(/^the /i,m.match(/^the /i)?'the ':'')); } } return t.replace(/\b[a-z]+\b/g,w=>CAPW.has(w)?w[0].toUpperCase()+w.slice(1):w); }


/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_geo(){
GEO_RAW = 'Japan|日本;Tokyo|東京;Osaka|大阪;Kyoto|京都;Nagoya|名古屋;Yokohama|横浜;Kobe|神戸;Fukuoka|福岡;Sapporo|札幌;Sendai|仙台;Hiroshima|広島;Nara|奈良;Nagasaki|長崎;Okinawa|沖縄;Hokkaido|北海道;Kanagawa|神奈川;Chiba|千葉;Saitama|埼玉;Aichi|愛知;Hyogo|兵庫;Shizuoka|静岡;Niigata|新潟;Kumamoto|熊本;Kagoshima|鹿児島;Nikko|日光;Kamakura|鎌倉;Mt. Fuji|富士山;America|アメリカ;the United States|アメリカ;the U.S.|アメリカ;the USA|アメリカ;Canada|カナダ;Mexico|メキシコ;Brazil|ブラジル;Argentina|アルゼンチン;Peru|ペルー;Chile|チリ;Cuba|キューバ;England|イギリス;the United Kingdom|イギリス;Britain|イギリス;Scotland|スコットランド;Ireland|アイルランド;France|フランス;Germany|ドイツ;Italy|イタリア;Spain|スペイン;Portugal|ポルトガル;Switzerland|スイス;Austria|オーストリア;Belgium|ベルギー;Holland|オランダ;the Netherlands|オランダ;Sweden|スウェーデン;Norway|ノルウェー;Denmark|デンマーク;Finland|フィンランド;Iceland|アイスランド;Greece|ギリシャ;Turkey|トルコ;Russia|ロシア;Poland|ポーランド;Ukraine|ウクライナ;Egypt|エジプト;Kenya|ケニア;Morocco|モロッコ;Nigeria|ナイジェリア;South Africa|南アフリカ;Africa|アフリカ;Asia|アジア;Europe|ヨーロッパ;Australia|オーストラリア;New Zealand|ニュージーランド;China|中国;Korea|韓国;South Korea|韓国;North Korea|北朝鮮;Taiwan|台湾;Hong Kong|香港;Vietnam|ベトナム;Thailand|タイ;Singapore|シンガポール;Malaysia|マレーシア;Indonesia|インドネシア;the Philippines|フィリピン;India|インド;Nepal|ネパール;Mongolia|モンゴル;Dubai|ドバイ;Israel|イスラエル;Saudi Arabia|サウジアラビア;Iran|イラン;Hawaii|ハワイ;Alaska|アラスカ;California|カリフォルニア;Texas|テキサス;Florida|フロリダ;New York|ニューヨーク;Los Angeles|ロサンゼルス;San Francisco|サンフランシスコ;Chicago|シカゴ;Boston|ボストン;Seattle|シアトル;Las Vegas|ラスベガス;Washington|ワシントン;Miami|マイアミ;Toronto|トロント;Vancouver|バンクーバー;Montreal|モントリオール;London|ロンドン;Paris|パリ;Berlin|ベルリン;Rome|ローマ;Venice|ベネチア;Milan|ミラノ;Madrid|マドリード;Barcelona|バルセロナ;Lisbon|リスボン;Vienna|ウィーン;Amsterdam|アムステルダム;Brussels|ブリュッセル;Geneva|ジュネーブ;Zurich|チューリッヒ;Moscow|モスクワ;Athens|アテネ;Istanbul|イスタンブール;Cairo|カイロ;Sydney|シドニー;Melbourne|メルボルン;Beijing|北京;Shanghai|上海;Seoul|ソウル;Busan|釜山;Taipei|台北;Bangkok|バンコク;Hanoi|ハノイ;Manila|マニラ;Jakarta|ジャカルタ;Delhi|デリー;Mumbai|ムンバイ;Bali|バリ;Rio|リオ;Cambridge|ケンブリッジ;Oxford|オックスフォード';
GEO = {};
GEO_RAW.split(';').forEach(x=>{ const [en,ja]=x.split('|'); GEO[en.toLowerCase()]={en,ja}; });
CAPW = new Set('english japanese chinese korean french german spanish italian russian portuguese arabic american british canadian australian european african asian monday tuesday wednesday thursday friday saturday sunday january february march april june july august september october november december christmas'.split(' '));
}
