import { getAIName, isOffline } from "../ai/aiHelper";

// batata hai kaunsa AI chala - Gemini ya offline
const AiBadge = ({ usedAI }) => {
  const offline = isOffline(usedAI);

  return (
    <span
      className={`ai-source ${offline ? "is-local" : ""}`}
      title={offline ? "Gemini key nahi mili, offline AI chal raha hai" : usedAI}
    >
      {getAIName(usedAI)}
    </span>
  );
};

export default AiBadge;
