// src/components/SemitoneGenerator.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

const SemitoneGenerator = ({ currentTrack, onNoteSelect, selectedSemiToneID }) => {
  // local fallback so it still highlights even if parent doesn’t control it
  const [localSelected, setLocalSelected] = useState(null);

  // derive a single numeric "selected offset" from the prop (supports number or object)
  const selectedOffset = useMemo(() => {
    const v = selectedSemiToneID;
    if (typeof v === "number") return v;
    if (v && typeof v === "object") {
      if (typeof v.semitone === "number") return v.semitone;
      if (typeof v.pitchOffset === "number") {
        const base = currentTrack?.pitchOffset || 0;
        return v.pitchOffset - base; // infer relative offset
      }
    }
    return localSelected; // fall back to internal
  }, [selectedSemiToneID, currentTrack?.pitchOffset, localSelected]);

  // audio nodes
  const playerRef = useRef(null);
  const pitchRef = useRef(null);
  const reverbRef = useRef(null);

  // (re)build when URL changes
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

  const handleClick = async (offset) => {
    if (!currentTrack?.url) return;

    // highlight locally
    setLocalSelected(offset);

    // tell parent the numeric offset (simple, stable contract)
    onNoteSelect?.(offset);

    // audition: play sample with base+offset pitch, same reverb/reverse
    try { await Tone.start(); } catch {}
    const player = playerRef.current;
    const pitch = pitchRef.current;
    if (!player || !pitch) return;

    try { player.stop(); } catch {}
    pitch.pitch = (currentTrack.pitchOffset || 0) + offset;
    try { player.start(); } catch {}
  };

  const disabled = !currentTrack?.url;

  return (
    <div className="semiGen">
      <div className="semiGrid">
        {OFFSETS.map((offset) => {
          const isSelected = Number(selectedOffset) === offset;
          const label = offset === 0 ? "Root" : `+${offset}`;
          return (
            <button
              key={offset}
              type="button"
              className={`semiTile ${isSelected ? "selected" : ""}`}
              onClick={() => handleClick(offset)}
              disabled={disabled}
              aria-pressed={isSelected}
              title={`${label} semitone`}
            >
              <div className="semiTitle">{label}</div>
              <div className="semiSub">Pitch: {(currentTrack?.pitchOffset || 0) + offset}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SemitoneGenerator;
