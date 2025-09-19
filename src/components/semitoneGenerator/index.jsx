// src/components/SemitoneGenerator.jsx
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as Tone from "tone";
import "./base.css";

// Map 0..10 UI to Freeverb params
const mapReverb = (factor) => {
  const c = Math.max(0, Math.min(10, Number(factor) || 0));
  return {
    wet: c / 10,
    roomSize: 0.1 + (c / 10) * 0.9,
    dampening: 2000 + (c / 10) * 3000,
  };
};

const OFFSETS = [0, 1, 2, 3, 4, 5, 6, 7];
const KEY_TO_OFFSET = { q:0, w:1, e:2, r:3, a:4, s:5, d:6, f:7 };

const SemitoneGenerator = ({ currentTrack, onNoteSelect, selectedSemiToneID }) => {
  const [localSelected, setLocalSelected] = useState(null);

  const selectedOffset = useMemo(() => {
    const v = selectedSemiToneID;
    if (typeof v === "number") return v;
    if (v && typeof v === "object") {
      if (typeof v.semitone === "number") return v.semitone;
      if (typeof v.pitchOffset === "number") {
        const base = currentTrack?.pitchOffset || 0;
        return v.pitchOffset - base;
      }
    }
    return localSelected;
  }, [selectedSemiToneID, currentTrack?.pitchOffset, localSelected]);

  // audio nodes
  const playerRef = useRef(null);
  const pitchRef = useRef(null);
  const reverbRef = useRef(null);

  // build graph on URL change
  useEffect(() => {
    const cleanup = () => {
      try { playerRef.current?.stop(); } catch {}
      playerRef.current?.dispose();
      pitchRef.current?.dispose();
      reverbRef.current?.dispose();
      playerRef.current = null;
      pitchRef.current = null;
      reverbRef.current = null;
    };

    if (!currentTrack?.url) { cleanup(); return; }

    const player = new Tone.Player({
      url: currentTrack.url,
      autostart: false,
      fadeIn: 0.002,
      fadeOut: 0.005,
    });

    const pitch = new Tone.PitchShift({ pitch: currentTrack.pitchOffset || 0 });
    const { wet, roomSize, dampening } = mapReverb(currentTrack.reverbFactor || 0);
    const reverb = new Tone.Freeverb();
    reverb.set({ roomSize, dampening });
    reverb.wet.value = wet;

    player.reverse = !!currentTrack.reversed;
    player.chain(pitch, reverb, Tone.Destination);

    playerRef.current = player;
    pitchRef.current = pitch;
    reverbRef.current = reverb;

    (async () => { try { await Tone.loaded(); } catch {} })();

    return cleanup;
  }, [currentTrack?.url]);

  // live param sync
  useEffect(() => {
    if (pitchRef.current) pitchRef.current.pitch = currentTrack?.pitchOffset || 0;
  }, [currentTrack?.pitchOffset]);

  useEffect(() => {
    if (playerRef.current) playerRef.current.reverse = !!currentTrack?.reversed;
  }, [currentTrack?.reversed]);

  useEffect(() => {
    if (reverbRef.current) {
      const { wet, roomSize, dampening } = mapReverb(currentTrack?.reverbFactor || 0);
      reverbRef.current.set({ roomSize, dampening });
      reverbRef.current.wet.value = wet;
    }
  }, [currentTrack?.reverbFactor]);

  // unified trigger used by click & keyboard
  const triggerOffset = useCallback(async (offset) => {
    if (!currentTrack?.url) return;

    setLocalSelected(offset);
    onNoteSelect?.(offset); // keep contract simple: send numeric offset

    try { await Tone.start(); } catch {}

    const player = playerRef.current;
    const pitch = pitchRef.current;
    if (!player || !pitch) return;

    try { player.stop(); } catch {}
    pitch.pitch = (currentTrack.pitchOffset || 0) + offset;
    try { player.start(); } catch {}
  }, [currentTrack?.url, currentTrack?.pitchOffset, onNoteSelect]);

  const handleClick = (offset) => { triggerOffset(offset); };

  // keyboard: q w e r a s d f  -> offsets 0..7
  useEffect(() => {
    const downPressed = new Set();

    const isTypingTarget = (el) =>
      el &&
      (el.tagName === "INPUT" ||
       el.tagName === "TEXTAREA" ||
       el.tagName === "SELECT" ||
       el.isContentEditable);

    const onKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (!(key in KEY_TO_OFFSET)) return;
      if (isTypingTarget(e.target)) return;

      // avoid auto-repeat retriggers until keyup
      if (e.repeat || downPressed.has(key)) return;

      downPressed.add(key);
      triggerOffset(KEY_TO_OFFSET[key]);
    };

    const onKeyUp = (e) => {
      downPressed.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [triggerOffset]);

  const disabled = !currentTrack?.url;

  return (
    <div className="semiGen">
      <div className="semiGrid">
        {OFFSETS.map((offset, i) => {
          const isSelected = Number(selectedOffset) === offset;
          const label = offset === 0 ? "Root" : `+${offset}`;

          // expose the keyboard shortcuts for a11y
          const key = Object.keys(KEY_TO_OFFSET).find(k => KEY_TO_OFFSET[k] === offset);

          return (
            <button
              key={offset}
              type="button"
              className={`semiTile ${isSelected ? "selected" : ""}`}
              onClick={() => handleClick(offset)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-keyshortcuts={key}     // e.g., "q", "w", ...
              title={`${label} semitone (${key?.toUpperCase()})`}
            >
              <div className="semiTitle">{label}</div>
              <div className="semiSub">
                Pitch: {(currentTrack?.pitchOffset || 0) + offset}
              </div>
              <div className="semiKey">
                {key}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SemitoneGenerator;
