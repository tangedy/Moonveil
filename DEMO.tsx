

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Volume2, VolumeX, Backpack, X } from "lucide-react";

const TILE = 32;
const COLS = 15;
const ROWS = 10;

const walls = new Set([
  ...Array.from({ length: COLS }, (_, x) => `${x},0`),
  ...Array.from({ length: COLS }, (_, x) => `${x},${ROWS - 1}`),
  ...Array.from({ length: ROWS }, (_, y) => `0,${y}`),
  ...Array.from({ length: ROWS }, (_, y) => `${COLS - 1},${y}`),
  "3,2", "4,2", "5,2", "9,2", "10,2", "11,2",
  "3,7", "4,7", "10,7", "11,7",
  // The pond itself is solid, while the tile directly below it is clear.
  // This guarantees the player can stand at (7,3), face up, and interact.
  "7,2",
]);

const flowers = [
  [2, 2], [6, 2], [8, 2], [12, 2], [2, 7], [6, 7], [8, 7], [12, 7],
  [4, 4], [10, 5], [2, 5], [12, 4]
];

const NPCS = [
  {
    id: "moth",
    x: 11,
    y: 3,
    name: "MOTH",
    face: "✦",
    lines: [
      "Oh! A visitor wearing their shadow inside-out.",
      "The moon dropped something near the quiet pond.",
      "If you find it, don't let it remember your name."
    ]
  },
  {
    id: "sprout",
    x: 3,
    y: 5,
    name: "SPROUT",
    face: "♧",
    lines: [
      "...",
      "I am practicing being mysterious.",
      "Is it working?"
    ]
  }
];

const interactables = {
  "12,6": {
    id: "star",
    name: "???",
    lines: ["A tiny star is sleeping in the grass.", "It hums when you hold it close."],
  },
  "7,2": {
    id: "pond",
    name: "POND",
    lines: ["Your reflection blinks first.", "You decide not to mention it."],
  }
};

function PixelButton({ children, onClick, active = false, className = "", title }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`border-2 border-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-black active:translate-y-0.5 ${active ? "bg-white text-black" : "bg-black text-white"} ${className}`}
      style={{ boxShadow: "3px 3px 0 #6d28d9" }}
    >
      {children}
    </button>
  );
}

function Portrait({ type }) {
  const glyph = type === "YOU" ? "☾" : type === "MOTH" ? "✦" : type === "SPROUT" ? "♧" : "?";
  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center border-2 border-white bg-purple-950 text-3xl text-white" style={{ imageRendering: "pixelated", boxShadow: "4px 4px 0 #000" }}>
      <span className="animate-pulse">{glyph}</span>
    </div>
  );
}

