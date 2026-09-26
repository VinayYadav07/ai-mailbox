import { createContext, useContext, useReducer } from "react";

const MailContext = createContext();

const initialState = {
  mails: [],
  sent: [],
  unreadCount: 0,
  loaded: false,
  aiWorkingOn: [], // abhi AI kaunsi mails check kar raha hai
  lastUsedAI: null, // gemini ya offline
};

const countUnread = (mails) => mails.filter((mail) => !mail.receiverRead).length;

const mailReducer = (state, action) => {
  switch (action.type) {
    case "SET_MAILS":
      return {
        ...state,
        mails: action.payload,
        unreadCount: countUnread(action.payload),
        loaded: true,
      };

    case "SET_SENT":
      return { ...state, sent: action.payload };

    case "MARK_AS_READ": {
      const mails = state.mails.map((mail) =>
        mail.id === action.payload ? { ...mail, receiverRead: true } : mail,
      );
      return { ...state, mails, unreadCount: countUnread(mails) };
    }

    case "REMOVE_MAIL": {
      const mails = state.mails.filter((mail) => mail.id !== action.payload);
      const sent = state.sent.filter((mail) => mail.id !== action.payload);
      return { ...state, mails, sent, unreadCount: countUnread(mails) };
    }

    case "SAVE_AI": {
      const mails = state.mails.map((mail) =>
        mail.id === action.payload.id ? { ...mail, ai: action.payload.ai } : mail,
      );
      return { ...state, mails };
    }

    case "AI_WORKING":
      return { ...state, aiWorkingOn: action.payload };

    case "AI_USED":
      return { ...state, lastUsedAI: action.payload };

    default:
      return state;
  }
};

export const MailProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mailReducer, initialState);
  return (
    <MailContext.Provider value={{ state, dispatch }}>
      {children}
    </MailContext.Provider>
  );
};

// har page me mails lene ke liye
export const useMailContext = () => {
  return useContext(MailContext);
};
