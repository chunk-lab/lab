import { set_poseFace } from './play.js';
import { MD, N, jaPred, predV, sentenceText } from './engine.js';
import { onDoc } from './env.js';
import { EMO_LEFT, EMO_RIGHT } from './noto_map.js';
import { APP, POSE_OF_VERB, esc, poseFace, profOf, sceneNodes } from './play.js';
// ================= 動き（動詞ごとのポーズ・吹き出し・組み合わせ） =================
// 動詞は「動きの型」に振り分ける。絵にしにくい動詞（心・発話・好き嫌い）は吹き出しでチャンクの訳を出す。

// POSE_OF_VERB の上書き（motion.js の振り分けを優先。未分類はそのまま）

 


// 吹き出し：心・発話・好き嫌い → チャンクの訳。型・助動詞 → アイコン＋短い訳
export function motionJaShort(c){ try{ return jaPred(Object.assign({},c,{modal:null,q:null}),{kind:'main'},{}).replace(/。$/,''); }catch(e){ return ''; } }
export function motionBubble(add,c,sx,sy){
 const v=predV(c); if(!v) return false; const b=BUB_OF(v.id); if(!b) return false;
 const ic={think:'💭',say:'💬',feel:'💗'}[b]; const ja=motionJaShort(c);
 add('vbub',`<div class="vbub ${b}${c.neg?' neg':''}"><i>${ic}</i><span>${esc(ja)}</span></div>`, Math.min(sx+17,82), sy-19, {cls:'lbl'});
 return true;
}
export function modalBubbleHtml(c){ const md=MD(c.modal); if(!md) return ''; let ja=String(md.ja||'').replace(/[！!]/g,''); if(ja.length>15) ja=ja.slice(0,15)+'…';
 return `<div class="think mthink">${md.e}<small>${esc(ja)}</small></div>`; }

// 組み合わせ：主語の絵・目的語の絵につけるクラス
export let MANNER_AN;
export function motionSubjCls(c){ let k='';
 if(c.manner && MANNER_AN[c.manner]) k+=' m-'+MANNER_AN[c.manner];
 const F={tendto:'tend',usedto:'used',aboutto:'about',shouldhave:'regret',managedto:'managed',endedup:'ended',feellike:'want',meaningto:'meaning',thinkingof:'meaning',supposedto:'duty',getto:'lucky',dontmind:'ok',mightwant:'hint'}[c.modal];
 if(F) k+=' fx-'+F;
 if(['prog','pastprog','futprog','perfprog'].includes(c.tense)) k+=' t-prog';
 return k; }
export let OBJ_MOVE;
export function motionObjCls(c){ const v=predV(c); if(!v||c.neg) return ''; const p=POSE_OF_VERB[v.id]||MOTION_OF[v.id]; const m=OBJ_MOVE[p]||(['throw','kick'].includes(v.id)?'fly':''); return m?' o-'+m:''; }

// ===== 動き続けない：ループは約1.5秒ぶんだけ再生して最後の形で止める =====
export function motionLimit(a){ try{ const t=a.effect.getTiming(); if(t.iterations!==Infinity) return; const d=+t.duration||1000; let n=Math.max(1,Math.round(1500/d)); if(t.direction&&t.direction.includes('alternate')&&n%2) n++; n=Math.min(n,6); a.effect.updateTiming({iterations:n,fill:'forwards'}); }catch(e){} }

// 文が変わったら、キャラと目的語の動きをもう一度だけ再生
export let motionKey;
export function motionReplay(){ let k=''; try{ k=sentenceText(APP.S)+'|'+(APP.S.main.tense||'')+'|'+(APP.S.main.modal||'')+'|'+(APP.S.main.neg?1:0); }catch(e){} if(k===motionKey) return; motionKey=k;
 requestAnimationFrame(()=>{ ['subj','obj','with','iobjf','verbic','vbub','modal'].forEach(id=>{ const el=sceneNodes[id]; if(!el||!el.getAnimations) return; el.getAnimations({subtree:true}).forEach(a=>{ motionLimit(a); try{ a.currentTime=0; a.play(); }catch(e){} }); }); }); }

// 絵文字キャラの向き：真ん中の方を向く（主語は右向き・目的語は左向き）。逃げる系の動詞では主語は反対を向く
export let AWAY_V;
export function emoFlip(ref,x,c,role){ try{ if(!ref||profOf(ref)) return false; const n=N(ref); if(!n||!n.e) return false; const e=String(n.e).replace(/️/g,'');
 const L=EMO_LEFT.has(e), R=EMO_RIGHT.has(e); if(!L&&!R) return false;
 let want = x<50? 'right':'left'; const v=predV(c); if(role==='subj' && v && AWAY_V.has(v.id)) want = want==='right'?'left':'right';
 return (L&&want==='right')||(R&&want==='left'); }catch(e){ return false; } }

