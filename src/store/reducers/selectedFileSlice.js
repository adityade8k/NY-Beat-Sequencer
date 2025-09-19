import { createSlice } from '@reduxjs/toolkit';

const selectedFileSlice = createSlice({
  name: 'selectedFile',
  initialState: {
    id: null,
    title: null,
    url: null,
    image: null,
  },
  reducers: {
    setSelectedFile: (state, action) => {
      state.id = action.payload.id;
      state.title = action.payload.title;
      state.url = action.payload.url;
      state.image = action.payload.image;
    }
  }
});

export const { setSelectedFile } = selectedFileSlice.actions;
export default selectedFileSlice.reducer;