export default function MoonveilRPG() {
  const [player, setPlayer] = useState({ x: 7, y: 7, dir: "up" });
  const [dialogue, setDialogue] = useState(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [inventory, setInventory] = useState(["Soft Candy"]);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState("Find the fallen star");
  const [steps, setSteps] = useState(0);

  const occupied = useMemo(() => new Set(NPCS.map(n => `${n.x},${n.y}`)), []);

  const showDialogue = useCallback((target) => {
    setDialogue(target);
    setLineIndex(0);
  }, []);

  const advance = useCallback(() => {
    if (!dialogue) return;
    if (lineIndex < dialogue.lines.length - 1) {
      setLineIndex(i => i + 1);
    } else {
      if (dialogue.id === "star" && !inventory.includes("Sleeping Star")) {
        setInventory(items => [...items, "Sleeping Star"]);
        setToast("You found the Sleeping Star!");
      }
      setDialogue(null);
      setLineIndex(0);
    }
  }, [dialogue, lineIndex, inventory]);

  const interact = useCallback(() => {
    if (dialogue) return advance();
    const delta = player.dir === "up" ? [0, -1] : player.dir === "down" ? [0, 1] : player.dir === "left" ? [-1, 0] : [1, 0];
    const tx = player.x + delta[0];
    const ty = player.y + delta[1];
    const npc = NPCS.find(n => n.x === tx && n.y === ty);
    if (npc) return showDialogue(npc);
    const target = interactables[`${tx},${ty}`];
    if (target) return showDialogue(target);
    setToast("Only the grass answers.");
  }, [player, dialogue, advance, showDialogue]);

  const move = useCallback((dx, dy, dir) => {
    if (dialogue || inventoryOpen) return;
    setPlayer(p => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (walls.has(`${nx},${ny}`) || occupied.has(`${nx},${ny}`)) return { ...p, dir };
      setSteps(s => s + 1);
      return { x: nx, y: ny, dir };
    });
  }, [dialogue, inventoryOpen, occupied]);

  useEffect(() => {
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) e.preventDefault();
      if (key === "arrowup" || key === "w") move(0, -1, "up");
      if (key === "arrowdown" || key === "s") move(0, 1, "down");
      if (key === "arrowleft" || key === "a") move(-1, 0, "left");
      if (key === "arrowright" || key === "d") move(1, 0, "right");
      if (key === "z" || key === "enter" || key === " ") interact();
      if (key === "x" || key === "escape") { setDialogue(null); setInventoryOpen(false); }
      if (key === "i") setInventoryOpen(v => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, interact]);

  useEffect(() => {
    const t = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const playerGlyph = player.dir === "up" ? "▲" : player.dir === "down" ? "▼" : player.dir === "left" ? "◀" : "▶";
  const starCollected = inventory.includes("Sleeping Star");

  return (
    <div className="min-h-screen overflow-hidden bg-black p-4 text-white selection:bg-purple-500" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
      <style>{`
        @keyframes drift { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,-10px)} }
        @keyframes shimmer { 0%,100%{opacity:.25} 50%{opacity:.8} }
        .pixelated { image-rendering: pixelated; image-rendering: crisp-edges; }
        .scanlines:after { content:""; position:absolute; inset:0; pointer-events:none; background:repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,.18) 4px); z-index:30; }
      `}</style>

      <div className="pointer-events-none fixed inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#7c3aed 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative mx-auto max-w-4xl">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b-2 border-purple-500 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[.35em] text-purple-300"><Sparkles size={13}/> a tiny dream</div>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">MOONVEIL</h1>
          </div>
          <div className="flex gap-2">
            <PixelButton onClick={() => setInventoryOpen(true)} title="Inventory (I)"><Backpack size={15}/></PixelButton>
            <PixelButton onClick={() => setMuted(v => !v)} title="Toggle sound">{muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}</PixelButton>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_190px]">
          <main className="relative overflow-hidden border-4 border-white bg-purple-950 p-2 scanlines" style={{ boxShadow: "8px 8px 0 #5b21b6" }}>
            <div className="relative mx-auto overflow-hidden bg-black pixelated" style={{ width: "min(100%, 480px)", aspectRatio: `${COLS}/${ROWS}` }}>
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
                {Array.from({ length: COLS * ROWS }, (_, i) => {
                  const x = i % COLS, y = Math.floor(i / COLS);
                  const wall = walls.has(`${x},${y}`);
                  const isPond = x === 7 && y === 2;
                  return <div key={i} className={`relative border border-purple-950/20 ${wall ? "bg-purple-900" : "bg-[#130a20]"}`}>
                    {wall && <div className="absolute inset-1 border border-purple-400/40 bg-purple-800/40" />}
                    {isPond && <div className="absolute inset-1 animate-pulse bg-purple-400">~</div>}
                  </div>;
                })}
              </div>

              {flowers.map(([x,y], i) => (
                <div key={i} className="absolute grid place-items-center text-[clamp(8px,2vw,16px)] text-white" style={{ left: `${x/COLS*100}%`, top: `${y/ROWS*100}%`, width: `${100/COLS}%`, height: `${100/ROWS}%`, animation: `shimmer ${2+i%3}s infinite` }}>✦</div>
              ))}

              {!starCollected && <div className="absolute z-10 grid place-items-center text-[clamp(10px,2vw,20px)] text-white" style={{ left: `${12/COLS*100}%`, top: `${6/ROWS*100}%`, width: `${100/COLS}%`, height: `${100/ROWS}%`, filter: "drop-shadow(0 0 5px white)", animation: "drift 2s infinite" }}>★</div>}

              {NPCS.map(n => (
                <div key={n.id} className="absolute z-10 grid place-items-center text-[clamp(12px,3vw,24px)] font-black text-white" style={{ left: `${n.x/COLS*100}%`, top: `${n.y/ROWS*100}%`, width: `${100/COLS}%`, height: `${100/ROWS}%`, background: "#4c1d95", boxShadow: "inset 0 0 0 2px white" }}>{n.face}</div>
              ))}

              <motion.div
                className="absolute z-20 grid place-items-center bg-white text-[clamp(8px,2vw,14px)] font-black text-black"
                animate={{ left: `${player.x/COLS*100}%`, top: `${player.y/ROWS*100}%` }}
                transition={{ duration: 0.08 }}
                style={{ width: `${100/COLS}%`, height: `${100/ROWS}%`, boxShadow: "0 3px 0 #7c3aed" }}
              >
                <span>{playerGlyph}</span>
              </motion.div>

              <AnimatePresence>
                {toast && !dialogue && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-1/2 top-3 z-40 -translate-x-1/2 whitespace-nowrap border-2 border-white bg-black px-3 py-1 text-[9px] uppercase tracking-widest sm:text-xs">
                    {toast}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {dialogue && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                  onClick={advance}
                  className="absolute bottom-4 left-4 right-4 z-50 flex min-h-28 cursor-pointer gap-3 border-4 border-white bg-black p-3 text-left"
                  style={{ boxShadow: "5px 5px 0 #6d28d9" }}
                >
                  <Portrait type={dialogue.name}/>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 text-xs font-black tracking-[.25em] text-purple-300">{dialogue.name}</div>
                    <p className="text-xs leading-relaxed sm:text-sm">{dialogue.lines[lineIndex]}</p>
                    <span className="absolute bottom-2 right-3 animate-bounce text-purple-300">▼</span>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </main>

          <aside className="space-y-4">
            <section className="border-2 border-white bg-purple-950 p-4" style={{ boxShadow: "5px 5px 0 #5b21b6" }}>
              <div className="mb-3 flex items-center gap-2 text-xs font-black tracking-[.22em]"><Heart size={14} fill="white"/> DREAMER</div>
              <div className="mb-2 h-3 border-2 border-white bg-black p-0.5"><div className="h-full w-[82%] bg-purple-400" /></div>
              <div className="flex justify-between text-[10px] text-purple-200"><span>HEART 18/22</span><span>LV 1</span></div>
            </section>
            <section className="border-2 border-purple-500 bg-black p-4 text-xs leading-relaxed">
              <div className="mb-2 font-black tracking-widest text-purple-300">CONTROLS</div>
              <p>Move — WASD / arrows</p>
              <p>Interact — Z / Enter</p>
              <p>Inventory — I</p>
              <p>Close — X / Esc</p>
            </section>
            <section className="border-l-2 border-white pl-3 text-[10px] uppercase tracking-widest text-purple-300">
              <div>Steps: {steps}</div>
              <div>Stars: {starCollected ? "1 / 1" : "0 / 1"}</div>
            </section>
          </aside>
        </div>

        <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[.2em] text-purple-300"><span>Some dreams fit in your pocket.</span><span>v0.1</span></div>
      </div>

      <AnimatePresence>
        {inventoryOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4" onClick={() => setInventoryOpen(false)}>
            <motion.div initial={{ scale: .9, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .9 }} className="w-full max-w-md border-4 border-white bg-purple-950 p-5" style={{ boxShadow: "8px 8px 0 #6d28d9" }} onClick={e => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between border-b-2 border-purple-400 pb-3">
                <h2 className="text-xl font-black tracking-widest">POCKET</h2>
                <button onClick={() => setInventoryOpen(false)} className="p-1 hover:bg-white hover:text-black"><X/></button>
              </div>
              <div className="space-y-2">
                {inventory.map((item, i) => (
                  <div key={item} className="flex items-center gap-3 border-2 border-purple-400 bg-black p-3 text-sm">
                    <span className="grid h-8 w-8 place-items-center bg-white text-black">{i === 0 ? "◆" : "★"}</span>
                    <div><div className="font-bold">{item}</div><div className="text-[10px] text-purple-300">{i === 0 ? "Still warm. Restores 5 HEART." : "It dreams of the sky."}</div></div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-3 left-1/2 z-50 flex -translate-x-1/2 gap-1 lg:hidden">
        <button aria-label="left" onClick={() => move(-1,0,"left")} className="h-11 w-11 border-2 border-white bg-black">←</button>
        <div className="grid gap-1"><button aria-label="up" onClick={() => move(0,-1,"up")} className="h-8 w-11 border-2 border-white bg-black">↑</button><button aria-label="down" onClick={() => move(0,1,"down")} className="h-8 w-11 border-2 border-white bg-black">↓</button></div>
        <button aria-label="right" onClick={() => move(1,0,"right")} className="h-11 w-11 border-2 border-white bg-black">→</button>
        <button aria-label="interact" onClick={interact} className="ml-3 h-11 w-11 rounded-full border-2 border-white bg-purple-700 font-black">Z</button>
      </div>
    </div>
  );
}