import { createSlice } from '@reduxjs/toolkit'

const slice = createSlice({
  name: "exports",
  initialState: {},
  reducers: {
    addExport: (exports, { payload }) => {
      exports[payload.id] = payload;
    },
    notifyExport: (exports, { payload }) => {
      if (payload.error) {
        exports[payload.id].errorMessage = payload.error;
      } else {
        exports[payload.id].progress = payload.progress > 100 ? 100 : payload.progress;
      }
    }
  }
});

const getExports = ({ exports }) => Object.values(exports);
export const selectors = { getExports };
export const actions = slice.actions;
export default slice.reducer;
