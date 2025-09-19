import { createSlice } from '@reduxjs/toolkit';

const mixerSlice = createSlice({
    name: 'mixer',
    initialState: {
        isPlaying: false,
        bpm: 120,
        reverbFactor: 2,
        pitchOffset: 0,
        reversed: false,
        tracksPushed: 0,
    },
    reducers: {
        togglePlay: (state) => {
            state.isPlaying = !state.isPlaying;
        },
        setBPM: (state, action) => {
            state.bpm = action.payload;
        },
        setReverb: (state, action) => {
            state.reverbFactor = action.payload;
        },
        setPitchOffset: (state, action) => {
            state.pitchOffset = action.payload;
        },
        toggleReversed: (state) => {
            state.reversed = !state.reversed;
        }, 
        updateTrackPush : (state) => {
            state.tracksPushed += 1;
        },
        resetMixer: (state) => {
            state.isPlaying = false;
            state.bpm = 120;
            state.reverbFactor = 0;
            state.pitchOffset = 0;
            state.reversed = false;
        }
    }
});

export const { setBPM, togglePlay, setReverb, setPitchOffset, toggleReversed, resetMixer, updateTrackPush } = mixerSlice.actions;
export default mixerSlice.reducer;