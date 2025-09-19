import "./loadedFile.css"
const LoadedFile = ({ file }) => {
    return (
        <div className="loadedFile">
            <div className="loadedFileTitle">
                {file? file.title: "No file loaded"}
            </div>
            <div className="loadedFileImageCont">
                <img src={file.image} alt={file.title} className="loadedFileImage"/>
            </div>
            
        </div>

    )
}

export default LoadedFile;