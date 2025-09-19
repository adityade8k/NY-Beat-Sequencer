// src/components/board/Board.jsx
import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Tone from "tone";
import {
  addNoteToSequence,
  removeNoteFromSequence,
  toggleChannelActive,
  setPlaying,
  advanceStep,
  resetStep,
} from "../../store/reducers/sequencerSlice";
import "./board.css";

// reuse the same mapping you used in Mixer
const mapReverb = (factor) => {
  const c = Math.max(0, Math.min(10, Number(factor) || 0));
  return {
    wet: c / 10,
    roomSize: 0.1 + (c / 10) * 0.9,
    dampening: 2000 + (c / 10) * 3000,
  };
};

export default function Board() {
  const dispatch = useDispatch();

  // state
  const sequence = useSelector((s) => s.sequencer.sequence);
  const { isPlaying, step, steps } = useSelector((s) => s.sequencer.player);
  const currentTone = useSelector((s) => s.sequencer.currentTone);
  const currentSemi = useSelector((s) => s.sequencer.currentSemiTone);
  const bpm = useSelector((s) => s.mixer.bpm || 120); // use your mixer’s bpm

  // refs so Tone.Loop closure always has fresh data
  const seqRef = useRef(sequence);
  const stepRef = useRef(step);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { seqRef.current = sequence; }, [sequence]);
  useEffect(() => { stepRef.current = step; }, [step]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // cache url -> {player, pitch, reverb}
  const graphCacheRef = useRef(new Map());
  const getGraph = async (url) => {
    if (!graphCacheRef.current.has(url)) {
      const player = new Tone.Player({ url, autostart: false, fadeIn: 0.002, fadeOut: 0.005 });
      const pitch = new Tone.PitchShift({ pitch: 0 });
      const reverb = new Tone.Freeverb();
      player.chain(pitch, reverb, Tone.Destination);
      // ensure loaded at least once
      await Tone.loaded();
      graphCacheRef.current.set(url, { player, pitch, reverb });
    }
    return graphCacheRef.current.get(url);
  };

  // keep BPM up to date
  useEffect(() => {
    try { Tone.Transport.bpm.value = bpm; } catch {}
  }, [bpm]);

  // one global 16th-note loop
  const loopRef = useRef(null);
  useEffect(() => {
    // create once
    if (!loopRef.current) {
      loopRef.current = new Tone.Loop(async (time) => {
        // play the column indicated by stepRef.current
        const col = stepRef.current;
        const seq = seqRef.current;

        // trigger all active channels that have a note on this step
        for (let ch = 0; ch < seq.length; ch++) {
          const chan = seq[ch];
          if (!chan?.active) continue;

          const note = chan.steps[col];
          if (!note) continue;

          // build / fetch graph
          try {
            const { player, pitch, reverb } = await getGraph(note.url);

            // live params
            pitch.pitch = note.pitchOffset || 0;
            player.reverse = !!note.reversed;

            const { wet, roomSize, dampening } = mapReverb(note.reverbFactor || 0);
            reverb.set({ roomSize, dampening });
            reverb.wet.value = wet;

            // retrigger
            try { player.stop(); } catch {}
            player.start(time); // schedule precisely at this tick
          } catch (e) {
            console.error("Play failed:", e);
          }
        }

        // advance the playhead
        // (UI highlight follows this)
        requestAnimationFrame(() => dispatch(advanceStep()));
      }, "16n");
    }

    return () => {
      try { loopRef.current?.stop(0); } catch {}
    };
  }, [dispatch]);

  // start/stop transport in response to isPlaying
  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;

    if (isPlaying) {
      try { loop.start(0); } catch {}
      Tone.Transport.start("+0.05");
    } else {
      try { loop.stop(0); } catch {}
      Tone.Transport.stop();
    }
  }, [isPlaying]);

  // interactions ---------------------------------------------------------
  const handleChannelToggle = (ch) => {
    dispatch(toggleChannelActive(ch));
  };

  const handleStepClick = (ch, col, existingNote) => {
    if (existingNote) {
      // filled -> remove
      dispatch(removeNoteFromSequence({ ch, step: col }));
      return;
    }
    // empty -> add current semitone from currentTone
    if (!currentTone) return; // no tone selected
    const note = {
      // keep track reference for UI
      title: currentTone.title,
      trackId: currentTone.id,

      // sound params
      url: currentTone.url,
      reversed: !!currentTone.reversed,
      reverbFactor: currentTone.reverbFactor || 0,

      // absolute pitch to play now (base + semitone)
      pitchOffset: (currentTone.pitchOffset || 0) + (currentSemi || 0),

      // also keep the relative semitone for display
      semitone: currentSemi || 0,
    };
    dispatch(addNoteToSequence({ ch, step: col, note }));
  };

  // render ---------------------------------------------------------------
  return (
    <div className="board">
      <div className="board__left">
        {sequence.map((chan, ch) => (
          <button
            key={ch}
            className={`board__channel ${chan.active ? "is-active" : "is-muted"}`}
            onClick={() => handleChannelToggle(ch)}
            title={chan.active ? "Click to mute" : "Click to unmute"}
          >
            Ch #{ch + 1}
          </button>
        ))}
      </div>

      <div className="board__grid" style={{ gridTemplateColumns: `repeat(${steps}, 1fr)` }}>
        {sequence.map((chan, ch) => (
          <div key={ch} className="board__row">
            {chan.steps.map((cell, col) => {
              const isCurrentCol = col === step;
              const filled = !!cell;
              return (
                <div
                  key={col}
                  className={`board__cell ${filled ? "is-filled" : "is-empty"} ${isCurrentCol ? "is-current" : ""} ${chan.active ? "" : "is-muted"}`}
                  onClick={() => handleStepClick(ch, col, cell)}
                >
                  {/* content layer */}
                  {!filled ? (
                    <span className="board__plus">+</span>
                  ) : (
                    <span className="board__label">
                      <b>{cell.title}</b>{cell.semitone >= 0 ? `+${cell.semitone}` : cell.semitone}
                    </span>
                  )}
                  {/* hover-to-clear overlay for filled cells */}
                  {filled && <span className="board__clear">×</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
