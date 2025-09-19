import PlayerButton from "../playerButton";
import "./playerControls.css";
const PlayerControls = ({onPlay, onPause, onReset, isPlaying}) => {
    return(
        <div className="playerControlsCont">
            <PlayerButton onClick={onPlay} active={!isPlaying} iconSrc={"/assets/play.svg"}/>
            <PlayerButton onClick={onPause} active={isPlaying} iconSrc={"/assets/pause.svg"}/>
            <PlayerButton onClick={onReset} active={true} iconSrc={"/assets/reset.svg"}/>
        </div>
    )
}

export default PlayerControls;