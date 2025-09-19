// src/components/fileSelector/FileSelector.jsx
import "./fileSelector.css";

const FileSelector = ({
  files = [],
  onFileSelect,
  selectedId = null,
  right = true, // when false: names on the RIGHT, arrow pointing LEFT
}) => {
  // Empty state
  if (!files || files.length === 0) {
    return (
      <div className="fileSelector fileSelector--empty" role="list">
        <div className="fileSelector__emptyMsg">No Tracks Available</div>
      </div>
    );
  }

  return (
    <div className="fileSelector" role="list">
      {files.map((f) => {
        const isSelected = selectedId === f.id;
        return (
          <div
            key={f.id}
            role="listitem"
            className={`fileSelectorTile ${!right ? "reverse" : ""} ${isSelected ? "active" : ""}`}
          >
            {/* File name (moves to the right when .reverse is applied) */}
            <div className="fileName" title={f.title}>
              {`${!right ? "Track " : ""}`}{f.title}
            </div>

            {/* Arrow button */}
            <button
              type="button"
              className="loadCont"
              onClick={() => onFileSelect?.(f.id)}
              aria-label={right ? "Load to the right" : "Load to the left"}
            >
              {/* Use the same right.svg and flip it in CSS when !right */}
              <img
                className={`rightArrow ${!right ? "left" : ""} ${isSelected ? "active" : ""}`}
                src="/assets/right.svg"
                alt=""
              />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default FileSelector;
