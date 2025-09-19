import "./stepHeader.css"

const StepHeader = ({number, text}) => {
    return (
        <div className="stepHeader">
            <div className="stepNumber">{number}</div>
            <div className="stepText">{text}</div>
        </div>
    )
}

export default StepHeader;