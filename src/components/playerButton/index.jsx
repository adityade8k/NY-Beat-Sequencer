import "./playerButton.css";

const PlayerButton = ({onClick, active, iconSrc}) => {
    
    return(
        <button className={`playerButton ${active? "active" : ""}`} disabled={!active} onClick={onClick}>
            <img src={iconSrc} alt="" className={`playerButtonIcon ${active? "active" : ""}`} />
        </button>
    )
}

export default PlayerButton;