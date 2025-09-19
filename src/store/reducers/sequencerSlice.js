// src/store/reducers/sequencerSlice.js
import { createSlice } from "@reduxjs/toolkit";

// helpers
const pad3 = (n) => String(n).padStart(3, "0");

// create an empty sequence: 5 channels × 16 steps
const makeEmptySequence = (channels = 5, steps = 16) =>
  Array.from({ length: channels }, (_, ch) => ({
    id: ch,
    active: true,                 // channel mute toggle
    steps: Array.from({ length: steps }, () => null), // each step holds a note or null
  }));

const initialState = {
  // library/export
  tones: [],
  nextSeqNum: 0,

  // current selection for authoring
  currentTone: null,        // { id, title, url, pitchOffset, reverbFactor, reversed }
  currentSemiTone: 0,       // integer offset (e.g. +2)

  // playback/control
  player: {
    isPlaying: false,
    step: 0,                // 0..15 current column
    steps: 16,
  },

  // the grid
  sequence: makeEmptySequence(5, 16),
};

const sequencerSlice = createSlice({
  name: "sequencer",
  initialState,
  reducers: {
    // ----- library/export -----
    addTone(state, action) {
      const n = state.nextSeqNum;
      const idStr = pad3(n);
      state.tones.push({
        id: idStr,
        title: idStr,         // or `Tone ${idStr}`
        ...action.payload,    // url, bpm, pitchOffset, reverbFactor, reversed
      });
      state.nextSeqNum = n + 1;
    },

    // ----- selections used by authoring -----
    setCurrentTone(state, action) {
      state.currentTone = action.payload ?? null;
    },
    setCurrentSemiTone(state, action) {
      state.currentSemiTone = Number(action.payload) || 0;
    },

    // ----- board model -----
    initSequence(state, action) {
      const channels = action?.payload?.channels ?? 5;
      const steps = action?.payload?.steps ?? 16;
      state.sequence = makeEmptySequence(channels, steps);
      state.player.steps = steps;
      state.player.step = 0;
    },
    toggleChannelActive(state, action) {
      const ch = action.payload;
      if (state.sequence[ch]) state.sequence[ch].active = !state.sequence[ch].active;
    },
    addNoteToSequence(state, action) {
      const { ch, step, note } = action.payload;
      if (state.sequence[ch] && step >= 0 && step < state.player.steps) {
        state.sequence[ch].steps[step] = note; // note or null
      }
    },
    removeNoteFromSequence(state, action) {
      const { ch, step } = action.payload;
      if (state.sequence[ch] && step >= 0 && step < state.player.steps) {
        state.sequence[ch].steps[step] = null;
      }
    },

    // ----- transport -----
    setPlaying(state, action) {
      state.player.isPlaying = !!action.payload;
    },
    advanceStep(state) {
      state.player.step = (state.player.step + 1) % state.player.steps;
    },
    setStep(state, action) {
      const v = Number(action.payload) || 0;
      state.player.step = Math.max(0, Math.min(state.player.steps - 1, v));
    },
    resetStep(state) {
      state.player.step = 0;
    },
  },
});

export const {
  addTone,
  setCurrentTone,
  setCurrentSemiTone,

  initSequence,
  toggleChannelActive,
  addNoteToSequence,
  removeNoteFromSequence,

  setPlaying,
  advanceStep,
  setStep,
  resetStep,
} = sequencerSlice.actions;

export default sequencerSlice.reducer;
