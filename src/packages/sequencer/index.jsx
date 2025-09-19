// src/packages/sequencer/index.jsx
import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import PlayerControls from "../../components/playerControls";
import StepHeader from "../../components/stepHeader/stepHeader";
import "./sequencer.css";
import Slider from "../../components/slider";
import FileSelector from "../../components/fileSelector/fileSelector";
import SemitoneGenerator from "../../components/semitoneGenerator";
import Board from "../../components/board";
import {
  initSequence,
  setCurrentSemiTone,
  setCurrentTone,
  setPlaying,
  resetStep,
} from "../../store/reducers/sequencerSlice";
import { setBPM } from "../../store/reducers/mixerSlice";
import * as Tone from "tone";

const Sequencer = () => {
  const dispatch = useDispatch();
  const seq = useSelector((s) => s.sequencer);
  const mixer = useSelector((s) => s.mixer);

  // create empty 5x16 on first mount
  useEffect(() => {
    dispatch(initSequence({ channels: 5, steps: 16 }));
  }, [dispatch]);

  const handleTrackSelect = (fileID) => {
    console.log(seq)
    const found = seq.tones.find((t) => t.id === fileID);
    dispatch(setCurrentTone(found || null));
  };

  const handleSemiToneChange = (semi) => {
    // Accept either number or an object with pitch (if your SemitoneGenerator sends object)
    const val = typeof semi === "number" ? semi : semi?.pitchOffset ?? 0;
    dispatch(setCurrentSemiTone(val));
  };

  // transport controls (Board reacts to isPlaying via store)
  const onPlay = useCallback(async () => {
    try { await Tone.start(); } catch {}
    dispatch(setPlaying(true));
  }, [dispatch]);

  const onPause = useCallback(() => {
    dispatch(setPlaying(false));
  }, [dispatch]);

  const onReset = useCallback(() => {
    dispatch(setPlaying(false));
    dispatch(resetStep());
  }, [dispatch]);

  return (
    <div className="packCont sequencer">
      <div className="sequencerPanel top">
        <div className="sequencerPanel player">
          <StepHeader number={3} text={"Make a beat!"} />
          <div className="sequencerPlayer">
            <PlayerControls
              onPlay={onPlay}
              onPause={onPause}
              onReset={onReset}
              isPlaying={seq.player.isPlaying}
            />
          </div>
        </div>

        <div className="sequencerPanel bpm">
          <Slider
            label="BPM"
            min={60}
            max={180}
            step={1}
            value={mixer.bpm}
            onChange={(v) => dispatch(setBPM(v))}
          />
        </div>

        <div className="sequencerPanel synth">
          <SemitoneGenerator
            currentTrack={seq.currentTone}
            onNoteSelect={handleSemiToneChange}   // <-- use onNoteSelect
            selectedSemiToneID={seq.currentSemiTone}
          />
        </div>
      </div>

      <div className="sequencerPanel bottom">
        <div className="seqBoard">
          <Board />
        </div>
        <div className="sequencerFileList">
          <FileSelector
            files={seq.tones}
            onFileSelect={handleTrackSelect}
            selectedId={seq?.currentTone?.id}
            right = {false}
          />
        </div>
      </div>
    </div>
  );
};

export default Sequencer;
