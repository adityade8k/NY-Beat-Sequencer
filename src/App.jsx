import './App.css'
import FilePicker from './packages/filePicker'
import Mixer from './packages/mixer';
import Sequencer from './packages/sequencer';

function App() {

  return (
    <>
      <div id="topPanel">
        <FilePicker />
        <Mixer />
      </div>
      <Sequencer />
    </>

  )
}

export default App
