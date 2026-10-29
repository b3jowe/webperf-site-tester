const LABELS = {
  queued: 'I kö',
  running: 'Körs',
  done: 'Klar',
  failed: 'Misslyckades',
  cancelled: 'Avbruten'
};

const StatusBadge = ({ status }) => (
  <span className={`b3-status b3-status--${status}`}>{LABELS[status] ?? status}</span>
);

export default StatusBadge;
