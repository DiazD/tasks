import { configureStore } from '@reduxjs/toolkit'
import { v4 } from "uuid";
import { Tasker, createStateTransitions } from "../modules/Tasker";

import exports, { actions } from "./exports";
import tasks, { selectors, actions as taskActions } from "./tasks";

const store = configureStore({
  reducer: { exports, tasks },
});

export default store;

// lets define interfaces
const TaskStorage = {
  readTasks: () => {
    const tasks = selectors.getTasks(store.getState())
    return tasks;
  },
  addTask: (task) => {
    const id = v4();
    store.dispatch(taskActions.addTask({ ...task, id, status: "QUEUED" }));
    return id;
  },
  updateTask: (task) => {
    store.dispatch(taskActions.updateTask({ ...task }));
  }
}

const ResultStream = {
  put: (data) => {
    // for now we'll let the stream flow to the exports
    // branch
    store.dispatch(actions.notifyExport(data));
  },
};

const ErrorStream = ResultStream;

const stateTransitions = (task) => {
  const nextState = createStateTransitions(task);
  return nextState;
};

const {
  run,
  registerHandler,
} = Tasker({
  taskStorage: TaskStorage,
  resultStream: ResultStream,
  errorStream: ErrorStream,
  stateTransitions: stateTransitions,
  environment: { dispatch: store.dispatch, getState: store.getState },
});

export const addTask = TaskStorage.addTask

// register handlers
const exportHandler = ({
  resultStream,
  endTask,
  task,
}) => {
  let timer;
  let progress = 0;
  timer = setInterval(() => {
    if (progress >= 100) {
      clearInterval(timer);
      endTask(task);
    } else {
      progress += task.meta.increment;
      resultStream.put({ ...task, progress });
    }
  }, [task.meta.interval]);
};
registerHandler({ name: "export", handler: exportHandler });

run();
