import { configureStore } from '@reduxjs/toolkit';
import selectedFileReducer from './reducers/selectedFileSlice';
import mixerReducer from './reducers/mixerSlice';
import sequencerReducer from './reducers/sequencerSlice';

export const store = configureStore({
  reducer: {
    selectedFile: selectedFileReducer,
    mixer: mixerReducer,
    sequencer: sequencerReducer,
  },
});
