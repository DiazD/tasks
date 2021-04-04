### Description
An experiment on implementing a `task runner`. The main idea is to provide an interface for the user to run a task. A task is a function that runs on some provided environment.

### Original Problem
On a project I was working on, the client side provided many ways to import and export data. Initially, based on requirements, we just had a polling mechanism baked into the component. Later on, they wanted the polling to happen even if the user left the page(implying polling should be done at the top level).

We created a barebones task runner which was mainly a loop that read off a queue. It provided a way to signal that a `task was finished` and that's it. The API was fairly simple so we stuck with that instead of adding something like redux-saga.

### Experiment
Part of the issue of the original task runner were the following:

- queue baked in, it was an array of functions
- tasks were functions
- tasks had to take care of some plumbing

The new solution runs against an interface rather than some concrete data structure. This implies that if you provide a queue the implements the interface then your queue can work as a task storage. Here are the components that the new task runner is made of:

1. Task Storage
2. Result Stream
3. Error Stream
4. State Transition
5. An Environment

#### 1. Task Storage
This is the place that contains all of our tasks, it must implement the following interfaces:

- **readTasks**: a function that provides all tasks
- **updateTask**: a function that takes a task and does something with that task.
- **addTask(optional)**: mainly if you want to include the queuing of the task in this data structure

Because the task runner does not provide it's own queue, it gives the responsibility to the user on how it queues it's tasks.

#### 2. Result Stream
A function that allows you to push results to some external thing. The results stream must be implemented in order to work with your task system. For example:  Imagine you're polling for updates of data import.  Every tick you might want to update some state. The result stream allows you to provide a mechanism to emit those changes.

#### 3. Error Stream
A function that allows you to push errors to some external thing. It's similar to the Result Stream.

#### 4. State Transitions
A function that provides the `next status` of your task based on it's current status.

#### 5. Environment
A map that can provide the interval at which the runner checks for new tasks. It's the minimal way to use it for now but it should probably be extended to be injected into tasks.

### Examples

#### Using default configuration

```

import { createDefaultConfiguration, Tasker } from "./some-path";

// use the provided default config
const config = createDefaultconfiguration();

const {
  run,
  registerHandler
} = Tasker(config);

// define & register handlers
const pollUpdates = ({ task, endTask, resultStream, errorStream }) => {
  ...
}

const userTask = ({ task, endTask, resultStream, errorStream, environment }) => {
  // checks the user states, if it's stale data then we fetch for new ones
  let interval;
  let isUpdating = false;
  const { users, interval } = environment;

  interval = setInterval(() => {
    const usersToUpdate = users.getStaleUsers();
    if (usersToUpdate.length) {
      isUpdating = true;
      api.users.bulkFetch(usersToUpdate).then((response) => {
        // feed it to the results stream
        resultStream.put(response);
        isUpdating = false;
      });
    }
  }, interval);
}

registerHandler({ name: "poll", handler: pollUpdates });
registerHandler({ 
  name: "UserAgent", 
  handler: userTask,
  environment: { interval: 60 * 1000, users: users}
});

// run the loop
run();

```

#### Using Redux
We can use redux to store our tasks and output results to different areas of the store.

```
import { createDefaultConfiguration, Tasker } from "./some-path";
import store from "...some-path";

// use the provided default config
const ReduxTaskStorage = {
  readTasks: () => store.getState().tasksList,
  updateTask: (task) => store.dispatch({ type: "TASK/UPDATE", payload: task}),
  addTask: (task) => {
    const id = v4(); // create some uuid
    store.dispatch({ type: "TASK/CREATE", payload: { ...task, id, status: "QUEUED" }});
    return id;
  },
}

// for both result and error streams, we can have a middleware that listens for those 2 actions
// and routes them to the places they need to go.
const ReduxResultStream = {
  put: (data) => store.dispatch({ type: "TASK/RESULTS", payload: data })
}

const ReduxErrorStream = {
  put: (error) => {
    store.dispatch({ type: "TASK/ERRORS", payload: error });
    sendErrorToSentry(error, { level: "ERROR" }); // do anything here
  }
}

const config = {
  taskStorage: ReduxTaskStorage,
  resultStream: ReduxResultStream,
  errorStream: ReduxErrorStream,
  stateTransitions: TaskStateTransitions,
  environment: { interval: 10 * 1000 },
};
const {
  run,
  registerHandler
} = Tasker(config);
```
