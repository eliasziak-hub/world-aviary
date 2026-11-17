// Στυλ του widget. Χρησιμοποιεί container queries (το widget ζει σε στενή στήλη του Blogger) και τις μεταβλητές «field guide».
export const CSS = `
.p4wa{--ink:#2b2a26;--muted:#6d675a;--paper:#f6efdd;--card:#fffaf0;--line:#dccfae;--gold:#b8892b;--rust:#9c4a2b;--green:#3b5d3a;--sea:#c3d6d0;--sea2:#a9c4bd;--land:#e7d9b4;--heat:#d28a2b;--sel:#3b5d3a;
 container-type:inline-size;container-name:p4wa;box-sizing:border-box;font:15px/1.5 'Noto Sans Greek','Noto Sans',Karla,system-ui,-apple-system,'Segoe UI',sans-serif;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:12px;max-width:1100px;margin:16px auto;position:relative}
@media (prefers-color-scheme:dark){.p4wa{--ink:#ece6d4;--muted:#b0a88f;--paper:#1b1a16;--card:#25231d;--line:#3b382d;--gold:#d9a846;--rust:#e0875f;--green:#8fbf86;--sea:#1f2f2d;--sea2:#2a3f3b;--land:#4a4433;--heat:#d9a846;--sel:#8fbf86}}
.p4wa *{box-sizing:border-box}
.p4wa h2,.p4wa h3{font-family:'Cormorant Garamond',Georgia,serif;margin:0;line-height:1.15;color:var(--green)}
.p4wa h2{font-size:1.7rem}.p4wa h3{font-size:1.2rem}
.p4wa button{font:inherit;color:inherit;cursor:pointer}
.p4wa a{color:var(--rust)}
.p4wa :focus-visible{outline:3px solid var(--gold);outline-offset:2px;border-radius:6px}
.p4wa .mono{font-family:'Fira Code',ui-monospace,Menlo,monospace;font-size:.74rem;color:var(--muted)}
.p4wa-head{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:flex-end;justify-content:space-between;margin-bottom:8px}
.p4wa-sub{color:var(--muted);font-size:.86rem;margin:2px 0 0}
.p4wa-tabs{display:flex;gap:6px}
.p4wa-tab,.p4wa-pill,.p4wa-btn{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:5px 13px;font-size:.84rem;font-weight:600}
.p4wa-tab[aria-selected=true],.p4wa-pill[aria-pressed=true]{background:var(--green);border-color:var(--green);color:#fffaf0}
@media (prefers-color-scheme:dark){.p4wa-tab[aria-selected=true],.p4wa-pill[aria-pressed=true]{color:#16150f}}
.p4wa-btn:hover,.p4wa-pill:hover,.p4wa-tab:hover{border-color:var(--gold)}
.p4wa-pills{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 10px}
.p4wa-grid{display:grid;gap:12px;grid-template-columns:minmax(0,1fr)}
@container p4wa (min-width:760px){.p4wa-grid{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr)}.p4wa-drawer{grid-column:1/-1}}
.p4wa-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 12px;min-width:0}
.p4wa-globe{position:relative;padding:6px}
.p4wa-globe svg{display:block;width:100%;height:auto;max-height:560px;touch-action:pan-y;cursor:grab;user-select:none;-webkit-user-select:none}
.p4wa-globe svg.drag{cursor:grabbing}
.p4wa-sphere{fill:url(#p4wa-sea)}
.p4wa-grat{fill:none;stroke:var(--line);stroke-width:.5;opacity:.7}
.p4wa-land{stroke:var(--paper);stroke-width:.6;cursor:pointer;transition:filter .15s}
.p4wa-land:hover{filter:brightness(1.08)}
.p4wa-land.sel{stroke:var(--sel);stroke-width:2.4}
.p4wa-bubble circle{fill:var(--card);stroke:var(--gold);stroke-width:1.4}
.p4wa-bubble text{font:700 12px 'Noto Sans Greek',sans-serif;fill:var(--ink);text-anchor:middle;dominant-baseline:central;pointer-events:none}
.p4wa-bubble{pointer-events:none}
.p4wa-gtools{position:absolute;right:10px;top:10px;display:flex;flex-direction:column;gap:6px}
.p4wa-ico{width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:var(--card);display:grid;place-items:center;font-weight:700;font-size:1.05rem;line-height:1}
.p4wa-conts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.p4wa-cont{border:1px solid var(--line);background:var(--card);border-radius:10px;padding:4px 10px;font-size:.82rem;display:flex;gap:6px;align-items:center}
.p4wa-cont b{font-family:'Fira Code',monospace;font-size:.76rem;color:var(--rust)}
.p4wa-cont[aria-pressed=true]{border-color:var(--sel);box-shadow:inset 0 0 0 1px var(--sel)}
.p4wa-crumbs{display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;margin:0 0 8px;font-size:.86rem}
.p4wa-crumbs button{border:0;background:none;color:var(--rust);padding:0;text-decoration:underline;text-underline-offset:2px}
.p4wa-crumbs span.cur{font-weight:700}
.p4wa-search{width:100%;border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:6px 10px;margin:4px 0 8px;font:inherit;color:inherit}
.p4wa-fams{display:grid;gap:6px;max-height:430px;overflow:auto;padding-right:2px}
.p4wa-fam{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 8px;text-align:left;border:1px solid var(--line);background:var(--paper);border-radius:10px;padding:6px 10px;position:relative;overflow:hidden}
.p4wa-fam:hover{border-color:var(--gold)}
.p4wa-fam .bar{position:absolute;left:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--gold),var(--rust));border-radius:0 3px 0 0}
.p4wa-fam strong{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.08rem;color:var(--green)}
.p4wa-fam em{font-size:.78rem;color:var(--muted)}
.p4wa-fam .n{grid-row:1/3;grid-column:2;align-self:center;font:700 .95rem 'Fira Code',monospace;color:var(--rust)}
.p4wa-chips{display:flex;flex-wrap:wrap;gap:6px}
.p4wa-chip{border:1px solid var(--line);background:var(--paper);border-radius:999px;padding:4px 11px;font-size:.88rem}
.p4wa-chip i{font-style:italic}.p4wa-chip b{font:700 .74rem 'Fira Code',monospace;color:var(--rust);margin-left:5px}
.p4wa-chip[aria-pressed=true]{background:var(--green);color:#fffaf0;border-color:var(--green)}
.p4wa-chip[aria-pressed=true] b{color:#f0d9a0}
.p4wa-chip.review{border-style:dashed}
.p4wa-rail{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 10px;scroll-snap-type:x proximity}
.p4wa-post{flex:0 0 172px;scroll-snap-align:start;display:flex;flex-direction:column;background:var(--paper);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.p4wa-post .ph{aspect-ratio:8/5;background:linear-gradient(135deg,var(--sea),var(--land));display:grid;place-items:center;overflow:hidden;color:var(--muted);font-size:1.6rem}
.p4wa-post .ph img{width:100%;height:100%;object-fit:cover;display:block}
.p4wa-post .pb{padding:7px 9px 9px;display:flex;flex-direction:column;gap:4px;flex:1}
.p4wa-post b.t{font:700 1rem/1.15 'Cormorant Garamond',Georgia,serif;color:var(--green);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.p4wa-post p{margin:0;font-size:.78rem;color:var(--muted);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.p4wa-post .row{display:flex;gap:6px;margin-top:auto;align-items:center}
.p4wa-read{flex:1;text-align:center;text-decoration:none;border-radius:999px;background:var(--green);color:#fffaf0!important;padding:4px 8px;font-size:.78rem;font-weight:700}
@media (prefers-color-scheme:dark){.p4wa-read{color:#16150f!important}}
.p4wa-snd{width:30px;height:30px;border-radius:50%;border:1px solid var(--gold);background:var(--card);display:grid;place-items:center;font-size:.9rem}
.p4wa-snd[aria-pressed=true]{background:var(--gold);color:#1b1a16}
.p4wa-tag{display:inline-block;font:600 .66rem 'Fira Code',monospace;border-radius:6px;padding:1px 6px;background:#f2e3b8;color:#6b4a00;align-self:flex-start}
@media (prefers-color-scheme:dark){.p4wa-tag{background:#4a3d1a;color:#f0d9a0}}
.p4wa-note{font-size:.8rem;color:var(--muted);margin:6px 0 0}
.p4wa-empty{padding:18px;text-align:center;color:var(--muted)}
.p4wa-skel{background:linear-gradient(90deg,var(--paper),var(--card),var(--paper));background-size:200% 100%;animation:p4wa-sk 1.3s infinite;border-radius:12px;min-height:150px}
@keyframes p4wa-sk{to{background-position:-200% 0}}
.p4wa-stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin:8px 0}
.p4wa-stat{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:6px 10px}.p4wa-stat b{display:block;font:700 1.3rem 'Cormorant Garamond',serif;color:var(--green)}.p4wa-stat span{font-size:.76rem;color:var(--muted)}
.p4wa-list{list-style:none;margin:6px 0;padding:0;display:grid;gap:6px}
.p4wa-list li{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:6px 10px;font-size:.88rem}
.p4wa-list small{color:var(--muted)}
.p4wa-actions{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.p4wa-toast{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);background:var(--green);color:#fffaf0;border-radius:999px;padding:6px 14px;font-size:.84rem;z-index:5}
@media (prefers-reduced-motion:reduce){.p4wa *{animation:none!important;transition:none!important}}
`
