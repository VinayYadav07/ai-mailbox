const TONES = ["Professional", "Friendly", "Concise"];

const ToneButtons = ({ selected, onSelect, disabled }) => {
  return (
    <div className="tone-switch">
      {TONES.map((tone) => (
        <button
          type="button"
          key={tone}
          disabled={disabled}
          className={selected === tone ? "active" : ""}
          onClick={() => onSelect(tone)}
        >
          {tone}
        </button>
      ))}
    </div>
  );
};

export default ToneButtons;
