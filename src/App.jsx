import './App.css';
import { useSelector, useDispatch } from 'react-redux';

// redux
import { selectors, actions } from "./store/exports";
import { addTask, addFasterTask } from "./store/store";
import { useState, useEffect } from 'react';

const random = (seed) => Math.floor(Math.random() * seed) + 1;

function App() {
  const dispatch = useDispatch()
  const exports = useSelector(selectors.getExports);
  const [highscores, setHighscores] = useState([]);
  const [currentplace, setcurrentplace] = useState(1);

  useEffect(() => {
    const exportIdx = exports.findIndex(({ id, progress }) => progress === 100 && !highscores[id]);
    const export_ = exports[exportIdx];
    if (export_ && !highscores[export_.id]) {
      setHighscores((current) => {
        return { ...current, [export_.id]: currentplace }
      });

      setcurrentplace((state) => state + 1);
    }
  }, [exports, currentplace]);

  const addExport = () => {
    const id = addTask({
      task: "export",
      meta: { increment: random(20), interval: random(10000) }
    });
    dispatch(actions.addExport({
      id,
      name: `Export ${id}`,
      type: "normal",
      progress: 0
    }));
  }

  const addFasterExport = () => {
    const id = addFasterTask({
      task: "export",
      meta: { increment: random(20), interval: random(10000) }
    });
    dispatch(actions.addExport({
      id,
      name: `Export ${id}`,
      type: "faster",
      progress: 0
    }));
  }

  return (
    <div>
      <button onClick={addExport}>add exports</button>
      <button onClick={addFasterExport}>add faster exports</button>
      {exports.map((ex, idx) => (
        <div className="export d-flex align-items-center justify-content-between" key={ex.id}>
          <span className="text-sm small">{idx + 1}</span>
          <span className="text-sm medium">{ex.name}</span>
          <span className="text-sm small">{ex.type}</span>
          <span className="text-sm small">{ex.progress}%</span>
          <span className="text-sm small">{highscores[ex.id] ? highscores[ex.id] : null}</span>
          <span
            className="big d-flex align-items-center justify-content-between"
          >
            <div className="progress-bar-container">
              <div style={{ width: ex.progress * 5 }} className="progress-bar">
              </div>
            </div>
          </span>
        </div>
      ))}
      <div>
        <div>
          Normal: {exports.filter(({ type }) => type === "normal").map(({ id }) => highscores[id] || 0).reduce((acc, num) => acc + num, 0)} ({exports.filter(({ type, progress }) => type === "normal" && progress === 100).length}/{exports.filter(({ type, progress }) => type === "normal").length})
        </div>
        <div>
          Faster: {exports.filter(({ type }) => type === "faster").map(({ id }) => highscores[id] || 0).reduce((acc, num) => acc + num, 0)} ({exports.filter(({ type, progress }) => type === "faster" && progress === 100).length}/{exports.filter(({ type, progress }) => type === "faster").length})
        </div>
      </div>
    </div>
  );
}

export default App;
