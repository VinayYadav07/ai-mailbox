// Urgent / Important / Normal wala chhota label
const PriorityBadge = ({ priority, small }) => {
  if (!priority) return null;

  return (
    <span className={`prio prio-${priority.toLowerCase()} ${small ? "prio-sm" : ""}`}>
      {priority}
    </span>
  );
};

export default PriorityBadge;
