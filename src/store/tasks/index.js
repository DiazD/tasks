import { createSlice } from '@reduxjs/toolkit'

const slice = createSlice({
  name: "tasks",
  initialState: {},
  reducers: {
    addTask: (tasks, { payload }) => {
      tasks[payload.id] = payload;
    },
    updateTask: (tasks, { payload }) => {
      tasks[payload.id] = { ...tasks[payload.id], ...payload };
    }
  }
});

const getTasks = ({ tasks }) => Object.values(tasks);
export const selectors = { getTasks };
export const actions = slice.actions;
export default slice.reducer;
