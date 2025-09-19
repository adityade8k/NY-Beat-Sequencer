import { use } from "react";
import FileSelector from "../../components/fileSelector/fileSelector";
import StepHeader from "../../components/stepHeader/stepHeader";
import "./filePicker.css";
import { useSelector, useDispatch } from "react-redux";
import { files } from "../../data/files";
import { setSelectedFile } from "../../store/reducers/selectedFileSlice";
import { togglePlay } from "../../store/reducers/mixerSlice";

const FilePicker = () => {

    const dispatch = useDispatch();

    const selectedFile = useSelector((state) => state.selectedFile);
    const mixerState = useSelector((s) => s.mixer);

    const onFileSelect = (fileID) => {
        for (let f of files) {
            if (f.id === fileID) {
                dispatch(setSelectedFile(f));
                if (mixerState.isPlaying) {
                    dispatch(togglePlay());
                }
            }

        }
    }

    return (
        <div className="packCont half filePicker">
            <div className="headertile">
                <div className="title">New York Beat Sequencer</div>
                <div className="headerArrowCont">
                    <img className="headerArrow" src="/assets/rightDown.svg" alt="" />
                </div>
            </div>
            <StepHeader number="1" text="Upload a track" />
            <FileSelector files = {files} onFileSelect={onFileSelect} selectedId = {selectedFile.id} />
        </div>
    )
}

export default FilePicker;