import { useId } from 'react';
import "./toggle.css";

const Toggle = ({
  label,
  isOn,
  onToggle,
  disabled = false,
  className = '',
  id,
}) => {
  const reactId = useId();
  const switchId = id || `tgl-${reactId}`;

  const handleClick = () => {
    if (onToggle) onToggle(!isOn); // pass the next state
  };

  return (
    <div className={`toggle ${className}`}>
      {label && (
        <label htmlFor={switchId} className="toggleLabel">
          {label}
        </label>
      )}

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={!!isOn}
        aria-label={label}
        className={`toggleBtn ${isOn ? 'on' : 'off'}`}
        onClick={handleClick}
        disabled={disabled}
      >
        <span className="knob" />
      </button>
    </div>
  );
};

export default Toggle;
