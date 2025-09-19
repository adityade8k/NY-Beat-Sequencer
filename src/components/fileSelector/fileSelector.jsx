import "./fileSelector.css";
const FileSelector = ({ files = [], onFileSelect, selectedId = null }) => {
  console.log(selectedId);
  return (
    <div className="fileSelector" role="list" >
      {files.map((f) => {
        const isSelected = selectedId === f.id;
        return (
          <div
            key={f.id}
            className={`fileSelectorTile${isSelected ? 'active' : ''}`}
          >
            <div className="fileName" title={f.title}>{f.title}</div>

            <button
              type="button"
              className="loadCont"
              onClick={() => onFileSelect(f.id)}
            >
              <img className={`rightArrow ${isSelected ? 'active' : ''}`} src="/assets/right.svg" alt="" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileSelector;
