/* チャンク・カード（games/cb/tools/series_build.py が cards/ から作る。直すのは cards/ のほう） */
(function(){if(document.querySelector('style[data-ct="cards"]'))return;var s=document.createElement("style");s.setAttribute("data-ct","cards");s.textContent=".ct-cards{--bg1:#3d2f63;--bg2:#1e1633;--ink:#3a2c4a;--y:#ffcf5a;--pk:#ff5f8f;--pu:#6a4cf0;--bl:#3c8cff;--rd:#ff4f6d;--gr:#3cc98a}\n.ct-cards *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none}\n.ct-cards,.ct-cards{margin:0;height:100%;background:var(--bg2);font-family:\"Hiragino Maru Gothic ProN\",\"Hiragino Sans\",\"Noto Sans JP\",\"M PLUS Rounded 1c\",sans-serif;color:#fff;overscroll-behavior:none}\n.ct-cards{position:relative;max-width:480px;height:100%;height:100dvh;margin:0 auto;background:radial-gradient(120% 80% at 50% 0%,#4b3a7a,var(--bg1) 40%,var(--bg2));overflow:hidden}\n.ct-cards .scr{position:absolute;inset:0;display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top) + 8px) 10px calc(env(safe-area-inset-bottom) + 24px);animation:fade .25s;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}\n.ct-cards .scr>*{flex-shrink:0}\n@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1}}\n.ct-cards button{font-family:inherit}\n.ct-cards .btn{border:0;border-radius:16px;padding:14px;font-weight:900;font-size:17px;color:#fff;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.25);transition:transform .08s}\n.ct-cards .btn:active{transform:translateY(3px);box-shadow:0 1px 0 rgba(0,0,0,.25)}\n.ct-cards .btn:disabled{opacity:.35;filter:grayscale(.6)}\n.ct-cards .go{background:linear-gradient(180deg,#ff7aa3,var(--pk))}\n.ct-cards .ghost{background:rgba(255,255,255,.14)}\n.ct-cards .play{background:linear-gradient(180deg,#56dba0,var(--gr))}\n.ct-cards .disc{background:linear-gradient(180deg,#ff6b7f,#e33c57)}\n.ct-cards .small{padding:8px 12px;font-size:13px}\n.ct-cards .title{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}\n.ct-cards .logo{display:flex;flex-direction:column;align-items:center;font-weight:900;line-height:.95;letter-spacing:2px;text-shadow:0 5px 0 rgba(0,0,0,.3)}\n.ct-cards .logo span:first-child{font-size:56px;color:var(--y)}\n.ct-cards .logo span:last-child{font-size:56px;color:#fff}\n.ct-cards .sub{opacity:.85;font-weight:800}\n.ct-cards .fan{display:flex;margin:18px 0 26px}\n.ct-cards .fan .card{transform:rotate(var(--r));margin:0 -6px}\n.ct-cards .title .btn{width:240px}\n.ct-cards .rec{font-size:12.5px;opacity:.8;text-align:center;line-height:1.6}\n.ct-cards .card{position:relative;width:50px;height:70px;border-radius:9px;background:#fffdf6;color:var(--ink);display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:13.5px;line-height:1.05;box-shadow:0 3px 0 rgba(0,0,0,.28);border-top:7px solid var(--c);flex:0 0 auto;cursor:pointer;transition:transform .12s,box-shadow .12s;touch-action:none;padding:0 2px;word-break:break-word}\n.ct-cards .card.big{width:70px;height:96px;font-size:17px;border-top-width:10px}\n.ct-cards .card i{position:absolute;bottom:2px;right:4px;font-style:normal;font-size:9px;color:#a08ac0}\n.ct-cards .card u{position:absolute;bottom:2px;left:4px;text-decoration:none;font-size:8.5px;color:#3cc98a;font-weight:900}\n.ct-cards .card em{position:absolute;top:-17px;left:50%;transform:translateX(-50%);font-style:normal;font-size:9px;white-space:nowrap;background:rgba(0,0,0,.45);color:#fff;border-radius:6px;padding:1px 4px}\n.ct-cards .card .rm{position:absolute;top:-7px;right:-7px;width:18px;height:18px;border-radius:50%;background:#4a3a6a;color:#fff;font-size:12px;line-height:18px;font-style:normal}\n.ct-cards .card.n{--c:#5aa7ff}\n.ct-cards .card.v{--c:#ff6f7f}\n.ct-cards .card.m{--c:#4cd08a}\n.ct-cards .card.p{--c:#ffcc40}\n.ct-cards .card.a{--c:#ff9a45}\n.ct-cards .card.c{--c:#b07cff}\n.ct-cards .card.tsu{width:auto;min-width:42px;height:42px;border-radius:12px;border-top-width:5px;padding:0 8px;font-size:12px}\n.ct-cards .card.tsu i{display:none}\n.ct-cards .card.rare{background:linear-gradient(160deg,#fffdf6 60%,#fff1c2)}\n.ct-cards .card.drag{z-index:10;box-shadow:0 10px 20px rgba(0,0,0,.4)}\n.ct-cards .card.ins{box-shadow:-4px 0 0 var(--y),0 3px 0 rgba(0,0,0,.28)}\n.ct-cards .card.hit{animation:hit .35s}\n@keyframes hit{50%{transform:translateY(-10px) scale(1.12)}}\n.ct-cards .top{display:flex;align-items:center;gap:8px}\n.ct-cards .stg{background:var(--pu);border-radius:12px;padding:6px 9px;font-weight:900;font-size:13px;white-space:nowrap}\n.ct-cards .stg small{opacity:.7}\n.ct-cards .stg.boss{background:#c83250}\n.ct-cards .goal{flex:1;display:flex;align-items:center;gap:6px;font-size:11px}\n.ct-cards .goal b{font-size:15px;color:var(--y)}\n.ct-cards .bar{flex:1;height:10px;background:rgba(255,255,255,.15);border-radius:6px;overflow:hidden}\n.ct-cards .bar i{display:block;height:100%;background:linear-gradient(90deg,var(--y),var(--pk));width:0;transition:width .1s}\n.ct-cards .res{display:flex;gap:4px;font-size:9.5px;font-weight:800}\n.ct-cards .res span{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.12);border-radius:9px;padding:3px 6px}\n.ct-cards .res b{font-size:14px}\n.ct-cards .res .money b{color:var(--y)}\n.ct-cards .jokers{display:flex;gap:5px;margin-top:8px}\n.ct-cards .joker{flex:1;min-height:62px;border-radius:10px;background:linear-gradient(160deg,#ffe08a,#ffb21f);color:var(--ink);padding:5px;font-size:8.5px;font-weight:800;line-height:1.3;border:2px solid rgba(255,255,255,.5)}\n.ct-cards .joker b{display:block;font-size:10.5px;margin-bottom:2px}\n.ct-cards .joker.empty{background:rgba(255,255,255,.06);border:2px dashed rgba(255,255,255,.18);color:rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center}\n.ct-cards .bossbar{margin-top:6px;background:rgba(239,77,99,.22);border:1.5px dashed #ff8fa6;border-radius:10px;padding:5px 9px;font-size:11.5px;font-weight:800}\n.ct-cards .board{margin-top:8px;background:rgba(0,0,0,.18);border-radius:16px;padding:18px 8px 8px;min-height:230px;flex:0 0 auto;display:flex;flex-direction:column}\n.ct-cards .row{display:flex;flex-wrap:wrap;gap:16px 5px;min-height:70px;align-content:flex-start;padding-top:2px}\n.ct-cards .row .ph{opacity:.45;font-size:12px;font-weight:800;margin:auto}\n.ct-cards .pv{margin-top:auto;text-align:center}\n.ct-cards .sent{font-weight:900;font-size:15.5px;min-height:22px;margin:8px 0 2px}\n.ct-cards .sent.ok{color:#fff}\n.ct-cards .sent.bad,.ct-cards .sent.wait{color:rgba(255,255,255,.55)}\n.ct-cards .yk{color:var(--y);font-weight:900;font-size:12.5px;min-height:17px}\n.ct-cards .cm{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:5px}\n.ct-cards .chips,.ct-cards .mult{min-width:76px;border-radius:12px;padding:5px 10px;font-size:22px;font-weight:900}\n.ct-cards .chips{background:var(--bl)}\n.ct-cards .mult{background:var(--rd)}\n.ct-cards .x{font-weight:900;font-size:20px}\n.ct-cards .msg{min-height:16px;margin-top:5px;font-size:12px;font-weight:800;color:#ffb3c0}\n.ct-cards .bump{animation:bump .25s}\n@keyframes bump{50%{transform:scale(1.2)}}\n.ct-cards .field{margin-top:8px;background:rgba(255,255,255,.06);border-radius:12px;padding:6px 8px}\n.ct-cards .flbl{display:flex;justify-content:space-between;font-size:11px;font-weight:800;opacity:.85}\n.ct-cards .flbl .pts b{color:var(--y);font-size:14px}\n.ct-cards .frow{display:flex;gap:4px;margin-top:5px;min-height:44px;align-items:center;overflow-x:auto}\n.ct-cards .frow .ph{opacity:.4;font-size:11px;font-weight:800}\n.ct-cards .card.mini{width:38px;height:52px;font-size:10.5px;border-top-width:5px}\n.ct-cards .card.mini i{font-size:8px}\n.ct-cards .card.can{outline:3px solid var(--y);animation:glow 1s infinite alternate}\n.ct-cards .card.cant{opacity:.4}\n@keyframes glow{to{outline-color:#fff6c8}}\n.ct-cards .fhint{font-size:11.5px;font-weight:800;color:var(--y);min-height:0}\n.ct-cards .fhint:empty{display:none}\n.ct-cards .card.marked{transform:translateY(8px);opacity:.75}\n.ct-cards .card.marked::after{content:'✕';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:34px;color:#ef4d63;font-weight:900;text-shadow:0 2px 0 #fff}\n.ct-cards .tsu{margin-top:8px}\n.ct-cards .tabs{display:flex;gap:4px;overflow-x:auto}\n.ct-cards .tab{flex:1;border:0;border-radius:10px 10px 0 0;padding:6px 2px;font-size:11px;font-weight:900;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);white-space:nowrap}\n.ct-cards .tab.on{background:rgba(255,255,255,.2);color:#fff}\n.ct-cards .tw{display:flex;flex-wrap:wrap;gap:6px;background:rgba(255,255,255,.12);border-radius:0 0 12px 12px;padding:8px;min-height:54px}\n.ct-cards .hand{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:12px}\n.ct-cards .hand .card{width:54px;height:78px;font-size:14px}\n.ct-cards .btns{display:flex;gap:10px;margin-top:auto;padding-top:10px}\n.ct-cards .btns .btn{flex:1}\n.ct-cards .btns .play{flex:1.6}\n.ct-cards .float{position:absolute;transform:translate(-50%,-10px);font-weight:900;font-size:16px;pointer-events:none;animation:up .9s forwards;text-shadow:0 2px 0 rgba(0,0,0,.4);z-index:30}\n.ct-cards .float.c{color:#8ec5ff}\n.ct-cards .float.m{color:#ff8fa0}\n.ct-cards .float.x{color:var(--y);font-size:20px}\n@keyframes up{to{transform:translate(-50%,-50px);opacity:0}}\n.ct-cards .bigscore{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);font-size:52px;font-weight:900;color:var(--y);text-shadow:0 5px 0 rgba(0,0,0,.35);z-index:40;animation:pop .3s}\n@keyframes pop{from{transform:translate(-50%,-50%) scale(.4)}}\n.ct-cards .clear,.ct-cards .end{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;text-align:center}\n.ct-cards .clear h1,.ct-cards .end h1{font-size:30px;margin:0;color:var(--y)}\n.ct-cards .pay{background:rgba(255,255,255,.1);border-radius:14px;padding:12px 16px;width:260px}\n.ct-cards .pay div{display:flex;justify-content:space-between;padding:4px 0;font-weight:800}\n.ct-cards .pay b{color:var(--y)}\n.ct-cards .money.big{font-size:30px;font-weight:900;color:var(--y)}\n.ct-cards .clear .btn,.ct-cards .end .btn{width:240px}\n.ct-cards .shop{flex:1;display:flex;flex-direction:column}\n.ct-cards .shead{display:flex;justify-content:space-between;align-items:center}\n.ct-cards .shead h1{margin:4px 0;font-size:26px}\n.ct-cards .shead .money{font-size:22px;font-weight:900;color:var(--y)}\n.ct-cards .next{font-size:12px;opacity:.8;font-weight:800}\n.ct-cards .items{display:flex;flex-direction:column;gap:8px;margin-top:10px}\n.ct-cards .item{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.1);border-radius:14px;padding:8px;cursor:pointer}\n.ct-cards .item .joker{flex:0 0 86px;min-height:70px}\n.ct-cards .item.poor{opacity:.5}\n.ct-cards .item.sold{justify-content:center;opacity:.4;min-height:50px;font-weight:800}\n.ct-cards .pack{flex:0 0 86px;height:70px;border-radius:12px;background:linear-gradient(160deg,#9a80ff,var(--pu));display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;font-size:13px;text-align:center}\n.ct-cards .pack.book{background:linear-gradient(160deg,#ff9ec0,#e8457e)}\n.ct-cards .pack.boost{background:linear-gradient(160deg,#6fe0ad,#2fbf83)}\n.ct-cards .desc{flex:1;font-size:12px;font-weight:700;line-height:1.5}\n.ct-cards .price{background:var(--y);color:var(--ink);border-radius:10px;padding:6px 8px;font-weight:900;white-space:nowrap}\n.ct-cards .myj{margin-top:12px}\n.ct-cards .lbl{font-size:11px;opacity:.75;font-weight:800;margin-bottom:5px}\n.ct-cards .sbtns{display:flex;gap:10px;margin-top:auto}\n.ct-cards .sbtns .btn{flex:1}\n.ct-cards .modal{position:absolute;inset:0;background:rgba(10,5,25,.7);display:flex;align-items:center;justify-content:center;z-index:50;padding:16px}\n.ct-cards .box{background:#3b2d5f;border-radius:20px;padding:16px;width:100%;max-height:90%;overflow:auto;display:flex;flex-direction:column;gap:10px}\n.ct-cards .box h2{margin:0;color:var(--y);font-size:20px}\n.ct-cards .box ol{margin:0;padding-left:20px;font-size:13.5px;line-height:1.6;font-weight:700}\n.ct-cards .pick{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}\n.ct-cards .pick.scroll{max-height:50vh;overflow:auto;gap:6px}\n.ct-cards .pc{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer}\n.ct-cards .pc .ja{font-size:12px;text-align:center;font-weight:800}\n.ct-cards .toast{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(0,0,0,.75);padding:10px 14px;border-radius:12px;font-weight:800;font-size:13px;z-index:60}\n.ct-cards .st,.ct-cards .tot{font-weight:800;opacity:.9}\n.ct-cards .bestS{background:rgba(255,255,255,.1);border-radius:14px;padding:12px;width:100%}\n.ct-cards .bestS .t{font-size:17px;font-weight:900;margin:6px 0}\n.ct-cards .card.guest{background:linear-gradient(160deg,#fff7d6,#ffe08a);box-shadow:0 0 0 2px #ffb21f,0 3px 0 rgba(0,0,0,.28)}\n.ct-cards .card.wild{background:linear-gradient(160deg,#efe6ff,#d4c2ff);box-shadow:0 0 0 2px #9a80ff,0 3px 0 rgba(0,0,0,.28)}\n.ct-cards .mbar{margin-top:6px;font-size:10.5px;font-weight:800;line-height:1.9}\n.ct-cards .mc{display:inline-block;margin-left:4px;padding:1px 7px;border-radius:8px;background:rgba(90,167,255,.18)}\n.ct-cards .mc b{color:var(--y)}\n.ct-cards .mc.t0{border:1.5px solid #3cc98a}\n.ct-cards .mc.t1{border:1.5px solid #ffb21f}\n.ct-cards .mc.t2{border:1.5px solid #ef4d63}\n.ct-cards .mc.hit{background:rgba(95,224,165,.3)}\n.ct-cards .qbar{margin-top:2px;font-size:10.5px;font-weight:800;line-height:1.9}\n.ct-cards .qc{display:inline-block;margin-left:4px;padding:1px 7px;border-radius:8px;background:rgba(255,255,255,.12)}\n.ct-cards .qc.t0{border:1.5px solid #3cc98a}\n.ct-cards .qc.t1{border:1.5px solid #ffb21f}\n.ct-cards .qc.t2{border:1.5px solid #ef4d63}\n.ct-cards .qc.hit{background:rgba(95,224,165,.3)}\n.ct-cards .qrev{font-size:24px;font-weight:900;text-align:center;padding:10px;border-radius:12px;background:rgba(255,255,255,.1)}\n.ct-cards .msg .gd{color:#7df0b8}\n.ct-cards .pack.itp{background:linear-gradient(160deg,#c9b5ff,#7b5cf0)}\n.ct-cards .combos{display:flex;flex-wrap:wrap;gap:6px;max-height:50vh;overflow:auto}\n.ct-cards .combos span{background:rgba(255,255,255,.12);border-radius:8px;padding:4px 8px;font-size:12.5px;font-weight:800}\n.ct-cards .box .res{text-align:center;font-weight:900;font-size:18px}\n.ct-cards .box .res.w{color:#5fe0a5}\n.ct-cards .box .res.l{color:#ff8fa6}\n.ct-cards .row{position:relative}\n.ct-cards .caret{position:absolute;width:4px;border-radius:2px;background:linear-gradient(180deg,#fff4cf,#d8b25a);box-shadow:0 0 10px #f3dc95;pointer-events:none;z-index:5;display:none}\n.ct-cards .card.ghost{position:absolute;z-index:80;pointer-events:none;box-shadow:0 14px 28px rgba(0,0,0,.5);animation:none}\n.ct-cards .rv .rs{font-family:var(--serif);font-size:18px;line-height:1.7;text-align:center;padding:8px;background:rgba(4,16,13,.5);border-radius:10px}\n.ct-cards .rt.au{color:var(--gold2);border-bottom:1px dashed var(--gold)}\n.ct-cards .rt.hi{background:var(--gold);color:#2a1d08;border-radius:4px;padding:0 3px}\n.ct-cards .rv .why{font-size:14px;line-height:1.7;font-weight:700}\n.ct-cards .rv p{font-size:13px;margin:0;line-height:1.6}\n.ct-cards .rv h2 small{font-size:12px;opacity:.75;margin-left:6px}\n.ct-cards .cks{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:flex-end;padding:8px 4px;background:rgba(4,16,13,.5);border-radius:10px}\n.ct-cards .ck{display:flex;flex-direction:column;align-items:center;border-radius:8px;padding:4px 7px 3px;border:1px solid rgba(243,220,149,.3);transition:opacity .2s}\n.ct-cards .ck b{font-family:var(--serif);font-size:16px;font-weight:700;color:var(--ivory)}\n.ct-cards .ck small{font-size:9.5px;opacity:.85;margin-top:1px}\n.ct-cards .ck.r1{background:rgba(47,95,158,.45)}\n.ct-cards .ck.r2{background:rgba(163,40,63,.45)}\n.ct-cards .ck.r3{background:rgba(47,125,91,.45)}\n.ct-cards .ck.r4{background:rgba(168,122,34,.4)}\n.ct-cards .ck.r5{background:rgba(107,74,158,.45)}\n.ct-cards .ck.hi{outline:2px solid var(--gold2);transform:scale(1.06)}\n.ct-cards .ck.dim{opacity:.35}\n.ct-cards .ck.dot{border:none;background:none;font-size:18px}\n.ct-cards .rv .lead{font-size:13.5px;line-height:1.75;margin:0;font-weight:600}\n.ct-cards .rv .big{text-align:center;padding:6px}\n.ct-cards .rv .big b{font-family:var(--serif);font-size:24px;color:var(--gold2)}\n.ct-cards .rv .big span{display:block;font-family:var(--mincho);font-size:15px;margin-top:2px}\n.ct-cards .rv .wn{margin:0;padding-left:0;list-style:none;display:flex;flex-direction:column;gap:6px}\n.ct-cards .rv .wn li{font-size:13px;line-height:1.65;background:rgba(4,16,13,.45);border-left:3px solid var(--gold);border-radius:6px;padding:6px 8px}\n.ct-cards .rv .wn li b{font-family:var(--serif);color:var(--gold2);font-size:15px;margin-right:6px}\n.ct-cards .rv .jo{font-size:13px;line-height:1.8;background:rgba(4,16,13,.45);border-radius:8px;padding:6px 8px}\n.ct-cards .rv .jo span{font-family:var(--mincho);color:var(--gold2)}\n.ct-cards .rv .jo small{opacity:.8}\n.ct-cards .rv .ja2{font-family:var(--mincho);font-size:13px;opacity:.85;text-align:center}\n.ct-cards .rv .wh{display:flex;align-items:center;gap:6px;margin-bottom:2px}\n.ct-cards .rv .wh b{font-family:var(--serif);color:var(--gold2);font-size:16px}\n.ct-cards .rv .wh i{font-style:normal;font-size:10.5px;background:rgba(243,220,149,.15);border:1px solid rgba(243,220,149,.45);border-radius:6px;padding:0 6px;color:var(--ivory)}\n.ct-cards .rv .wh u.ru{background:rgba(90,167,255,.35);color:#e6f0ff}\n.ct-cards .rv .wh u{text-decoration:none;font-size:10px;background:var(--gold);color:#2a1d08;border-radius:6px;padding:0 5px;font-weight:800}\n.ct-cards .rv .sm{font-size:12px;opacity:.85;margin:0;line-height:1.6}\n.ct-cards .rv .pts{margin:0;padding-left:18px;font-size:13px;line-height:1.7}\n.ct-cards .rv .pts b{font-family:var(--serif);color:var(--gold2)}\n.ct-cards .card.need{animation:need 1s ease-in-out infinite alternate;box-shadow:0 0 0 3px var(--gold2),0 0 22px rgba(243,220,149,.85)}\n@keyframes need{to{transform:translateY(-8px)}}\n.ct-cards .hrow.need{color:var(--gold2);font-size:13px}\n.ct-cards .hrow.need b{font-family:var(--serif);font-size:15px}\n.ct-cards .imp .cmp{display:flex;flex-direction:column;gap:6px}\n.ct-cards .imp .cmp div{background:rgba(4,16,13,.5);border-radius:8px;padding:6px 8px}\n.ct-cards .imp .cmp small{font-size:10.5px;opacity:.7}\n.ct-cards .imp .cmp p{margin:2px 0 0;font-family:var(--serif);font-size:16px;line-height:1.6}\n.ct-cards .st.im{color:var(--gold2);border-bottom:1px dashed var(--gold)}\n.ct-cards .st.hi{background:var(--gold);color:#2a1d08;border-radius:4px;padding:0 3px;border:none}\n.ct-cards .hist{display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow:auto}\n.ct-cards .hi1{display:flex;align-items:center;gap:8px;background:rgba(4,16,13,.5);border:1px solid rgba(216,178,90,.25);border-radius:10px;padding:8px;cursor:pointer}\n.ct-cards .hi1 span{color:var(--gold2);font-family:var(--serif);width:18px}\n.ct-cards .hi1 b{flex:1;font-family:var(--serif);font-weight:600;font-size:14px}\n.ct-cards .hi1 i{font-style:normal;font-size:11px;opacity:.8}\n.ct-cards .rvb{display:flex;gap:8px}\n.ct-cards .rvb .btn{flex:1}\n.ct-cards .rvb .ghost{flex:.7}\n.ct-cards .rv .pg{text-align:center;font-size:11px;opacity:.6}\n.ct-cards .ribar{margin-top:4px;color:#ffcf5a;font-weight:900;font-size:11.5px}\n.ct-cards .card.mini.byguest{box-shadow:0 0 0 2px #ffb21f}\n.ct-cards .btn.ri{flex:.9;line-height:1.1;font-size:13px}\n.ct-cards .btn.ri small{font-size:9.5px;opacity:.85}\n.ct-cards .sd .bon{margin-top:4px;font-size:12px;font-weight:900;color:#ffcf5a}\n.ct-cards .qrev2{text-align:center;font-weight:800;font-size:13px}\n.ct-cards .qrev2 b{color:#ffcf5a}\n.ct-cards .card s.of{position:absolute;bottom:3px;left:4px;text-decoration:none;font-size:9px;color:#5aa7ff;font-weight:900}\n.ct-cards .vrules{font-size:12px;font-weight:700;line-height:1.6}\n.ct-cards .vrules summary{font-weight:900;color:var(--y);cursor:pointer}\n.ct-cards .vrules ol{padding-left:18px;margin:6px 0}\n.ct-cards .btn.vs{background:linear-gradient(180deg,#8f78ff,#5b3fe0)}\n.ct-cards .opps{display:flex;flex-direction:column;gap:8px}\n.ct-cards .oppc{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.1);border-radius:14px;padding:10px;cursor:pointer}\n.ct-cards .oppc .face{font-size:38px}\n.ct-cards .oppc p{margin:3px 0;font-size:12px;line-height:1.5;font-weight:700}\n.ct-cards .oppc small{opacity:.7}\n.ct-cards .lvtag{font-size:10px;border-radius:8px;padding:2px 6px;background:#3cc98a}\n.ct-cards .lvtag.l1{background:#ffb21f;color:#3a2c4a}\n.ct-cards .lvtag.l2{background:#ef4d63}\n.ct-cards .vtop{display:flex;align-items:center;gap:6px}\n.ct-cards .vh{background:var(--pu);border-radius:12px;padding:6px 9px;font-weight:900;font-size:12px;white-space:nowrap}\n.ct-cards .pot{flex:1;text-align:center;font-weight:900;font-size:20px;color:var(--y)}\n.ct-cards .pot small{font-size:10px;color:#fff;opacity:.7;margin-left:4px}\n.ct-cards .vmed{display:flex;gap:4px;font-size:10px;font-weight:800}\n.ct-cards .vmed span{display:flex;flex-direction:column;align-items:center;background:rgba(255,255,255,.12);border-radius:9px;padding:3px 7px}\n.ct-cards .vmed b{font-size:14px;color:var(--y)}\n.ct-cards .vq{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:9px;width:28px;height:28px;font-weight:900}\n.ct-cards .opp{display:flex;align-items:center;gap:8px;margin-top:8px;background:rgba(239,77,99,.12);border-radius:14px;padding:6px 8px;position:relative;min-height:56px}\n.ct-cards .opp .face{font-size:32px}\n.ct-cards .oinfo{flex:1;min-width:0}\n.ct-cards .oname{font-weight:900;font-size:13px}\n.ct-cards .oname small{margin-left:8px;font-size:10.5px;opacity:.8}\n.ct-cards .oname b{color:var(--y)}\n.ct-cards .backs{display:flex;gap:2px;margin-top:4px}\n.ct-cards .cback{width:16px;height:22px;border-radius:4px;background:repeating-linear-gradient(45deg,#ef4d63,#ef4d63 3px,#c83250 3px,#c83250 6px);border:1.5px solid #fff8}\n.ct-cards .bubble{position:absolute;right:8px;top:6px;max-width:52%;background:#fff;color:var(--ink);font-weight:900;font-size:11.5px;border-radius:12px;padding:5px 9px;opacity:0;line-height:1.35}\n.ct-cards .bubble.on{opacity:1}\n.ct-cards .bubble.hot{background:#ffcf5a}\n.ct-cards .bubble.think{opacity:.7}\n.ct-cards .rule{margin-top:6px;font-size:11px;font-weight:800;background:rgba(255,207,90,.14);border:1.5px dashed rgba(255,207,90,.6);border-radius:10px;padding:4px 8px}\n.ct-cards .rule:empty{display:none}\n.ct-cards .rule b{color:var(--y)}\n.ct-cards .vturn{margin-top:6px;font-size:12px;font-weight:800;text-align:center}\n.ct-cards .vturn .you{color:var(--y)}\n.ct-cards .cm .eq{margin-left:8px;font-weight:900;font-size:18px;color:var(--y)}\n.ct-cards .card.mini.bycpu{box-shadow:0 0 0 2px #ef4d63}\n.ct-cards .card.mini.byme{box-shadow:0 0 0 2px #5aa7ff}\n.ct-cards .flbl i{font-style:normal}\n.ct-cards .flbl i.me{color:#8cc4ff}\n.ct-cards .flbl i.cp{color:#ff8fa6}\n.ct-cards .sd .side{background:rgba(255,255,255,.08);border-radius:14px;padding:8px 10px}\n.ct-cards .sd .side.cp{background:rgba(239,77,99,.14)}\n.ct-cards .spk{margin-left:8px;border:1px solid rgba(243,220,149,.5);background:rgba(4,16,13,.5);color:var(--gold2);border-radius:999px;font-size:11px;padding:1px 8px;font-family:var(--sans)}\n.ct-cards .sd .who{font-size:12px;font-weight:900;opacity:.8}\n.ct-cards .sd .tx{font-weight:900;font-size:15px;margin:4px 0}\n.ct-cards .sd .yk2{color:var(--y);font-size:12px;font-weight:900}\n.ct-cards .sd .cm2{font-weight:900;font-size:15px;margin-top:4px}\n.ct-cards .sd .cm2 .chips{background:#3c8cff;border-radius:8px;padding:2px 7px;margin-right:3px}\n.ct-cards .sd .cm2 .mult{background:#ff4f6d;border-radius:8px;padding:2px 7px;margin:0 3px}\n.ct-cards .sd .cm2 .tot{font-size:20px;color:var(--y)}\n.ct-cards .srow .card.tsu{height:52px;min-width:28px;padding:0 4px;font-size:10px}\n.ct-cards .srow{display:flex;align-items:flex-end;flex-wrap:wrap;gap:3px;margin-top:4px}\n.ct-cards .sd .res{text-align:center;font-weight:900;font-size:20px;margin:4px 0;min-height:26px}\n.ct-cards .sd .res.w{color:#5fe0a5}\n.ct-cards .sd .res.l{color:#ff8fa6}\n.ct-cards{--felt1:#1d5646;--felt2:#123b31;--felt3:#08201a;--gold:#d8b25a;--gold2:#f3dc95;--goldd:#9c7a2e;--ivory:#f8f2e4;--ivory2:#ece2c9;--ink:#2a2118;--ruby:#a8243c;--sapph:#1f4f9a;--emer:#1f7a55;--y:#f3dc95;\n  --serif:\"Playfair Display\",\"Shippori Mincho B1\",Georgia,serif;--mincho:\"Shippori Mincho B1\",\"Hiragino Mincho ProN\",serif;--sans:\"Zen Kaku Gothic New\",\"Hiragino Sans\",\"Noto Sans JP\",sans-serif}\n.ct-cards,.ct-cards{background:var(--felt3);font-family:var(--sans)}\n.ct-cards{background:\n  radial-gradient(130% 60% at 50% -5%,rgba(243,220,149,.10),transparent 60%),\n  repeating-linear-gradient(45deg,rgba(255,255,255,.012) 0 2px,rgba(0,0,0,.02) 2px 4px),\n  radial-gradient(120% 80% at 50% 10%,var(--felt1),var(--felt2) 45%,var(--felt3));\n  box-shadow:inset 0 0 120px rgba(0,0,0,.55)}\n.ct-cards .btn{font-family:var(--mincho);font-weight:800;letter-spacing:.06em;border:1px solid rgba(243,220,149,.55);border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -2px 6px rgba(0,0,0,.25),0 4px 0 rgba(0,0,0,.35),0 8px 18px rgba(0,0,0,.25);text-shadow:0 1px 0 rgba(0,0,0,.35)}\n.ct-cards .btn:active{box-shadow:inset 0 2px 6px rgba(0,0,0,.4),0 1px 0 rgba(0,0,0,.35)}\n.ct-cards .go{background:linear-gradient(180deg,#f7e3a3,#d8b25a 48%,#a9822f);color:#2a1d08;text-shadow:0 1px 0 rgba(255,255,255,.35)}\n.ct-cards .play{background:linear-gradient(180deg,#3fb487,#1f7a55 55%,#145a3e)}\n.ct-cards .disc{background:linear-gradient(180deg,#d24a63,#a8243c 55%,#7a1528)}\n.ct-cards .ghost{background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03));color:var(--ivory)}\n.ct-cards .btn.vs{background:linear-gradient(180deg,#3c6fc4,#1f4f9a 55%,#14376e)}\n.ct-cards .logo{font-family:\"Playfair Display\",serif;font-weight:900;letter-spacing:.08em;text-shadow:none;line-height:.9}\n.ct-cards .logo span{background:linear-gradient(180deg,#fff4cf 0%,#f3dc95 30%,#c99a3c 60%,#f3dc95 85%);-webkit-background-clip:text;background-clip:text;color:transparent!important;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45));position:relative}\n.ct-cards .logo span:first-child,.ct-cards .logo span:last-child{font-size:58px}\n.ct-cards .logo::after{content:'';display:block;width:180px;height:1px;margin:10px auto 0;background:linear-gradient(90deg,transparent,var(--gold),transparent)}\n.ct-cards .sub{font-family:var(--mincho);letter-spacing:.12em;color:var(--ivory2);opacity:.9}\n.ct-cards .title .btn{width:250px}\n.ct-cards .lvsel{display:flex;border:1px solid rgba(243,220,149,.45);border-radius:999px;overflow:hidden;margin-top:4px}\n.ct-cards .lvb{border:0;background:transparent;color:var(--ivory2);font-family:var(--mincho);font-weight:800;font-size:13.5px;padding:7px 18px;letter-spacing:.1em}\n.ct-cards .lvb.on{background:linear-gradient(180deg,#f7e3a3,#d8b25a 55%,#a9822f);color:#2a1d08}\n.ct-cards .lvdesc{font-size:11.5px;color:var(--ivory2);opacity:.8;max-width:290px;text-align:center;line-height:1.5;min-height:34px}\n.ct-cards .rec{color:var(--ivory2)}\n.ct-cards .rec i{font-family:var(--serif)}\n.ct-cards .card{font-family:var(--serif);font-weight:700;color:var(--ink);background:linear-gradient(165deg,#fffaf0 0%,var(--ivory) 45%,var(--ivory2) 100%);border:none;border-top:3px solid var(--c);border-radius:7px;\n  box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),inset 0 0 0 3px rgba(156,122,46,.35),0 2px 0 rgba(0,0,0,.25),0 6px 12px rgba(0,0,0,.3)}\n.ct-cards .card::before{content:attr(data-pos);position:absolute;top:3px;left:5px;font-family:\"Playfair Display\",serif;font-style:italic;font-weight:600;font-size:8.5px;color:var(--c);opacity:.95}\n.ct-cards .card.tsu::before,.ct-cards .card.mini::before{display:none}\n.ct-cards .card.n{--c:#2f5f9e}\n.ct-cards .card.v{--c:#a3283f}\n.ct-cards .card.m{--c:#2f7d5b}\n.ct-cards .card.p{--c:#a87a22}\n.ct-cards .card.a{--c:#b0592a}\n.ct-cards .card.c{--c:#6b4a9e}\n.ct-cards .card i{color:#9c7a2e;font-family:\"Playfair Display\",serif;font-style:normal;font-weight:700}\n.ct-cards .card.big{border-top-width:4px;font-size:18px}\n.ct-cards .card.tsu{background:linear-gradient(180deg,#2a3b35,#1b2a25);color:var(--ivory);border-top:2px solid var(--c);box-shadow:inset 0 0 0 1px rgba(243,220,149,.35),0 3px 6px rgba(0,0,0,.35);font-family:var(--serif);font-weight:600}\n.ct-cards .card.rare{background:linear-gradient(165deg,#fffaf0 0%,#f7ecd0 55%,#ead6a0 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),inset 0 0 0 3px rgba(216,178,90,.75),0 2px 0 rgba(0,0,0,.25),0 6px 12px rgba(0,0,0,.3)}\n.ct-cards .card.guest{background:linear-gradient(135deg,#fff3c4,#f3dc95 35%,#e3bf63 60%,#fff0b8 80%,#d8b25a);background-size:200% 200%;animation:foil 3s ease-in-out infinite;box-shadow:inset 0 0 0 1px #fff7d6,inset 0 0 0 3px #b8903a,0 0 14px rgba(243,220,149,.55),0 6px 12px rgba(0,0,0,.3)}\n.ct-cards .card.wild{background:linear-gradient(135deg,#f2ebff,#d9c8ff 40%,#b9a0f0 70%,#efe6ff);background-size:200% 200%;animation:foil 3.5s ease-in-out infinite;box-shadow:inset 0 0 0 1px #fff,inset 0 0 0 3px #7b5cc4,0 0 12px rgba(185,160,240,.5),0 6px 12px rgba(0,0,0,.3)}\n@keyframes foil{50%{background-position:100% 100%}}\n.ct-cards .card em{background:rgba(10,25,20,.85);border:1px solid rgba(243,220,149,.4);color:var(--gold2);font-family:var(--sans);font-weight:700}\n.ct-cards .card .rm{background:#2a3b35;border:1px solid rgba(243,220,149,.5);color:var(--gold2)}\n.ct-cards .card.ins{box-shadow:-4px 0 0 var(--gold),0 6px 12px rgba(0,0,0,.3)}\n.ct-cards .card.errc{box-shadow:0 0 0 2px #e0475f,0 0 14px rgba(224,71,95,.6),0 6px 12px rgba(0,0,0,.3);animation:shake .35s}\n@keyframes shake{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}\n.ct-cards .card.nx{box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),inset 0 0 0 3px rgba(156,122,46,.35),0 0 0 2px rgba(243,220,149,.85),0 0 12px rgba(243,220,149,.45)}\n.ct-cards .card.nx::after{content:'';position:absolute;top:-6px;left:50%;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:radial-gradient(circle,#fff6d0,#d8b25a);box-shadow:0 0 8px #f3dc95;z-index:2}\n.ct-cards .card.hintc{outline:2px solid var(--gold2);outline-offset:2px;animation:hglow 1.1s ease-in-out infinite alternate}\n@keyframes hglow{to{outline-color:rgba(243,220,149,.25)}}\n.ct-cards .hand{gap:7px;margin-top:14px}\n.ct-cards .hand .card{width:56px;height:80px;font-size:14.5px}\n.ct-cards .hand .card{animation:deal .32s cubic-bezier(.2,.9,.3,1.2) both}\n.ct-cards .hand .card:nth-child(2){animation-delay:.03s}\n.ct-cards .hand .card:nth-child(3){animation-delay:.06s}\n.ct-cards .hand .card:nth-child(4){animation-delay:.09s}\n.ct-cards .hand .card:nth-child(5){animation-delay:.12s}\n.ct-cards .hand .card:nth-child(6){animation-delay:.15s}\n.ct-cards .hand .card:nth-child(7){animation-delay:.18s}\n.ct-cards .hand .card:nth-child(8){animation-delay:.21s}\n@keyframes deal{from{opacity:0;transform:translateY(16px) rotate(-3deg)}}\n.ct-cards .board,.ct-cards .field,.ct-cards .tw,.ct-cards .item,.ct-cards .pay,.ct-cards .bestS,.ct-cards .opp,.ct-cards .sd .side,.ct-cards .oppc{background:linear-gradient(180deg,rgba(4,16,13,.55),rgba(4,16,13,.35));border:1px solid rgba(216,178,90,.28);box-shadow:inset 0 1px 0 rgba(243,220,149,.08)}\n.ct-cards .board{position:relative;border-radius:14px}\n.ct-cards .row .ph,.ct-cards .frow .ph{color:var(--ivory2);font-family:var(--mincho)}\n.ct-cards .sent{font-family:var(--serif);font-weight:700;font-size:17px;letter-spacing:.01em;color:var(--ivory)}\n.ct-cards .jt{font-family:var(--mincho);font-size:11.5px;color:var(--ivory2);opacity:.8;min-height:15px;margin-bottom:2px}\n.ct-cards .yk{color:var(--gold2);font-family:var(--mincho)}\n.ct-cards .chips,.ct-cards .mult{font-family:\"Playfair Display\",serif;font-weight:800;border:1px solid rgba(243,220,149,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),inset 0 -3px 8px rgba(0,0,0,.3),0 3px 8px rgba(0,0,0,.35)}\n.ct-cards .chips{background:linear-gradient(180deg,#3c6fc4,var(--sapph) 60%,#14376e)}\n.ct-cards .mult{background:linear-gradient(180deg,#d24a63,var(--ruby) 60%,#7a1528)}\n.ct-cards .x{color:var(--gold2);font-family:\"Playfair Display\",serif}\n.ct-cards .msg{color:#f2b6c0}\n.ct-cards .msg .gd{color:#9fe3c2}\n.ct-cards .hintb{position:static;align-self:flex-end;margin-top:6px;border:1px solid rgba(243,220,149,.5);background:rgba(4,16,13,.6);color:var(--gold2);font-family:var(--mincho);font-weight:800;font-size:11.5px;border-radius:999px;padding:3px 10px}\n.ct-cards .hp{font-size:12px;color:var(--ivory2);text-align:left;margin-top:4px}\n.ct-cards .hp:empty{display:none}\n.ct-cards .hrow{padding:3px 0;border-top:1px dashed rgba(243,220,149,.2)}\n.ct-cards .hrow.ans{font-family:var(--serif);font-size:14px;color:var(--gold2);display:flex;align-items:center;gap:8px;flex-wrap:wrap}\n.ct-cards .hpen{font-size:10.5px;opacity:.7}\n.ct-cards .hrow.guide{font-size:11.5px}\n.ct-cards .sd1{color:#9fe3c2}\n.ct-cards .sd2{color:var(--gold2);font-size:13px}\n.ct-cards .sd0{opacity:.45}\n.ct-cards .tabs .tab{font-family:var(--mincho);background:rgba(4,16,13,.35);color:var(--ivory2);border:1px solid rgba(216,178,90,.18);border-bottom:none}\n.ct-cards .tabs .tab.on{background:linear-gradient(180deg,rgba(216,178,90,.35),rgba(216,178,90,.12));color:#fff8e0}\n.ct-cards .tw{border-radius:0 0 12px 12px}\n.ct-cards .stg,.ct-cards .vh{background:linear-gradient(180deg,#22352f,#16241f);border:1px solid rgba(243,220,149,.5);font-family:var(--mincho);color:var(--gold2)}\n.ct-cards .stg.boss{background:linear-gradient(180deg,#7a1528,#4d0d1a)}\n.ct-cards .goal{color:var(--ivory2)}\n.ct-cards .goal b{font-family:\"Playfair Display\",serif;color:var(--gold2)}\n.ct-cards .bar{background:rgba(0,0,0,.35);border:1px solid rgba(216,178,90,.3)}\n.ct-cards .bar i{background:linear-gradient(90deg,#a9822f,#f3dc95,#d8b25a)}\n.ct-cards .res span,.ct-cards .vmed span{background:rgba(4,16,13,.5);border:1px solid rgba(216,178,90,.28)}\n.ct-cards .res b,.ct-cards .vmed b{font-family:\"Playfair Display\",serif}\n.ct-cards .joker{background:linear-gradient(170deg,#1c2b4a,#121c33);color:var(--ivory2);border:1px solid var(--gold);box-shadow:inset 0 0 0 2px #121c33,inset 0 0 0 3px rgba(216,178,90,.5),0 4px 10px rgba(0,0,0,.35)}\n.ct-cards .joker b{color:var(--gold2);font-family:var(--mincho)}\n.ct-cards .joker.empty{background:rgba(0,0,0,.15);border:1px dashed rgba(216,178,90,.25);box-shadow:none;color:rgba(243,220,149,.35)}\n.ct-cards .bossbar,.ct-cards .rule{background:rgba(122,21,40,.35);border:1px solid rgba(224,71,95,.5);color:#f8d9de}\n.ct-cards .rule{background:rgba(216,178,90,.1);border-color:rgba(216,178,90,.45);color:var(--ivory2)}\n.ct-cards .mc,.ct-cards .qc{background:rgba(4,16,13,.5)}\n.ct-cards .mc b{color:var(--gold2)}\n.ct-cards .mc.hit,.ct-cards .qc.hit{background:rgba(31,122,85,.55)}\n.ct-cards .qrev{font-family:var(--serif);color:var(--gold2);background:rgba(4,16,13,.5);border:1px solid rgba(216,178,90,.4)}\n.ct-cards .float{font-family:\"Playfair Display\",serif;font-weight:800}\n.ct-cards .float.c{color:#a9c9ff}\n.ct-cards .float.m{color:#ffb0bd}\n.ct-cards .float.x{color:var(--gold2)}\n.ct-cards .bigscore{font-family:\"Playfair Display\",serif;font-weight:900;font-size:58px;background:linear-gradient(180deg,#fff4cf,#f3dc95 40%,#c99a3c 70%,#f3dc95);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 4px 0 rgba(0,0,0,.5)) drop-shadow(0 0 18px rgba(243,220,149,.45))}\n.ct-cards .toast{background:rgba(6,20,16,.92);border:1px solid rgba(216,178,90,.55);color:var(--ivory);font-family:var(--sans);box-shadow:0 8px 24px rgba(0,0,0,.45)}\n.ct-cards .modal{background:rgba(2,10,8,.72);backdrop-filter:blur(3px)}\n.ct-cards .box{background:linear-gradient(180deg,#183f35,#0d2620);border:1px solid rgba(216,178,90,.55);box-shadow:inset 0 0 0 3px rgba(13,38,32,1),inset 0 0 0 4px rgba(216,178,90,.25),0 20px 50px rgba(0,0,0,.6);border-radius:16px}\n.ct-cards .box h2{font-family:var(--mincho);color:var(--gold2);letter-spacing:.06em}\n.ct-cards .clear h1,.ct-cards .end h1{font-family:var(--mincho);color:var(--gold2);letter-spacing:.08em}\n.ct-cards .pay b,.ct-cards .money.big,.ct-cards .shead .money,.ct-cards .pot{color:var(--gold2);font-family:\"Playfair Display\",serif}\n.ct-cards .shead h1{font-family:var(--mincho);color:var(--gold2)}\n.ct-cards .price{background:linear-gradient(180deg,#f7e3a3,#d8b25a 55%,#a9822f);color:#2a1d08;font-family:\"Playfair Display\",serif}\n.ct-cards .pack{background:linear-gradient(170deg,#2a2148,#17122c);border:1px solid var(--gold);color:var(--gold2);font-family:var(--mincho)}\n.ct-cards .pack.book{background:linear-gradient(170deg,#4d1a2a,#2c0e18)}\n.ct-cards .pack.boost{background:linear-gradient(170deg,#173f30,#0c2419)}\n.ct-cards .pack.itp{background:linear-gradient(170deg,#3a2a66,#21173d)}\n.ct-cards .opp{border-color:rgba(224,71,95,.35)}\n.ct-cards .bubble{background:var(--ivory);color:var(--ink);border:1px solid var(--gold);font-family:var(--sans)}\n.ct-cards .bubble.hot{background:linear-gradient(180deg,#f7e3a3,#d8b25a)}\n.ct-cards .cback{background:repeating-linear-gradient(45deg,#14376e 0 3px,#1f4f9a 3px 6px);border:1px solid var(--gold)}\n.ct-cards .card.mini.bycpu{box-shadow:0 0 0 2px #c23a52,0 3px 6px rgba(0,0,0,.3)}\n.ct-cards .card.mini.byme{box-shadow:0 0 0 2px #3c6fc4,0 3px 6px rgba(0,0,0,.3)}\n.ct-cards .card.mini.byguest{box-shadow:0 0 0 2px var(--gold),0 0 10px rgba(243,220,149,.5)}\n.ct-cards .vq{background:rgba(4,16,13,.5);border:1px solid rgba(216,178,90,.35);color:var(--gold2)}\n.ct-cards .lvtag{background:var(--emer)}\n.ct-cards .lvtag.l1{background:var(--gold);color:#2a1d08}\n.ct-cards .lvtag.l2{background:var(--ruby)}\n.ct-cards .sd .tx{font-family:var(--serif)}\n.ct-cards .sd .cm2 .chips{background:var(--sapph)}\n.ct-cards .sd .cm2 .mult{background:var(--ruby)}\n.ct-cards .sd .cm2 .tot{font-family:\"Playfair Display\",serif;color:var(--gold2)}\n.ct-cards .sd .res.w,.ct-cards .box .res.w{color:#9fe3c2}\n.ct-cards .sd .res.l,.ct-cards .box .res.l{color:#f2a3b0}\n.ct-cards .combos span{background:rgba(4,16,13,.5);border:1px solid rgba(216,178,90,.3);font-family:var(--serif)}\n.ct-cards .vrules summary{color:var(--gold2)}\n.ct-cards{position:absolute;inset:0;background:#1e1633;color:#fff;font-family:\"Hiragino Maru Gothic ProN\",\"Hiragino Sans\",\"Noto Sans JP\",sans-serif;overflow:hidden}.ct-cards .cc-app{position:relative;max-width:480px;height:100%;margin:0 auto;background:radial-gradient(120% 80% at 50% 0%,#4b3a7a,#3d2f63 40%,#1e1633);overflow:hidden}";document.head.appendChild(s)})();
/* ===== チャンク・カード:英文で「役」を作るローグライク(Balatro 風) =====
   判定・辞書はぷにチャンクの部品(PuniChunk._internal)を使う。 */
