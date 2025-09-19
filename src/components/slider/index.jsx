import { useId } from 'react';

const Slider = ({
  label,
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  className = '',
  id,
}) => {
  const reactId = useId();
  const sliderId = id || `slider-${reactId}`;
  const outputId = `out-${reactId}`;

  const handleChange = (e) => {
    const v = Number(e.target.value);
    if (!Number.isNaN(v) && onChange) onChange(v);
  };

  return (
    <div className={`slider ${className}`}>
      <div className="sliderHeader">
        {label && <label htmlFor={sliderId} className="sliderLabel">{label}</label>}
        <output id={outputId} htmlFor={sliderId} aria-live="polite">
          {value}
        </output>
      </div>

      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={handleChange}
        aria-describedby={outputId}
        className="sliderInput"
      />
    </div>
  );
};

export default Slider;
