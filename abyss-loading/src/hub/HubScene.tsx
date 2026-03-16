// src/hub/HubScene.tsx
// 深淵載入中 — 主祠空間大廳
// 畫面：標題 + 橫幅 + 大廳選單 + 底部資訊欄
// 面板：副本選擇 / 遺物背包 / 輪迴紀錄 / 系統設定
//
// index.html 加入：
// <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;600&family=Share+Tech+Mono&display=swap" rel="stylesheet">

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { HubInstanceEntry } from '../types/game.types';
import hubConfig from './hub.config.json';

// ── Global CSS ─────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@keyframes bg-b    { 0%,100%{transform:scale(1.05)} 50%{transform:scale(1)} }
@keyframes title-w { 0%,100%{opacity:.85;filter:blur(0)} 45%{opacity:.65;filter:blur(.4px)} }
@keyframes tpulse  { 0%,100%{opacity:.3} 50%{opacity:1} }
@keyframes gra     { 0%{background-position:0 0} 25%{background-position:-30px 20px} 50%{background-position:24px -16px} 75%{background-position:-18px 32px} 100%{background-position:0 0} }
@keyframes mote-up { 0%{opacity:0;transform:translateY(0) translateX(0)} 14%{opacity:var(--op)} 85%{opacity:var(--op)} 100%{opacity:0;transform:translateY(var(--dy)) translateX(var(--dx))} }

.abh-mote { position:absolute;border-radius:50%;pointer-events:none;opacity:0;animation:mote-up linear infinite; }
.abh-col  { position:absolute;bottom:0;width:1.5px;background:linear-gradient(0deg,rgba(180,165,220,.04) 0%,rgba(180,165,220,.18) 50%,rgba(180,165,220,.28) 75%,rgba(180,165,220,0) 100%); }

.abh-tog { width:32px;height:18px;border:1px solid rgba(180,165,220,.18);background:rgba(12,10,24,.6);position:relative;cursor:pointer;flex-shrink:0;transition:.2s; }
.abh-tog.on { border-color:rgba(180,165,220,.4);background:rgba(20,16,38,.8); }
.abh-tog::after { content:'';position:absolute;top:2px;left:2px;width:12px;height:12px;background:rgba(150,138,185,.4);transition:.2s; }
.abh-tog.on::after { left:16px;background:rgba(210,195,255,.72); }

.abh-lobby-card { transition:all .28s cubic-bezier(.2,0,.2,1); }
.abh-lobby-card:hover { border-color:rgba(180,165,220,.28) !important;background:rgba(20,17,38,.88) !important;transform:translateY(-2px); }
.abh-lobby-card:hover .abh-lc-title { color:rgba(235,225,255,.95) !important; }
.abh-lobby-card:hover .abh-lc-arrow { transform:translateX(4px); }