(function () {
  'use strict';
  var PC = window.PuniChunk, G = PC._internal.G, DICT = PC.adapters.dict();
  var CFG = { auto: { art: false, prep: false, verb: false, ti: false, er: false } };
  // レベル:0 初級(冠詞・前置詞・時制はおまかせ)/1 中級/2 上級
  var LEVEL = 1, LV_JA = ['初級', '中級', '上級'], LV_MULT = [1, 1, 1.3];
  function setLevel(l) { LEVEL = l; var a = l === 0; CFG.auto = { art: a, prep: a, verb: a, ti: a, er: a }; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  var rnd = Math.random, pick = function (a) { return a[Math.floor(rnd() * a.length)]; };
  var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var storeKeyLevel = 'level';
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem('chunkcards:' + k)); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem('chunkcards:' + k, JSON.stringify(v)); } catch (e) { } } };

  // ---------------- 音 ----------------
  var AC = null;
  function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function beep(f, d, type, v, when) { var c = ac(); if (!c) return; var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain(); o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v || .12, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d + .02); }
  // 柔らかい音:鈴のような高音(sine)と、カード・チップの「カチッ」(短いノイズ)
  var NB = null;
  function noise(d, f, q, v, when) { var c = ac(); if (!c) return; if (!NB) { NB = c.createBuffer(1, c.sampleRate * .3, c.sampleRate); var a = NB.getChannelData(0); for (var i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    var t = c.currentTime + (when || 0), sN = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); sN.buffer = NB; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); sN.connect(bp); bp.connect(g); g.connect(c.destination); sN.start(t); sN.stop(t + d + .02); }
  function bell(f, d, v, when) { beep(f, d, 'sine', v, when); beep(f * 2.01, d * .6, 'sine', v * .25, when); }
  var SFX = {
    tap: function () { noise(.04, 3200, 2, .12); },
    put: function () { noise(.06, 2200, 1.2, .18); noise(.05, 900, 1, .08, .01); },
    chip: function (i) { noise(.05, 2600 + i * 60, 6, .16); bell(880 + i * 30, .12, .03, .01); },
    mult: function () { bell(523, .35, .08); bell(784, .4, .06, .05); },
    joker: function () { bell(1175, .45, .07); bell(1568, .5, .05, .08); },
    bad: function () { beep(196, .25, 'triangle', .06); beep(185, .3, 'triangle', .05, .08); },
    win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { bell(f, .9, .07, i * .09); }); },
    coin: function () { noise(.05, 4200, 8, .14); bell(2093, .25, .04, .02); },
    lose: function () { [392, 330, 262].forEach(function (f, i) { bell(f, .8, .07, i * .2); }); }
  };

  var voice = null, warned = false;
  function pickVoice() { try { var vs = speechSynthesis.getVoices() || []; var en = vs.filter(function (v) { return /^en([-_]|$)/i.test(v.lang || '') || /english/i.test(v.name || ''); }); var us = en.filter(function (v) { return /US/i.test(v.lang) || /Samantha|Google US|Alex|Aaron|Ava|Allison/i.test(v.name); }); voice = us.filter(function (v) { return v.localService; })[0] || us[0] || en.filter(function (v) { return v.localService; })[0] || en[0] || null; } catch (e) { } return voice; }
  try { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); setTimeout(pickVoice, 300); setTimeout(pickVoice, 1500); } catch (e) { }
  var primed = false;
  function unlock() { ac(); if (!primed) { primed = true; try { pickVoice(); var u = new SpeechSynthesisUtterance(' '); u.lang = 'en-US'; if (voice) u.voice = voice; u.volume = 0; speechSynthesis.speak(u); } catch (e) { } } }
  function noVoiceMsg() { if (warned) return; warned = true; try { var d = document.createElement('div'); d.textContent = '英語の音声が見つかりません。端末の設定で英語(米国)の読み上げ音声を追加するか、SafariやChromeで直接開いてください。'; d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:16px;z-index:9999;background:#222c;color:#fff;font-size:13px;padding:10px 12px;border-radius:12px;text-align:center'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 5000); } catch (e) { } }
  function speak(t) { try { if (!voice) pickVoice(); if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t); if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; if ((speechSynthesis.getVoices() || []).length) noVoiceMsg(); } u.rate = .95; speechSynthesis.speak(u); } catch (e) { } }

  // ---------------- 単語・カード ----------------
  var E = {}; ['noun', 'verb', 'adj', 'adv'].forEach(function (p) { E[p] = {}; DICT.all(p).forEach(function (e) { E[p][e.w] = e; }); });
  var KIND_JA = { pron: '代名詞', n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', t: 'つなぎ' };
  var cid = 1;
  function card(kind, w, extra) { var c = { id: cid++, kind: kind, w: w, bonus: 0 }; for (var k in extra || {}) c[k] = extra[k]; c.chips = baseChips(c); return c; }
  function lvOf(c) { return (c.w.e && c.w.e.lv) || 1; }
  function baseChips(c) { if (c.tsu) return 3; if (c.w.k === 'pr' && c.w.v === 'it') return 10; var b = { pron: 5, n: 10, v: 15, adj: 10, adv: 10 }[c.kind] || 5; return b + (lvOf(c) - 1) * 6; }
  function mk(kind, word) {
    if (kind === 'pron') return card('pron', { k: 'pr', v: word });
    var pos = { n: 'noun', v: 'verb', adj: 'adj', adv: 'adv' }[kind], e = E[pos][word]; if (!e) return null;
    return card(kind, kind === 'n' ? { k: 'n', e: e, pl: false } : kind === 'v' ? { k: 'v', e: e, f: 'base' } : { k: kind, e: e });
  }
  function starterDeck() {
    var L = [['pron', ['i', 'you', 'he', 'she', 'we', 'they']],
      ['n', ['apple', 'book', 'dog', 'cat', 'pizza', 'guitar', 'friend', 'teacher', 'sister', 'park', 'library', 'station', 'morning', 'Monday']],
      ['v', ['eat', 'read', 'play', 'like', 'buy', 'watch', 'go', 'run', 'make', 'see', 'write', 'swim', 'drink', 'study']],
      ['adj', ['big', 'small', 'new', 'happy', 'red', 'old']],
      ['adv', ['quickly', 'well', 'yesterday', 'today', 'here', 'slowly', 'tomorrow']]];
    var d = []; L.forEach(function (g) { g[1].forEach(function (w) { var c = mk(g[0], w); if (c) d.push(c); }); }); return d;
  }
  // つなぎの棚(何度でも使える)
  var TSU = [
    ['冠詞', [['det', 'a'], ['det', 'the'], ['det', 'this'], ['det', 'that']]],
    ['所有', [['pos', 'i', 'my'], ['pos', 'you', 'your'], ['pos', 'he', 'his'], ['pos', 'she', 'her'], ['pos', 'we', 'our'], ['pos', 'they', 'their']]],
    ['前置詞', [['prep', 'in'], ['prep', 'at'], ['prep', 'on'], ['prep', 'to'], ['prep', 'with'], ['prep', 'for'], ['prep', 'from'], ['prep', 'by'], ['prep', 'up'], ['prep', 'down'], ['prep', 'out'], ['prep', 'off'], ['prep', 'away'], ['prep', 'back']]],
    ['助動詞', [['modal', 'can'], ['modal', 'will'], ['modal', 'must'], ['modal', 'should'], ['modal', 'may'], ['sm', 'want to'], ['sm', 'have to'], ['sm', 'need to'], ['sm', 'be going to']]],
    ['be/have/do', [['be', 'pres'], ['hv', 'pres'], ['do', 'pres'], ['not', ''], ['deg', 'very']]],
    ['つなぐ', [['conj', 'and'], ['conj', 'but'], ['conj', 'so'], ['conj', 'when'], ['conj', 'if'], ['conj', 'because'], ['rel', 'who', 'who'], ['rel', 'which', 'which'], ['rel', 'that', 'that']]]
  ];
  var TSU_EASY = [
    ['前置詞', [['prep', 'to'], ['prep', 'with'], ['prep', 'for'], ['prep', 'from'], ['prep', 'up'], ['prep', 'out'], ['prep', 'off'], ['prep', 'back']]],
    TSU[1], TSU[3], TSU[4], TSU[5]
  ];
  function curTSU() { return TSU; }
  function tsuCard(spec) {
    var k = spec[0], w;
    if (k === 'pos') w = { k: 'pr', v: spec[1] }; else if (k === 'sm') w = { k: 'sm', v: spec[1], t: 'pres' }; else if (k === 'not') w = { k: 'not' }; else if (k === 'do') w = { k: 'do', v: 'pres', neg: false }; else w = { k: k, v: spec[1] };
    return card('t', w, { tsu: true, label: spec[2] || null });
  }
  function cardText(c) {
    if (c.label) return c.label;
    if (c.w.k === 'do') return c.w.neg ? (c.w.v === 'past' ? "didn't" : "don't") : c.w.v === 'past' ? 'did' : 'do';
    var t = G.wordText(c.w, CFG); if (c.w.k === 'be') t = c.w.v === 'past' ? (c.w.neg ? 'be(過去・否定)' : 'be(過去)') : (c.w.neg ? 'be(否定)' : 'be'); if (c.w.k === 'hv') t = (c.w.v === 'past' ? 'had' : 'have') + (c.w.neg ? "n't" : ''); if (c.w.k === 'modal') t = c.w.neg ? ({ can: "can't", could: "couldn't", will: "won't", would: "wouldn't", must: "mustn't", should: "shouldn't", may: 'may not', might: 'might not' }[c.w.v] || c.w.v + ' not') : c.w.v;
    return t === 'i' ? 'I' : t;
  }
  function colorOf(c) { var k = c.w.k; return k === 'n' || k === 'pr' || k === 'det' ? 'n' : k === 'v' ? 'v' : k === 'adj' || k === 'adv' || k === 'deg' ? 'm' : k === 'prep' ? 'p' : k === 'conj' || k === 'rel' ? 'c' : 'a'; }
  function cyclable(c) { return !c.tsu && (c.kind === 'v' || (c.kind === 'n' && G.isCount(c.w.e) && !c.w.e.ind)) || (c.tsu && /^(be|hv|det|do|modal|sm)$/.test(c.w.k)); }
  function cycle(c) {
    var w = c.w;
    if (w.k === 'v') { var F = ['base', 'past', 'pp', 'ing'], i = F.indexOf(w.f || 'base'); w.f = F[(i + 1) % 4]; }
    else if (w.k === 'n') w.pl = !w.pl;
    else if (w.k === 'be' || w.k === 'hv') { var st = (w.v === 'past' ? 1 : 0) + (w.neg ? 2 : 0); st = (st + 1) % 4; w.v = st & 1 ? 'past' : 'pres'; w.neg = !!(st & 2); } // 今 → 過去 → 否定 → 過去の否定
    else if (w.k === 'do') { var sd = (w.v === 'past' ? 1 : 0) + (w.neg ? 2 : 0); sd = (sd + 1) % 4; w.v = sd & 1 ? 'past' : 'pres'; w.neg = !!(sd & 2); } // do → did → don't → didn't
    else if (w.k === 'modal') { var FAM = { can: ['can', 'could'], could: ['can', 'could'], will: ['will', 'would'], would: ['will', 'would'], may: ['may', 'might'], might: ['may', 'might'], must: ['must'], should: ['should'] }[w.v] || [w.v], L = FAM.length * 2, si = FAM.indexOf(w.v) + (w.neg ? FAM.length : 0); si = (si + 1) % L; w.v = FAM[si % FAM.length]; w.neg = si >= FAM.length; } // can → could → can't → couldn't
    else if (w.k === 'sm') w.t = w.t === 'past' ? 'pres' : 'past'; // want to → wanted to
    else if (w.k === 'det') w.v = { a: 'the', the: 'a', 'this': 'that', that: 'this' }[w.v];
  }
  var FORM_JA = { base: '原形・現在', past: '過去形', pp: '過去分詞', ing: '-ing形' };

  // ---------------- 判定:並びから文と「役」を出す ----------------
  function isPlace(t) { return (t.t === 'PP' && (t.cat === 'place' || (t.np && t.np.noun && t.np.noun.cat === 'place'))) || (t.t === 'ADV' && t.ak === 'place') || (t.t === 'ID' && t.ik === 'place'); }
  function isTime(t) { return (t.t === 'PP' && t.cat === 'time') || (t.t === 'ADV' && t.ak === 'time') || (t.t === 'ID' && t.ik === 'time'); }
  // ---- 後置修飾:名詞のうしろに -ing形/過去分詞/前置詞の句/関係代名詞の節 をつけて、ひとつの名詞のかたまりにする ----
  function dummy(pr) { return G.chainState([{ k: 'pr', v: pr }], CFG).chunk; }
  function chunkTx(t) { return t.t === 'NP' && t.pron ? G.PRON[t.pron].obj : G.chunkText(t, CFG); }
  function isPerson(np) { return np.noun && /^(person|animal)$/.test(np.noun.cat); }
  function mergeNP(np, extra, text, kind) { var m = {}; for (var k in np) m[k] = np[k]; m.words = np.words.concat([].concat.apply([], extra.map(function (t) { return t.words || []; }))); m.postText = (np.postText ? np.postText + ' ' : '') + text; m.postKind = kind; return m; }
  function relClause(head, rel, R) { // 関係代名詞の節の文字列(だめなら null)
    if (rel === 'who' && !isPerson(head)) return null; if (rel === 'which' && head.noun && head.noun.cat === 'person') return null;
    if (R[0] && R[0].t === 'VP') { // 主語が抜けた形:who plays tennis
      var r = G.parse([dummy(head.num === 'pl' ? 'they' : 'he')].concat(R), CFG); if (r.ok && r.kind === 'S') return rel + ' ' + r.text.replace(/^\S+\s/, '').replace(/\.$/, '');
    }
    if (rel !== 'who' && R.length === 2 && R[0].t === 'NP' && R[1].t === 'VP' && R[1].verb && R[1].verb.fr !== 'intr') { // 目的語が抜けた形:that I bought
      var r2 = G.parse(R.concat([dummy('it')]), CFG); if (r2.ok && r2.kind === 'S') return rel + ' ' + r2.text.replace(/\s+it\.$/, '').replace(/^(\w)(\w*)/, function (m, a, b) { return m === 'I' ? m : a.toLowerCase() + b; });
    }
    return null;
  }
  function postVariants(T) {
    var out = [];
    function gen(i, acc) {
      if (out.length > 40) return;
      if (i >= T.length) { out.push(acc); return; }
      var t = T[i]; gen(i + 1, acc.concat([t]));
      if (t.t !== 'NP' || t.pron || !t.noun) return;
      var nx = T[i + 1]; if (!nx) return;
      if (nx.t === 'PP') gen(i + 2, acc.concat([mergeNP(t, [nx], G.chunkText(nx, CFG), 'pp')]));
      var vp = nx;
      if (vp.t === 'PART') {
        for (var k = 1; k <= 2 && i + 2 + k <= T.length; k++) { // 分詞だけ(the cat watched)では名詞を説明できない。うしろに1つ以上必要
          var ab = T.slice(i + 2, i + 2 + k);
          if (ab.some(function (x) { return !/^(NP|PP|ADV)$/.test(x.t); })) break;
          if (ab.length && ab[0].t === 'NP' && (vp.vf === 'pp' || vp.verb.fr === 'intr')) break;
          gen(i + 2 + k, acc.concat([mergeNP(t, [vp].concat(ab), [G.wordText(vp.words[0], CFG)].concat(ab.map(chunkTx)).join(' '), vp.vf)]));
        }
      }
      if (nx.t === 'REL') for (var j = i + 3; j <= T.length; j++) { var tx = relClause(t, nx.v, T.slice(i + 2, j)); if (tx) gen(j, acc.concat([mergeNP(t, [nx].concat(T.slice(i + 2, j)), tx, 'rel')])); }
    }
    gen(0, []); return out;
  }
  // 並びをチャンクに区切る(長いチャンクから試す)→ 文として読めるかを調べる
  // ---- 並びの読みかえ:句動詞(end + up)、be/have のうしろの規則動詞は過去分詞、名詞の前の分詞=形容詞、-ing=動名詞 ----
  var PARTICLE = ['up', 'down', 'out', 'off', 'away', 'back', 'on', 'in', 'over'];
  function vtext(e, f) { return G.wordText({ k: 'v', e: e, f: f }, CFG); }
  function regular(e) { return vtext(e, 'past') === vtext(e, 'pp'); }
  function prevCore(ws, i) { for (var j = i - 1; j >= 0; j--) if (ws[j].k !== 'not' && ws[j].k !== 'deg' && ws[j].k !== 'adv') return ws[j]; return null; }
  var MOTION_V = ['go', 'come', 'run', 'walk', 'move', 'fly', 'drive', 'travel', 'return', 'swim', 'jump', 'hurry', 'ride', 'climb', 'get', 'send', 'bring', 'take'];
  function autoWord(k, v) { return { id: -1, kind: 't', tsu: true, auto: true, chips: 0, bonus: 0, w: { k: k, v: v } }; }
  function autoInsert(ws, crow, skipAfterVerb) {
    var hasVerb = ws.some(function (w) { return /^(v|be|modal|sm|hv)$/.test(w.k); }), out = [], oc = [], changed = false, seenV = false, motion = false, past = ws.some(function (w) { return w.k === 'adv' && /yesterday|ago|last/.test(w.e.w); });
    for (var i = 0; i < ws.length; i++) {
      var w = ws[i];
      if (!hasVerb && w.k === 'adj' && i > 0 && (ws[i - 1].k === 'n' || ws[i - 1].k === 'pr')) { var bw = autoWord('be', past ? 'past' : 'pres'); out.push(bw.w); oc.push(bw); changed = true; hasVerb = true; seenV = true; }
      if (w.k === 'n' && w.e && (w.e.cat === 'place' || w.e.cat === 'time') && seenV) {
        var j = i; while (j > 0 && (/^(det|adj)$/.test(ws[j - 1].k) || (ws[j - 1].k === 'pr' && crow[j - 1].tsu))) j--;
        var pw = ws[j - 1];
        if (pw && pw.k !== 'prep' && !(skipAfterVerb && pw.k === 'v')) {
          var pv = w.e.cat === 'time' ? (w.e.prep || 'on') : motion ? 'to' : (w.e.prep || 'in'), aw = autoWord('prep', pv), at = out.length - (i - j);
          out.splice(at, 0, aw.w); oc.splice(at, 0, aw); changed = true;
        }
      }
      if (w.k === 'v' || w.k === 'be') { seenV = true; if (w.k === 'v' && MOTION_V.indexOf(w.e.w.split(' ')[0]) >= 0) motion = true; }
      out.push(w); oc.push(crow[i]);
    }
    return changed ? { ws: out, crow: oc } : null;
  }
  function fixEmph(r, emph) { if (!emph || r.state !== 'ok') return r; r.text = r.text.replace(/\b(do|does|did)(n't| not)\b/i, '$1'); r.f.neg = false; r.f.emph = true; if (r.ja) r.ja = r.ja.replace('(〜ない)', '(本当に)'); return r; }
  function evaluate(row, quick) { try { return evaluateRaw(row, quick); } catch (e) { if (window.console) console.warn('evaluate', e); return { state: 'bad', msg: 'この並びは読めない。並べ直そう' }; } }
  function evaluateRaw(row, quick) {
    if (!row.length) return { state: 'empty' };
    // 1) 句動詞をまとめる/be・have のうしろの規則動詞を過去分詞に(カード自体も切りかえる)
    var ws = [], crow = [], phr = false, doPast = false, emph = false;
    for (var i = 0; i < row.length; i++) {
      var w = row[i].w, nx = row[i + 1] && row[i + 1].w;
      if (w.k === 'do') { ws.push({ k: 'not' }); crow.push(row[i]); if (w.v === 'past') doPast = true; if (!w.neg) emph = true; continue; } // don't / didn't = 否定。do / did(強調)は not を付けて読んであとで外す
      if (w.neg && /^(be|hv|modal)$/.test(w.k)) { ws.push(w); crow.push(row[i]); ws.push({ k: 'not' }); crow.push(row[i]); continue; }
      if (LEVEL === 0 && w.k === 'v' && (w.f === 'base' || w.f === 'past') && w.e.fr !== 'intr') { // 初級:物が主語で be のあと・目的語なし → 受け身(The cake was eaten)
        var pvb = prevCore(row.map(function (c) { return c.w; }), i), sN = null; for (var si = i - 1; si >= 0; si--) { if (row[si].w.k === 'n') { sN = row[si].w; break; } if (row[si].w.k === 'pr' && !row[si].tsu) break; }
        var nxi = i + 1; while (row[nxi] && /^(det|adj)$/.test(row[nxi].w.k)) nxi++; var nxw = row[nxi] && row[nxi].w, objLike = nxw && (nxw.k === 'pr' && !row[nxi].tsu || (nxw.k === 'n' && !/^(place|time)$/.test(nxw.e.cat)));
        if (pvb && pvb.k === 'be' && sN && !/^(person|animal)$/.test(sN.e.cat) && !objLike) { var wp = {}; for (var kp in w) wp[kp] = w[kp]; wp.f = 'pp'; w = wp; }
      }
      if (doPast && w.k === 'v') { var wc = {}; for (var kk in w) wc[kk] = w[kk]; wc.f = 'past'; w = wc; doPast = false; }
      if (w.k === 'v' && w.f === 'past' && regular(w.e)) { var pv = prevCore(row.map(function (c) { return c.w; }), i); if (pv && (pv.k === 'be' || pv.k === 'hv')) { var wq = {}; for (var kq in w) wq[kq] = w[kq]; wq.f = 'pp'; w = wq; } } // カードは書きかえず、読むときだけ過去分詞に
      if (w.k === 'v' && nx && nx.k === 'prep' && PARTICLE.indexOf(nx.v) >= 0 && E.verb[w.e.w + ' ' + nx.v]) { ws.push({ k: 'v', e: E.verb[w.e.w + ' ' + nx.v], f: w.f }); crow.push(row[i]); i++; phr = true; continue; }
      ws.push(w); crow.push(row[i]);
    }
    var r = fixEmph(evalWords(crow, ws, row), emph);
    if (r.state === 'ok') { r.f.phrasal = phr; return r; }
    if (LEVEL === 0) { // 初級:場所・時の前置詞や be は、語順さえ合っていれば補う
      for (var vi = 0; vi < 2; vi++) { var ins = autoInsert(ws, crow, vi === 1); if (!ins) continue; var r3 = evalWords(ins.crow, ins.ws, row); if (r3.state === 'ok') { r3.f.phrasal = phr; return r3; } }
    }
    if (quick) return r;
    // 2) 読みかえを試す(分詞の形容詞・動名詞・規則動詞の過去⇄過去分詞)
    var opts = [];
    ws.forEach(function (w, k) {
      if (w.k !== 'v' || !(w.f === 'ing' || w.f === 'pp' || w.f === 'past')) return;
      var pv = prevCore(ws, k), nx = ws[k + 1], nx2 = ws[k + 2], alt = [];
      var nounNext = nx && (nx.k === 'n' || (nx.k === 'adj' && nx2 && nx2.k === 'n'));
      var txt = vtext(w.e, w.f === 'past' ? 'pp' : w.f);
      if ((w.f === 'ing' || w.f === 'pp' || (w.f === 'past' && regular(w.e))) && nounNext && w.e.w.indexOf(' ') < 0 && (!pv || /^(det|pr|adj|prep|v|conj)$/.test(pv.k)))
        alt.push({ w: { k: 'adj', e: { w: txt, lv: w.e.lv || 1, ja: w.e.ja, jt: 'i' } }, flag: 'padj' });
      if (w.f === 'ing' && w.e.w.indexOf(' ') < 0 && (!pv || /^(v|prep|conj)$/.test(pv.k)) && !(nx && /^(det|n|pr)$/.test(nx.k) && !pv)) {
        var ne = E.noun[txt] || { w: txt, c: 'u', ad: '', cat: 'act', tg: ['act'], lv: w.e.lv || 1, ja: (w.e.ja || '') + 'こと' };
        alt.push({ w: { k: 'n', e: ne, pl: false }, flag: 'gerund' });
      }
      if ((w.f === 'past' || w.f === 'pp') && regular(w.e)) alt.push({ w: { k: 'v', e: w.e, f: w.f === 'past' ? 'pp' : 'past' }, flag: null });
      if (alt.length) opts.push({ k: k, alt: alt });
    });
    var tries = 0, best = r;
    (function go(j, cur, flags) {
      if (best.state === 'ok' || tries > 12) return;
      if (j === opts.length) { if (!Object.keys(flags).length && cur === ws) return; tries++; var r2 = evalWords(crow, cur, row); if (r2.state === 'ok') { r2.f.phrasal = phr; for (var f in flags) r2.f[f] = true; best = r2; } return; }
      go(j + 1, cur, flags);
      opts[j].alt.forEach(function (a) { var c2 = cur.slice(); c2[opts[j].k] = a.w; var f2 = {}; for (var x in flags) f2[x] = 1; if (a.flag) f2[a.flag] = 1; go(j + 1, c2, f2); });
    })(0, ws, {});
    return best;
  }
  function evalWords(row, words, fullRow) {
    var n = words.length;
    var memo = {}, segErr = null, far = 0, found = null, bestBad = null, tried = 0;
    function cs(i, j) { var k = i + ':' + j; if (!(k in memo)) memo[k] = words.slice(i, j).some(function (w) { return w.k === 'rel'; }) ? {} : G.chainState(words.slice(i, j), CFG); return memo[k]; }
    function dfs(i, T) {
      if (found || tried > 400) return;
      if (i === n) {
        tried++; var vars = postVariants(T), r = null;
        for (var vi = 0; vi < vars.length; vi++) { var r1 = G.parse(vars[vi], CFG); if (r1.ok && r1.kind === 'S') { found = { r: r1, T: vars[vi] }; return; } if (!r) r = r1; }
        var v = G.viable(T, true), cand = { r: r, wait: v && r.sev === 1 };
        if (!bestBad || (cand.wait && !bestBad.wait) || (cand.r.sev < bestBad.r.sev)) bestBad = cand;
        return;
      }
      if (i > far) far = i;
      if (words[i].k === 'rel') { T.push({ t: 'REL', v: words[i].v, words: [words[i]] }); dfs(i + 1, T); T.pop(); return; }
      var pw = words[i]; if (pw.k === 'v' && (pw.f === 'ing' || pw.f === 'pp') && i > 0) { T.push({ t: 'PART', verb: pw.e, vf: pw.f, words: [pw] }); dfs(i + 1, T); T.pop(); if (found) return; } // 分詞(後置修飾の材料)
      for (var j = n; j > i; j--) {
        var st = cs(i, j);
        if (st.complete && !st.err) { T.push(st.chunk); dfs(j, T); T.pop(); if (found) return; }
        else if (st.complete && st.err && !segErr) segErr = st.err;
      }
    }
    dfs(0, []);
    if (found) { var sm = semantic(found.r); if (sm) return { state: 'bad', msg: sm }; return { state: 'ok', text: found.r.text, f: features(found.r, fullRow), nps: nounPhrases(found.r), ja: jaOf(found.r), r: found.r }; }
    if (bestBad) return { state: bestBad.wait ? 'wait' : 'bad', msg: bestBad.r.err ? bestBad.r.err.msg : 'まだ文になっていない' };
    // 区切れない:どこで止まったか
    var tail = cs(far, n);
    if (segErr) return { state: 'bad', msg: segErr.msg };
    if (tail.prefix) return { state: 'wait', msg: '「' + cardText(row[n - 1]) + '」の後ろに続きが必要' };
    return { state: 'bad', at: far, atCard: row[far], msg: '「' + cardText(row[far]) + '」のところで つながらない' };
  }
  // 意味のチェック(英語脳の辞書の情報):動詞の目的語に合う名詞か/場所・時・食べ物が主語になっていないか
  var THING_OK = ['go', 'come', 'run', 'move', 'stop', 'start', 'begin', 'change', 'open', 'close', 'break', 'fall', 'work', 'arrive', 'leave', 'turn', 'fly', 'grow', 'shine', 'happen', 'end', 'ring', 'burn', 'melt', 'float', 'sink', 'roll', 'shake', 'hurt', 'cost', 'smell', 'taste', 'sound', 'look'];
  function headNoun(np) { if (!np || np.t !== 'NP' || np.pron) return null; if (np.noun) return np.noun; var w = (np.words || []).filter(function (x) { return x.k === 'n'; }).pop(); return w ? w.e : null; }
  function semantic(r) {
    var bad = null;
    r.alt.cls.forEach(function (cl) {
      if (bad) return; var vp = cl.vp, v = vp.verb, sn = headNoun(cl.subj);
      if (sn && v && !vp.be && !/^(person|animal)$/.test(sn.cat) && THING_OK.indexOf(v.w) < 0) bad = '「' + sn.w + '」が ' + v.w + ' するのは意味が変(主語は人か動物に)';
      if (bad || !v || vp.be) return; var ot = (v.ot || []).filter(function (t) { return t !== 'any'; });
      if (!ot.length) return;
      cl.comps.forEach(function (t) { var e = headNoun(t); if (bad || !e) return; var tags = [e.cat].concat(e.tg || []); if (ot.some(function (x) { return tags.indexOf(x) >= 0; })) return; var foodOnly = ot.every(function (x) { return /^(food|drink)$/.test(x); }); if (foodOnly || /^(person|animal|place|time)$/.test(e.cat)) bad = '「' + v.w + '」の目的語に「' + e.w + '」は合わない'; }); // 物の名詞はゆるく通す
    });
    return bad;
  }
  // チャンクごとの日本語(直訳ふう)
  function jaOf(r) {
    try {
      var past = !!r.info.past;
      function clJa(cl) {
        var o = [], vp = cl.vp, mods = cl.pre.concat(cl.posts);
        if (cl.subj) o.push(G.gloss(cl.subj) + 'は');
        mods.filter(isTime).forEach(function (t) { o.push(G.gloss(t)); });
        mods.filter(function (t) { return !isTime(t); }).forEach(function (t) { o.push(G.gloss(t)); });
        cl.comps.forEach(function (t) { o.push(G.gloss(t) + (t.t === 'NP' && !(vp.be && !vp.verb) ? 'を' : '')); });
        var v = G.gloss(vp).replace(/\(〜ない\)/, '');
        if (vp.be && vp.verb && vp.vf === 'pp') v += '(〜される)'; else if (vp.be && vp.verb && vp.vf === 'ing') v += '(〜している)'; else if (vp.have) v += '(〜したところ・したことがある)';
        if (vp.neg) v += '(〜ない)';
        o.push(v); return o.filter(Boolean).join(' / ');
      }
      var parts = [], a = r.alt;
      if (a.front && a.front.cl) parts.push('〈' + a.front.conj.v + '〉' + clJa(a.front.cl));
      a.cls.forEach(function (cl, i) { parts.push((i && a.co ? '〈' + a.co.v + '〉' : '') + clJa(cl)); });
      return parts.join('、') + (past ? '(過去)' : '');
    } catch (e) { return ''; }
  }
  // ざっくりしたエラーを、何をすればいいかの言葉にする
  function advise(row) {
    var cs = row.filter(function (c) { return !c.tsu || /^(be|hv|modal|sm)$/.test(c.w.k); }), K = function (c) { return c.kind === 'pron' || c.kind === 'n' ? 'N' : c.kind === 'v' || /^(be|hv)$/.test(c.w.k) ? 'V' : c.kind === 'adj' ? 'A' : c.kind === 'adv' ? 'D' : /^(modal|sm)$/.test(c.w.k) ? 'M' : 'x'; };
    var seq = cs.map(K).join(''), hasConj = row.some(function (c) { return /^(conj|rel)$/.test(c.w.k); });
    if (seq.indexOf('V') < 0) return '動詞(v.)か be を置こう';
    if (seq.charAt(0) === 'V' && !hasConj) return '文の最初に主語(I / he / the dog など)を置こう';
    if (/V[^V]*V/.test(seq.replace(/MV/g, 'V')) && !hasConj && !row.some(function (c) { return c.w.k === 'v' && /ing|pp/.test(c.w.f); })) return '動詞が2つある。1つ外すか、and / when / because でつなごう';
    if (/^N+N/.test(seq) && seq.indexOf('NV') > 1) return '動詞の前に名詞が2つ。目的語は動詞のうしろへ';
    if (/VNN/.test(seq) && !row.some(function (c) { return c.w.k === 'prep'; })) return '名詞が2つ続いている。間に前置詞(in / with など)を入れよう';
    if (/NA/.test(seq) && !row.some(function (c) { return c.w.k === 'be'; })) return '形容詞は名詞の前か、be のうしろに置こう';
    if (/^AN|^DN/.test(seq)) return '主語の前に形容詞・副詞が来ている。順番を見直そう';
    return '';
  }
  function nounPhrases(r) {
    var out = [], add = function (t) { if (!t) return; if (t.t === 'NP') out.push(t); if (t.t === 'PP' && t.np) out.push(t.np); };
    var cl = function (c) { if (!c) return; add(c.subj); (c.comps || []).forEach(add); (c.posts || []).forEach(add); (c.pre || []).forEach(add); };
    r.alt.cls.forEach(cl); if (r.alt.front) { cl(r.alt.front.cl); add(r.alt.front.tok); }
    return out.map(function (np) { return { pron: np.pron || null, w: np.noun ? np.noun.w : null, det: np.det, poss: np.poss, num: np.num, person: !!(np.noun && /^(person|animal)$/.test(np.noun.cat)) }; });
  }
  function clWords(cl) { var w = []; if (!cl) return w; [cl.subj, cl.vp].concat(cl.comps || [], cl.posts || [], cl.pre || []).forEach(function (t) { if (t && t.words) w = w.concat(t.words); }); return w; }
  var COMPAT = { write: ['read'], cook: ['food'], make: ['food', 'drink'], drink: [], open: ['read'] }; // 辞書のタグで足りない自然な組み合わせ
  function features(r, row) {
    var a = r.alt, cls = a.cls, main = cls[0], vp = main.vp, f = { words: row.length, adj: 0, rare: 0 };
    row.forEach(function (c) { if (c.w.k === 'adj') f.adj++; if (!c.tsu && lvOf(c) >= 2) f.rare++; });
    f.cats = {}; row.forEach(function (c) { var k = c.w.k; if (k === 'n') { f.cats[c.w.e.cat] = 1; if (c.w.pl) f.plural = true; } if (k === 'det') f['det_' + c.w.v] = true; if (k === 'pr' && c.w.v === 'it' && !c.tsu) f.it = true; if (c.guest || c.by === 'guest') f.guest = true; });
    var nO = main.comps.filter(function (t) { return t.t === 'NP'; }).length;
    f.O = nO >= 1; f.O2 = nO >= 2; f.C = main.comps.some(function (t) { return t.t === 'AP'; }) || (!!vp.be && !vp.verb && nO >= 1);
    f.aux = !!(vp.modal || vp.semi); f.prog = !!(vp.be && vp.verb && vp.vf === 'ing'); f.passive = !!(vp.be && vp.verb && vp.vf === 'pp'); f.perfect = !!vp.have; f.neg = !!vp.neg;
    f.pronSubj = !!(main.subj && main.subj.pron);
    // 主節の飾り(場所・時・様子)は種類ごとに1つまで。2つ目からは点にしない
    var mods = main.pre.concat(main.comps, main.posts); if (a.front && a.front.tok) mods.push(a.front.tok);
    var seen = {}, dup = [];
    mods.forEach(function (t) { var k = isPlace(t) ? 'place' : isTime(t) ? 'time' : (t.t === 'ADV' && t.ak === 'manner') ? 'manner' : null; if (!k) return; if (seen[k]) dup = dup.concat(t.words || []); seen[k] = 1; });
    f.place = !!seen.place; f.time = !!seen.time; f.manner = seen.manner || (vp.advs || []).length ? 1 : 0;
    f.dupWords = dup;
    // 2つ目の文(and/but のうしろ、when/if の節)はカードの点が半分、要素も数えない
    var sub = []; cls.slice(1).forEach(function (c) { sub = sub.concat(clWords(c)); }); if (a.front && a.front.cl) sub = sub.concat(clWords(a.front.cl));
    f.halfWords = sub;
    f.post = cls.some(function (cl) { return [cl.subj].concat(cl.comps, cl.posts).some(function (t) { return t && t.postKind; }); });
    f.past = !!r.info.past; f.clause = !!r.info.clause; f.coord = !!r.info.coord;
    f.hasArt = row.some(function (c) { return c.w.k === 'det'; }); f.hasPP = mods.some(function (t) { return t.t === 'PP'; });
    // 動詞と目的語の相性
    var v = vp.verb; f.colloc = null; f.pair = null;
    if (v && !vp.be) {
      var ot = (v.ot || []).filter(function (x) { return x !== 'any'; }), on = main.comps.filter(function (t) { return t.t === 'NP' && !t.pron && t.noun; })[0];
      if (ot.length && on) { var e = on.noun, tags = [e.cat].concat(e.tg || [], COMPAT[v.w] && (e.tg || []).some(function (x) { return COMPAT[v.w].indexOf(x) >= 0; }) ? ot : []), m = ot.filter(function (x) { return tags.indexOf(x) >= 0; }); f.pair = v.w + ' + ' + e.w; f.colloc = m.some(function (x) { return x !== 'thing'; }) && ot.indexOf('thing') < 0 && ot.length <= 3 ? 'good' : m.length ? null : 'bad'; }
    }
    f.combo = f.colloc === 'good';
    // 進行形・受け身は、実際にできた文の形で決める(読みかえとずれないように)
    if (vp.verb && vp.be) {
      var txt = ' ' + r.text.toLowerCase().replace(/[.,!?]/g, '') + ' ', ing = first(vtext(vp.verb, 'ing')), pp = first(vtext(vp.verb, 'pp'));
      var beRe = '(am|is|are|was|were|be|been|isn\'t|aren\'t|wasn\'t|weren\'t)( not)?( \\w+ly)? ';
      var isIng = new RegExp(' ' + beRe + ing + ' ').test(txt), isPP = new RegExp(' ' + beRe + pp + ' ').test(txt);
      if (isIng || isPP) { f.prog = isIng; f.passive = !isIng && isPP; }
    }
    // 主節以外(when/if の節・and のうしろ)の文法も、お題の判定には数える
    var sub = {}; cls.slice(1).concat(a.front && a.front.cl ? [a.front.cl] : []).forEach(function (cl) {
      var v2 = cl.vp; if (!v2) return;
      if (v2.be && v2.verb) { var t2 = ' ' + r.text.toLowerCase().replace(/[.,!?]/g, '') + ' ', b2 = '(am|is|are|was|were|be|been|isn\'t|aren\'t|wasn\'t|weren\'t)( not)? '; if (new RegExp(' ' + b2 + first(vtext(v2.verb, 'ing')) + ' ').test(t2)) sub.prog = 1; else if (new RegExp(' ' + b2 + first(vtext(v2.verb, 'pp')) + ' ').test(t2)) sub.passive = 1; } if (v2.have) sub.perfect = 1; if (v2.modal || v2.semi) sub.aux = 1; if (v2.neg) sub.neg = 1;
      if (cl.comps.some(function (t) { return t.t === 'NP'; })) sub.O = 1; if (cl.comps.some(function (t) { return t.t === 'AP'; }) || (v2.be && !v2.verb)) sub.C = 1;
      var m2 = cl.pre.concat(cl.posts); if (m2.some(isPlace)) sub.place = 1; if (m2.some(isTime)) sub.time = 1;
    });
    f.sub = sub;
    return f;
  }
  // 話のつながり:前の文に出た名詞を the / this / that / 所有格 か代名詞で受ける
  function storyOf(nps, prev) {
    if (!prev || !prev.length || !nps) return null; var res = null;
    nps.forEach(function (np) {
      if (np.pron === 'it' && prev.some(function (p) { return p.w && !p.person && p.num !== 'pl'; })) res = 'pron';
      else if ((np.pron === 'he' || np.pron === 'she') && prev.some(function (p) { return p.w && p.person && p.num !== 'pl'; })) res = 'pron';
      else if (np.pron === 'they' && prev.some(function (p) { return p.num === 'pl' && (p.w || (p.pron && p.pron !== 'i' && p.pron !== 'you')); })) res = 'pron';
      else if (!res && np.w && (np.det === 'the' || np.det === 'this' || np.det === 'that' || np.poss) && prev.some(function (p) { return p.w === np.w; })) res = 'def';
    });
    return res;
  }
  // 役とカードの点(ジョーカー・ボス・くり返しの前)
  function baseScore(row, ev) {
    var f = ev.f, y = yaku(f), chips = y.chips, mult = y.mult, steps = [{ t: 'yaku', label: y.name, chips: chips, mult: mult }];
    var dup = f.dupWords || [], half = f.halfWords || [];
    row.forEach(function (c, i) {
      var v = c.chips + (c.bonus || 0), tag = '';
      if (dup.indexOf(c.w) >= 0) { v = 0; tag = '重複'; } else if (half.indexOf(c.w) >= 0) { v = Math.floor(v / 2); tag = '½'; }
      chips += v; steps.push({ t: 'card', i: i, add: v, tag: tag, chips: chips, mult: mult });
    });
    return { y: y, chips: chips, mult: mult, steps: steps };
  }
  // 役(文の型)の点。お店の「文型の本」でレベルが上がる
  var PARTS = [
    ['SV', 'S+V', 10, 1], ['O', '+O', 10, 1], ['O2', '+O2', 15, 1], ['C', '+C', 10, 1], ['place', '+場所', 10, 1], ['time', '+時', 10, 1], ['manner', '+様子', 5, 1],
    ['aux', '助動詞', 5, 1], ['prog', '進行形', 10, 1], ['perfect', '完了形', 20, 2], ['passive', '受け身', 20, 2], ['neg', '否定', 5, 1], ['past', '過去', 5, 1], ['clause', '節', 15, 1], ['post', '後置修飾', 25, 2],
    ['phrasal', '句動詞', 15, 1], ['gerund', '動名詞', 20, 2], ['padj', '分詞の形容詞', 15, 1], ['combo', '名コンビ', 0, 2], ['story', 'つながり', 0, 2], ['storyP', '代名詞で受ける', 0, 3]
  ];
  var PART_JA = {}; PARTS.forEach(function (p) { PART_JA[p[0]] = p[1]; });
  function yaku(f) {
    var on = PARTS.filter(function (p) { return p[0] === 'SV' || f[p[0]]; }), chips = 0, mult = 0;
    on.forEach(function (p) { var lv = (R && R.lv && R.lv[p[0]]) || 0; chips += p[2] + lv * 10; mult += p[3] + lv; });
    var main = on.filter(function (p) { return /^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; }).join('').replace(/^S\+V/, 'S+V');
    var extra = on.filter(function (p) { return !/^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).map(function (p) { return p[1]; });
    return { name: main + (extra.length ? '・' + extra.join('・') : ''), chips: chips, mult: mult, parts: on };
  }

  // ---------------- ジョーカー ----------------
  var JOKERS = [
    { id: 'past', name: '過去マニア', desc: '過去の文は 倍率×2', price: 6, fx: function (f) { return f.past ? [['x', 2]] : []; } },
    { id: 'adj', name: 'かざり職人', desc: '形容詞1つごとに チップ+20', price: 4, fx: function (f) { return f.adj ? [['c', 20 * f.adj]] : []; } },
    { id: 'place', name: '旅人', desc: '場所の句があれば 倍率+4', price: 5, fx: function (f) { return f.place ? [['m', 4]] : []; } },
    { id: 'time', name: '時の番人', desc: '時の句があれば 倍率+4', price: 5, fx: function (f) { return f.time ? [['m', 4]] : []; } },
    { id: 'perf', name: '完了の達人', desc: '完了形(have+過去分詞)は 倍率×3', price: 7, fx: function (f) { return f.perfect ? [['x', 3]] : []; } },
    { id: 'long', name: '長文家', desc: '8語以上の文は 倍率×1.5、10語以上は×2', price: 6, fx: function (f) { return f.words >= 10 ? [['x', 2]] : f.words >= 8 ? [['x', 1.5]] : []; } },
    { id: 'aux', name: '助動詞ファン', desc: '助動詞・want to などがあれば 倍率+4', price: 4, fx: function (f) { return f.aux ? [['m', 4]] : []; } },
    { id: 'prog', name: '進行中', desc: '進行形(be+-ing)は 倍率+6', price: 5, fx: function (f) { return f.prog ? [['m', 6]] : []; } },
    { id: 'neg', name: 'あまのじゃく', desc: '否定(not)の文は チップ+60', price: 4, fx: function (f) { return f.neg ? [['c', 60]] : []; } },
    { id: 'noun', name: '主役は名詞', desc: '主語が代名詞でなければ 倍率+3', price: 4, fx: function (f) { return f.pronSubj ? [] : [['m', 3]]; } },
    { id: 'obj', name: '目的語ハンター', desc: '目的語があれば チップ+40', price: 4, fx: function (f) { return f.O ? [['c', 40]] : []; } },
    { id: 'link', name: 'つなぎ名人', desc: '節(when / if / because)の文は 倍率×2', price: 7, fx: function (f) { return f.clause ? [['x', 2]] : []; } },
    { id: 'mini', name: 'ミニマリスト', desc: '4語以下の文は 倍率+8', price: 5, fx: function (f) { return f.words <= 4 ? [['m', 8]] : []; } },
    { id: 'manner', name: '様子の名人', desc: '様子の副詞1つごとに 倍率+3', price: 4, fx: function (f) { return f.manner ? [['m', 3 * f.manner]] : []; } },
    { id: 'pass', name: '受け身の美学', desc: '受け身(be+過去分詞)は 倍率×2.5', price: 6, fx: function (f) { return f.passive ? [['x', 2.5]] : []; } },
    { id: 'rare', name: '語彙王', desc: 'むずかしい語のカード1枚ごとに チップ+25', price: 5, fx: function (f) { return f.rare ? [['c', 25 * f.rare]] : []; } },
    { id: 'first', name: '先手必勝', desc: 'ステージ最初の「出す」は 倍率+6', price: 4, fx: function (f, ctx) { return ctx.first ? [['m', 6]] : []; } },
    { id: 'last', name: 'ラストスパート', desc: 'ステージ最後の「出す」は 倍率×3', price: 6, fx: function (f, ctx) { return ctx.last ? [['x', 3]] : []; } },
    { id: 'lucky', name: '四つ葉', desc: '4回に1回 倍率×3', price: 5, fx: function () { return rnd() < .25 ? [['x', 3]] : []; } },
    { id: 'bank', name: '貯金箱', desc: '利子の上限が 5→10', price: 5, fx: function () { return []; } },
    { id: 'combo', name: '型のコレクター', desc: '役の要素1つごとに チップ+15', price: 5, fx: function (f, ctx) { return [['c', 15 * ctx.y.parts.length]]; } }
  ];
  // ---------------- ボス ----------------
  var BOSSES = [
    { id: 'art', text: '冠詞(a / the)を使わない文は 0点', ok: function (f) { return f.hasArt; } },
    { id: 'past', text: '過去の文しか 点にならない', ok: function (f) { return f.past; } },
    { id: 'long', text: '6語以上の文しか 点にならない', ok: function (f) { return f.words >= 6; } },
    { id: 'npron', text: '代名詞が主語の文は 0点', ok: function (f) { return !f.pronSubj; } },
    { id: 'pp', text: '前置詞の句がない文は 0点', ok: function (f) { return f.hasPP; } },
    { id: 'obj', text: '目的語のない文は 0点', ok: function (f) { return f.O || f.C; } },
    { id: 'hands', text: '「出す」が3回しかない', hands: 3, ok: function () { return true; } }
  ];
  var TARGETS = [300, 500, 800, 1200, 1800, 2700, 4000, 6000];
  var BOSS_AT = { 2: 1, 5: 1, 7: 1 }; // 0始まり:3・6・8ステージ

  // ---------------- ゲームの状態 ----------------
  var R = null;
  function newRun() {
    R = { stage: 0, money: 4, deck: starterDeck(), jokers: [], lv: {}, best: { text: '', pts: 0 }, total: 0, played: 0, rerollCost: 2 };
    if (LEVEL === 2) for (var i = 0; i < 8; i++) { var g = guestCard(); if (g) { g.guest = false; g.chips = baseChips(g); R.deck.push(g); } }
    startStage();
  }
  function startStage() {
    var bi = BOSS_AT[R.stage] ? pick(BOSSES.filter(function (b) { return !R.lastBoss || b.id !== R.lastBoss; })) : null; if (bi) R.lastBoss = bi.id;
    R.boss = bi; R.target = TARGETS[R.stage]; R.score = 0; R.hands = bi && bi.hands ? bi.hands : 4; R.handsMax = R.hands; R.discards = 3; R.first = true;
    R.deck.forEach(function (c) { if (c.w.k === 'v') c.w.f = 'base'; if (c.w.k === 'n') c.w.pl = false; });
    R.deck.forEach(function (c) { if (c.scout) { c.scout = false; c.chips = baseChips(c); } });
    R.draw = shuffle(R.deck.slice()); R.disc = []; R.hand = []; R.row = []; R.field = []; R.pts = 0; R.refill = 0; R.log = []; deal();
    R.yakuCnt = {}; R.prev = null; R.stageF = []; R.questDone = false; R.quest = pickQuest(R.usedQ = R.usedQ || []); R.missions = pickMissions(R.usedM = R.usedM || [], 3);
    var g = guestCard(); if (g) { var j = R.hand.findIndex(function (c) { return cat(c) === cat(g); }); if (j < 0) j = 0; R.draw.unshift(R.hand[j]); R.hand[j] = g; }
    showGame();
  }
  function drawOne() { if (!R.draw.length) { R.draw = shuffle(R.disc); R.disc = []; } return R.draw.pop() || null; }
  function verbFits(v, n) { var ot = v.w.e.ot || []; if (!ot.length || ot.indexOf('any') >= 0) return true; var tags = [n.w.e.cat].concat(n.w.e.tg || []); return ot.some(function (t) { return tags.indexOf(t) >= 0; }); }
  // 手札を配る:品詞がかたよらないように(主語2・動詞2〜3・名詞2・飾り1 くらい)。動詞の目的語になれる名詞もできるだけ入れる
  function cat(c) { return c.kind === 'pron' || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)) ? 'subj' : c.kind === 'v' ? 'verb' : c.kind === 'n' ? 'noun' : 'mod'; }
  var WANT = { subj: [2, 3], verb: [2, 3], noun: [2, 3], mod: [1, 2] };
  function deal() { fillTo(8); }
  function fillTo(N) {
    if (!R.draw.length) { R.draw = shuffle(R.disc); R.disc = []; }
    while (R.hand.length + R.row.filter(function (c) { return !c.tsu; }).length < N) {
      if (!R.draw.length) { if (!R.disc.length) break; R.draw = shuffle(R.disc); R.disc = []; }
      var cnt = { subj: 0, verb: 0, noun: 0, mod: 0 }; R.hand.concat(R.row.filter(function (c) { return !c.tsu; })).forEach(function (c) { cnt[cat(c)]++; });
      var short = Object.keys(WANT).filter(function (k) { return cnt[k] < WANT[k][0]; }), full = Object.keys(WANT).filter(function (k) { return cnt[k] >= WANT[k][1]; });
      var idx = -1;
      if (short.length) { var k0 = pick(short); for (var i = R.draw.length - 1; i >= 0; i--) if (cat(R.draw[i]) === k0) { idx = i; break; } }
      if (idx < 0) for (var j = R.draw.length - 1; j >= 0; j--) if (full.indexOf(cat(R.draw[j])) < 0) { idx = j; break; }
      if (idx < 0) idx = R.draw.length - 1;
      R.hand.push(R.draw.splice(idx, 1)[0]);
    }
    // 他動詞があるのに目的語になれる名詞がないときは、山札から合う名詞と入れかえる
    var vs = R.hand.filter(function (c) { return c.kind === 'v' && c.w.e.fr !== 'intr'; }), ns = R.hand.filter(function (c) { return c.kind === 'n'; });
    if (vs.length && !vs.some(function (v) { return ns.some(function (n) { return verbFits(v, n); }); })) {
      var i2 = R.draw.findIndex(function (c) { return c.kind === 'n' && vs.some(function (v) { return verbFits(v, c); }); }), j2 = R.hand.findIndex(function (c) { return cat(c) === 'noun' || cat(c) === 'mod'; });
      if (i2 >= 0 && j2 >= 0) { var t = R.hand[j2]; R.hand[j2] = R.draw[i2]; R.draw[i2] = t; }
    }
  }
  // ---------------- 中身の操作(画面とは分けておく。対戦にするときはここをサーバーと共有する) ----------------
  var FIELD_MAX = 8;
  var Core = {
    // 手札から捨てる:場に表向きで並び、捨てたカードの点が「捨て札ポイント」になる。捨てた枚数ぶん補充待ち
    discard: function (cards) {
      cards.forEach(function (c) { var i = R.hand.indexOf(c); if (i >= 0) R.hand.splice(i, 1); R.field.unshift(c); R.pts += c.chips + c.bonus; });
      while (R.field.length > FIELD_MAX) R.disc.push(R.field.pop());
      R.discards--; R.refill += cards.length; R.log.push({ a: 'discard', cards: cards.map(cardText) });
    },
    // 補充1枚:山から引く(タダ)
    drawOne: function () { if (R.refill <= 0) return null; var before = R.hand.length; fillTo(R.hand.length + R.row.filter(function (c) { return !c.tsu; }).length + 1); R.refill--; var c = R.hand[R.hand.length - 1]; R.log.push({ a: 'draw' }); return R.hand.length > before ? c : null; },
    // 補充1枚:場から取る(そのカードの点ぶんポイントを払う)
    take: function (c) { var cost = c.chips + c.bonus, i = R.field.indexOf(c); if (R.refill <= 0 || i < 0 || R.pts < cost) return false; R.pts -= cost; R.field.splice(i, 1); R.hand.push(c); R.refill--; R.log.push({ a: 'take', card: cardText(c), cost: cost }); return true; }
  };
  // 点数の計算(内訳つき)
  function notes(f, rep) {
    var o = [];
    if (f.colloc === 'good') o.push('<span class="gd">✨ 名コンビ(' + f.pair + ')</span>');
    if (f.storyP) o.push('<span class="gd">🔗 前の文を代名詞で受けた</span>'); else if (f.story) o.push('<span class="gd">🔗 前の文とつながった</span>');
    if ((f.dupWords || []).length) o.push('同じ種類の句の2つ目は 0点');
    if ((f.halfWords || []).length) o.push('2つ目の文は カード点が半分');
    if (rep) o.push('同じ役 ' + (rep + 1) + '回目 → 倍率 ' + (rep === 1 ? '½' : '¼'));
    return o.join('<br>');
  }
  function applyStory(ev) { var st = storyOf(ev.nps, R && R.prev); ev.f.story = st === 'def'; ev.f.storyP = st === 'pron'; }
  function scoreOf(ev, ctx) {
    var f = ev.f; applyStory(ev);
    var b = baseScore(R.row, ev), y = b.y, steps = b.steps, chips = b.chips, mult = b.mult;
    ctx.y = y;
    R.jokers.forEach(function (j, ji) {
      j.fx(f, ctx).forEach(function (e) {
        if (e[0] === 'c') chips += e[1]; else if (e[0] === 'm') mult += e[1]; else mult = Math.round(mult * e[1] * 10) / 10;
        steps.push({ t: 'joker', ji: ji, txt: e[0] === 'c' ? '+' + e[1] : e[0] === 'm' ? '+' + e[1] + ' 倍' : '×' + e[1], chips: chips, mult: mult });
      });
    });
    var rep = (R.yakuCnt && R.yakuCnt[y.name]) || 0;
    if (rep) { mult = Math.round(mult * (rep === 1 ? .5 : .25) * 10) / 10; steps.push({ t: 'note', txt: '同じ役 ' + (rep + 1) + '回目 ×' + (rep === 1 ? '½' : '¼'), chips: chips, mult: mult }); }
    if (LEVEL !== 1) { mult = Math.round(mult * LV_MULT[LEVEL] * 10) / 10; steps.push({ t: 'note', txt: LV_JA[LEVEL] + ' ×' + LV_MULT[LEVEL], chips: chips, mult: mult }); }
    var bossOk = !R.boss || R.boss.ok(f);
    return { y: y, steps: steps, chips: chips, mult: mult, total: bossOk ? Math.floor(chips * mult) : 0, bossFail: !bossOk, rep: rep };
  }

  // ---------------- 画面 ----------------
  var root = null;
  function mount(r) { root = r; var lv = store.get('level'); setLevel(lv == null ? 1 : lv); showTitle(); document.addEventListener('pointerdown', unlock, { once: false, passive: true }); }
  function screen(html) { root.innerHTML = ''; var s = el('div', 'scr', html); root.appendChild(s); return s; }
  function showTitle() {
    var b = store.get('best') || {};
    var s = screen('<div class="title"><div class="logo"><span>CHUNK</span><span>CARDS</span></div><div class="sub">英文で「役」をつくる カードゲーム</div><div class="lvsel" id="lvsel"></div><div class="lvdesc" id="lvd"></div>' +
      '<div class="fan"><div class="card n big" style="--r:-12deg">The</div><div class="card v big" style="--r:-4deg">dog</div><div class="card v big" style="--r:4deg">ate</div><div class="card m big" style="--r:12deg">quickly</div></div>' +
      '<button class="btn go" id="go">ひとりで練習</button><button class="btn vs" id="vs">CPUと対戦</button><button class="btn ghost" id="how">あそびかた</button><button class="btn ghost small" id="cb">📖 名コンビ図鑑</button>' +
      (b.stage ? '<div class="rec">最高:ステージ ' + b.stage + ' ・ ' + (b.total || 0).toLocaleString() + '点' + (b.text ? '<br><i>' + b.text + '</i>' : '') + '</div>' : '') + '</div>');
    var LVD = ['a / the・前置詞・be・動詞の形を忘れても、自動で補って文にしてくれる。出したあとに1語ずつ解説(点 ×1)', 'a / the・前置詞・動詞の形も自分で選ぶ(点 ×1)', 'むずかしい語が山札に入り、候補の光もなし(点 ×1.3)'];
    function lvUI() { var box = $('#lvsel', s); box.innerHTML = ''; LV_JA.forEach(function (n, i) { var b = el('button', 'lvb' + (i === LEVEL ? ' on' : ''), n); b.onclick = function () { setLevel(i); store.set('level', i); SFX.tap(); lvUI(); }; box.appendChild(b); }); $('#lvd', s).textContent = LVD[LEVEL]; }
    lvUI();
    $('#go', s).onclick = function () { unlock(); SFX.put(); newRun(); };
    $('#how', s).onclick = function () { unlock(); showHow(); };
    $('#cb', s).onclick = function () { var l = store.get('combos') || [], o = el('div', 'modal', '<div class="box"><h2>📖 名コンビ図鑑(' + l.length + ')</h2><p style="font-size:12px;opacity:.8;margin:0">動詞とぴったりの目的語の組み合わせ。文で使うと倍率+2</p><div class="combos">' + (l.length ? l.map(function (x) { return '<span>' + x + '</span>'; }).join('') : '<i>まだない</i>') + '</div><button class="btn go" id="ok">とじる</button></div>'); root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); }; };
    $('#vs', s).onclick = function () { unlock(); SFX.put(); window.ChunkVS && window.ChunkVS.start(); };
  }
  function showHow() {
    var o = el('div', 'modal', '<div class="box"><h2>あそびかた</h2><ol>' +
      '<li>手札のカードを<b>タップ</b>すると「文の台」に並ぶ。<b>つなぎの棚</b>(a / the / in / can など)は何回でも使える。</li>' +
      '<li>手札は<b>タップ</b>か<b>上へフリック</b>で台の最後へ。<b>ドラッグ</b>すると金の線の位置に1枚ずつ差し込める。台のカードは<b>ドラッグで並べかえ</b>、<b>下へフリック</b>か×で手札へ戻す。<b>タップで形が変わる</b>(eat → ate → eaten → eating、単数⇄複数)。be・have は「今 → 過去 → 否定 → 過去の否定」(is → was → isn’t → wasn’t)、do は do → did → don’t → didn’t、can は can → could → can’t → couldn’t(will・may も同じ。must・should は否定と切りかえ)、want to → wanted to。</li>' +
      '<li>正しい英文になると<b>役</b>(S+V+O+場所 など)と点が出る。「<b>出す!</b>」で点が入る。間違っていると理由が出て、出せない。</li>' +
      '<li>点 = <b>チップ × 倍率</b>。長い文・むずかしい形(過去・完了・進行・節…)ほど高い。</li>' +
      '<li>「出す」の回数のうちに<b>目標点</b>に届けばクリア。お店で<b>ジョーカー</b>(点が化ける効果)や<b>文型の本</b>を買って強くなろう。3・6・8ステージは<b>ボス</b>(条件つき)。</li>' +
      '<li>「<b>捨てる</b>」→ 手札から捨てるカードをえらぶ。捨てたカードは<b>場</b>に表向きで並び、その点数が<b>捨て札pt</b>になる。補充は1枚ずつ「山から引く(タダ)」か「場から取る(点数ぶんのpt)」をえらべる。強いカードをわざと捨てて、あとで拾い直すのもアリ。</li><li><b>レベル</b>(タイトルで選ぶ):初級は冠詞・前置詞(「つなぎ」カード)・時制がおまかせ。上級はむずかしい語が増え、点も高い。</li><li>台の文がうまくいかないときは、止まったカードが<b>赤く</b>光り、次に置けるカードに<b>金の点</b>が付く(初級・中級)。初級・中級は、台の下に「次に置くもの」(主語 → 動詞 → 目的語 → 場所 → 時)がいつも出る。答えは出ないので、並べるのは自分で。上級は💡ヒント(💰1)で、使えるカードが光るだけ。</li></ol><button class="btn go" id="ok">わかった</button></div>');
    root.appendChild(o); $('#ok', o).onclick = function () { o.remove(); };
  }

  var G_ = {}; // ゲーム画面の要素
  function showGame() {
    var s = screen(
      '<div class="top"><div class="stg' + (R.boss ? ' boss' : '') + '">' + (R.boss ? '👹 ボス ' : 'ステージ ') + (R.stage + 1) + '<small>/8</small></div>' +
      '<div class="goal"><div class="gl">目標 <b id="tgt">' + R.target.toLocaleString() + '</b></div><div class="bar"><i id="barf"></i></div><div class="gl">いま <b id="sc">0</b></div></div>' +
      '<div class="res"><span>出す<b id="hd"></b></span><span>捨てる<b id="ds"></b></span><span class="money">💰<b id="mn"></b></span></div></div>' +
      '<div class="jokers" id="jk"></div>' +
      (R.boss ? '<div class="bossbar">👹 ' + R.boss.text + '</div>' : '') + '<div class="qbar" id="qb"></div>' +
      '<div class="board"><div class="row" id="row"><div class="ph">手札をタップして ここに並べる</div></div>' +
      '<div class="pv"><div class="sent" id="sent"></div><div class="jt" id="jt"></div><div class="yk" id="yk"></div><div class="cm"><span class="chips" id="ch">0</span><span class="x">×</span><span class="mult" id="ml">0</span></div><div class="msg" id="msg"></div><div class="hp" id="hp"></div></div><button class="hintb" id="hb">💡 ヒント</button></div>' +
      '<div class="field"><div class="flbl"><span>場(捨てたカード)</span><span class="pts">捨て札pt <b id="pt">0</b></span></div><div class="frow" id="fd"></div><div class="fhint" id="fh"></div></div>' +
      '<div class="tsu"><div class="tabs" id="tabs"></div><div class="tw" id="tw"></div></div>' +
      '<div class="hand" id="hand"></div>' +
      '<div class="btns" id="bt"></div>');
    ['jk', 'row', 'sent', 'yk', 'ch', 'ml', 'msg', 'tabs', 'tw', 'hand', 'bt', 'hd', 'ds', 'mn', 'sc', 'barf', 'fd', 'fh', 'pt', 'qb', 'jt', 'hp', 'hb'].forEach(function (k) { G_[k] = $('#' + k, s); });
    G_.hb.onclick = doHint;
    G_.tab = G_.tab == null ? 0 : G_.tab;
    G_.vs = null; G_.mode = 'play'; G_.mark = []; renderAll();
  }
  // 台の上の見た目:文の中での実際の形(is / plays / him / an …)にそろえる
  var BE = /^(am|is|are|was|were|be|been|being)$/, HV = /^(have|has|had|having)$/;
  function first(w) { return String(w).toLowerCase().split(' ')[0]; }
  function plaus(c, tok) {
    var k = c.w.k;
    if (k === 'prep' && c.label) return /^(in|on|at)$/.test(tok);
    if (k === 'be') return BE.test(tok);
    if (k === 'modal') return tok === c.w.v;
    if (k === 'do') return /^(do|does|did)$/.test(tok); if (k === 'hv') return HV.test(tok); if (k === 'det') return /^(a|an|the|this|that|these|those)$/.test(tok);
    if (k === 'pr' && !c.label && G.PRON[c.w.v]) { var P = G.PRON[c.w.v]; return tok === first(P.sub) || tok === first(P.obj); }
    if (k === 'sm') return /^be/.test(c.w.v) ? BE.test(tok) : /^have/.test(c.w.v) ? HV.test(tok) : tok.indexOf(first(c.w.v).slice(0, 3)) === 0;
    if (k === 'v') { var fs = ['base', 'past', 'pp', 'ing'].map(function (f) { return first(G.wordText({ k: 'v', e: c.w.e, f: f }, CFG)); }), b0 = fs[0]; return fs.indexOf(tok) >= 0 || tok === b0 + 's' || tok === b0 + 'es' || tok === b0.replace(/y$/, 'ies') || tok === 'has' && b0 === 'have'; }
    var b = first(cardText(c)); return tok === b || (b.length > 2 && tok.indexOf(b.slice(0, b.length - 1)) === 0) || (k === 'n' && first(G.wordText({ k: 'n', e: c.w.e, pl: true }, CFG)) === tok);
  }
  function surfaceOf(row, ev) {
    if (!ev || ev.state !== 'ok') return null;
    var toks = [], orig = {}, p = 0, out = [], seq = [];
    ev.text.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean).forEach(function (w) { var m = /^(\w+)n't$/i.exec(w); if (m) { var b = { ca: 'can', wo: 'will', sha: 'shall' }[m[1].toLowerCase()] || m[1]; orig[toks.length] = w; toks.push(b, 'not'); } else toks.push(w); });
    for (var i = 0; i < row.length; i++) {
      var c = row[i], n = cardText(c).split(' ').length;
      var neg2 = c.w.neg && /^(be|hv|modal|do)$/.test(c.w.k);
      if (neg2) { if (!/^not$/i.test(toks[p + 1] || '') || (c.w.k === 'do' ? !/^(do|does|did)$/i.test(toks[p] || '') : !plaus(c, (toks[p] || '').toLowerCase()))) return null; n = 2; }
      else if (c.w.k === 'not' && /^(do|does|did)$/i.test(toks[p] || '') && /^not$/i.test(toks[p + 1] || '')) n = 2;
      else if (c.w.k === 'not') { if (!/^not$/i.test(toks[p] || '')) return null; }
      else if (!plaus(c, (toks[p] || '').toLowerCase())) {
        var sk = 0; // 初級:おまかせで足された語(冠詞・前置詞・be など)は飛ばして、あとで解説する
        while (LEVEL === 0 && sk < 3 && toks[p] && !plaus(c, toks[p].toLowerCase())) { seq.push({ t: toks[p], auto: true }); p++; sk++; }
        if (!plaus(c, (toks[p] || '').toLowerCase())) return null;
      }
      var t = orig[p] && n === 2 && (c.w.k === 'not' || neg2) ? orig[p] : toks.slice(p, p + n).join(' '); p += n;
      if (i === 0 && t !== 'I' && !/^[A-Z]/.test(cardText(c))) t = t.charAt(0).toLowerCase() + t.slice(1);
      out.push(t); seq.push({ t: t, card: i });
    }
    while (LEVEL === 0 && p < toks.length) { seq.push({ t: toks[p], auto: true }); p++; }
    if (p !== toks.length) return null;
    out.seq = seq; return out;
  }
  // 文になっていないときの目安:主語に合わせて be / have、動詞・前置詞のうしろの代名詞は目的語の形
  function guessForm(c, prev) {
    var k = c.w.k;
    if (k === 'pr' && !c.label && prev && (prev.w.k === 'v' || prev.w.k === 'prep') && G.PRON[c.w.v]) return G.PRON[c.w.v].obj;
    if ((k === 'be' || k === 'hv') && prev && (prev.w.k === 'pr' || prev.w.k === 'n')) {
      var v = prev.w.k === 'pr' ? prev.w.v : prev.w.pl ? 'they' : 'he', past = c.w.v === 'past';
      if (k === 'be') return past ? (v === 'i' || v === 'he' || v === 'she' || v === 'it' ? 'was' : 'were') : v === 'i' ? 'am' : /^(he|she|it)$/.test(v) ? 'is' : 'are';
      return past ? 'had' : /^(he|she|it)$/.test(v) ? 'has' : 'have';
    }
    return null;
  }
  function rowText(row) { return row.map(function (c, i) { return guessForm(c, row[i - 1]) || cardText(c); }).join(' '); }
  function formTag(c, tok, row, i) {
    if (!tok || c.w.k !== 'v') return null; var t = first(tok), e = c.w.e, b = first(vtext(e, 'base')), pa = first(vtext(e, 'past')), pp = first(vtext(e, 'pp')), ing = first(vtext(e, 'ing')), pv = prevCore(row.map(function (x) { return x.w; }), i);
    if (t === ing) return '-ing形'; if (t === pp && pv && (pv.k === 'be' || pv.k === 'hv')) return '過去分詞'; if (t === pa) return '過去形'; if (t === pp) return '過去分詞';
    if (t === b) return pv && (pv.k === 'modal' || pv.k === 'sm' || pv.k === 'not') ? '原形' : '現在形'; if (t === b + 's' || t === b + 'es' || t === b.replace(/y$/, 'ies') || t === 'has') return '現在(三単現)'; return null;
  }
  function cardEl(c, where, i, disp, ftag) {
    var e = el('div', 'card ' + colorOf(c) + (c.tsu ? ' tsu' : '') + (lvOf(c) >= 2 && !c.tsu ? ' rare' : '') + (c.guest ? ' guest' : '') + (c.w.k === 'pr' && c.w.v === 'it' && !c.tsu ? ' wild' : ''));
    var t = disp || cardText(c); e.dataset.pos = { pron: 'pron.', n: 'n.', v: 'v.', adj: 'adj.', adv: 'adv.' }[c.kind] || '';
 e.innerHTML = '<span class="w"' + (t.length > 5 ? ' style="font-size:' + Math.max(8.5, (where === 'hand' ? 14.5 : where === 'field' ? 10.5 : 13.5) - (t.length - 5) * (where === 'field' ? .8 : 1.05)) + 'px"' : '') + '>' + t + '</span><i>' + (c.chips + c.bonus) + '</i>' + (c.bonus ? '<u>+' + c.bonus + '</u>' : '') +
      (c.w.k === 'v' && where === 'row' ? '<em>' + (ftag || FORM_JA[c.w.f || 'base']) + '</em>' : '') + (where === 'row' ? '<b class="rm">×</b>' : '');
    e.dataset.i = i; return e;
  }
  function renderAll() { if (G_.vs) return G_.vs.renderAll(); renderTop(); renderJokers(); renderRow(); renderTsu(); renderHand(); renderField(); renderBtns(); }
  function renderTop() { G_.hd.textContent = R.hands; G_.ds.textContent = R.discards; G_.mn.textContent = R.money; G_.sc.textContent = R.score.toLocaleString(); if (G_.pt) G_.pt.textContent = R.pts; G_.barf.style.width = Math.min(100, R.score / R.target * 100) + '%'; if (G_.qb && R.quest) G_.qb.innerHTML = missionBar(R.missions) + questBar(R.quest, R.stageF); }
  function missionBar(ms) { return '<div class="mbar">🎯 お題:' + ms.map(function (x) { return '<span class="mc t' + x.m.tier + (x.done ? ' hit' : '') + '">' + (x.done ? '✔ ' : '') + x.m.label + ' <b>💰' + (x.m.tier + 1) + '</b></span>'; }).join('') + '</div>'; }
  function renderJokers() {
    G_.jk.innerHTML = '';
    for (var i = 0; i < 5; i++) { var j = R.jokers[i]; var e = el('div', 'joker' + (j ? '' : ' empty'), j ? '<b>' + j.name + '</b><span>' + j.desc + '</span>' : '<span>空き</span>'); e.dataset.i = i; G_.jk.appendChild(e); }
  }
  function renderHand() {
    G_.hand.innerHTML = '';
    R.hand.forEach(function (c, i) {
      var e = cardEl(c, 'hand', i); if (G_.mode === 'disc' && G_.mark.indexOf(c) >= 0) e.classList.add('marked');
      if (G_.nxH && G_.nxH[c.id]) e.classList.add('nx'); if (G_.hintIds && G_.hintIds[c.id]) e.classList.add('hintc');
      e.onpointerdown = function (ev) { cardPress(ev, c, e, 'hand'); };
      G_.hand.appendChild(e);
    });
  }
  function renderTsu() {
    var TS = curTSU(); if (G_.tab >= TS.length) G_.tab = 0;
    G_.tabs.innerHTML = ''; TS.forEach(function (t, i) { var b = el('button', 'tab' + (i === G_.tab ? ' on' : ''), t[0]); b.onclick = function () { G_.tab = i; SFX.tap(); renderTsu(); }; G_.tabs.appendChild(b); });
    G_.tw.innerHTML = ''; TS[G_.tab][1].forEach(function (spec) { var c = tsuCard(spec), e = cardEl(c, 'tsu', 0); if (G_.nxT && G_.nxT[spec.join('|')]) e.classList.add('nx'); e.dataset.spec = spec.join('|'); e.onpointerdown = function (ev) { cardPress(ev, c, e, 'tsu', spec); }; G_.tw.appendChild(e); });
  }
  // 文の台:タップ=形を変える/×=戻す/ドラッグ=並べかえ
  function renderRow() {
    G_.row.innerHTML = '';
    if (!R.row.length) G_.row.appendChild(el('div', 'ph', '手札をタップして ここに並べる'));
    var ev0 = evaluate(R.row), sf = surfaceOf(R.row, ev0), errI = ev0.state === 'bad' && ev0.atCard ? R.row.indexOf(ev0.atCard) : -1;
    calcNext();
    R.row.forEach(function (c, i) {
      var e = cardEl(c, 'row', i, sf ? sf[i] : guessForm(c, R.row[i - 1]), sf ? formTag(c, sf[i], R.row, i) : null); G_.row.appendChild(e);
      if (i === errI) e.classList.add('errc'); if (G_.hintIds && G_.hintIds[c.id] && !c.tsu) e.classList.add('hintc');
      $('.rm', e).onpointerdown = function (ev) { ev.stopPropagation(); };
      $('.rm', e).onclick = function (ev) { ev.stopPropagation(); if (G_.busy) return; SFX.tap(); R.row.splice(R.row.indexOf(c), 1); if (!c.tsu) R.hand.push(c); renderRow(); renderHand(); };
      e.onpointerdown = function (ev) { cardPress(ev, c, e, 'row'); };
    });
    updatePreview(); if (G_.bt) renderBtns();
    applyNext(); armIdle();
  }
  // 次に置けるカード(初級・中級):今の並びに足しても「まちがい」にならないもの
  function calcNext() {
    G_.nxH = {}; G_.nxT = {};
    if (LEVEL >= 2 || !R.row.length || G_.mode !== 'play' || G_.busy) return;
    var cur0 = evaluate(R.row, true); if (cur0.state === 'ok') return;
    R.hand.forEach(function (c) { if (evaluate(R.row.concat([c]), true).state !== 'bad') G_.nxH[c.id] = 1; });
    var TS = curTSU(); (TS[G_.tab] || TS[0])[1].forEach(function (spec) { if (evaluate(R.row.concat([tsuCard(spec)]), true).state !== 'bad') G_.nxT[spec.join('|')] = 1; });
  }
  function applyNext() {
    if (G_.hand) Array.prototype.forEach.call(G_.hand.children, function (e) { var c = R.hand[+e.dataset.i]; e.classList.toggle('nx', !!(c && G_.nxH && G_.nxH[c.id])); e.classList.toggle('hintc', !!(c && G_.hintIds && G_.hintIds[c.id])); });
    if (G_.tw) Array.prototype.forEach.call(G_.tw.children, function (e) { e.classList.toggle('nx', !!(G_.nxT && G_.nxT[e.dataset.spec])); });
  }
  // ---- 💡 ヒント(3段階)。使うほど次の文の点が下がる ----
  var HINT_MULT = [1, 1, 1, 1], HINT_COST = [0, 1, 0, 0]; // 上級のヒント:練習は💰1、対戦は捨て札pt5
  function hintCostTxt(n) { return G_.vs ? '捨て札pt ' + HINT_COST[n] * 5 : '💰' + HINT_COST[n]; }
  function payHint(n) { var c = HINT_COST[n]; if (!c) return true; if (G_.vs) { if (R.pts < c * 5) return false; R.pts -= c * 5; return true; } if (R.money < c) return false; R.money -= c; return true; }
  function roleOf(row, i) {
    var c = row[i], k = c.w.k, seenV = row.slice(0, i).some(function (x) { return x.w.k === 'v' || x.w.k === 'be'; });
    if (k === 'pr' && !c.tsu || k === 'n') { var prv = row.slice(0, i).filter(function (x) { return x.w.k !== 'det' && x.w.k !== 'adj'; }).pop(); if (prv && prv.w.k === 'prep') return k === 'n' && c.w.e.cat === 'time' ? '時' : '場所など'; return seenV ? '目的語' : '主語'; }
    if (k === 'modal' || k === 'sm') return '助動詞'; if (k === 'be') return 'be'; if (k === 'hv') return 'have'; if (k === 'not') return '否定';
    if (k === 'adj') return '形容詞:名詞の前に置く'; if (k === 'det') return '冠詞';
    if (k === 'v') return '動詞'; if (k === 'adv') return c.w.e.k === 'time' ? '時' : c.w.e.k === 'place' ? '場所' : '様子';
    return null;
  }
  function diagnose(cards) {
    var subj = cards.some(function (c) { return c.kind === 'pron' || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)); }), verb = cards.some(function (c) { return c.kind === 'v'; });
    return !subj ? '主語になれるカード(I / he / 人・動物の名詞)がない。捨てて交換しよう' : !verb ? '動詞のカードがない。捨てて交換しよう' : 'この手札だと文が作りにくい。捨てて交換しよう';
  }
  // ---- ヒント:答えは見せない。初級・中級は「次に何を置くか」をいつも出す。上級はボタンで使えるカードを光らせるだけ(💰1) ----
  function doHint() {
    if (G_.busy || G_.mode !== 'play') { flash('いまはヒントを使えない'); return; }
    if (LEVEL < 2) { flash('次に置けるカードには金の点が付いている'); return; }
    var cards = R.hand.concat(R.row.filter(function (c) { return !c.tsu; }));
    var best = window.ChunkVS && window.ChunkVS._search ? window.ChunkVS._search(cards, null, 1, 220) : null;
    if (!best) { G_.hp.innerHTML = '<div class="hrow">💡 ' + diagnose(cards) + '</div>'; SFX.bad(); return; }
    if (R.hintLv) return;
    if (!payHint(1)) { flash('ヒントには ' + hintCostTxt(1) + ' が必要'); SFX.bad(); return; }
    R.hintLv = 1; G_.hintBest = best; SFX.joker(); if (!G_.vs && G_.mn) renderTop(); renderRow(); renderHand();
  }
  function stepGuide(row, ev) {
    var k = function (c) { return c.w.k; }, cs = row.map(k), iV = cs.findIndex(function (x) { return x === 'v' || x === 'be'; });
    var subj = row.slice(0, iV < 0 ? row.length : iV).some(function (c) { return c.w.k === 'pr' && !c.tsu || c.w.k === 'n'; });
    var after = iV < 0 ? [] : row.slice(iV + 1), obj = after.some(function (c) { return (c.w.k === 'n' || c.w.k === 'pr' || c.w.k === 'adj') && !(c.tsu && c.w.k !== 'pr'); });
    var vC = row.filter(function (c) { return c.w.k === 'v'; })[0], noObj = vC && ((c0 = prevCore(row.map(function (z) { return z.w; }), row.indexOf(vC))) && c0.k === 'be' && /pp|past/.test(vC.w.f) || vC.w.e.fr === 'intr'); var c0;
    if (noObj && ev.state === 'ok') obj = true; // 受け身や自動詞は目的語なしでOK
    var place = row.some(function (c, i) { return c.w.k === 'prep' || (c.w.k === 'adv' && c.w.e.k === 'place') || (LEVEL === 0 && iV >= 0 && i > iV && c.w.k === 'n' && c.w.e.cat === 'place'); }), time = row.some(function (c) { return (c.w.k === 'adv' && c.w.e.k === 'time') || (c.w.k === 'n' && c.w.e.cat === 'time'); });
    var steps = [['主語', subj], ['動詞', iV >= 0], ['目的語・補語', obj], ['場所', place], ['時', time]], nextI = steps.findIndex(function (x) { return !x[1]; });
    var line = steps.map(function (x, i) { return x[1] ? '<span class="sd1">✔ ' + x[0] + '</span>' : i === nextI ? '<b class="sd2">' + x[0] + '</b>' : '<span class="sd0">' + x[0] + '</span>'; }).join(' → ');
    var tip = !row.length ? '主語から置こう(I / he / a・the + 人や動物の名詞)'
      : !subj ? '主語を作ろう(名詞まで置く)'
      : iV < 0 ? '次は動詞(v.)。can や be をはさんでもOK'
      : ev.state === 'ok' ? '文になった! のばすなら 場所(前置詞 + 名詞)・時・様子を足そう'
      : ev.state === 'wait' ? 'もう少し:' + (ev.msg || '続きを置こう')
      : 'まちがいを直そう(赤いカード)';
    return '<div class="hrow">💡 ' + tip + '</div><div class="hrow guide">' + line + '</div>';
  }
  function hintPanel() {
    if (!G_.hp) return; G_.hintIds = {};
    if (G_.mode !== 'play') { G_.hp.innerHTML = ''; return; }
    if (LEVEL < 2) { G_.hp.innerHTML = stepGuide(R.row, cur || { state: 'empty' }); if (G_.hb) G_.hb.style.display = 'none'; return; }
    if (G_.hb) { G_.hb.style.display = ''; G_.hb.textContent = R.hintLv ? '💡' : '💡 ヒント(' + hintCostTxt(1) + ')'; }
    var b = G_.hintBest;
    if (!R.hintLv || !b) { G_.hp.innerHTML = ''; return; }
    b.row.forEach(function (c) { if (!c.tsu) G_.hintIds[c.id] = 1; });
    G_.hp.innerHTML = '<div class="hrow">💡 光っているカードで文が作れる。並べ方は自分で考えよう</div>';
  }
  function placeBest(b) {
    var orig = R.hand.concat(R.row.filter(function (c) { return !c.tsu; })), used = {};
    var nr = b.row.map(function (c) { if (c.tsu) return c; var o = orig.filter(function (x) { return x.id === c.id; })[0]; o.w.f = c.w.f; o.w.pl = c.w.pl; used[o.id] = 1; return o; });
    R.hand = orig.filter(function (c) { return !used[c.id]; }); R.row = nr; SFX.put(); renderRow(); renderHand();
  }
  // ---- 初級:出したあとの解説(チュートリアル式)。文をチャンク(意味のかたまり)に分けて、順番と1語ずつの理由を説明する ----
  var ROLE = {
    subj: { n: '主語', m: 'だれが・何が', c: 'r1', d: '文の主人公。英語の文は、かならず主語から始まる。主語になれるのは「名詞のかたまり」(the dog など)か「代名詞」(she など)。' },
    verb: { n: '動詞', m: 'どうする', c: 'r2', d: '動きや状態を表すかたまり。英語では主語のすぐうしろに置く。動詞の形は「いつのことか(今・過去)」と「主語がだれか」で変わる。' },
    be: { n: '動詞(be動詞)', m: '〜である', c: 'r2', d: 'be動詞は「主語 = 〜」とイコールでつなぐ動詞。うしろに様子(形容詞)や名詞を置いて「主語がどんなものか」を言う。' },
    obj: { n: '目的語', m: '何を・だれを', c: 'r3', d: '動詞の動作を受ける相手。動詞のすぐうしろに置き、前置詞は付けない(× eat in an apple)。' },
    comp: { n: '補語', m: 'どんな・何', c: 'r3', d: 'be動詞のうしろで、主語の様子や正体を説明する言葉。He is happy. の happy は he の様子。' },
    place: { n: '場所', m: 'どこで・どこへ', c: 'r4', d: '場所は「前置詞 + 名詞」のかたまりで表すことが多い。目的語のうしろに置く。' },
    time: { n: '時', m: 'いつ', c: 'r5', d: '時は1語の副詞(yesterday など)か「前置詞 + 名詞」(on Monday など)で表す。文の最後に置くのが基本。' },
    manner: { n: '様子', m: 'どんなふうに', c: 'r4', d: '動詞をくわしくする副詞。ふつうは動詞(と目的語)のうしろに置く。' },
    other: { n: '修飾', m: '', c: 'r4', d: '' },
    front: { n: '前おき', m: '', c: 'r5', d: '文の前に置く「〜するとき」などのかたまり。前に置いたときは、うしろにカンマ(,)を付ける。' },
    conj: { n: '接続詞', m: 'つなぎ', c: 'r5', d: '接続詞は文と文をつなぐ言葉。when / if / because のうしろには「主語 + 動詞」の文が続く。' }
  };
  function tokRole(t, cl) {
    if (!t) return 'other'; if (t === cl.subj) return 'subj'; if (t === cl.vp) return cl.vp.be && !cl.vp.verb ? 'be' : 'verb';
    if (cl.comps.indexOf(t) >= 0) return cl.vp.be && !cl.vp.verb ? 'comp' : t.t === 'AP' ? 'comp' : 'obj';
    if (isTime(t)) return 'time'; if (isPlace(t) || (t.t === 'PP' && t.cat === 'dir')) return 'place'; if (t.t === 'ADV') return 'manner'; return 'other';
  }
  function chunksOf(row, ev) {
    var sf = surfaceOf(row, ev); if (!sf || !sf.seq || !ev.r) return null;
    var a = ev.r.alt, owners = [];
    function addCl(cl, tag) { if (!cl) return; [cl.subj, cl.vp].concat(cl.pre, cl.comps, cl.posts).forEach(function (t) { if (t) owners.push({ t: t, role: tokRole(t, cl), cl: tag }); }); }
    if (a.front) { if (a.front.cl) addCl(a.front.cl, 'front'); else if (a.front.tok) owners.push({ t: a.front.tok, role: isTime(a.front.tok) ? 'time' : 'front', cl: 'main' }); }
    a.cls.forEach(function (cl, i) { addCl(cl, i ? 'second' : 'main'); });
    function ownerOfCard(c) { for (var i = 0; i < owners.length; i++) if ((owners[i].t.words || []).indexOf(c.w) >= 0) return i; return -1; }
    var seq = sf.seq, own = seq.map(function (x) { return x.auto ? null : ownerOfCard(row[x.card]); });
    seq.forEach(function (x, k) { if (x.auto && /^(am|is|are|was|were|be|been|do|does|did)$/i.test(x.t)) { var vi = owners.findIndex(function (o) { return o.role === 'verb' || o.role === 'be'; }); own[k] = vi; } });
    for (var k = seq.length - 1; k >= 0; k--) if (own[k] == null || own[k] < 0) { var c = !seq[k].auto && row[seq[k].card]; if (c && /^(conj)$/.test(c.w.k)) { own[k] = 'conj' + k; continue; } own[k] = k + 1 < seq.length ? own[k + 1] : own[k - 1]; }
    for (var k2 = 0; k2 < seq.length; k2++) if (own[k2] == null || own[k2] < 0) own[k2] = k2 ? own[k2 - 1] : 0;
    // 動詞のかたまりに入った副詞(quickly など)は、別のチャンクとして見せる
    seq.forEach(function (x, k) { var c = !x.auto && row[x.card], ow = owners[own[k]]; if (c && c.w.k === 'adv' && ow && (ow.role === 'verb' || ow.role === 'be')) own[k] = 'adv' + k; });
    var chunks = [];
    seq.forEach(function (x, k) {
      var o = own[k], last = chunks[chunks.length - 1];
      if (last && last.o === o) { last.ks.push(k); return; }
      var isC = typeof o === 'string', ow = isC ? null : owners[o], ac = isC && /^adv/.test(o) ? row[x.card] : null;
      chunks.push({ o: o, ks: [k], role: ac ? (ac.w.e.k === 'time' ? 'time' : ac.w.e.k === 'place' ? 'place' : 'manner') : isC ? 'conj' : ow ? ow.role : 'other', tok: ow ? ow.t : null, cl: ow ? ow.cl : 'main', adv: ac });
    });
    chunks.forEach(function (ch) { ch.text = ch.ks.map(function (k) { return seq[k].t; }).join(' '); ch.ja = ch.adv ? (ch.adv.w.e.ja || '') : ch.tok ? jaChunk(ch, ev) : ''; });
    return { seq: seq, chunks: chunks, ev: ev, row: row };
  }
  function jaChunk(ch, ev) {
    var g = ''; try { g = G.gloss(ch.tok) || ''; } catch (e) { }
    if (ch.role === 'subj') return g + 'は'; if (ch.role === 'obj') return g + 'を';
    if (ch.role === 'verb' || ch.role === 'be') { var vp = ch.tok; g = g.replace(/\(.*?\)/g, ''); if (vp.be && !vp.verb) g = ''; return g; }
    return g;
  }
  // 1語ずつの説明:品詞名つき。おまかせで補った語には印を付ける
  function posOf(x, c) {
    if (x.auto) { var t = x.t.toLowerCase(); return /^(a|an|the)$/.test(t) ? '冠詞' : /^(am|is|are|was|were|be|been)$/.test(t) ? 'be動詞' : /^(do|does|did|will|would|shall|have|has|had)$/.test(t) ? '助動詞' : /^(to|in|on|at|for|with|from|by|of|into)$/.test(t) ? '前置詞' : 'つなぎの語'; }
    var k = c.w.k; if (k === 'pr') return c.label ? '所有格' : '代名詞';
    return { n: '名詞', v: '動詞', adj: '形容詞', adv: '副詞', det: c.w.v === 'this' || c.w.v === 'that' ? '指示語' : '冠詞', prep: '前置詞', modal: '助動詞', sm: '助動詞', do: '助動詞', be: 'be動詞', hv: '助動詞(have)', not: '否定', conj: '接続詞', rel: '関係代名詞', deg: '副詞' }[k] || '';
  }
  function wordNotes(ch, R0) {
    var out = [], seq = R0.seq, row = R0.row;
    ch.ks.forEach(function (k) {
      var x = seq[k], t = x.t.toLowerCase(), c = x.auto ? null : row[x.card], pos = posOf(x, c), nk = null, txt = '';
      for (var j = k + 1; j < seq.length; j++) if (!seq[j].auto) { nk = row[seq[j].card]; if (nk && nk.w.k !== 'adj') break; }
      var nw = nk && nk.w.e ? nk.w.e.w : '', ncat = nk && nk.w.e ? nk.w.e.cat : '';
      if (pos === '冠詞') {
        if (t === 'a') txt = '名詞の前に付けて「1つの」を表す。数えられる名詞(' + (nw || 'book') + ' など)が1つで、まだ話に出ていないものに付ける。';
        else if (t === 'an') txt = 'a と同じ働き。ただし ' + (nw || 'apple') + ' のように母音(ア・イ・ウ・エ・オの音)で始まる語の前では an にする。';
        else txt = '名詞の前に付けて「その」を表す。聞き手にもどれのことか分かるもの、1つに決まるものに付ける' + (/^(place|time)$/.test(ncat) ? '(the park、the morning のように場所や時間帯にはよく付く)' : '') + '。';
        txt += ' 冠詞は「冠詞 →(形容詞)→ 名詞」の順で、名詞の前に置く。';
      } else if (pos === '指示語') txt = '「この(this)・あの(that)」。冠詞のかわりに名詞の前に置く。名詞が複数なら these / those に変わる。';
      else if (pos === '前置詞') {
        var m = { 'in': ncat === 'time' ? '朝・午後・月・年など「幅のある時間」に使う(in the morning)。' : '「〜の中で」。建物や町など広がりのある場所に使う(in the park)。', on: ncat === 'time' ? '曜日や日付に使う(on Monday)。' : '「〜の上に・接して」。', at: ncat === 'time' ? '時刻やお昼など「時間の1点」に使う(at noon)。' : '駅や家など「場所を1点」として考えるときに使う(at the station)。', to: '「〜へ」。go・come など移動の動詞のあとで行き先を表す。', 'with': '「〜と一緒に・〜を使って」。', 'for': '「〜のために」。', from: '「〜から」。', by: '「〜のそばで・〜によって」。' }[t] || '';
        txt = '前置詞は名詞の前に置いて、場所・時・方向などを表す言葉。「前置詞 + 名詞」でひとつのかたまりになる。' + m;
      } else if (pos === 'be動詞') txt = (/n't|not/.test(t) ? 'not が付いた否定の形(〜ではない)。be動詞は、うしろに not を付けるだけで否定になる。' : '') + '主語とうしろの言葉をイコールでつなぐ動詞。主語と時で形が変わる:I am / he・she・it is / you・we・they are(過去は was / were)。' + (t === 'been' ? 'have のうしろでは been になる(完了形)。' : '');
      else if (c && c.w.k === 'do' && !c.w.neg) txt = '強調の do:「本当に〜する」と気持ちを強める。主語が he / she なら does、過去なら did。うしろの動詞は原形(元の形)。';
      else if (c && c.w.k === 'do') txt = '「〜しない」の否定。ふつうの動詞(like・play など)を打ち消すときは、動詞の前に do not(don\'t)を置く。主語が he / she / 1つなら doesn\'t、過去なら didn\'t。うしろの動詞は原形(元の形)にする。';
      else if (pos === '助動詞' && /^(do|does|did)$/.test(t)) txt = 'not で打ち消すときに動詞の前に置く助動詞。主語が he / she なら does、過去なら did。うしろの動詞は原形(元の形)にする。';
      else if (pos === '助動詞(have)') txt = 'have + 過去分詞 で完了形(〜したところ・〜したことがある)。主語が he / she なら has、過去なら had。';
      else if (pos === '助動詞') txt = '動詞の前に置いて「できる(can)・するつもり(will)」などの意味を足す。うしろの動詞は原形(元の形)のまま。';
      else if (pos === '代名詞') { var P = G.PRON[c.w.v], base = cardText(c).toLowerCase(); txt = '名詞のかわりに使う言葉(' + P.ja + ')。' + (t === P.obj.toLowerCase() && t !== base ? '動詞や前置詞のうしろ(目的語)では形が変わる:' + base + ' → ' + t + '。I → me、he → him、she → her、we → us、they → them。' : '主語のときは I / you / he / she / it / we / they の形。'); }
      else if (pos === '所有格') txt = '「〜の」を表す(my = わたしの)。冠詞のかわりに名詞の前に置く。';
      else if (pos === '名詞') { var e = c.w.e; txt = 'ものや人の名前を表す言葉(' + (e.ja || '') + ')。' + (c.w.pl ? '2つ以上なので -s を付けた複数形。' : G.isCount(e) && !e.ind ? '数えられる名詞なので、1つなら a / the などが前に必要。' : '数えられない名詞なので a は付けない。'); }
      else if (pos === '動詞') {
        var e3 = c.w.e, b = first(vtext(e3, 'base')), w0 = first(t), pv = prevCore(row.map(function (z) { return z.w; }), x.card), pa = first(vtext(e3, 'past')), irr = pa !== b + 'ed' && pa !== b + 'd' && pa !== b.replace(/y$/, 'ied');
        txt = '動きを表す言葉(' + (e3.ja || '') + ')。';
        if (w0 === first(vtext(e3, 'ing'))) txt += 'be動詞 + 〜ing 形で進行形「〜しているところ」。';
        else if (pv && pv.k === 'hv' && w0 === first(vtext(e3, 'pp'))) txt += 'have + 過去分詞で完了形。' + b + ' の過去分詞は ' + w0 + '。';
        else if (pv && pv.k === 'be' && w0 === first(vtext(e3, 'pp'))) txt += 'be動詞 + 過去分詞で受け身「〜される」。';
        else if (w0 === pa && w0 !== b) txt += '過去のことなので過去形:' + b + ' → ' + w0 + '。' + (irr ? 'これは形が不規則に変わる動詞(不規則動詞)。' : 'ふつうの動詞は -ed を付ける。');
        else if (w0 !== b) txt += '主語が he / she / it や1人・1つで、今のこと(いつもすること)のときは -s を付ける(三人称単数現在):' + b + ' → ' + w0 + '。';
        else txt += pv && (pv.k === 'modal' || pv.k === 'sm' || pv.k === 'not') ? '助動詞のうしろなので原形(元の形)のまま。' : '主語が I / you / 複数で今のことなので、元の形のまま。';
      }
      else if (pos === '形容詞') txt = '様子を表す言葉(' + (c.w.e.ja || '') + ')。名詞の前に置いて名詞をくわしくするか、be動詞のうしろで主語の様子を言う。';
      else if (pos === '副詞') txt = c.w.k === 'deg' ? '「とても」。形容詞の前に置いて強める。' : '動詞や文をくわしくする言葉(' + (c.w.e.ja || '') + ')。' + (c.w.e.k === 'time' ? '時を表す副詞は文の最後に置くのが基本。' : c.w.e.k === 'place' ? '場所を表す副詞。前置詞はいらない。' : '様子を表す副詞は動詞(と目的語)のうしろに置くのが基本。');
      else if (pos === '否定') txt = '「〜ない」。be動詞・助動詞のうしろに置く。ふつうの動詞のときは do / does / did + not にする。';
      else if (pos === '接続詞') txt = { and: '「そして」。', but: '「でも」。', so: '「だから」。', when: '「〜するとき」。', 'if': '「もし〜なら」。', because: '「〜だから」。' }[c.w.v] + 'うしろに「主語 + 動詞」の文が続く。';
      else if (pos === '関係代名詞') txt = '前の名詞を、うしろの文で説明するときのつなぎ(who は人、which はもの、that はどちらにも使える)。';
      var fixed = R0.fixK && R0.fixK[k];
      out.push({ w: x.t, pos: pos, auto: fixed ? (x.auto ? true : 'form') : (x.auto || (c && cardText(c).toLowerCase() !== t)) ? 'rule' : false, txt: txt });
    });
    return out;
  }
  function reviewItems(row, ev) { var R0 = chunksOf(row, ev); return R0 && R0.chunks.length ? R0 : null; }
  function showReview(R0) {
    return new Promise(function (done) {
      var o = el('div', 'modal'); root.appendChild(o); var idx = -1, chs = R0.chunks; R0.fixK = {}; improvements(R0).forEach(function (m) { R0.fixK[m.k] = 1; });
      function line(hi) { return chs.map(function (ch, i) { var r = ROLE[ch.role] || ROLE.other; return '<span class="ck ' + r.c + (i === hi ? ' hi' : '') + (hi >= 0 && i !== hi ? ' dim' : '') + '"><b>' + (i === 0 ? ch.text.charAt(0).toUpperCase() + ch.text.slice(1) : ch.text) + '</b><small>' + r.n + '</small></span>'; }).join('') + '<span class="ck dot">.</span>'; }
      function close() { o.remove(); done(); }
      function page() {
        var body, btn;
        if (idx < 0) {
          body = '<h2>📖 この文を分解しよう</h2><div class="cks">' + line(-1) + '</div>' +
            '<p class="lead">英語の文は、意味のかたまり(<b>チャンク</b>)を決まった順番に並べて作る。<br>基本の順番:<b>主語 → 動詞 → 目的語・補語 → 場所 → 時</b></p>' +
            '<p class="lead">この文の型:<b>' + yaku(R0.ev.f).name + '</b></p><p class="sm">チャンクごとに、中の1語1語の品詞と、なぜその形なのかを見ていこう。「置き忘れ」「選びなおし」はあなたが直す所。「自動で変わる形」は主語などに合わせて決まるルール(まちがいではない)。</p>';
          btn = 'くわしく見る';
        } else if (idx < chs.length) {
          var ch = chs[idx], r = ROLE[ch.role] || ROLE.other, notes = wordNotes(ch, R0);
          body = '<h2>' + (idx + 1) + '. ' + r.n + (r.m ? '<small>' + r.m + '</small>' : '') + '</h2><div class="cks">' + line(idx) + '</div>' +
            '<div class="big"><b>' + ch.text + '</b>' + (ch.ja ? '<span>' + ch.ja + '</span>' : '') + '</div>' +
            (r.d ? '<p class="lead">' + (ch.cl === 'second' ? '(2つ目の文)' : ch.cl === 'front' ? '(前おきの文の中)' : '') + r.d + '</p>' : '') +
            (notes.length ? '<ul class="wn">' + notes.map(function (n) { return '<li><div class="wh"><b>' + n.w + '</b><i>' + n.pos + '</i>' + (n.auto === true ? '<u>置き忘れ</u>' : n.auto === 'form' ? '<u>選びなおし</u>' : n.auto === 'rule' ? '<u class="ru">自動で変わる形</u>' : '') + '</div>' + n.txt + '</li>'; }).join('') + '</ul>' : '');
          btn = idx + 1 < chs.length ? 'つぎのチャンクへ' : 'まとめへ';
        } else {
          var pts = []; chs.forEach(function (ch) { wordNotes(ch, R0).forEach(function (n) { if (n.auto === true || n.auto === 'form') pts.push('<li><b>' + n.w + '</b>(' + n.pos + ')</li>'); }); });
          body = '<h2>まとめ</h2><div class="cks">' + line(-1) + '</div><p class="lead">' + chs.map(function (c) { return '<b>' + (ROLE[c.role] || ROLE.other).n + '</b>'; }).join(' → ') + '</p>' +
            (pts.length ? '<p class="sm">今回の置き忘れ・選びなおし:</p><ul class="pts">' + pts.join('') + '</ul><p class="sm">次は、この部品も自分でカードを置いてみよう。</p>' : '<p class="sm">補った語はなし。完ぺき!</p>');
          btn = 'おわり';
        }
        o.innerHTML = '<div class="box rv">' + body + '<div class="rvb"><button class="btn ghost small" id="cl">解説をやめる</button><button class="btn go" id="nx">' + btn + '</button></div><div class="pg">' + (idx + 2) + ' / ' + (chs.length + 2) + '</div></div>';
        $('#nx', o).onclick = function () { SFX.tap(); idx++; if (idx > chs.length) close(); else page(); };
        $('#cl', o).onclick = close;
        if (idx >= 0 && idx < chs.length) speak(chs[idx].text);
      }
      page();
    });
  }
  // ---- 初級:10秒止まったら、次に必要なカードを光らせる ----
  function armIdle() {
    clearTimeout(G_.idleT); G_.needId = null; if (G_.hand) Array.prototype.forEach.call(G_.hand.querySelectorAll('.need'), function (e) { e.classList.remove('need'); });
    if (LEVEL !== 0 || !G_.hand) return;
    G_.idleT = setTimeout(idleHint, 10000);
  }
  function idleHint() {
    if (LEVEL !== 0 || G_.busy || G_.mode !== 'play' || !G_.hand || !document.body.contains(G_.hand)) return;
    var cards = R.hand.concat(R.row.filter(function (c) { return !c.tsu; }));
    var best = window.ChunkVS && window.ChunkVS._search ? window.ChunkVS._search(cards, null, 1, 220) : null;
    if (!best) { if (G_.hp) G_.hp.innerHTML = '<div class="hrow">💡 ' + diagnose(cards) + '</div>'; return; }
    var inRow = {}; R.row.forEach(function (c) { inRow[c.id] = 1; });
    var miss = best.row.filter(function (c) { return !c.tsu && !inRow[c.id]; });
    var noAdj = function (c) { return c.w.k !== 'adj' && c.w.k !== 'adv'; }, pick0 = miss.filter(function (c) { return G_.nxH && G_.nxH[c.id] && noAdj(c); })[0] || miss.filter(noAdj)[0] || miss[0];
    if (!pick0) { if (G_.hp && cur && cur.state !== 'ok') G_.hp.innerHTML = '<div class="hrow">💡 カードはそろっている。並べる順番を見直そう(主語 → 動詞 → 目的語 → 場所 → 時)</div>'; return; }
    var idx = best.row.indexOf(pick0), role = roleOf(best.row, idx) || '';
    G_.needId = pick0.id;
    Array.prototype.forEach.call(G_.hand.children, function (e) { var c = R.hand[+e.dataset.i]; if (c && c.id === pick0.id) e.classList.add('need'); });
    if (G_.hp) G_.hp.innerHTML = '<div class="hrow need">💡 次はこのカード:<b>' + cardText(pick0) + '</b>' + (role ? '(' + role + ')' : '') + '</div>' + G_.hp.innerHTML;
    SFX.joker();
  }
  // ---- 初級:置き忘れた語・直した形を、まず必ず解説する ----
  // 「直した」に出すのは、本人が選べたのに置き忘れた・選びまちがえた所だけ。
  // 三単現の -s・him/her・is/are・do-support のような「カードの仕組みで自動に決まる形」は出さない(全体の解説でルールとして説明)
  function vCat(c, tok, row, i) {
    var e = c.w.e, t = first(tok), pv = prevCore(row.map(function (z) { return z.w; }), i);
    if (t === first(vtext(e, 'ing'))) return 'ing';
    if (t === first(vtext(e, 'pp')) && pv && (pv.k === 'be' || pv.k === 'hv')) return 'pp';
    if (t === first(vtext(e, 'past')) && t !== first(vtext(e, 'base'))) return 'past';
    return 'base';
  }
  function improvements(R0) {
    var out = [], seq = R0.seq, row = R0.row;
    seq.forEach(function (x, k) {
      var c = x.auto ? null : row[x.card], t = x.t.toLowerCase();
      if (x.auto) { if (/^(do|does|did)$/.test(t)) return; out.push({ k: k, kind: 'miss', w: x.t, pos: posOf(x, null), why: needWhy(x, k, R0) }); return; }
      if (!c || c.w.k !== 'v') return;
      var want = vCat(c, x.t, row, x.card), have = c.w.f || 'base';
      if (want === 'base' || want === have) return;
      if (vtext(c.w.e, have) === x.t) return; // 見た目が同じ形(filled の過去形と過去分詞など)は取りちがえにしない
      out.push({ k: k, kind: 'form', w: x.t, from: cardText(c), pos: posOf(x, c), why: formWhy(c, x, R0) });
    });
    return out;
  }
  function nextNoun(seq, k, row) { for (var j = k + 1; j < seq.length; j++) if (!seq[j].auto) { var c = row[seq[j].card]; if (c && c.w.k === 'n') return c; if (c && !/^(adj|det)$/.test(c.w.k)) return null; } return null; }
  function needWhy(x, k, R0) {
    var t = x.t.toLowerCase(), n = nextNoun(R0.seq, k, R0.row), nw = n ? n.w.e.w : '', cat = n ? n.w.e.cat : '';
    if (t === 'a' || t === 'an') return '「' + nw + '」は数えられる名詞。英語では、数えられる名詞を1つだけ言うとき、前に a / an / the などがかならず必要(名詞だけをポンと置くことはできない)。ここでは「ある1つの」なので ' + t + (t === 'an' ? '(母音で始まるので a ではなく an)' : '') + '。';
    if (t === 'the') return '「' + nw + '」の前に冠詞が必要。' + (/^(place|time)$/.test(cat) ? nw + ' のような場所・時間帯は「いつもの・その」と決まったものなので the を付ける。' : '話の中で「どれのことか」決まっているものには the を付ける。');
    if (/^(in|on|at|to)$/.test(t)) return '「' + nw + '」を' + (cat === 'time' ? '「いつ」' : '「どこで・どこへ」') + 'として使うには、前に前置詞が必要。前置詞がないと、' + nw + ' が動詞の「何を」(目的語)のように読まれてしまう。' + (t === 'on' ? '曜日・日付は on。' : t === 'at' ? (cat === 'time' ? '時刻など「時の1点」は at。' : '駅など「地点」は at。') : t === 'to' ? '移動の動詞(go など)の行き先は to。' : cat === 'time' ? '朝・午後・月など「幅のある時間」は in。' : '公園・町など「広がりのある場所の中」は in。');
    if (/^(am|is|are|was|were)$/.test(t)) return '英語の文には動詞がかならず1つ必要。形容詞(happy など)は動詞ではないので、主語とつなぐ be動詞を入れる。主語に合わせて ' + t + '(I → am、he・she → is、you・複数 → are、過去は was / were)。';
    if (t === 'will') return 'tomorrow など「これから先」の時の言葉があるので、未来を表す助動詞 will(〜するだろう・〜するつもり)を動詞の前に補った。will のうしろの動詞は原形(元の形)。';
    if (/^(do|does|did)$/.test(t)) return 'ふつうの動詞を not で打ち消すときは、動詞の前に do / does / did が必要。主語が he・she なら does、過去なら did。';
    return '文をつなぐために「' + x.t + '」が必要。';
  }
  function formWhy(c, x, R0) {
    var k = c.w.k, t = x.t.toLowerCase(), base = cardText(c).toLowerCase(), row = R0.row;
    if (k === 'v') {
      var e = c.w.e, b = first(vtext(e, 'base')), w0 = first(t), pa = first(vtext(e, 'past'));
      var timeW = row.filter(function (z) { return z.w.k === 'adv' && z.w.e.k === 'time'; }).map(function (z) { return z.w.e.w; })[0];
      if (w0 === pa && w0 !== b) return (timeW ? '「' + timeW + '」があるので過去のこと。' : '過去のことなので、') + '動詞を過去形にする:' + b + ' → ' + w0 + '。英語は「〜した」を動詞の形で表す。';
      if (w0 === first(vtext(e, 'ing'))) return 'be動詞のあとは -ing 形で「〜しているところ」(進行形)。';
      if (w0 === first(vtext(e, 'pp'))) return 'have / be のあとは過去分詞(完了形・受け身)。';
      var subj = row.filter(function (z) { return z.w.k === 'pr' || z.w.k === 'n'; })[0];
      return '主語「' + (subj ? cardText(subj) : '') + '」は自分・相手以外の1人(1つ)で、今のこと。このとき動詞に -s を付ける(三人称単数現在):' + b + ' → ' + w0 + '。';
    }
    if (k === 'pr') return '「' + base + '」は動詞(または前置詞)のうしろにあるので、「〜を・〜に」の形にする:' + base + ' → ' + t + '。';
    if (k === 'be') return 'be動詞は主語と時に合わせて形が決まる:I am / he・she is / you・複数 are / 過去は was・were。ここでは ' + t + '。';
    if (k === 'hv') return '主語が he / she / 1つなら has、過去なら had にする。';
    return '形を直した。';
  }
  function showImprove(R0, imps) {
    return new Promise(function (done) {
      var o = el('div', 'modal'); root.appendChild(o); var i = 0, seq = R0.seq;
      var mine = R0.row.map(cardText).join(' ');
      function sent(hk) { return seq.map(function (x, k) { var t = k === 0 ? x.t.charAt(0).toUpperCase() + x.t.slice(1) : x.t, im = imps.some(function (m) { return m.k === k; }); return '<span class="st' + (im ? ' im' : '') + (k === hk ? ' hi' : '') + '">' + t + '</span>'; }).join(' ') + '.'; }
      function page() {
        var m = imps[i];
        o.innerHTML = '<div class="box rv imp"><h2>✏️ ここを直したよ ' + (i + 1) + ' / ' + imps.length + '</h2>' +
          '<div class="cmp"><div><small>あなたの並べ方</small><p>' + mine + '</p></div><div><small>正しい文</small><p>' + sent(m.k) + '</p></div></div>' +
          '<div class="big"><b>' + (m.kind === 'form' ? m.from + ' → ' + m.w : '+ ' + m.w) + '</b><span>' + m.pos + (m.kind === 'miss' ? '・置き忘れ' : '・形の直し') + '</span></div>' +
          '<p class="lead">' + m.why + '</p><div class="rvb"><button class="btn ghost small" id="sk">とばす</button><button class="btn go" id="nx">' + (i + 1 < imps.length ? 'つぎへ' : 'わかった') + '</button></div></div>';
        $('#nx', o).onclick = function () { SFX.tap(); i++; if (i >= imps.length) { o.remove(); done(); } else page(); };
        $('#sk', o).onclick = function () { o.remove(); done(); };
      }
      page();
    });
  }
  function askFull() {
    return new Promise(function (done) {
      var o = el('div', 'modal', '<div class="box rv"><h2>📖 文全体の解説</h2><p class="lead">この文をチャンクに分けて、1語ずつ品詞と働きを見ていく?</p><div class="rvb"><button class="btn ghost small" id="n">今回は見ない</button><button class="btn go" id="y">見る</button></div></div>');
      root.appendChild(o); $('#y', o).onclick = function () { o.remove(); done(true); }; $('#n', o).onclick = function () { o.remove(); done(false); };
    });
  }
  async function reviewFlow(R0, noAsk) { var imps = improvements(R0); if (imps.length) await showImprove(R0, imps); if (noAsk || await askFull()) await showReview(R0); }
  // 出したあと:初級・中級は「直した所」をすぐ見せて全体の解説を聞く。上級は見たい人だけ
  async function reviewAfter(R0) {
    if (LEVEL < 2) return reviewFlow(R0);
    var imps = improvements(R0);
    var yes = await new Promise(function (done) { var o = el('div', 'modal', '<div class="box rv"><h2>📖 この文の解説</h2><p class="lead">' + (imps.length ? '直した所が ' + imps.length + ' か所ある。' : '') + '解説を見る?</p><div class="rvb"><button class="btn ghost small" id="n">見ない</button><button class="btn go" id="y">見る</button></div></div>'); root.appendChild(o); $('#y', o).onclick = function () { o.remove(); done(true); }; $('#n', o).onclick = function () { o.remove(); done(false); }; });
    if (yes) { if (imps.length) await showImprove(R0, imps); await showReview(R0); }
  }
  // 今回出した文の記録(あとでふりかえる)
  function snap(row) { return row.map(function (c) { var n = {}; for (var k in c) n[k] = c[k]; n.w = {}; for (var j in c.w) n.w[j] = c.w[j]; return n; }); }
  function recordHist(list, row, ev, score) { if (ev && ev.state === 'ok') list.push({ row: snap(row), text: ev.text, score: score, lv: LEVEL }); }
  function histModal(list) {
    var o = el('div', 'modal', '<div class="box rv"><h2>📚 今回の文をふりかえる</h2><p class="sm">タップすると、その文の「直した所」と全体の解説が見られる。</p><div class="hist" id="hl"></div><button class="btn go" id="ok">とじる</button></div>');
    root.appendChild(o);
    list.forEach(function (h, i) {
      var e = el('div', 'hi1', '<span>' + (i + 1) + '</span><b>' + h.text + '</b><i>' + (h.score != null ? h.score.toLocaleString() + '点' : '') + '</i>');
      e.onclick = async function () { var keep = LEVEL; setLevel(h.lv); var ev = evaluate(h.row), R0 = reviewItems(h.row, ev); if (R0) { o.style.display = 'none'; await reviewFlow(R0, true); o.style.display = ''; } else flash('この文は解説できない'); setLevel(keep); };
      $('#hl', o).appendChild(e);
    });
    $('#ok', o).onclick = function () { o.remove(); };
  }
  function errMsg(ev, row) { var m = ev.msg || '', a = /語順|つながらない|まだ文/.test(m) ? advise(row) : ''; return (ev.state === 'bad' ? '✕ ' : '… ') + m + (a ? ' → ' + a : ''); }
  // ---- 指の操作:タップ/ドラッグで好きな場所へ差し込む/上フリックで台へ/下フリックで手札へ ----
  var drag = null;
  function gapAt(x, y, self) {
    var els = Array.prototype.filter.call(G_.row.querySelectorAll('.card'), function (n) { return n !== self; });
    if (!els.length) return { i: 0, el: null, after: false };
    var rs = els.map(function (n) { return n.getBoundingClientRect(); });
    var line = rs.filter(function (r) { return y >= r.top - 10 && y <= r.bottom + 10; });
    if (!line.length) { if (y < rs[0].top) return { i: +els[0].dataset.i, el: els[0], after: false }; var lk = els.length - 1; return { i: R.row.length, el: els[lk], after: true }; }
    for (var k = 0; k < els.length; k++) { var r = rs[k]; if (y >= r.top - 10 && y <= r.bottom + 10 && x < r.left + r.width / 2) return { i: +els[k].dataset.i, el: els[k], after: false }; }
    var lastIn = els[rs.indexOf(line[line.length - 1])]; return { i: +lastIn.dataset.i + 1, el: lastIn, after: true };
  }
  function overRow(x, y) { var b = G_.row.getBoundingClientRect(); return x >= b.left - 6 && x <= b.right + 6 && y >= b.top - 14 && y <= b.bottom + 14; }
  function caret(g) {
    var c = G_.caret; if (!g) { if (c) c.style.display = 'none'; return; }
    if (!c) { c = G_.caret = el('div', 'caret'); }
    if (c.parentNode !== G_.row) G_.row.appendChild(c);
    var rb = G_.row.getBoundingClientRect(); c.style.display = 'block';
    if (!g.el) { c.style.left = '4px'; c.style.top = '2px'; c.style.height = '70px'; return; }
    var r = g.el.getBoundingClientRect(); c.style.left = ((g.after ? r.right + 1 : r.left - 4) - rb.left) + 'px'; c.style.top = (r.top - rb.top) + 'px'; c.style.height = r.height + 'px';
  }
  function cardPress(ev, c, e, from, spec) {
    if (G_.busy) return;
    var d = drag = { c: c, e: e, from: from, spec: spec, x: ev.clientX, y: ev.clientY, t: Date.now(), moved: false, ghost: null };
    e.setPointerCapture && e.setPointerCapture(ev.pointerId);
    e.onpointermove = function (m) {
      if (drag !== d) return; var dx = m.clientX - d.x, dy = m.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 8) { d.moved = true; if (from === 'row') e.classList.add('drag'); else { d.ghost = e.cloneNode(true); d.ghost.classList.add('ghost'); var r = e.getBoundingClientRect(), rr = root.getBoundingClientRect(); d.ghost.style.left = (r.left - rr.left) + 'px'; d.ghost.style.top = (r.top - rr.top) + 'px'; root.appendChild(d.ghost); e.style.opacity = .35; } }
      if (!d.moved) return;
      var tf = 'translate(' + dx + 'px,' + (dy - 46) + 'px) scale(1.08)'; if (from === 'row') e.style.transform = tf; else d.ghost.style.transform = tf; // 指で隠れないよう少し上に
      if (G_.mode === 'play' && overRow(m.clientX, m.clientY)) caret(gapAt(m.clientX, m.clientY, from === 'row' ? e : null)); else caret(null);
    };
    e.onpointerup = e.onpointercancel = function (u) {
      if (drag !== d) return; drag = null; e.onpointermove = e.onpointerup = e.onpointercancel = null; caret(null);
      if (d.ghost) d.ghost.remove(); e.style.opacity = ''; e.style.transform = ''; e.classList.remove('drag');
      var dx = u.clientX - d.x, dy = u.clientY - d.y, dt = Date.now() - d.t, flickUp = dy < -35 && Math.abs(dy) > Math.abs(dx) * 1.2 && dt < 350, flickDown = dy > 35 && Math.abs(dy) > Math.abs(dx) * 1.2 && dt < 350;
      if (!d.moved) return tapCard(c, from, spec);
      if (G_.mode !== 'play') { if (from === 'hand') tapCard(c, from, spec); return; }
      var into = overRow(u.clientX, u.clientY);
      if (from === 'row') {
        if (into) { var g = gapAt(u.clientX, u.clientY, e), fi = R.row.indexOf(c), to = g.i; R.row.splice(fi, 1); if (to > fi) to--; R.row.splice(Math.max(0, Math.min(R.row.length, to)), 0, c); SFX.put(); renderRow(); return; }
        if (flickDown || u.clientY > G_.row.getBoundingClientRect().bottom + 20) { R.row.splice(R.row.indexOf(c), 1); if (!c.tsu) R.hand.push(c); SFX.tap(); renderRow(); renderHand(); return; }
        renderRow(); return;
      }
      var nc = from === 'tsu' ? tsuCard(spec) : c;
      if (into) { var g2 = gapAt(u.clientX, u.clientY, null); if (from === 'hand') R.hand.splice(R.hand.indexOf(c), 1); R.row.splice(Math.max(0, Math.min(R.row.length, g2.i)), 0, nc); SFX.put(); renderRow(); renderHand(); return; }
      if (flickUp) { if (from === 'hand') R.hand.splice(R.hand.indexOf(c), 1); R.row.push(nc); SFX.put(); renderRow(); renderHand(); return; }
    };
  }
  function tapCard(c, from, spec) {
    if (G_.busy) return;
    if (from === 'row') { if (cyclable(c)) { cycle(c); SFX.tap(); renderRow(); renderHand(); } return; }
    if (from === 'tsu') { SFX.put(); R.row.push(tsuCard(spec)); renderRow(); return; }
    if (G_.mode === 'disc') { var k = G_.mark.indexOf(c); if (k >= 0) G_.mark.splice(k, 1); else G_.mark.push(c); SFX.tap(); renderHand(); renderBtns(); return; }
    if (G_.mode === 'refill') { flash('先に補充しよう(山から引く/場から取る)'); return; }
    SFX.put(); R.hand.splice(R.hand.indexOf(c), 1); R.row.push(c); renderRow(); renderHand();
  }

  var cur = null;
  function updatePreview() {
    var ev = cur = evaluate(R.row);
    hintPanel(); if (G_.jt) G_.jt.textContent = ev.state === 'ok' && ev.ja ? ev.ja : '';
    if (G_.vs) return G_.vs.preview(ev);
    G_.sent.className = 'sent ' + ev.state; G_.msg.textContent = '';
    if (ev.state === 'empty') { G_.sent.textContent = ''; G_.yk.textContent = ''; G_.ch.textContent = '0'; G_.ml.textContent = '0'; if (G_.bp) G_.bp.disabled = true; return; }
    if (ev.state === 'ok') {
      var ctx = { first: R.first, last: R.hands === 1 }, sc = scoreOf(ev, ctx), y = sc.y;
      G_.sent.textContent = ev.text; G_.yk.textContent = '役:' + y.name + '(' + ev.f.words + '語)';
      G_.ch.textContent = sc.chips; G_.ml.textContent = sc.mult;
      G_.msg.innerHTML = notes(ev.f, sc.rep);
      if (sc.bossFail) G_.msg.textContent = '👹 ' + R.boss.text;
      if (G_.bp) G_.bp.disabled = G_.mode !== 'play';
    } else {
      G_.sent.textContent = rowText(R.row); G_.yk.textContent = ''; G_.ch.textContent = '–'; G_.ml.textContent = '–';
      G_.msg.textContent = errMsg(ev, R.row); if (G_.bp) G_.bp.disabled = true;
    }
  }
  // 場:捨て札は表向き。補充のときは、点数ぶんの捨て札ptで取れる
  function renderField() {
    G_.fd.innerHTML = ''; G_.pt.textContent = R.pts;
    if (!R.field.length) G_.fd.appendChild(el('div', 'ph', 'まだ何も捨てていない'));
    R.field.forEach(function (c) {
      var e = cardEl(c, 'field', 0), cost = c.chips + c.bonus, can = G_.mode === 'refill' && R.pts >= cost; e.classList.add('mini'); if (G_.mode === 'refill') e.classList.add(can ? 'can' : 'cant');
      e.onclick = function () { if (G_.mode !== 'refill') { flash('捨てたあとの補充で、' + cost + 'pt 払うと取れる'); return; } if (!Core.take(c)) { SFX.bad(); flash('捨て札ptが足りない(' + cost + 'pt 必要)'); return; } SFX.coin(); afterRefill(); };
      G_.fd.appendChild(e);
    });
    G_.fh.textContent = G_.mode === 'refill' ? 'あと ' + R.refill + ' 枚:山から引く か、場のカードをタップして取る' : '';
  }
  function renderBtns() {
    if (G_.vs) return G_.vs.btns();
    G_.bt.innerHTML = ''; var b = function (cls, txt, fn, dis) { var x = el('button', 'btn ' + cls, txt); x.onclick = fn; x.disabled = !!dis; G_.bt.appendChild(x); return x; };
    if (G_.mode === 'disc') { b('ghost', 'やめる', function () { G_.mode = 'play'; G_.mark = []; SFX.tap(); renderAll(); }); b('disc', G_.mark.length ? G_.mark.length + '枚 捨てる' : '捨てるカードをえらぶ', doDiscard, !G_.mark.length); return; }
    if (G_.mode === 'refill') { b('ghost', '山から引く(あと' + R.refill + ')', function () { Core.drawOne(); SFX.put(); afterRefill(); }); b('go', 'ぜんぶ山から', function () { while (R.refill > 0) Core.drawOne(); SFX.put(); afterRefill(); }); return; }
    G_.bd = b('disc', '捨てる', function () { if (!R.discards) { flash('このステージではもう捨てられない'); return; } G_.mode = 'disc'; G_.mark = []; SFX.tap(); renderAll(); }, !R.discards || G_.busy);
    G_.bp = b('play', '出す!', play, !cur || cur.state !== 'ok' || G_.busy); G_.bp.id = 'bp'; G_.bd.id = 'bd';
  }
  function doDiscard() { if (!G_.mark.length) return; Core.discard(G_.mark.slice()); G_.mark = []; G_.mode = 'refill'; SFX.tap(); renderAll(); }
  function afterRefill() { if (R.refill <= 0) G_.mode = 'play'; renderAll(); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function bump(n) { n.classList.remove('bump'); void n.offsetWidth; n.classList.add('bump'); }
  async function play() {
    if (G_.busy || !cur || cur.state !== 'ok' || G_.mode !== 'play') return; G_.busy = true; renderBtns();
    var ctx = { first: R.first, last: R.hands === 1 }, sc = scoreOf(cur, ctx), text = cur.text;
    speak(text); R.first = false; R.hands--; R.played++; renderTop();
    // 役 → カード1枚ずつ → ジョーカー の順に数字が上がっていく
    var cards = G_.row.querySelectorAll('.card'), jks = G_.jk.querySelectorAll('.joker');
    for (var k = 0; k < sc.steps.length; k++) {
      var st = sc.steps[k];
      if (st.t === 'yaku') { G_.yk.textContent = '役:' + st.label; bump(G_.yk); SFX.mult(0); await wait(380); }
      if (st.t === 'card') { var ce = cards[st.i]; if (ce) { ce.classList.add('hit'); floatTxt(ce, '+' + st.add + (st.tag ? ' ' + st.tag : ''), 'c'); } SFX.chip(k); await wait(150); }
      if (st.t === 'note') { floatTxt(G_.yk, st.txt, 'x'); SFX.bad(); await wait(500); }
      if (st.t === 'joker') { var je = jks[st.ji]; if (je) { bump(je); floatTxt(je, st.txt, /×/.test(st.txt) ? 'x' : /倍/.test(st.txt) ? 'm' : 'c'); } SFX.joker(); await wait(420); }
      G_.ch.textContent = st.chips; G_.ml.textContent = st.mult; bump(G_.ch); bump(G_.ml);
    }
    if (sc.bossFail) { G_.msg.textContent = '👹 ボスの条件を満たしていない… 0点'; SFX.bad(); await wait(900); }
    var total = sc.total; await countUp(total);
    clearTimeout(G_.idleT); recordHist(R.hist = R.hist || [], R.row, cur, total);
    var rv = reviewItems(R.row, cur); if (rv) await reviewAfter(rv);
    if (total > R.best.pts) R.best = { text: text, pts: total };
    R.total += total; afterPlay(cur, sc); R.hintLv = 0; G_.hintBest = null; G_.hintIds = {};
    R.disc = R.disc.concat(R.row.filter(function (c) { return !c.tsu; })); R.row = [];
    await wait(350); deal(); G_.busy = false;
    if (R.score >= R.target) { stageClear(); return; }
    if (R.hands <= 0) { finalReveal(); return; }
    renderAll();
  }
  // 出したあと:役のくり返し・話のつながり・お題・名コンビ図鑑・ゲストのスカウト
  function afterPlay(ev, sc) {
    R.yakuCnt[sc.y.name] = (R.yakuCnt[sc.y.name] || 0) + 1; R.prev = ev.nps; R.stageF.push(ev.f);
    var got = [];
    R.missions.forEach(function (x) { if (!x.done && missionHit(x.m, ev.f)) { x.done = true; var g = x.m.tier + 1; R.money += g; got.push('🎯「' + x.m.label + '」達成 💰+' + g); } });
    if (got.length && R.missions.every(function (x) { return x.done; })) { R.money += 3; got.push('🎯 お題ぜんぶ達成! 💰+3'); }
    got.forEach(function (t, i) { setTimeout(function () { flash(t); SFX.coin(); renderTop(); }, 300 + i * 1900); });
    if (ev.f.colloc === 'good' && addCombo(ev.f.pair)) { R.money++; flash('📖 名コンビ図鑑に登録!「' + ev.f.pair + '」💰+1'); }
    R.row.forEach(function (c) { if (c.guest) { c.guest = false; c.scout = true; R.deck.push(c); setTimeout(function () { flash('⭐ スカウト!「' + cardText(c) + '」が山札に入った'); }, 900); } });
  }
  function addCombo(pair) { var l = store.get('combos') || []; if (l.indexOf(pair) >= 0) return false; l.push(pair); store.set('combos', l); return true; }
  // ---- シークレットお題 ----
  var QUESTS = [
    ['past', '過去形', 0], ['neg', '否定(not)', 0], ['place', '場所の句', 0], ['time', '時の句', 0], ['adj', '形容詞', 0], ['O', '目的語', 0],
    ['prog', '進行形', 1], ['aux', '助動詞', 1], ['clause', 'because / when / if', 1], ['C', '補語(be + 形容詞など)', 1], ['story', '話のつながり', 1], ['combo', '名コンビ', 1],
    ['perfect', '完了形', 2], ['passive', '受け身', 2], ['post', '後置修飾', 2], ['phrasal', '句動詞', 2], ['gerund', '動名詞', 2], ['padj', '分詞の形容詞', 2]
  ].map(function (q) { return { k: q[0], label: q[1], tier: q[2] }; });
  // 普通のお題(中身が見える)
  var MISSIONS = [
    ['food', '食べ物か飲み物の名詞を使う', 0, function (f) { return f.cats.food || f.cats.drink; }],
    ['animal', '動物の名詞を使う', 0, function (f) { return f.cats.animal; }],
    ['placeN', '場所の名詞を使う', 0, function (f) { return f.cats.place; }],
    ['art2', 'a と the を両方使う', 0, function (f) { return f.det_a && f.det_the; }],
    ['len6', '6語以上の文', 0, function (f) { return f.words >= 6; }],
    ['len4', 'ちょうど4語の文', 1, function (f) { return f.words === 4; }],
    ['nounSubj', '主語を代名詞以外にする', 1, function (f) { return !f.pronSubj; }],
    ['pastProg', '過去進行形(was/were + -ing)', 1, function (f) { return f.past && f.prog; }],
    ['this', 'this / that を使う', 1, function (f) { return f.det_this || f.det_that; }],
    ['adj2', '形容詞を2つ使う', 1, function (f) { return f.adj >= 2; }],
    ['plural', '名詞の複数形を使う', 1, function (f) { return f.plural; }],
    ['rare2', 'むずかしい語を2枚使う', 2, function (f) { return f.rare >= 2; }],
    ['guest', '金枠のゲストカードを使う', 2, function (f) { return f.guest; }],
    ['len8', '8語以上の文', 2, function (f) { return f.words >= 8; }],
    ['it', 'it を使う', 2, function (f) { return f.it; }],
    ['opt', '目的語+場所+時 を1文に', 2, function (f) { return f.O && f.place && f.time; }]
  ].map(function (m) { return { k: m[0], label: m[1], tier: m[2], t: m[3] }; });
  function pickMissions(used, n) {
    var tiers = n === 1 ? [Math.floor(rnd() * 3)] : [0, 1, 2];
    return tiers.map(function (t) { var pool = MISSIONS.filter(function (m) { return m.tier === t && used.indexOf(m.k) < 0; }); if (!pool.length) { pool = MISSIONS.filter(function (m) { return m.tier === t; }); } var m = pick(pool); used.push(m.k); return { m: m, done: false }; });
  }
  function missionHit(m, f) { try { if (m.t(f)) return true; if (!f.sub) return false; var g = {}; for (var k in f) g[k] = f[k]; for (var j in f.sub) g[j] = true; return !!m.t(g); } catch (e) { return false; } }
  var Q_PCT = [10, 20, 30], TIER_JA = ['やさしい', 'ふつう', 'むずかしい'];
  function questHit(q, f) { return q.k === 'story' ? !!(f.story || f.storyP) : q.k === 'adj' ? f.adj > 0 : !!(f[q.k] || (f.sub && f.sub[q.k])); }
  function pickQuest(used) {
    var cands = [0, 1, 2].map(function (t) { var pool = QUESTS.filter(function (q) { return q.tier === t && used.indexOf(q.k) < 0; }); if (!pool.length) pool = QUESTS.filter(function (q) { return q.tier === t; }); return pick(pool); });
    var secret = pick(cands); used.push(secret.k); return { cands: cands, secret: secret };
  }
  function questBar(Q, fs) {
    return '🔒 シークレットお題(このうちどれか1つ):' + Q.cands.map(function (q) { var hit = fs.some(function (f) { return questHit(q, f); }); return '<span class="qc t' + q.tier + (hit ? ' hit' : '') + '">' + (hit ? '✔ ' : '') + q.label + '</span>'; }).join('');
  }
  async function finalReveal() {
    var Q = R.quest, hit = R.stageF.some(function (f) { return questHit(Q.secret, f); }), bonus = hit ? Math.round(R.target * Q_PCT[Q.secret.tier] / 100) : 0;
    var o = el('div', 'modal', '<div class="box"><h2>🔒 シークレットお題は…</h2><div class="qrev t' + Q.secret.tier + '">' + Q.secret.label + '</div><p class="res ' + (hit ? 'w' : 'l') + '">' + (hit ? '達成! 目標の' + Q_PCT[Q.secret.tier] + '% = +' + bonus + '点' : '出していなかった…') + '</p><button class="btn go" id="ok">つづける</button></div>');
    root.appendChild(o); if (hit) SFX.win(); else SFX.bad();
    await new Promise(function (r) { $('#ok', o).onclick = r; }); o.remove();
    R.questDone = true;
    if (hit) { await countUp(bonus); R.total += bonus; }
    if (R.score >= R.target) { flash('🎉 逆転クリア!'); stageClear(); } else gameOver();
  }
  function floatTxt(target, txt, kind) { var r = target.getBoundingClientRect(), rr = root.getBoundingClientRect(), f = el('div', 'float ' + kind, txt); f.style.left = (r.left - rr.left + r.width / 2) + 'px'; f.style.top = (r.top - rr.top) + 'px'; root.appendChild(f); setTimeout(function () { f.remove(); }, 900); }
  async function countUp(total) {
    var from = R.score, to = R.score + total, big = el('div', 'bigscore', '0'); root.appendChild(big);
    var steps = 18; for (var i = 1; i <= steps; i++) { big.textContent = Math.round(total * i / steps).toLocaleString(); R.score = Math.round(from + (to - from) * i / steps); renderTop(); if (i % 3 === 0) SFX.coin(); await wait(28); }
    R.score = to; renderTop(); await wait(500); big.remove();
  }
  function interestCap() { return R.jokers.some(function (j) { return j.id === 'bank'; }) ? 10 : 5; }
  function stageClear() {
    SFX.win();
    var base = R.boss ? 5 : 3, left = R.hands, interest = Math.min(interestCap(), Math.floor(R.money / 5)), one = R.handsMax - R.hands === 1 ? 5 : 0, dl = R.discards;
    var Q = R.quest, qhit = !R.questDone && R.stageF.some(function (f) { return questHit(Q.secret, f); }), qm = qhit ? [2, 3, 4][Q.secret.tier] : 0;
    var gain = base + left + interest + one + dl + qm; R.money += gain;
    saveBest(R.stage + 1);
    if (R.stage >= 7) { showEnd(true); return; }
    var s = screen('<div class="clear"><h1>ステージ ' + (R.stage + 1) + ' クリア!</h1><div class="pay"><div>クリア報酬<b>+' + base + '</b></div><div>残りの「出す」×' + left + '<b>+' + left + '</b></div>' + (one ? '<div>⚡ 一発クリア<b>+5</b></div>' : '') + (dl ? '<div>使わなかった「捨てる」×' + dl + '<b>+' + dl + '</b></div>' : '') +
      (R.questDone ? '' : '<div>🔒 シークレット「' + Q.secret.label + '」' + (qhit ? '達成' : 'ならず') + '<b>+' + qm + '</b></div>') + '<div>利子(5ごとに1)<b>+' + interest + '</b></div></div><div class="money big">💰 ' + R.money + '</div><button class="btn go" id="sh">お店へ</button></div>');
    $('#sh', s).onclick = function () { SFX.tap(); R.stage++; R.rerollCost = 2; showShop(true); };
  }
  function saveBest(stage) { var b = store.get('best') || {}; if (!b.stage || stage > b.stage || (stage === b.stage && R.total > (b.total || 0))) store.set('best', { stage: stage, total: R.total, text: R.best.text }); }
  // ---------------- お店 ----------------
  var shopItems = null;
  function rollShop() {
    var owned = R.jokers.map(function (j) { return j.id; }), pool = shuffle(JOKERS.filter(function (j) { return owned.indexOf(j.id) < 0; }));
    shopItems = [];
    pool.slice(0, 2).forEach(function (j) { shopItems.push({ t: 'joker', j: j, price: j.price }); });
    shopItems.push({ t: 'pack', price: 4 });
    var keys = ['O', 'place', 'time', 'past', 'aux', 'prog', 'perfect', 'manner', 'C', 'neg', 'clause', 'passive', 'post', 'phrasal', 'gerund', 'padj'], k = pick(keys);
    shopItems.push({ t: 'book', key: k, price: 3 });
    shopItems.push(rnd() < .4 ? { t: 'it', price: 5 } : { t: 'boost', price: 3 });
  }
  function showShop(fresh) {
    if (fresh) rollShop();
    var s = screen('<div class="shop"><div class="shead"><h1>お店</h1><div class="money">💰 <b>' + R.money + '</b></div></div><div class="next">つぎ:' + (BOSS_AT[R.stage] ? '👹 ボス ' : 'ステージ ') + (R.stage + 1) + '(目標 ' + TARGETS[R.stage].toLocaleString() + ')</div>' +
      '<div class="items" id="items"></div><div class="myj"><div class="lbl">持っているジョーカー(タップで売る)</div><div class="jokers" id="mj"></div></div>' +
      '<div class="sbtns"><button class="btn ghost" id="rr">入れかえ 💰' + R.rerollCost + '</button><button class="btn go" id="nx">つぎへ</button></div></div>');
    var box = $('#items', s);
    shopItems.forEach(function (it, i) {
      if (!it) { box.appendChild(el('div', 'item sold', '<span>売り切れ</span>')); return; }
      var face = it.t === 'joker' ? '<div class="joker"><b>' + it.j.name + '</b><span>' + it.j.desc + '</span></div>'
        : it.t === 'pack' ? '<div class="pack">単語<br>パック</div>' : it.t === 'book' ? '<div class="pack book">文型の本<br><small>' + PART_JA[it.key] + '</small></div>' : it.t === 'it' ? '<div class="pack itp">it<br><small>万能</small></div>' : '<div class="pack boost">カード<br>強化</div>';
      var desc = it.t === 'joker' ? 'ジョーカー(最大5枚)' : it.t === 'pack' ? '3枚の中から1枚えらんで山札へ' : it.t === 'book' ? '「' + PART_JA[it.key] + '」の入った役が チップ+10・倍率+1(いまLv' + (R.lv[it.key] || 0) + ')' : it.t === 'it' ? '万能カード「it」を山札へ。どの動詞の目的語にも入り、主語にもなれる' : '山札のカード1枚の点を+15';
      var e = el('div', 'item' + (R.money < it.price ? ' poor' : ''), face + '<div class="desc">' + desc + '</div><div class="price">💰' + it.price + '</div>');
      e.onclick = function () { buy(i); }; box.appendChild(e);
    });
    var mj = $('#mj', s); for (var j = 0; j < 5; j++) { var jj = R.jokers[j], e2 = el('div', 'joker' + (jj ? '' : ' empty'), jj ? '<b>' + jj.name + '</b><span>' + jj.desc + '</span>' : '<span>空き</span>'); if (jj) (function (jj) { e2.onclick = function () { if (confirmSell(jj)) { } }; })(jj); mj.appendChild(e2); }
    $('#rr', s).onclick = function () { if (R.money < R.rerollCost) { SFX.bad(); return; } R.money -= R.rerollCost; R.rerollCost++; SFX.coin(); showShop(true); };
    $('#nx', s).onclick = function () { SFX.put(); startStage(); };
  }
  function confirmSell(j) {
    var o = el('div', 'modal', '<div class="box"><h2>' + j.name + '</h2><p>' + j.desc + '</p><p>売ると 💰' + Math.floor(j.price / 2) + '</p><button class="btn disc" id="ys">売る</button><button class="btn ghost" id="no">やめる</button></div>');
    root.appendChild(o); $('#no', o).onclick = function () { o.remove(); };
    $('#ys', o).onclick = function () { R.jokers.splice(R.jokers.indexOf(j), 1); R.money += Math.floor(j.price / 2); SFX.coin(); o.remove(); showShop(false); };
  }
  function buy(i) {
    var it = shopItems[i]; if (!it) return; if (R.money < it.price) { SFX.bad(); return; }
    if (it.t === 'joker') { if (R.jokers.length >= 5) { flash('ジョーカーは5枚まで(売ってから買おう)'); SFX.bad(); return; } R.money -= it.price; R.jokers.push(it.j); shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'book') { R.money -= it.price; R.lv[it.key] = (R.lv[it.key] || 0) + 1; shopItems[i] = null; SFX.joker(); showShop(false); return; }
    if (it.t === 'pack') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openPack(); return; }
    if (it.t === 'it') { R.money -= it.price; shopItems[i] = null; R.deck.push(mk('pron', 'it')); SFX.joker(); showShop(false); return; }
    if (it.t === 'boost') { R.money -= it.price; shopItems[i] = null; SFX.coin(); openBoost(); return; }
  }
  // ゲストカード:山札にない上級の語(金色・点2倍)。文に使えばスカウトして山札へ
  function guestCard() {
    var lv = Math.min(4, 2 + Math.floor((((R && R.stage) || 0)) / 3)), ok = function (e) { return (e.lv || 1) >= 2 && (e.lv || 1) <= lv; }, r = rnd(), c = null;
    for (var t = 0; t < 6 && !c; t++) {
      if (r < .35) { var vs = DICT.all('verb').filter(function (e) { return ok(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link && e.w.indexOf(' ') < 0; }); if (vs.length) c = mk('v', pick(vs).w); }
      else if (r < .75) { var ns = DICT.all('noun').filter(function (e) { return ok(e) && e.cat !== 'time'; }); if (ns.length) c = mk('n', pick(ns).w); }
      else { var as = DICT.all('adj').filter(ok); if (as.length) c = mk('adj', pick(as).w); }
      r = rnd();
    }
    if (c) { c.guest = true; c.chips = baseChips(c) * 2; }
    return c;
  }
  function randomCard() {
    if (rnd() < .04) return mk('pron', 'it');
    var r = rnd(), lv = Math.min(3, 1 + Math.floor(((R && R.stage) || 0) / 3)), ok = function (e) { return (e.lv || 1) <= lv + 1 && (e.lv || 1) >= 1; };
    if (r < .3) { var vs = DICT.all('verb').filter(function (e) { return ok(e) && !e.tail && e.fr !== 'cl' && !e.cv && !e.link; }); return mk('v', pick(vs).w); }
    if (r < .65) { var ns = DICT.all('noun').filter(function (e) { return ok(e) && (e.cat !== 'time' || e.prep); }); return mk('n', pick(ns).w); }
    if (r < .82) return mk('adj', pick(DICT.all('adj').filter(ok)).w);
    if (r < .95) return mk('adv', pick(DICT.all('adv').filter(function (e) { return e.k === 'manner' || e.k === 'time' || e.k === 'place'; })).w);
    return mk('pron', pick(['i', 'you', 'he', 'she', 'we', 'they']));
  }
  function openPack() {
    var cs = [randomCard(), randomCard(), randomCard()].filter(Boolean);
    var o = el('div', 'modal', '<div class="box"><h2>1枚えらんで山札へ</h2><div class="pick" id="pk"></div><button class="btn ghost" id="sk">いらない</button></div>'); root.appendChild(o);
    cs.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.classList.add('big'); var w = el('div', 'pc'); w.appendChild(e); w.appendChild(el('div', 'ja', (c.w.e ? c.w.e.ja : '') + '<br><small>' + KIND_JA[c.kind] + '</small>')); w.onclick = function () { R.deck.push(c); SFX.put(); o.remove(); showShop(false); }; $('#pk', o).appendChild(w); });
    $('#sk', o).onclick = function () { o.remove(); showShop(false); };
  }
  function openBoost() {
    var o = el('div', 'modal', '<div class="box"><h2>強化するカードをえらぶ(+15)</h2><div class="pick scroll" id="pk"></div></div>'); root.appendChild(o);
    R.deck.forEach(function (c) { var e = cardEl(c, 'hand', 0); e.onclick = function () { c.bonus += 15; SFX.joker(); o.remove(); showShop(false); }; $('#pk', o).appendChild(e); });
  }
  function flash(t) { var f = el('div', 'toast', t); root.appendChild(f); setTimeout(function () { f.remove(); }, 1800); }
  function gameOver() { SFX.lose(); saveBest(R.stage + 1); showEnd(false); }
  function showEnd(win) {
    var s = screen('<div class="end"><h1>' + (win ? '🏆 全ステージ クリア!' : 'ゲームオーバー') + '</h1><div class="st">ステージ ' + (R.stage + 1) + (win ? '' : ' で目標に届かず(' + R.score.toLocaleString() + ' / ' + R.target.toLocaleString() + ')') + '</div>' +
      '<div class="tot">合計 ' + R.total.toLocaleString() + '点 ・ 文 ' + R.played + '本</div>' +
      (R.best.text ? '<div class="bestS"><div class="lbl">いちばん高かった文(' + R.best.pts.toLocaleString() + '点)</div><div class="t">' + R.best.text + '</div><button class="btn ghost small" id="sp">🔊 聞く</button></div>' : '') +
      ((R.hist || []).length ? '<button class="btn ghost" id="hs">📚 今回の文をふりかえる(' + R.hist.length + ')</button>' : '') +
      '<button class="btn go" id="re">もう一回</button><button class="btn ghost" id="tt">タイトルへ</button></div>');
    if ($('#hs', s)) $('#hs', s).onclick = function () { histModal(R.hist); };
    if ($('#sp', s)) $('#sp', s).onclick = function () { speak(R.best.text); };
    $('#re', s).onclick = function () { SFX.put(); newRun(); }; $('#tt', s).onclick = function () { showTitle(); };
  }
  // 対戦モード(cards/vs.js)に中の部品を渡す
  window.ChunkKit = { G: G, CFG: CFG, $: $, el: el, rnd: rnd, pick: pick, shuffle: shuffle, store: store, SFX: SFX, speak: speak, unlock: unlock,
    mk: mk, card: card, starterDeck: starterDeck, randomCard: randomCard, TSU: TSU, tsuCard: tsuCard, cardText: cardText, cardEl: cardEl, colorOf: colorOf, lvOf: lvOf, cat: cat, verbFits: verbFits,
    evaluate: evaluate, yaku: yaku, JOKERS: JOKERS, PART_JA: PART_JA, KIND_JA: KIND_JA, Core: Core, fillTo: fillTo,
    G_: G_, getR: function () { return R; }, setR: function (x) { R = x; }, screen: screen, showTitle: showTitle, flash: flash, wait: wait, bump: bump, floatTxt: floatTxt,
    renderRow: renderRow, _cycle: cycle, _wordNotes: wordNotes, _formTag: formTag, _improvements: improvements, surfaceOf: surfaceOf, reviewItems: reviewItems, showReview: showReview, reviewFlow: reviewFlow, reviewAfter: reviewAfter, recordHist: recordHist, histModal: histModal, errMsg: errMsg, hintPanel: hintPanel, doHint: doHint, level: function () { return LEVEL; }, LV_MULT: LV_MULT, LV_JA: LV_JA, HINT_MULT: HINT_MULT, calcNext: calcNext, baseScore: baseScore, QUESTS: QUESTS, MISSIONS: MISSIONS, pickMissions: pickMissions, missionHit: missionHit, Q_PCT: Q_PCT, TIER_JA: TIER_JA, questHit: questHit, pickQuest: pickQuest, addCombo: addCombo, guestCard: guestCard, notes: notes, baseChips: baseChips, rowText: rowText, renderHand: renderHand, renderTsu: renderTsu, cur: function () { return cur; }, root: function () { return root; } };
  // テスト用
  window.ChunkCards = { mount: mount, _R: function () { return R; }, _eval: evaluate, _scoreOf: scoreOf, _mk: mk, _tsu: tsuCard, _yaku: yaku, _features: features, JOKERS: JOKERS };
  document.addEventListener('DOMContentLoaded', function () { var r = document.getElementById('app'); if (r) mount(r); });
})();

