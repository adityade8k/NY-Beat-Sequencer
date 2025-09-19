// src/packages/mixer/index.jsx
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Tone from "tone";
import LoadedFile from "../../components/loadedFile";
import PlayerControls from "../../components/playerControls";
import Slider from "../../components/slider";
import StepHeader from "../../components/stepHeader/stepHeader";
import Toggle from "../../components/toggle";
import {
  resetMixer,
  setBPM,
  setPitchOffset,
  setReverb,
  togglePlay,
  toggleReversed,
  updateTrackPush,
} from "../../store/reducers/mixerSlice";
import "./mixer.css";
import { addTone } from "../../store/reducers/sequencerSlice";

// Map 0..10 UI to Freeverb params
const mapReverb = (factor) => {
  const c = Math.max(0, Math.min(10, Number(factor) || 0));
  return {
    wet: c / 10,
    roomSize: 0.1 + (c / 10) * 0.9,
    dampening: 2000 + (c / 10) * 3000,
  };
};

const Mixer = () => {
  const dispatch = useDispatch();
  const loadedFile = useSelector((s) => s.selectedFile);
  const mixerState = useSelector((s) => s.mixer);
  const loadedUrl = typeof loadedFile === "string" ? loadedFile : loadedFile?.url ?? null;

  // Tone nodes
  const playerRef = useRef(null);
  const pitchRef  = useRef(null);
  const reverbRef = useRef(null);
  const loopRef   = useRef(null);

  // stop & reset when file changes
  const prevKeyRef = useRef(loadedUrl);
  useEffect(() => {
    if (prevKeyRef.current !== loadedUrl) {
      try { loopRef.current?.stop(0); } catch {}
      try { Tone.Transport.stop(); } catch {}
      dispatch(resetMixer());
      prevKeyRef.current = loadedUrl;
    }
  }, [loadedUrl, dispatch, mixerState.isPlaying]);

  // build graph on file change
  useEffect(() => {
    const cleanup = () => {
      try { loopRef.current?.stop(0); } catch {}
      loopRef.current?.dispose();
      playerRef.current?.dispose();
      pitchRef.current?.dispose();
      reverbRef.current?.dispose();
      loopRef.current = null;
      playerRef.current = null;
      pitchRef.current = null;
      reverbRef.current = null;
    };

    if (!loadedUrl) {
      cleanup();
      return;
    }

    dispatch(resetMixer());
    let disposed = false;

    const build = async () => {
      try {
        const player = new Tone.Player({
          url: loadedUrl,
          autostart: false,
          fadeIn: 0.002,
          fadeOut: 0.005,
        });

        const pitch = new Tone.PitchShift({ pitch: mixerState.pitchOffset || 0 });

        const { wet, roomSize, dampening } = mapReverb(mixerState.reverbFactor);
        const reverb = new Tone.Freeverb();
        reverb.set({ roomSize, dampening });
        reverb.wet.value = wet;

        player.chain(pitch, reverb, Tone.Destination);
        player.reverse = !!mixerState.reversed;

        playerRef.current = player;
        pitchRef.current  = pitch;
        reverbRef.current = reverb;

        await Tone.loaded();
        if (disposed) return;

        // QUARTER-NOTE loop; cut note to 4n exactly
        const loop = new Tone.Loop((time) => {
          const p = playerRef.current;
          if (!p?.buffer?.loaded) return;
          const durSec = Tone.Time("4n").toSeconds();   // dynamic w.r.t. current BPM
          // always (re)start and limit to exactly one beat
          try { p.stop(); } catch {}
          p.start(time, 0, durSec);
        }, "4n");

        loopRef.current = loop;

        if (mixerState.isPlaying) {
          loop.start(0);
          Tone.Transport.start("+0.05");
        } else {
          loop.stop(0);
        }
      } catch (e) {
        console.error("Tone graph build failed:", e);
      }
    };

    build();
    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedUrl]);

  // bpm / live params
  useEffect(() => { try { Tone.Transport.bpm.value = mixerState.bpm || 120; } catch {} }, [mixerState.bpm]);
  useEffect(() => { if (pitchRef.current)  pitchRef.current.pitch = mixerState.pitchOffset || 0; }, [mixerState.pitchOffset]);
  useEffect(() => {
    if (reverbRef.current) {
      const { wet, roomSize, dampening } = mapReverb(mixerState.reverbFactor);
      reverbRef.current.set({ roomSize, dampening });
      reverbRef.current.wet.value = wet;
    }
  }, [mixerState.reverbFactor]);
  useEffect(() => { if (playerRef.current) playerRef.current.reverse = !!mixerState.reversed; }, [mixerState.reversed]);

  // transport react
  useEffect(() => {
    const loop = loopRef.current;
    if (!loop) return;
    if (mixerState.isPlaying) {
      loop.start(0);
      Tone.Transport.start("+0.05");
    } else {
      loop.stop(0);
      Tone.Transport.stop();
    }
  }, [mixerState.isPlaying]);

  // handlers
  const handlePlayToggle = async () => {
    try { await Tone.start(); } catch {}
    const next = !mixerState.isPlaying;
    if (next) {
      try { Tone.Transport.bpm.value = mixerState.bpm || 120; } catch {}
      Tone.Transport.start("+0.05");
    } else {
      Tone.Transport.stop();
    }
    dispatch(togglePlay());
  };

  const handleReset = () => {
    if (mixerState.isPlaying) handlePlayToggle();
    dispatch(resetMixer());
  };

  const handleBPMChange = (v) => {
    if (mixerState.isPlaying) handlePlayToggle();
    dispatch(setBPM(v));
  };
  const handlePitchOffsetChange = (v) => {
    if (mixerState.isPlaying) handlePlayToggle();
    dispatch(setPitchOffset(v));
  };
  const handleReverbChange = (v) => {
    if (mixerState.isPlaying) handlePlayToggle();
    dispatch(setReverb(v));
  };
  const handleReversedToggle = (next) => {
    if (mixerState.isPlaying) handlePlayToggle();
    dispatch(toggleReversed(next));
  };

  const handleExport = () => {
    dispatch(addTone({
      url: loadedUrl,
      bpm: mixerState.bpm,
      pitchOffset: mixerState.pitchOffset,
      reverbFactor: mixerState.reverbFactor,
      reversed: mixerState.reversed,
      id: mixerState.tracksPushed,
      title: mixerState.tracksPushed,
    }));
    dispatch(updateTrackPush());
  };

  return (
    <div className="packCont half mixer">
      <StepHeader number="2" text="Mix your track" />
      <div className="mixerCont">
        <div className="mixerSection">
          <LoadedFile file={loadedFile} />
          <PlayerControls
            onPlay={handlePlayToggle}
            onPause={handlePlayToggle}
            onReset={handleReset}
            isPlaying={mixerState.isPlaying}
          />
        </div>

        <div className="mixerSection">
          <Slider label="BPM" min={60} max={180} step={1} value={mixerState.bpm} onChange={handleBPMChange} />
          <Slider label="Reverb" min={0} max={10} step={1} value={mixerState.reverbFactor} onChange={handleReverbChange} />
          <Slider label="Pitch Offset" min={-12} max={12} step={1} value={mixerState.pitchOffset} onChange={handlePitchOffsetChange} />
          <Toggle label="Reversed" isOn={mixerState.reversed} onToggle={handleReversedToggle} />

          <div className="exportSection">
            {`Add Track ${mixerState.tracksPushed}`}
            <div className="exportButton">
              <img src="./assets/rightDown.svg" className="exportIcon" onClick={handleExport} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mixer;