/* 読み込んだあと1回だけ、ファイルの順番どおりに動かす（main.js が呼ぶ） */
export function init_motion(){
(function(){
 const G={
  look:'watch see look look_for look_up look_into look_out look_around u_look_out_for u_look_back u_look_through u_look_over u_look_up_to u_look_down_on u_watch_out u_check_out check x_search x_notice x_explore x_investigate x_smell x_review find x_miss_the_bus i_looklike x_compare x_measure',
  write:'write draw study x_type x_print x_spell u_write_down u_write_back u_sign_up u_sign_in u_log_in u_log_out u_fill_in u_fill_out x_translate c1_color x_design x_paint_pictures c2_copy c2_email text x_post x_download x_record x_vote c2_publish x_book x_spend',
  give:'give show lend pass send feed sell u_hand_over u_hand_in u_hand_out u_give_out give_back give_away c2_hand c2_offer x_share x_serve u_pay_back u_pay_for x_introduce x_recommend u_show_off u_show_around u_drop_off u_put_back u_bring_in u_bring_out c2_receive x_earn x_borrow_money x_save_money x_rent x_order caus_let caus_help c2_contact i_takepartin x_join u_save_up',
  phone:'call c1_phone u_call_back u_call_up u_call_off u_call_for u_hear_from i_keepintouch listen u_hold_on hang_on hang_up',
  talk:'say tell ask answer talk shout sing teach x_explain x_whisper x_yell x_complain x_argue x_promise x_gossip x_describe x_report x_announce x_pronounce c1_discuss c1_speak c1_repeat c2_chat c2_communicate c2_suggest c2_advise c2_encourage u_speak_up u_talk_over caus_tell caus_ask u_point_out x_whistle x_cancel c2_blame c2_annoy c2_bother c2_disturb',
  think:'think know hope remember forget x_understand x_plan x_decide x_worry x_guess x_imagine x_wonder x_forgive c2_consider c2_expect c2_predict c2_realize c2_regret c2_concentrate c2_confuse x_memorize x_solve x_learn u_figure_out u_think_over u_come_up_with i_thinkabout i_makeupmind i_makesense i_makesure i_believein i_focuson i_relyon i_payattention u_count_on u_feel_like need c1_mean i_lookforwardto look_forwardto x_try x_prepare u_get_ready u_make_up u_mix_up c2_exist c1_happen u_end_up u_turn_out i_takeadvantage i_leadto u_stick_to u_deal_with u_sort_out u_work_on u_brush_up_on c2_apply c2_achieve choose put_upwith u_make_out u_take_in u_stand_for x_dream',
  feel:'like x_hate x_prefer x_miss x_trust x_respect c2_admire c2_appreciate u_fall_for u_care_for u_take_after u_let_down',
  nod:'x_agree x_nod c2_accept u_catch_on x_greet u_go_ahead x_thank x_blink',
  nope:'refuse c2_disagree c2_avoid u_back_out quit x_stop give_up give_in u_hold_back u_shut_up u_call_off x_let_go break_up u_drop_out u_sell_out',
  bow:'x_bow c2_apologize x_pray i_payattention_x',
  clap:'x_clap x_cheer x_celebrate u_cheer_up c2_impress x_score have_fun i_haveagoodtime',
  push:'push pull x_drag u_knock_down x_knock c2_hit x_attack x_beat x_defeat x_fight u_pull_over c2_bend u_kick_out u_break_in u_break_out break x_tear c2_destroy c2_ruin c2_steal u_blow_up c1_blow u_blow_out u_pick_on',
  lift:'x_lift x_raise pick_up pick x_collect c2_gather take_up u_put_up x_lower u_set_up grab x_hold get take put put_on put_off put_away put_down put_out take_off take_out take_back take_away u_take_apart u_put_together u_put_in x_fill u_fill_up u_plug_in u_switch_on u_switch_off turn_on turn_off turn_up turn_down open close x_drop u_throw_away u_throw_out c2_cover c2_bury c2_divide c2_replace x_raise_x x_pick_flowers x_grow_plants x_feed_the_cat c1_add x_try_on u_try_on u_try_out x_touch c2_shut hang pick_out x_weigh u_cut_off',
  stir:'cook x_mix x_boil x_fry x_bake c2_roast wash clean x_sweep x_vacuum x_iron c1_brush u_clean_up c2_tidy u_tidy_up x_wrap x_fold x_knit x_sew x_tie c2_dry u_wash_up u_clean_out x_water x_pour c2_recycle x_pack u_pack_up fix x_repair c2_spill take_ashower c2_dress u_dress_up u_wear_out x_create x_invent c2_produce c2_develop build make',
  sneeze:'x_sneeze x_cough x_hiccup u_throw_up c2_sweat x_breathe catch_acold u_come_down_with c2_injure c1_hurt',
  fall:'fall c2_die c2_disappear u_pass_out u_fall_apart u_pass_away x_sink x_melt u_fall_behind c2_fail lose u_get_lost x_miss_x c2_retire u_calm_down u_settle_down u_slow_down u_cool_down x_float c2_end',
  mouth:'eat drink x_bite x_lick x_chew x_swallow x_taste have_lunch u_eat_out u_eat_up x_kiss x_yawn',
  wave:'arrive meet invite x_wave c1_welcome show_up u_drop_by u_reach_out u_come_on u_get_together x_marry u_get_married x_hug_each_other u_get_along u_take_turns u_fit_in',
  walk:'x_pass_by x_crawl c2_cross come_across go_over u_go_by u_head_out u_set_off u_start_out u_get_away u_step_back c2_land u_go_shopping u_come_around u_go_up u_go_down u_keep_going u_keep_on u_carry_on continue u_get_by u_move_on c2_park u_get_in u_go_off u_head_to u_go_for u_go_into u_get_into u_get_out_of u_get_back_to u_get_through come_over u_come_up u_stick_around u_hang_around u_stand_by u_line_up u_check_in u_follow_up u_catch_up u_catch_up_with u_keep_up_with u_keep_up',
  up:'stand win x_stretch c2_increase c2_improve c2_succeed recover u_get_better start x_begin x_finish u_make_it u_come_true u_stand_out u_pop_up appear c2_perform u_warm_up u_open_up i_takeplace u_take_over u_take_on u_kick_off x_shine x_ring c2_rain c2_snow x_burn do_possbest c1_grow turn_into get_over',
  sit:'wait rest u_sit_back u_sit_up x_kneel c1_sit u_stay_in x_sigh x_frown',
  laugh:'smile x_giggle u_make_fun_of u_freak_out x_shake',
  cry:'cry c2_frighten',
  hug:'love hug protect x_kiss_x c2_survive u_look_after look_after take_careof u_care_for_x x_rescue caus_have caus_make caus_want',
  run:'u_hurry_up u_jump_in',
  sleep:'u_fall_asleep',
  hold:'carry bring use wear have do work read x_keep x_save c2_hand_x keep drive x_hold_x u_hold_x x_play',
 };
 const MAP={}; Object.entries(G).forEach(([p,l])=>l.split(/\s+/).forEach(id=>{ if(id) MAP[id]=p; }));
 window.MOTION_OF=MAP;
 // 吹き出しで意味を出す動詞
 window.BUB_OF=id=>{ const p=MAP[id]; return p==='think'?'think':p==='feel'?'feel':p==='talk'||p==='phone'&&/call|phone|hear/.test(id)?'say':null; };
})();
Object.entries(MOTION_OF).forEach(([id,p])=>{ POSE_OF_VERB[id]= p==='feel'?'hug':p; });
POSE_OF_VERB.love='hug';
POSE_OF_VERB.like='hug';
{ const _pf=poseFace;
  set_poseFace(function(c){ const r=_pf(c); const v=predV(c);
   const F={look:'neutral',write:'neutral',give:'happy',phone:'talk',clap:'excited',bow:'neutral',nod:'happy',nope:'neutral',push:'angry',lift:'busy',stir:'neutral',sneeze:'talk',fall:'sad',think:'neutral',hug:'happy'};
   if(v && F[r.pose] && r.face==='neutral') r.face=F[r.pose];
   if(v && ['x_hate','c2_annoy','c2_bother','x_complain','x_argue','x_fight'].includes(v.id)) r.face='angry';
   if(v && ['x_worry','c2_regret','x_miss','c2_confuse'].includes(v.id)) r.face='sad';
   if(c.neg && predV(c)) r.face='neutral';
   return r; }); }
MANNER_AN = {happily:'happy',carefully:'care',quietly:'quiet',loudly:'loud',well:'well',hard:'hard',again:'again',a_lot:'alot'};
OBJ_MOVE = {mouth:'eat',give:'give',push:'push',lift:'lift',look:'look',write:'tilt',stir:'spin',hold:'held',throw:'fly',kick:'fly'};
onDoc('animationstart',e=>{ e.target.getAnimations&&e.target.getAnimations().forEach(motionLimit); },true);
motionKey = '';
AWAY_V = new Set(['escape','run_away','go_away','leave','u_get_away','x_leave_the_room','take_away','run_out']);
}