/* ===== チャンク・カード:CPU対戦(ポーカー型) =====
   ・2人で山札と「場」を共有。手札8枚。交換を3回ずつ(捨てたカードは表向きで場へ)。
   ・1回目の交換のあとと、最後に「賭け」。最後に文を見せ合って、点が高いほうがポットを取る。 */
(function () {
  'use strict';
  var K = window.ChunkKit; if (!K) return;
  var G = K.G, $ = K.$, el = K.el, rnd = K.rnd, pick = K.pick, shuffle = K.shuffle, SFX = K.SFX, G_ = K.G_;

  // ---------------- CPU:手札からいちばん点の高い文をさがす ----------------
  function T(spec) { return K.tsuCard(spec); }
  function form(c, patch) { var n = {}; for (var k in c) n[k] = c[k]; n.w = {}; for (var j in c.w) n.w[j] = c.w[j]; for (var p in patch) n.w[p] = patch[p]; return n; }
  var QCTX = null; // CPU が探すときに、お題の当たりやすさも点に入れる
  function scoreRow(row, ev, rule) {
    var b = K.baseScore(row, ev), y = b.y, chips = b.chips, mult = b.mult;
    if (rule) rule.fx(ev.f, { y: y }).forEach(function (e) { if (e[0] === 'c') chips += e[1]; else if (e[0] === 'm') mult += e[1]; else mult = Math.round(mult * e[1] * 10) / 10; });
    return { y: y, chips: chips, mult: mult, total: Math.floor(chips * mult) };
  }
  function isSubj(c) { return (c.kind === 'pron' && c.w.v !== 'it') || (c.kind === 'n' && /^(person|animal)$/.test(c.w.e.cat)); }
  function count(c) { return G.isCount(c.w.e) && !c.w.e.ind; }
  // 名詞のかたまりの候補(使うカードの id つき)
  function npOpts(n, adjs, asSubj) {
    var o = [], det = function (d) { return T(['det', d]); };
    if (n.kind === 'pron') { o.push([n]); return o; }
    var e = n.w.e, cnt = count(n);
    if (e.ind || e.cat === 'time' || e.cat === 'place' && !cnt) { o.push([n]); }
    else {
      o.push([det('the'), n]);
      if (cnt && !asSubj) o.push([det('a'), n]);
      if (cnt) o.push([form(n, { pl: true })]);
      if (asSubj && e.cat === 'person') o.push([T(['pos', 'i', 'my']), n]);
      adjs.slice(0, 2).forEach(function (a) { o.push([det(cnt && !asSubj ? 'a' : 'the'), a, n]); });
    }
    return o;
  }
  function vpOpts(v, lvl) {
    var o = [[form(v, { f: 'base' })], [form(v, { f: 'past' })]];
    if (lvl >= 1) { o.push([T(['be', 'pres']), form(v, { f: 'ing' })]); o.push([T(['modal', 'can']), form(v, { f: 'base' })]); }
    if (lvl >= 2) { o.push([T(['hv', 'pres']), form(v, { f: 'pp' })]); o.push([T(['modal', 'will']), form(v, { f: 'base' })]); o.push([T(['be', 'past']), form(v, { f: 'ing' })]); }
    return o;
  }
  var MOTION = ['go', 'come', 'run', 'walk', 'move', 'fly', 'drive', 'travel', 'return', 'swim', 'jump', 'hurry', 'ride', 'climb'];
  function motion(row) { var v = row.filter(function (c) { return c.kind === 'v'; })[0]; return v && MOTION.indexOf(v.w.e.w) >= 0; }
  function ids(row) { var s = {}; row.forEach(function (c) { if (!c.tsu) s[c.id] = 1; }); return s; }
  function overlap(a, b) { var s = ids(a); return b.some(function (c) { return !c.tsu && s[c.id]; }); }
  // lvl 0:やさしい 1:ふつう 2:つよい
  function search(hand, rule, lvl, budget) {
    var memo = {}, n = 0, max = budget || 260;
    function key(row) { return row.map(function (c) { return (c.tsu ? 't' : c.id) + ':' + K.cardText(c) + (c.w.f || '') + (c.w.pl ? 'p' : ''); }).join('|'); }
    function ev(row) {
      var k = key(row); if (k in memo) return memo[k];
      if (n >= max) return null; n++;
      var e = K.evaluate(row), r = null;
      if (e.state === 'ok') { var sc = scoreRow(row, e, rule), q = 0; if (QCTX) { QCTX.cands.forEach(function (c) { if (K.questHit(c, e.f)) q += K.Q_PCT[c.tier] / 300; }); if (V && V.mission && K.missionHit(V.mission, e.f)) q += .1; } r = { row: row, ev: e, score: Math.round(sc.total * (1 + q)), sc: sc }; }
      memo[k] = r; return r;
    }
    var subs = hand.filter(isSubj), verbs = hand.filter(function (c) { return c.kind === 'v'; }), nouns = hand.filter(function (c) { return c.kind === 'n' || c.kind === 'pron'; }), adjs = hand.filter(function (c) { return c.kind === 'adj'; }), advs = hand.filter(function (c) { return c.kind === 'adv'; });
    var cores = [];
    // 1) 主語+動詞(+目的語)を現在形で
    subs.forEach(function (s) {
      npOpts(s, adjs, true).slice(0, 3).forEach(function (S) {
        verbs.forEach(function (v) {
          var V = [form(v, { f: 'base' })];
          if (v.w.e.fr !== 'tr') { var r = ev(S.concat(V)); if (r) cores.push({ S: S, v: v, O: null, r: r }); }
          if (v.w.e.fr === 'intr') return;
          nouns.forEach(function (o) {
            if (o === s || (o.kind === 'n' && !K.verbFits(v, o)) || (o.kind === 'pron' && o.w.v !== 'it' && (v.w.e.ot || []).indexOf('person') < 0) || /^(time|place)$/.test(o.kind === 'n' && o.w.e.cat)) return;
            npOpts(o, [], false).slice(0, 2).forEach(function (O) { if (overlap(S, O)) return; var r2 = ev(S.concat(V, O)); if (r2) cores.push({ S: S, v: v, O: O, r: r2 }); });
          });
        });
      });
    });
    if (!cores.length) return null;
    cores.sort(function (a, b) { return b.r.score - a.r.score; });
    // 2) 上位の形で時制を変えてみる
    var best = [];
    cores.slice(0, lvl ? 4 : 2).forEach(function (c) {
      vpOpts(c.v, lvl).forEach(function (V) { var row = c.S.concat(V, c.O || []), r = ev(row); if (r) best.push(r); });
    });
    best.sort(function (a, b) { return b.score - a.score; });
    // 3) うしろに場所・時・様子をつけ足す(良くなるかぎり)
    var exts = [];
    hand.forEach(function (c) {
      if (c.kind === 'adv') { var ax = [c]; ax.kind = c.w.e.k === 'time' ? 'time' : c.w.e.k === 'place' ? 'place' : 'adv'; exts.push(ax); }
      if (c.kind === 'n' && c.w.e.cat === 'place') { ['in', 'at', 'to'].forEach(function (p) { var x = [T(['prep', p])].concat(count(c) ? [T(['det', 'the']), c] : [c]); if (p === 'to') x.to = 1; x.kind = 'place'; exts.push(x); }); }
      if (c.kind === 'n' && c.w.e.cat === 'time') { ['in', 'on', 'at'].forEach(function (p) { var x = [T(['prep', p])].concat(count(c) && !c.w.e.ind ? [T(['det', 'the']), c] : [c]); x.kind = 'time'; exts.push(x); }); }
    });
    var top = null, steps = lvl === 0 ? 1 : lvl === 1 ? 2 : 4;
    best.slice(0, lvl ? 3 : 1).forEach(function (b0) {
      var curB = b0, kinds = {};
      for (var s = 0; s < steps; s++) {
        var nb = null, nk = null;
        exts.forEach(function (x) { if (overlap(curB.row, x) || (x.to && !motion(curB.row)) || (x.kind !== 'adv' && kinds[x.kind])) return; var r = ev(curB.row.concat(x)); if (r && r.score > (nb ? nb.score : curB.score)) { nb = r; nk = x.kind; } });
        if (!nb) break; curB = nb; kinds[nk] = 1;
      }
      if (!top || curB.score > top.score) top = curB;
    });
    // 4) つよい CPU:残りのカードでもう一つ文を作って and / because でつなぐ
    if (lvl >= 2 && top && rnd() < .4) {
      var rest = hand.filter(function (c) { return !ids(top.row)[c.id]; });
      if (rest.some(isSubj) && rest.some(function (c) { return c.kind === 'v'; })) {
        var sub = search(rest, rule, 1, 80);
        if (sub) ['and', 'because', 'but'].forEach(function (cj) { var r = ev(top.row.concat([T(['conj', cj])], sub.row)); if (r && r.score > top.score) top = r; });
      }
    }
    if (top) { top.n = n; var seen = {}; seen[top.ev.text] = 1; top.alts = Object.keys(memo).map(function (k) { return memo[k]; }).filter(function (r) { if (!r || seen[r.ev.text]) return false; seen[r.ev.text] = 1; return true; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 2); }
    return top;
  }

  // ---------------- 対戦の進行 ----------------
  var OPPS = [
    { id: 'mii', name: 'ミイ', face: '🐱', lv: 0, style: 'careful', tag: 'やさしい', desc: '慎重派。いい文ができたときしか賭けない。賭けてきたら本物かも。' },
    { id: 'baron', name: 'ハッタリ男爵', face: '🎩', lv: 1, style: 'bluff', tag: 'ふつう', desc: '弱い手でも平気で賭けてくる。わざと強いカードを捨てることも。' },
    { id: 'gon', name: 'ひろい屋ゴン', face: '🦝', lv: 2, style: 'collector', tag: 'つよい', desc: 'あなたの捨てたカードを拾っていく。and や because で長い文も作る。' }
  ];
  var QS = [[290, 360, 540], [390, 530, 640], [500, 680, 880]]; // CPU がふだん作れる点(25%・50%・75%)
  var HANDS = 6, ANTE = 5, BETS = { 1: 10, 3: 20 }, START = 100;
  var V = null, ME = null, CPU = null;
  function player() { return { lv: {}, stage: 2, hand: [], row: [], field: [], draw: [], disc: [], pts: 0, refill: 0, discards: 99, log: [] }; }
  // CPU の手番で共有の山・場を使う
  function withP(p, fn) { p.draw = ME.draw; p.disc = ME.disc; p.field = ME.field; K.setR(p); try { return fn(); } finally { ME.draw = p.draw; ME.disc = p.disc; ME.field = p.field; K.setR(ME); } }
  function start(opp) {
    if (!opp) { pickOpp(); return; }
    ME = player(); CPU = player(); K.setR(ME);
    var all = K.starterDeck(); for (var i = 0; i < 25; i++) { var c = K.randomCard(); if (c) all.push(c); } all.push(K.mk('pron', 'it'));
    V = { opp: opp, all: all, n: 0, med: { me: START, cpu: START }, first: rnd() < .5 ? 'me' : 'cpu', stats: { win: 0, lose: 0 } };
    showVS(); nextHand();
  }
  function pickOpp() {
    var rec = K.store.get('vs') || {};
    var o = el('div', 'modal', '<div class="box"><h2>対戦相手をえらぶ</h2><div class="opps" id="ops"></div>' +
      '<details class="vrules"><summary>対戦のルール</summary><ol><li>🪙100枚ずつ持って、6ハンド勝負。毎ハンド 参加費🪙5。</li><li>手札8枚。交換を<b>3回ずつ</b>交互に(1〜3枚捨てて補充、またはそのまま)。捨てたカードは<b>場に表向き</b>で並ぶので、相手が何を狙っているか読める。場のカードは捨て札ptで取れる(相手の欲しいカードを先に取るのもアリ)。</li><li>1回目の交換のあとと最後に<b>賭け</b>。チェック/ベット、相手が賭けたらコール/レイズ/降りる。</li><li>最後に台の文を見せ合い、点の高いほうがポットを総取り。台の文が間違っていると0点。</li><li>毎ハンド「ルール」が1つ付く(例:過去の文は倍率×2)。</li><li><b>リーチ</b>:役の要素が3つ以上ある文ができたら、自分の交換の番で「🀄 リーチ」(🪙5)。以後は台の文が固定で交換なし。点が+30%(1回目)/+20%(2回目)/+10%(3回目)。相手にも「リーチ中」と見える。</li><li><b>お題</b>:🎯 見えるお題を満たすと点+10%。🔒 シークレット(候補3つのうち1つが本命)が当たると+10/20/30%。ボーナスは合計+50%まで。</li><li><b>ゲストカード</b>:場の金枠のカードは、捨て札ptで取り合い。</li></ol></details>' +
      '<button class="btn ghost" id="cx">もどる</button></div>');
    K.root().appendChild(o);
    OPPS.forEach(function (op) {
      var r = rec[op.id] || { w: 0, l: 0 };
      var e = el('div', 'oppc', '<div class="face">' + op.face + '</div><div><b>' + op.name + '</b> <span class="lvtag l' + op.lv + '">' + op.tag + '</span><p>' + op.desc + '</p><small>戦績 ' + r.w + '勝 ' + r.l + '敗</small></div>');
      e.onclick = function () { SFX.put(); o.remove(); start(op); }; $('#ops', o).appendChild(e);
    });
    $('#cx', o).onclick = function () { o.remove(); };
  }
  function showVS() {
    var op = V.opp;
    var s = K.screen(
      '<div class="vtop"><div class="vh">ハンド <b id="vhn"></b>/' + HANDS + '</div><div class="pot">🪙 <b id="vpot">0</b><small>ポット</small></div><div class="vmed"><span>あなた<b id="vme"></b></span><span>' + op.face + '<b id="vcpu"></b></span></div><button class="vq" id="vq">✕</button></div>' +
      '<div class="opp"><div class="face">' + op.face + '</div><div class="oinfo"><div class="oname">' + op.name + '<small>捨て札pt <b id="opt">0</b></small></div><div class="backs" id="obk"></div></div><div class="bubble" id="obb"></div></div>' +
      '<div class="rule" id="vrule"></div><div class="vturn" id="vturn"></div>' +
      '<div class="board"><div class="row" id="row"></div>' +
      '<div class="pv"><div class="sent" id="sent"></div><div class="jt" id="jt"></div><div class="yk" id="yk"></div><div class="cm"><span class="chips" id="ch">0</span><span class="x">×</span><span class="mult" id="ml">0</span><span class="eq" id="eq"></span></div><div class="msg" id="msg"></div><div class="hp" id="hp"></div></div><button class="hintb" id="hb">💡 ヒント</button></div>' +
      '<div class="field"><div class="flbl"><span>場(<i class="me">あなた</i>/<i class="cp">' + op.name + '</i>の捨てたカード)</span><span class="pts">捨て札pt <b id="pt">0</b></span></div><div class="frow" id="fd"></div><div class="fhint" id="fh"></div></div>' +
      '<div class="tsu"><div class="tabs" id="tabs"></div><div class="tw" id="tw"></div></div>' +
      '<div class="hand" id="hand"></div><div class="btns" id="bt"></div>');
    ['row', 'sent', 'yk', 'ch', 'ml', 'msg', 'tabs', 'tw', 'hand', 'bt', 'fd', 'fh', 'pt'].forEach(function (k) { G_[k] = $('#' + k, s); });
    ['vhn', 'vpot', 'vme', 'vcpu', 'opt', 'obk', 'obb', 'vrule', 'vturn', 'eq', 'jt', 'hp', 'hb'].forEach(function (k) { G_[k] = $('#' + k, s); });
    G_.tab = G_.tab || 0; G_.mode = 'play'; G_.mark = []; G_.busy = false;
    G_.vs = { renderAll: renderAll, preview: preview, btns: btns }; G_.hb.onclick = K.doHint;
    $('#vq', s).onclick = function () { var o = el('div', 'modal', '<div class="box"><h2>対戦をやめる?</h2><p>ここでやめると負けになる。</p><button class="btn disc" id="y">やめる</button><button class="btn ghost" id="n">つづける</button></div>'); K.root().appendChild(o); $('#n', o).onclick = function () { o.remove(); }; $('#y', o).onclick = function () { o.remove(); V.quit = true; endMatch(true); }; };
  }
  function renderAll() { top(); K.renderRow(); K.renderTsu(); K.renderHand(); field(); btns(); }
  function top() {
    if (!G_.vhn) return;
    G_.vhn.textContent = V.n; G_.vpot.textContent = V.pot; G_.vme.textContent = V.med.me; G_.vcpu.textContent = V.med.cpu; G_.opt.textContent = CPU.pts;
    G_.obk.innerHTML = ''; CPU.hand.forEach(function () { G_.obk.appendChild(el('div', 'cback')); });
    G_.vrule.innerHTML = (V.rule ? '🎲 このハンドのルール:<b>' + V.rule.name + '</b> ' + V.rule.desc : '') + (V.mission ? '<div class="mbar">🎯 お題(達成で点+10%):<span class="mc t' + V.mission.tier + (cur && cur.state === 'ok' && K.missionHit(V.mission, cur.f) ? ' hit' : '') + '">' + (cur && cur.state === 'ok' && K.missionHit(V.mission, cur.f) ? '✔ ' : '') + V.mission.label + '</span></div>' : '') + (V.quest ? '<div class="qbar">🔒 シークレット(どれか1つ・当たると+10/20/30%):' + V.quest.cands.map(function (q) { var hit = cur && cur.state === 'ok' && K.questHit(q, cur.f); return '<span class="qc t' + q.tier + (hit ? ' hit' : '') + '">' + (hit ? '✔ ' : '') + q.label + '</span>'; }).join('') + '</div>' : '') +
      (V.ri && (V.ri.me || V.ri.cpu) ? '<div class="ribar">' + (V.ri.me ? '🀄 あなた リーチ中(+' + riPct(V.ri.me) + '%) ' : '') + (V.ri.cpu ? '🀄 ' + V.opp.name + ' リーチ中!' : '') + '</div>' : '');
    G_.vturn.innerHTML = V.turnTxt || '';
  }
  function say(t, cls) { if (!G_.obb) return; G_.obb.className = 'bubble on ' + (cls || ''); G_.obb.innerHTML = t; K.bump(G_.obb); }
  var cur = null;
  function myMul(t) { return Math.floor(t * K.LV_MULT[K.level()] * K.HINT_MULT[ME.hintLv || 0]); }
  function mulNote() { var o = []; if (K.level() !== 1) o.push(K.LV_JA[K.level()] + ' ×' + K.LV_MULT[K.level()]); return o.length ? '<br>' + o.join('・') : ''; }
  function preview(ev) {
    cur = ev; G_.sent.className = 'sent ' + ev.state; G_.msg.textContent = ''; G_.eq.textContent = '';
    if (ev.state === 'empty') { G_.sent.textContent = ''; G_.yk.textContent = '最後に台の文で勝負。手札をタップして並べよう'; G_.ch.textContent = '0'; G_.ml.textContent = '0'; return; }
    if (ev.state === 'ok') { var sc = scoreRow(ME.row, ev, V.rule); G_.sent.textContent = ev.text; G_.yk.textContent = '役:' + sc.y.name + '(' + ev.f.words + '語)'; G_.ch.textContent = sc.chips; G_.ml.textContent = sc.mult; G_.eq.textContent = '= ' + myMul(sc.total).toLocaleString(); G_.msg.innerHTML = K.notes(ev.f, 0) + mulNote(); top(); return; }
    G_.sent.textContent = K.rowText(ME.row); G_.yk.textContent = ''; G_.ch.textContent = '–'; G_.ml.textContent = '–'; G_.msg.textContent = K.errMsg(ev, ME.row);
  }
  function field() {
    G_.fd.innerHTML = ''; G_.pt.textContent = ME.pts;
    if (!ME.field.length) G_.fd.appendChild(el('div', 'ph', 'まだ誰も捨てていない'));
    ME.field.forEach(function (c) {
      var e = K.cardEl(c, 'field', 0), cost = c.chips + (c.bonus || 0), can = G_.mode === 'refill' && ME.pts >= cost; e.classList.add('mini', c.by === 'cpu' ? 'bycpu' : c.by === 'guest' ? 'byguest' : 'byme'); if (G_.mode === 'refill') e.classList.add(can ? 'can' : 'cant');
      e.onclick = function () { if (G_.mode !== 'refill') { K.flash('捨てたあとの補充で、' + cost + 'pt 払うと取れる'); return; } if (!K.Core.take(c)) { SFX.bad(); K.flash('捨て札ptが足りない(' + cost + 'pt 必要)'); return; } SFX.coin(); afterRefill(); };
      G_.fd.appendChild(e);
    });
    G_.fh.textContent = G_.mode === 'refill' ? 'あと ' + ME.refill + ' 枚:山から引く か、場のカードをタップして取る' : '';
  }
  var wait = K.wait, resolve = null;
  function act(v) { var r = resolve; resolve = null; if (r) r(v); }
  function ask(phase) { V.phase = phase; renderAll(); return new Promise(function (r) { resolve = r; }); }
  function btns() {
    var bt = G_.bt; if (!bt) return; bt.innerHTML = '';
    var b = function (cls, txt, fn, dis) { var x = el('button', 'btn ' + cls, txt); x.onclick = function () { if (!x.disabled) fn(); }; x.disabled = !!dis; bt.appendChild(x); return x; };
    if (G_.mode === 'disc') { b('ghost', 'やめる', function () { G_.mode = 'play'; G_.mark = []; SFX.tap(); renderAll(); }); b('disc', G_.mark.length ? G_.mark.length + '枚 捨てる' : '捨てるカードをえらぶ(3枚まで)', doDiscard, !G_.mark.length || G_.mark.length > 3); return; }
    if (G_.mode === 'refill') { b('ghost', '山から引く(あと' + ME.refill + ')', function () { K.Core.drawOne(); SFX.put(); afterRefill(); }); b('go', 'ぜんぶ山から', function () { while (ME.refill > 0) K.Core.drawOne(); SFX.put(); afterRefill(); }); return; }
    if (V.phase === 'turn') {
      b('disc', '捨てて交換', function () { G_.mode = 'disc'; G_.mark = []; SFX.tap(); renderAll(); }); b('ghost', '交換しない', function () { SFX.tap(); act('pass'); });
      var ok = canRiichi(); b('go small ri', '🀄 リーチ<br><small>' + (ok ? '🪙5・点+' + riPct(V.t) + '%' : '役3つ以上で') + '</small>', function () { act('riichi'); }, !ok); return;
    }
    if (V.phase === 'bet') {
      var q = V.betQ, amt = BETS[V.t];
      if (!q.face) { b('ghost', 'チェック', function () { act({ a: 'check' }); }); b('go', 'ベット ' + amt, function () { act({ a: 'bet' }); }, V.med.me <= 0); }
      else { b('disc', '降りる', function () { act({ a: 'fold' }); }); b('play', 'コール ' + Math.min(q.face, V.med.me), function () { act({ a: 'call' }); }); if (!q.raised && V.med.me > q.face) b('go', 'レイズ +' + amt, function () { act({ a: 'raise' }); }); }
      return;
    }
    b('ghost', V.phase === 'cpu' ? V.opp.name + 'の番…' : '…', function () { }, true);
  }
  function doDiscard() {
    if (!G_.mark.length || G_.mark.length > 3) return;
    G_.mark.forEach(function (c) { c.by = 'me'; }); K.Core.discard(G_.mark.slice()); G_.mark = []; G_.mode = 'refill'; SFX.tap(); renderAll();
  }
  function afterRefill() { if (ME.refill <= 0) { G_.mode = 'play'; act('done'); } renderAll(); }

  function riPct(t) { return (4 - t) * 10; }
  function parts(ev) { return ev && ev.state === 'ok' ? K.yaku(ev.f).parts.filter(function (p) { return /^(SV|O|O2|C|place|time|manner)$/.test(p[0]); }).length : 0; }
  function canRiichi() { return !V.ri.me && cur && cur.state === 'ok' && parts(cur) >= 3 && V.med.me >= 5; }
  function riichiPay(who) { var a = Math.min(5, V.med[who]); V.med[who] -= a; V.pot += a; }
  function pay(who, amt) { var a = Math.max(0, Math.min(amt, V.med[who])); V.med[who] -= a; V.pot += a; V.c[who] += a; return a; }
  async function nextHand() {
    V.n++;
    if (V.n > HANDS || V.med.me < ANTE || V.med.cpu < ANTE) { endMatch(); return; }
    V.first = V.first === 'me' ? 'cpu' : 'me';
    V.all.forEach(function (c) { c.by = null; if (c.w.k === 'v') c.w.f = 'base'; if (c.w.k === 'n') c.w.pl = false; });
    ME.hand = []; ME.row = []; ME.field = []; ME.disc = []; ME.draw = shuffle(V.all.slice()); ME.pts = 0; ME.refill = 0;
    CPU.hand = []; CPU.row = []; CPU.pts = 0; CPU.refill = 0; V.cpuBest = null; V.cpuLocked = null; ME.hintLv = 0; G_.hintBest = null; G_.hintIds = {}; V.ri = { me: 0, cpu: 0 }; V.bluffed = false; G_.busy = false;
    V.quest = K.pickQuest(V.usedQ = V.usedQ || []); QCTX = V.quest; V.mission = K.pickMissions(V.usedM = V.usedM || [], 1)[0].m;
    V.rule = pick(K.JOKERS.filter(function (j) { return !/^(bank|lucky|first|last)$/.test(j.id); }));
    V.pot = 0; V.c = { me: 0, cpu: 0 }; pay('me', ANTE); pay('cpu', ANTE);
    withP(CPU, function () { K.fillTo(8); }); K.fillTo(8);
    var g = K.guestCard(); if (g) { g.by = 'guest'; ME.field.unshift(g); }
    G_.mode = 'play'; G_.mark = []; say(pick(['よろしく!', 'いくよ〜', 'ふふふ…', 'さあ勝負!']));
    renderAll(); SFX.put();
    var order = V.first === 'me' ? ['me', 'cpu'] : ['cpu', 'me'];
    for (var t = 1; t <= 3; t++) {
      for (var k = 0; k < 2; k++) {
        if (V.quit) return;
        V.turnTxt = '交換 <b>' + t + '/3</b> ・ ' + (order[k] === 'me' ? '<span class="you">あなたの番</span>:1〜3枚 捨てて交換 か、そのまま' : V.opp.name + 'の番');
        V.t = t;
        if (order[k] === 'me') {
          if (V.ri.me) { V.turnTxt = '交換 <b>' + t + '/3</b> ・ あなたはリーチ中(交換なし)'; renderAll(); await wait(500); continue; }
          var a = await ask('turn');
          if (a === 'riichi') { V.ri.me = t; riichiPay('me'); G_.busy = true; SFX.joker(); K.flash('🀄 リーチ! この文で勝負(点+' + riPct(t) + '%)'); say(pick(['む…リーチか', 'ほう…', 'こわいね'])); renderAll(); await wait(600); }
        } else await cpuTurn(t);
      }
      if (t === 1 || t === 3) { var r = await betting(t, order); if (V.quit) return; if (r) { await foldEnd(r); return; } }
    }
    await showdown();
  }
  // ---- CPU の手番 ----
  function best() {
    if (V.cpuLocked) return V.cpuLocked;
    var r = search(CPU.hand, V.rule, V.opp.lv), miss = [.3, .2, .1][V.opp.lv];
    if (r && r.alts && r.alts.length && rnd() < miss) r = r.alts[Math.floor(rnd() * r.alts.length)]; // 読みちがえ
    return r;
  }
  async function cpuTurn(t) {
    V.phase = 'cpu'; renderAll(); say('考え中…', 'think'); await wait(650);
    if (V.ri.cpu) { say('リーチ中…'); await wait(700); return; }
    var bst = best(), used = bst ? ids(bst.row) : {}, unused = CPU.hand.filter(function (c) { return !used[c.id]; });
    if (t <= 2 && bst && parts(bst.ev) >= 3 && V.med.cpu >= 5 && ((quant(bst.score) >= .7 && rnd() < .35) || (V.opp.style === 'bluff' && rnd() < .15))) {
      V.ri.cpu = t; riichiPay('cpu'); V.cpuBest = V.cpuLocked = bst; say('リーチ!!', 'hot'); SFX.joker(); renderAll(); await wait(1000); return;
    }
    unused.sort(function (a, b) { return (a.chips - b.chips) + (rnd() - .5) * 8; });
    var dc = unused.slice(0, 3);
    if (V.opp.style === 'bluff' && rnd() < .3 && bst) { var u2 = CPU.hand.filter(function (c) { return used[c.id]; }).sort(function (a, b) { return b.chips - a.chips; })[0]; if (u2 && dc.indexOf(u2) < 0) { dc = dc.slice(0, 2).concat([u2]); V.bluffed = true; } }
    if (!dc.length || (t === 3 && bst && quant(bst.score) >= .9 && rnd() < .7)) { say('交換しない'); V.cpuBest = bst; await wait(800); return; }
    dc.forEach(function (c) { c.by = 'cpu'; });
    withP(CPU, function () { K.Core.discard(dc); }); say(dc.length + '枚 捨てた'); SFX.tap(); renderAll(); await wait(800);
    var took = [], drew = 0, base = bst ? bst.score : 0;
    while (CPU.refill > 0) {
      var cands = ME.field.filter(function (c) { return (c.by === 'me' || c.by === 'guest') && c.chips + (c.bonus || 0) <= CPU.pts; }).sort(function (a, b) { return b.chips - a.chips; }).slice(0, V.opp.style === 'collector' ? 3 : 1), pickC = null, gain = 0;
      cands.forEach(function (c) { var r = search(CPU.hand.concat([c]), V.rule, V.opp.lv, 160), g = (r ? r.score : 0) - base; if (g > gain) { gain = g; pickC = c; } });
      if (!pickC && V.opp.style === 'collector' && cands.length && rnd() < .5) pickC = cands[0]; // じゃま
      if (pickC && gain >= 0) { withP(CPU, function () { K.Core.take(pickC); }); took.push(K.cardText(pickC)); base = Math.max(base, base + gain); }
      else { withP(CPU, function () { K.Core.drawOne(); }); drew++; }
    }
    say((took.length ? '場から「' + took.join('」「') + '」を取った' : '') + (took.length && drew ? '、' : '') + (drew ? '山から' + drew + '枚 引いた' : ''));
    V.cpuBest = best(); renderAll(); await wait(900);
  }
  function quant(s) { var q = QS[V.opp.lv]; return s < q[0] * .8 ? .1 : s < q[0] ? .25 : s < q[1] ? .45 : s < q[2] ? .7 : s < q[2] * 1.3 ? .85 : .95; }
  function cpuBet(face, raised, t) {
    var sc = V.cpuBest ? V.cpuBest.score : 0, q = quant(sc), st = V.opp.style, early = t === 1 ? .1 : 0, r = rnd();
    if (V.bluffed) q = Math.max(q, .6);
    if (!face) {
      var th = st === 'careful' ? .65 : st === 'bluff' ? .45 : .55, bl = st === 'bluff' ? .35 : st === 'careful' ? .03 : .1;
      return q >= th || r < bl ? 'bet' : 'check';
    }
    var fold = (st === 'careful' ? .4 : st === 'bluff' ? .2 : .3) - early, rz = st === 'bluff' ? .75 : st === 'careful' ? .9 : .85;
    if (V.med.me === 0) rz = 2;
    if (q < fold && !(st === 'bluff' && r < .4)) return 'fold';
    if (!raised && (q >= rz || (st === 'bluff' && r < .15)) && V.med.cpu > face) return 'raise';
    return 'call';
  }
  // ---- 賭け:先手から。チェック/ベット → コール/レイズ/降りる(レイズは1回まで) ----
  async function betting(t, order) {
    var amt = BETS[t], c0 = { me: V.c.me, cpu: V.c.cpu }, raised = false, acted = {}, i = 0, guard = 0;
    while (guard++ < 8) {
      var who = order[i % 2], oth = order[(i + 1) % 2], face = (V.c[oth] - c0[oth]) - (V.c[who] - c0[who]);
      if (face > 0 && V.med[who] === 0) face = 0;
      if (who !== 'me' && V.med.me === 0 && face === 0) { acted[who] = 1; }
      else {
        var a;
        if (who === 'me') { V.betQ = { face: face, raised: raised }; V.turnTxt = '<span class="you">賭け</span>:' + (face ? V.opp.name + 'が ' + face + ' 賭けた。受ける?' : 'ベットする?(1回目は' + BETS[1] + '・最後は' + BETS[3] + ')'); a = (await ask('bet')).a; if (V.quit) return null; }
        else { V.phase = 'cpu'; V.turnTxt = V.opp.name + 'が考えている…'; renderAll(); await wait(700); a = cpuBet(face, raised, t); }
        if (a === 'fold') { say(who === 'cpu' ? '降りる…' : 'やった!', who === 'cpu' ? 'sad' : 'happy'); return who === 'me' ? 'cpu' : 'me'; }
        if (a === 'check') { if (who === 'cpu') say('チェック'); acted[who] = 1; }
        if (a === 'call') { pay(who, face); if (who === 'cpu') say('コール'); SFX.coin(); acted[who] = 1; }
        if (a === 'bet' || a === 'raise') { pay(who, face + amt); if (a === 'raise') raised = true; acted = {}; acted[who] = 1; if (who === 'cpu') say(a === 'bet' ? 'ベット ' + amt + '!' : 'レイズ!! +' + amt, 'hot'); SFX.coin(); }
        renderAll();
      }
      var me2 = V.c.me - c0.me, cp2 = V.c.cpu - c0.cpu;
      if (acted.me && acted.cpu && (me2 === cp2 || V.med.me === 0 || V.med.cpu === 0)) return null;
      i++;
    }
    return null;
  }
  function settle(winner) {
    var p = V.pot;
    if (winner === 'draw') { V.med.me += Math.floor(p / 2); V.med.cpu += p - Math.floor(p / 2); }
    else V.med[winner] += p;
    V.pot = 0; if (winner === 'me') V.stats.win++; else if (winner === 'cpu') V.stats.lose++;
    return p;
  }
  async function foldEnd(winner) {
    var p = settle(winner); G_.busy = false; renderAll(); if (winner === 'me') SFX.win(); else SFX.lose();
    var o = el('div', 'modal', '<div class="box sd"><h2>' + (winner === 'me' ? V.opp.name + 'が降りた!' : '降りた') + '</h2><p class="res' + (winner === 'me' ? ' w' : ' l') + '">' + (winner === 'me' ? '🪙 +' + p : '🪙 ' + p + ' は ' + V.opp.name + 'へ') + '</p><button class="btn go" id="nx">つぎのハンドへ</button></div>');
    K.root().appendChild(o); $('#nx', o).onclick = function () { o.remove(); nextHand(); };
  }
  function miniRow(row, ev) { var w = el('div', 'srow'), sf = K.surfaceOf(row, ev); row.forEach(function (c, i) { var e = K.cardEl(c, 'field', 0, sf ? sf[i] : null); e.classList.add('mini'); w.appendChild(e); }); return w; }
  async function showdown() {
    V.phase = 'show'; V.turnTxt = '勝負!'; G_.busy = true; renderAll();
    var ev = K.evaluate(ME.row), my = ev.state === 'ok' ? scoreRow(ME.row, ev, V.rule) : null, cb = V.cpuBest = best(), cs = cb ? cb.sc : null, Q = V.quest.secret;
    var bon = function (f, who) { var o = []; if (V.ri[who]) o.push(['🀄 リーチ', riPct(V.ri[who])]); if (f && K.missionHit(V.mission, f)) o.push(['🎯 お題', 10]); if (f && K.questHit(Q, f)) o.push(['🔒 シークレット', K.Q_PCT[Q.tier]]); return o; };
    var mb = my ? bon(ev.f, 'me') : [], cbn = cs ? bon(cb.ev.f, 'cpu') : [], pc = function (l) { return Math.min(50, l.reduce(function (a, x) { return a + x[1]; }, 0)); };
    var mt = my ? Math.floor(myMul(my.total) * (1 + pc(mb) / 100)) : 0, ct = cs ? Math.floor(cs.total * (1 + pc(cbn) / 100)) : 0, win = mt > ct ? 'me' : mt < ct ? 'cpu' : 'draw';
    var bl = function (l) { return l.length ? '<div class="bon">' + l.map(function (x) { return x[0] + ' +' + x[1] + '%'; }).join(' ・ ') + (pc(l) < l.reduce(function (a, x) { return a + x[1]; }, 0) ? '(上限 +50%)' : '') + '</div>' : ''; };
    if (my && ev.f.colloc === 'good' && K.addCombo(ev.f.pair)) K.flash('📖 名コンビ図鑑に登録!「' + ev.f.pair + '」');
    var o = el('div', 'modal', '<div class="box sd"><h2>勝負!</h2>' +
      '<div class="side me"><div class="who">あなた' + (my ? '<button class="spk" id="spm">🔊</button>' : '') + '</div><div class="tx">' + (my ? ev.text : '(文になっていない → 0点)') + '</div>' + (my ? '<div class="yk2">' + my.y.name + '</div>' : '') + '<div class="cm2"><b class="chips">' + (my ? my.chips : 0) + '</b>×<b class="mult">' + (my ? my.mult : 0) + '</b>= <b class="tot" id="mt">0</b></div>' + bl(mb) + (mulNote() ? '<div class="bon">' + mulNote().replace('<br>', '') + '</div>' : '') + '</div>' +
      '<div class="side cp"><div class="who">' + V.opp.face + ' ' + V.opp.name + (cb ? '<button class="spk" id="spc">🔊 聞く</button>' : '') + '</div><div id="crow"></div><div class="tx">' + (cb ? cb.ev.text : '(文が作れなかった)') + '</div>' + (cs ? '<div class="yk2">' + cs.y.name + '</div>' : '') + '<div class="cm2"><b class="chips">' + (cs ? cs.chips : 0) + '</b>×<b class="mult">' + (cs ? cs.mult : 0) + '</b>= <b class="tot" id="ct">0</b></div>' + bl(cbn) + '</div>' +
      '<div class="qrev2">🔒 シークレットは「<b>' + Q.label + '</b>」(' + K.TIER_JA[Q.tier] + ' +' + K.Q_PCT[Q.tier] + '%)</div><p class="res" id="rs"></p><button class="btn go" id="nx" style="visibility:hidden">つぎのハンドへ</button></div>');
    K.root().appendChild(o); if (cb) $('#crow', o).appendChild(miniRow(cb.row, cb.ev));
    var rv = my ? K.reviewItems(ME.row, ev) : null; if (my) K.recordHist(V.hist = V.hist || [], ME.row, ev, mt);
    if (rv) { var rb = el('button', 'btn ghost small', '📖 この文の解説'); rb.onclick = function () { K.reviewFlow(rv); }; $('.side.me', o).appendChild(rb); }
    if ($('#spm', o)) $('#spm', o).onclick = function () { K.speak(ev.text); }; if ($('#spc', o)) $('#spc', o).onclick = function () { K.speak(cb.ev.text); };
    if (my) { K.speak(ev.text); } await wait(400); // 自分の文だけ自動で読む。相手の文は🔊で
    for (var i = 1; i <= 15; i++) { $('#mt', o).textContent = Math.round(mt * i / 15).toLocaleString(); $('#ct', o).textContent = Math.round(ct * i / 15).toLocaleString(); if (i % 3 === 0) SFX.chip(i); await wait(45); }
    await wait(my ? 1200 : 300);
    var p = settle(win);
    $('#rs', o).className = 'res ' + (win === 'me' ? 'w' : win === 'cpu' ? 'l' : '');
    $('#rs', o).textContent = win === 'me' ? '勝ち! 🪙 +' + p : win === 'cpu' ? '負け… 🪙 ' + p + ' は ' + V.opp.name + 'へ' : '引き分け(半分ずつ)';
    if (win === 'me') { SFX.win(); say(pick(['くっ…', 'やるね', 'まいった'])); } else if (win === 'cpu') { SFX.lose(); say(pick(['いただき!', 'ふふん', 'まだまだ'])); }
    if (rv) { await wait(900); await K.reviewAfter(rv); } // 直した所は勝負のあとすぐ(上級は見たい人だけ)
    $('#nx', o).style.visibility = 'visible'; G_.busy = false; renderAll();
    $('#nx', o).onclick = function () { o.remove(); nextHand(); };
  }
  function endMatch(quit) {
    var won = !quit && V.med.me > V.med.cpu, draw = !quit && V.med.me === V.med.cpu;
    var rec = K.store.get('vs') || {}, r = rec[V.opp.id] || { w: 0, l: 0 }; if (won) r.w++; else if (!draw) r.l++; rec[V.opp.id] = r; K.store.set('vs', rec);
    G_.vs = null; if (won) SFX.win(); else SFX.lose();
    var s = K.screen('<div class="end"><h1>' + (won ? '🏆 勝ち!' : draw ? '引き分け' : '負け…') + '</h1><div class="st">' + V.opp.face + ' ' + V.opp.name + ' との対戦</div>' +
      '<div class="tot">あなた 🪙' + V.med.me + ' ・ ' + V.opp.name + ' 🪙' + V.med.cpu + '</div><div class="st">ハンド ' + V.stats.win + '勝 ' + V.stats.lose + '敗 ・ 通算 ' + r.w + '勝 ' + r.l + '敗</div>' +
      ((V.hist || []).length ? '<button class="btn ghost" id="hs">📚 今回の文をふりかえる(' + V.hist.length + ')</button>' : '') + '<button class="btn go" id="re">もう一回</button><button class="btn vs" id="ot">相手をかえる</button><button class="btn ghost" id="tt">タイトルへ</button></div>');
    if ($('#hs', s)) { var hl = V.hist; $('#hs', s).onclick = function () { K.histModal(hl); }; }
    $('#re', s).onclick = function () { start(V.opp); }; $('#ot', s).onclick = function () { K.showTitle(); pickOpp(); }; $('#tt', s).onclick = function () { K.showTitle(); };
  }

  window.ChunkVS = { start: start, _search: search, _score: scoreRow, _V: function () { return V; }, _me: function () { return ME; }, _cpu: function () { return CPU; }, OPPS: OPPS };
})();
