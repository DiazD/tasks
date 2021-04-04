import { v4 } from "uuid";

let runnerEnvironment = { interval: 5000 };

const put = (stream, data) => {
  stream.put(data);
}

const nextState = (task, stateTransitions, error) => {
  if (error) return "ERROR";
  return stateTransitions(task);
};

const updateState = (stateTransitions, taskStorage) => (task, error = false) => {
  const status = nextState(task, stateTransitions, error);
  const newTask = { ...task, status };
  taskStorage.updateTask(newTask);

  return newTask;
}

const wrappedErrorStream = (updateTask, errorStream) => (task, error) => {
  const updatedTask = updateTask(task, true);
  put(errorStream, { ...updatedTask, error });
}

const handlers = {};

const registerHandler = (handler) => {
  handlers[handler.name] = handler;
}

const taskRunner = ({
  task,
  errorStream,
  resultStream,
  updateTask,
}) => {
  const updatedTask = updateTask(task);
  const { handler, environment = {} } = handlers[task.task];

  handler({
    task: updatedTask,
    environment,
    errorStream,
    resultStream,
    endTask: updateTask
  });
};

const getTasks = (storage) => storage.readTasks().filter(({ status }) => status === "QUEUED");
const runner = ({
  taskStorage,
  resultStream,
  errorStream,
  stateTransitions,
  environment,
}) => {
  runnerEnvironment = { ...runnerEnvironment, ...environment };
  // setup wrappers for errorStream and stateTransitions
  const updateTask = updateState(stateTransitions, taskStorage);
  const errorStream_ = wrappedErrorStream(updateTask, errorStream);

  // main loop
  console.log("STARTING TO RUN...", runnerEnvironment)
  setInterval(() => {
    const tasks = getTasks(taskStorage);
    console.log("AVAILABLE TASKS", tasks);
    tasks.forEach((task) => {
      console.log("RUNNING", task);
      taskRunner({
        task,
        taskStorage,
        resultStream,
        errorStream: errorStream_,
        updateTask
      });
    });
  }, runnerEnvironment.interval);
};

export const Tasker = ({
  taskStorage,
  resultStream,
  errorStream,
  stateTransitions,
  environment,
}) => {
  const run = () => runner({
    taskStorage,
    resultStream,
    errorStream,
    stateTransitions,
    environment,
  });

  return {
    run,
    updateEnvironment: (newEnvironment) => {
      runnerEnvironment = { ...runnerEnvironment, ...newEnvironment }
    },
    registerHandler
  };
};

// default configuration
export const createTaskStorage = () => {
  const tasks = [];

  // minimal api
  return {
    readTasks: () => tasks,
    addTask: (task) => {
      const id = v4();
      tasks.push({ ...task, status: "QUEUED", id });
      return id;
    },
    updateTask: (task) => {
      const currentTask = tasks.findIndex(({ id }) => id === task.id);
      if (currentTask !== -1) {
        tasks[currentTask] = { ...tasks[currentTask], ...task };
      }
    }
  };
};

export const createErrorStream = () => {
  const errors = {};
  return {
    put: (data) => {
      errors[data.id] = data;
    },
    errors,
  };
};

export const createResultStream = () => {
  const results = {};
  return {
    put: (data) => {
      results[data.task] = data;
    },
    results,
  };
};

export const createStateTransitions = (task) => {
  switch (task.status) {
    case "QUEUED": {
      return "RUNNING";
    }
    case "RUNNING": {
      return "FINISHED";
    };
  }
};

export const createDefaultConfiguration = () => {
  return {
    taskStorage: createTaskStorage(),
    resultStream: createResultStream(),
    errorStream: createErrorStream(),
    stateTransitions: createStateTransitions,
    environment: {},
  }
};

export const compose =
  (...functions) =>
    (...args) => functions.reduceRight(
      (args, g) => g(args),
      args,
    )
