// webperf_core betygsätter 1–5, där 5 är bäst
const ratingLevel = (value) => {
  if (value >= 4.5) {
    return 'good';
  }
  if (value >= 2.5) {
    return 'ok';
  }
  return 'poor';
};

const Rating = ({ label, value }) => {
  if (value === null) {
    return null;
  }

  return (
    <div className={`b3-rating b3-rating--${ratingLevel(value)}`}>
      <span className="b3-rating__value">{value.toFixed(1)}</span>
      <span className="b3-rating__label">{label}</span>
    </div>
  );
};

export default Rating;