.abh-pclose { font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.18em;color:rgba(160,145,200,.3);cursor:pointer;padding:6px 12px;border:1px solid rgba(180,165,220,.1);background:transparent;transition:all .2s; }
.abh-pclose:hover { color:rgba(200,185,240,.7);border-color:rgba(180,165,220,.25); }
.abh-enter-btn { margin-top:8px;padding:5px 14px;background:transparent;border:1px solid rgba(180,165,220,.14);font-family:'Share Tech Mono',monospace;font-size:8.5px;letter-spacing:.18em;color:rgba(190,175,230,.5);cursor:pointer;transition:all .2s;display:block;text-transform:uppercase; }
.abh-enter-btn:hover { border-color:rgba(180,165,220,.35);color:rgba(220,208,255,.85); }
`;

const M = {
  mono:  "'Share Tech Mono', monospace" as const,
  serif: "'Noto Serif TC', serif"       as const,
};

type PanelId = 'instance' | 'backpack' | 'achieve' | 'settings';

// ── HubScene ───────────────────────────────────────────────────────────────
export default function HubScene() {
  const rootRef   = useRef<HTMLDivElement>(null);
  const [panel,   setPanel]   = useState<PanelId | null>(null);
  const [toggles, setToggles] = useState({
    typewriter: true, audio: false, grain: true,
    auto: false, flash: true, scan: true,
  });

  const { globalTags, globalInventory, loadInstance,
          stats, instanceFortune, localTags } = useGameStore();

  // inject CSS
  useEffect(() => {
    if (document.getElementById('abh-css')) return;
    const s = document.createElement('style');
    s.id = 'abh-css'; s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
    return () => { document.getElementById('abh-css')?.remove(); };
  }, []);

  // dust motes
  useEffect(() => {
    const root = rootRef.current; if (!root) return;
    const arr: HTMLDivElement[] = [];
    for (let i = 0; i < 16; i++) {
      const m = document.createElement('div'); m.className = 'abh-mote';
      const s = Math.random() * 1.8 + 0.5;
      m.style.cssText = `width:${s}px;height:${s}px;background:rgba(200,185,255,${Math.random()*.15+.04});left:${Math.random()*100}%;top:${10+Math.random()*65}%;--op:${Math.random()*.14+.04};--dy:-${Math.random()*55+30}px;--dx:${(Math.random()-.5)*24}px;animation-duration:${Math.random()*13+9}s;animation-delay:-${Math.random()*13}s`;
      root.appendChild(m); arr.push(m);
    }
    return () => arr.forEach(m => m.remove());
  }, []);

  const handleEnter = useCallback(async (id: string) => {
    try {
      const mod = await import(`../instances/${id}/index.ts`);
      loadInstance(mod.default);
    } catch (e) { console.error('loadInstance failed:', id, e); }
  }, [loadInstance]);

  const isUnlocked = (inst: HubInstanceEntry) => {
    if (!inst.unlock_condition) return true;
    if (inst.unlock_condition.req_global_tag)
      return globalTags.includes(inst.unlock_condition.req_global_tag);
    if (inst.unlock_condition.req_global_item)
      return globalInventory.includes(inst.unlock_condition.req_global_item);
    return false;
  };

  // ── shared components ──
  const PanelHead = ({ title, sub }: { title: string; sub: string }) => (
    <div style={{
      padding: '22px 28px 16px',
      borderBottom: '1px solid rgba(180,165,220,.08)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 300, letterSpacing: '.2em', color: 'rgba(230,218,255,.78)' }}>{title}</div>
        <div style={{ fontFamily: M.mono, fontSize: 9, letterSpacing: '.2em', color: 'rgba(160,145,200,.32)', marginTop: 5 }}>{sub}</div>
      </div>
      <button className="abh-pclose" onClick={() => setPanel(null)}>× 關閉</button>
    </div>
  );

  const Body = ({ children }: { children: React.ReactNode }) => (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 28px' }}>{children}</div>
  );

  const SecTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      fontFamily: M.mono, fontSize: 8.5, letterSpacing: '.22em',
      color: 'rgba(160,145,200,.28)', textTransform: 'uppercase' as const,
      marginBottom: 10, paddingBottom: 6,
      borderBottom: '1px solid rgba(180,165,220,.06)',
    }}>{children}</div>
  );

  const instIconMap: Record<string, string>  = { song_wang: '⛵', tribunal: '⚖️', castle: '🏰' };
  const instColorMap: Record<string, string> = { song_wang: 'rgba(220,160,80,.65)', tribunal: 'rgba(160,130,255,.6)', castle: 'rgba(100,200,155,.5)' };

  return (
    <div ref={rootRef} style={{
      position: 'relative', width: '100%', height: '100vh',
      overflow: 'hidden', background: '#0e0c1a',
      fontFamily: M.serif,
    }}>

      {/* ── Background ── */}
      <div style={{
        position: 'absolute', inset: '-4%',
        animation: 'bg-b 20s ease-in-out infinite',
        background: `
          radial-gradient(ellipse 70% 55% at 50% 0%,  rgba(55,42,90,.55)  0%,transparent 60%),
          radial-gradient(ellipse 45% 40% at 15% 60%, rgba(35,25,60,.45)  0%,transparent 55%),
          radial-gradient(ellipse 45% 40% at 85% 55%, rgba(28,30,55,.4)   0%,transparent 52%),
          linear-gradient(175deg,#0c0b18 0%,#12102a 35%,#0d0c1e 65%,#0b0a16 100%)
        `,
      }} />

      {/* Light shafts */}
      {[['18%',110,1.5,520],['47%',150,0,560],['76%',90,-2,480]].map(([l,w,r,h],i) => (
        <div key={i} style={{
          position:'absolute',top:0,left:l as string,width:w as number,height:h as number,
          background:'linear-gradient(180deg,rgba(200,185,255,.025) 0%,transparent 72%)',
          filter:'blur(28px)',transform:`rotate(${r}deg)`,pointerEvents:'none',
        }}/>
      ))}

      {/* Columns */}
      {[['6%',420,1],['13%',490,.5],['25%',340,.32],['75%',360,.3],['87%',470,.48],['94%',410,.38]].map(([l,h,op],i) => (
        <div key={i} className="abh-col" style={{left:l as string,height:h as number,opacity:op as number}}/>
      ))}

      {/* Floor */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:160,
        background:'linear-gradient(0deg,rgba(10,9,22,1) 0%,rgba(13,12,26,.6) 50%,transparent 100%)'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,
        background:'linear-gradient(90deg,transparent,rgba(180,165,220,.12) 30%,rgba(180,165,220,.2) 50%,rgba(180,165,220,.12) 70%,transparent)'}}/>

      {/* Grain */}
      <div style={{position:'absolute',inset:0,opacity:.022,pointerEvents:'none',
        animation:'gra .08s steps(1) infinite',
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize:'200px'}}/>

      {/* Vignette */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',
        background:'radial-gradient(ellipse at 50% 40%,transparent 38%,rgba(6,5,14,.75) 100%)'}}/>

      {/* ── Top Bar ── */}
      <div style={{
        position:'absolute',top:0,left:0,right:0,height:36,zIndex:30,
        background:'rgba(10,9,20,.88)',borderBottom:'1px solid rgba(180,165,220,.1)',
        display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',
      }}>
        <span style={{fontFamily:M.mono,fontSize:11,letterSpacing:'.18em',color:'rgba(180,165,220,.45)'}}>
          <span style={{display:'inline-block',width:5,height:5,borderRadius:'50%',
            background:'rgba(160,140,210,.6)',marginRight:8,animation:'tpulse 4s ease-in-out infinite'}}/>
          深淵載入中&nbsp;·&nbsp;主祠空間
        </span>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{fontFamily:M.mono,fontSize:11,letterSpacing:'.12em',
            padding:'3px 10px',border:'1px solid rgba(180,165,220,.15)',color:'rgba(180,165,220,.4)'}}>
          </span>
          <span style={{fontFamily:M.mono,fontSize:11,letterSpacing:'.18em',color:'rgba(180,165,220,.3)'}}>
          </span>
        </div>
      </div>

      {/* ── Title ── */}
      <div style={{
        position:'absolute',top:52,left:'50%',transform:'translateX(-50%)',
        textAlign:'center',pointerEvents:'none',zIndex:5,whiteSpace:'nowrap',
      }}>
        <div style={{
          fontSize:38,fontWeight:300,letterSpacing:'.3em',
          color:'rgba(230,218,255,.85)',
          textShadow:'0 0 60px rgba(160,130,255,.25),0 0 120px rgba(120,90,200,.15)',
          animation:'title-w 12s ease-in-out infinite',
        }}>深淵載入中</div>
        <div style={{fontFamily:M.mono,fontSize:10,letterSpacing:'.5em',color:'rgba(180,165,220,.35)',marginTop:6}}>
          ABYSS · LOADING · ∞
        </div>
        <div style={{marginTop:10,fontSize:13,fontWeight:300,fontStyle:'italic',
          color:'rgba(200,185,240,.35)',letterSpacing:'.08em'}}>
          記憶廢墟
        </div>
      </div>

      {/* ── Fortune Strip ── */}
      <div style={{
        position:'absolute',top:170,left:'50%',transform:'translateX(-50%)',
        display:'flex',alignItems:'center',gap:12,
        background:'rgba(14,12,28,.7)',border:'1px solid rgba(180,165,220,.1)',
        padding:'8px 20px',whiteSpace:'nowrap',
      }}>
        <span style={{fontFamily:M.mono,fontSize:10,letterSpacing:'.2em',color:'rgba(160,145,200,.4)',textTransform:'uppercase'}}>本輪靈簽</span>
        <div style={{width:1,height:20,background:'rgba(180,165,220,.12)'}}/>
        <span style={{fontSize:20}}>{instanceFortune?.icon_emoji ?? '🌒'}</span>
        <span style={{fontSize:15,color:'rgba(220,208,255,.75)',letterSpacing:'.06em'}}>{instanceFortune?.name ?? '太陰訓命'}</span>
        <span style={{fontFamily:M.mono,fontSize:10,letterSpacing:'.12em',
          color:'rgba(160,145,200,.38)',padding:'2px 6px',border:'1px solid rgba(160,145,200,.15)'}}>
          {instanceFortune?.rarity ?? 'RARE'}
        </span>
        <div style={{width:1,height:20,background:'rgba(180,165,220,.12)'}}/>
        {[
          {label:'靈氣', val:stats.inspiration,  color:'rgba(130,100,220,.8)'},
          {label:'體質', val:stats.constitution,  color:'rgba(52,180,120,.8)'},
          {label:'業力', val:stats.karma, color:stats.karma < 0 ? 'rgba(220,120,100,.8)' : 'rgba(160,145,200,.7)',
           display: stats.karma < 0 ? `▼${Math.abs(stats.karma)}` : `${stats.karma}`},
        ].map(s => (
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:5}}>
            <span style={{fontFamily:M.mono,fontSize:10,color:'rgba(160,145,200,.38)',letterSpacing:'.1em'}}>{s.label}</span>
            <span style={{fontFamily:M.mono,fontSize:11,color:s.color}}>{(s as any).display ?? s.val}</span>
          </div>
        ))}
        {localTags.length > 0 && (
          <>
            <div style={{width:1,height:20,background:'rgba(180,165,220,.12)'}}/>
            {localTags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontFamily:M.mono,fontSize:8,padding:'2px 6px',letterSpacing:'.06em',
                color:'rgba(52,180,120,.7)',border:'1px solid rgba(52,180,120,.2)',
              }}>{tag}</span>
            ))}
          </>
        )}
      </div>

      {/* ── Lobby Grid ── */}
      <div style={{
        position:'absolute',top:'60%',left:'50%',transform:'translate(-50%,-50%)',
        display:'grid',gridTemplateColumns:'1fr 1fr',
        gap:14,width:'min(740px,92vw)',
      }}>
        {[
          { id:'instance', icon:'✲', title:'進入副本',   ac:'rgba(220,160,80,.6)',
            desc:`選擇記憶碎片 · 進入指定世界\n永安鎮：送王 · 深淵庭院 · 更多即將展示` },
          { id:'backpack', icon:'◈',  title:'遺物背包',   ac:'rgba(160,130,255,.6)',
            desc:`永久遺物 · 副本遺物 · 詳細查閱\n當前持有：2 永久 · 4 副本` },
          { id:'achieve',  icon:'◎',  title:'輪迴紀錄',   ac:'rgba(200,180,100,.6)',
            desc:`成就 · 結局紀錄 · 命格歷史\n已獲 4 項 · 3 項待解中` },
          { id:'settings', icon:'⊙',  title:'系統設定',   ac:'rgba(160,155,185,.5)',
            desc:`音效 · 視覺效果 · 語言 · 顯示\n深淵運行參數調整` },
        ].map(card => (
          <div
            key={card.id}
            className="abh-lobby-card"
            onClick={() => setPanel(card.id as PanelId)}
            style={{
              background:'rgba(14,12,28,.72)',
              border:'1px solid rgba(180,165,220,.12)',
              padding:'20px 22px',
              cursor:'pointer',position:'relative',overflow:'hidden',
              display:'flex',alignItems:'center',gap:16,
            }}
          >
            {/* left accent bar */}
            <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:card.ac,transition:'width .25s'}}/>
            {/* hover bg gradient */}
            <div style={{position:'absolute',inset:0,
              background:'linear-gradient(135deg,rgba(180,165,220,.04) 0%,transparent 60%)',
              opacity:0,transition:'opacity .25s'}}/>
            <div style={{
              width:52,height:52,flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              border:'1px solid rgba(180,165,220,.1)',background:'rgba(10,8,20,.6)',
              fontSize:26,transition:'filter .25s',
            }}>{card.icon}</div>
            <div style={{flex:1}}>
              <div className="abh-lc-title" style={{
                fontSize:18,fontWeight:400,letterSpacing:'.1em',
                color:'rgba(220,208,255,.78)',marginBottom:6,transition:'color .25s',
              }}>{card.title}</div>
              <div style={{
                fontFamily:M.mono,fontSize:11,letterSpacing:'.06em',
                color:'rgba(160,145,200,.45)',lineHeight:1.6,
                whiteSpace:'pre-line',
              }}>{card.desc}</div>
            </div>
            <div className="abh-lc-arrow" style={{
              fontFamily:M.mono,fontSize:14,color:card.ac,
              flexShrink:0,transition:'transform .25s,color .25s',
            }}>→</div>
          </div>
        ))}
      </div>

      {/* ── Bottom Status Bar ── */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,height:36,
        background:'rgba(8,7,18,.95)',borderTop:'1px solid rgba(180,165,220,.08)',
        display:'flex',alignItems:'center',padding:'0 20px',gap:0,
        fontFamily:M.mono,fontSize:11,
      }}>
        {[
          { label:'靈氣', val:stats.inspiration,  fill:'rgba(130,100,220,.65)', w: Math.min(100,stats.inspiration) },
          { label:'體質', val:stats.constitution,  fill:'rgba(52,180,120,.6)',   w: Math.min(100,stats.constitution) },
          { label:'業力', val:Math.abs(stats.karma), fill:'rgba(220,120,80,.6)',
            w: Math.min(100,Math.abs(stats.karma)),
            display: stats.karma < 0 ? `▼${Math.abs(stats.karma)}` : `${stats.karma}`,
            color: stats.karma < 0 ? 'rgba(220,130,100,.7)' : 'rgba(200,185,240,.55)' },
        ].map(s => (
          <div key={s.label} style={{display:'flex',alignItems:'center',gap:8,padding:'0 20px',
            borderRight:'1px solid rgba(180,165,220,.08)',height:'100%'}}>
            <span style={{color:'rgba(160,145,200,.3)',letterSpacing:'.15em'}}>{s.label}</span>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:48,height:2,background:'rgba(180,165,220,.08)'}}>
                <div style={{width:`${s.w}%`,height:'100%',background:s.fill}}/>
              </div>
              <span style={{color:(s as any).color ?? 'rgba(200,185,240,.55)',letterSpacing:'.1em'}}>
                {(s as any).display ?? s.val}
              </span>
            </div>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 20px',
          borderRight:'1px solid rgba(180,165,220,.08)',height:'100%'}}>
          <span style={{color:'rgba(160,145,200,.3)',letterSpacing:'.15em'}}>副本</span>
          <span style={{color:'rgba(200,185,240,.55)',letterSpacing:'.1em'}}>永安鎮：送王</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 20px',
          borderRight:'1px solid rgba(180,165,220,.08)',height:'100%'}}>
          <span style={{color:'rgba(160,145,200,.3)',letterSpacing:'.15em'}}>上次結局</span>
          <span style={{color:'rgba(200,180,100,.65)',letterSpacing:'.1em'}}>S · 第411次終止</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'0 0 0 20px',marginLeft:'auto',height:'100%'}}>
          <span style={{color:'rgba(160,145,200,.3)',letterSpacing:'.15em'}}>NEXUS</span>
          <span style={{color:'rgba(200,185,240,.55)',letterSpacing:'.1em'}}>主祠空間 · 穩定</span>
        </div>
      </div>

      {/* ── PANEL OVERLAY ── */}
      {panel && (
        <div style={{
          position:'absolute',top:36,left:0,right:0,bottom:36,zIndex:20,
          background:'rgba(8,7,18,.96)',display:'flex',flexDirection:'column',
        }}>

          {/* INSTANCE */}
          {panel === 'instance' && (
            <>
              <PanelHead title="副本選擇" sub="選擇記憶碎片，進入指定副本"/>
              <Body>
                {(hubConfig.instances as HubInstanceEntry[]).map(inst => {
                  const ok = isUnlocked(inst);
                  const ac = instColorMap[inst.id] ?? 'rgba(180,165,220,.3)';
                  return (
                    <div key={inst.id} style={{
                      display:'flex',alignItems:'center',gap:16,
                      padding:'16px',marginBottom:10,
                      border:'1px solid rgba(180,165,220,.1)',background:'rgba(14,12,28,.65)',
                      position:'relative',overflow:'hidden',
                      opacity: ok ? 1 : 0.3,
                      pointerEvents: ok ? 'all' : 'none',
                      transition:'all .22s',
                    }}>
                      <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:ac}}/>
                      <div style={{width:46,height:46,display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:22,border:'1px solid rgba(180,165,220,.1)',flexShrink:0}}>
                        {instIconMap[inst.id] ?? '◈'}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:15,color:'rgba(220,208,255,.75)',fontWeight:400,marginBottom:4}}>{inst.name}</div>
                        <div style={{fontFamily:M.mono,fontSize:8,letterSpacing:'.08em',color:'rgba(160,145,200,.38)',lineHeight:1.6}}>
                          {ok ? '已解鎖 · 點擊進入副本' : `解鎖條件：${inst.unlock_condition?.req_global_tag ?? inst.unlock_condition?.req_global_item ?? '未知'}`}
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontFamily:M.mono,fontSize:8.5,letterSpacing:'.1em',color:ac}}>
                          {ok ? '已解鎖' : '▶ 待解中'}
                        </div>
                        {ok && (
                          <button className="abh-enter-btn" onClick={() => handleEnter(inst.id)}>
                            進入副本
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Body>
            </>
          )}

          {/* BACKPACK */}
          {panel === 'backpack' && (
            <>
              <PanelHead title="遺物背包" sub="永久遺物 / 副本遺物"/>
              <Body>
                {[
                  { title:'GLOBAL · 永久持有', items:[
                    {icon:'🧿',name:'命牌護符',rarity:'EPIC',  rc:'rgba(160,130,255,.55)'},
                    {icon:'🏛️',name:'輪迴令牌',rarity:'LEG',   rc:'rgba(220,180,60,.6)'},
                  ]},
                  { title:'LOCAL · 上次副本（永安鎮：送王）', items:[
                    {icon:'🌐',name:'天機車軸',rarity:'RARE',   rc:'rgba(80,140,220,.52)'},
                    {icon:'⛓️',name:'業障鎖鏈',rarity:'CURSED', rc:'rgba(220,80,80,.55)'},
                    {icon:'🗿',name:'殘缺符石',rarity:'CMN',    rc:'rgba(160,148,185,.4)'},
                    {icon:'🌿',name:'古草藥方',rarity:'CMN',    rc:'rgba(160,148,185,.4)'},
                  ]},
                ].map((sec, si) => (
                  <div key={si} style={{marginBottom:18}}>
                    <SecTitle>{sec.title}</SecTitle>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:8}}>
                      {sec.items.map((it, ii) => (
                        <div key={ii} style={{
                          aspectRatio:'1',border:'1px solid rgba(180,165,220,.08)',
                          background:'rgba(12,10,24,.55)',display:'flex',flexDirection:'column',
                          alignItems:'center',justifyContent:'center',gap:3,
                          position:'relative',cursor:'pointer',transition:'all .2s',
                        }}>
                          <span style={{fontSize:19}}>{it.icon}</span>
                          <span style={{fontFamily:M.mono,fontSize:7,color:'rgba(160,148,195,.4)',letterSpacing:'.04em',textAlign:'center'}}>{it.name}</span>
                          <span style={{position:'absolute',top:2,right:3,fontFamily:M.mono,fontSize:6.5,color:it.rc}}>{it.rarity}</span>
                        </div>
                      ))}
                      {Array(6 - sec.items.length).fill(null).map((_,ei) => (
                        <div key={`e${ei}`} style={{aspectRatio:'1',border:'1px solid rgba(180,165,220,.08)',background:'rgba(12,10,24,.55)',opacity:.2}}/>
                      ))}
                    </div>
                  </div>
                ))}
              </Body>
            </>
          )}

          {/* ACHIEVE */}
          {panel === 'achieve' && (
            <>
              <PanelHead title="輪迴紀錄" sub="你走過的每一次命格記錄"/>
              <Body>
                {[
                  {icon:'🏆',name:'第411次：最後一次',desc:'永安鎮：送王完成神明結局，終止百年輪迴',  status:'S結局',color:'rgba(220,180,60,.7)',  locked:false},
                  {icon:'🔥',name:'引火焚身',          desc:'觸發天機命格，觸發宮火覺醒事件',   status:'已獲',  color:'rgba(160,130,255,.7)', locked:false},
                  {icon:'🧵',name:'赤絲護命',           desc:'貪命命格，赤絲纏繞，從死亡邊緣歸來',status:'已獲', color:'rgba(220,100,100,.65)',locked:false},
                  {icon:'⚖️',name:'命格清白',           desc:'以業力值≥20通過深淵庭院審判',      status:'已獲',  color:'rgba(160,130,255,.65)',locked:false},
                  {icon:'📜',name:'解謎達人',           desc:'在深淵庭院完成所有謎題',            status:'待解',  color:'rgba(160,145,200,.2)', locked:true},
                  {icon:'☠️',name:'永生的第412次',      desc:'在任何副本累計死亡超過三次',        status:'待解',  color:'rgba(160,145,200,.2)', locked:true},
                  {icon:'⛓️',name:'業障繫身',           desc:'攜帶所有詛咒遺物通過任何副本',      status:'待解',  color:'rgba(160,145,200,.2)', locked:true},
                ].map((a, i) => (
                  <div key={i} style={{
                    display:'flex',alignItems:'center',gap:14,padding:'12px 0',
                    borderBottom:'1px solid rgba(180,165,220,.05)',opacity:a.locked ? .25 : 1,
                  }}>
                    <div style={{width:36,height:36,border:'1px solid rgba(180,165,220,.1)',
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>{a.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13.5,color:'rgba(210,200,240,.62)',marginBottom:3}}>{a.name}</div>
                      <div style={{fontFamily:M.mono,fontSize:8,letterSpacing:'.08em',color:'rgba(150,138,185,.34)',lineHeight:1.55}}>{a.desc}</div>
                    </div>
                    <div style={{fontFamily:M.mono,fontSize:8.5,color:a.color,flexShrink:0,marginLeft:'auto'}}>{a.status}</div>
                  </div>
                ))}
              </Body>
            </>
          )}

          {/* SETTINGS */}
          {panel === 'settings' && (
            <>
              <PanelHead title="系統設定" sub="深淵運行參數調整"/>
              <Body>
                {([
                  {key:'typewriter', label:'文字打字機效果', sub:'TYPEWRITER · 35ms / 字'},
                  {key:'audio',      label:'環境音效',       sub:'AMBIENT_AUDIO'},
                  {key:'grain',      label:'顆粒噪訊濾鏡',   sub:'GRAIN_FILTER'},
                  {key:'auto',       label:'自動推進對話',   sub:'AUTO_ADVANCE'},
                  {key:'flash',      label:'保命閃紅效果',   sub:'DEATH_FLASH · DIVINE'},
                  {key:'scan',       label:'掃描線視覺',     sub:'SCANLINES'},
                ] as {key:keyof typeof toggles;label:string;sub:string}[]).map(item => (
                  <div key={item.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                    padding:'12px 0',borderBottom:'1px solid rgba(180,165,220,.05)'}}>
                    <div>
                      <div style={{fontSize:13.5,color:'rgba(200,190,230,.58)'}}>{item.label}</div>
                      <div style={{fontFamily:M.mono,fontSize:8,letterSpacing:'.1em',color:'rgba(150,138,185,.3)',marginTop:2}}>{item.sub}</div>
                    </div>
                    <div
                      className={`abh-tog${toggles[item.key]?' on':''}`}
                      onClick={() => setToggles(p => ({...p,[item.key]:!p[item.key]}))}
                    />
                  </div>
                ))}
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0'}}>
                  <div>
                    <div style={{fontSize:13.5,color:'rgba(200,190,230,.58)'}}>語言</div>
                    <div style={{fontFamily:M.mono,fontSize:8,letterSpacing:'.1em',color:'rgba(150,138,185,.3)',marginTop:2}}>LOCALE</div>
                  </div>
                  <span style={{fontFamily:M.mono,fontSize:9,color:'rgba(180,165,220,.45)'}}>繁體中文</span>
                </div>
              </Body>
            </>
          )}

        </div>
      )}
    </div>
  );
}
