import {
  AI_RECEIVE_MESSAGE,
  AI_SET_LOADING,
  AI_SUMMARIZE_CHAT,
  AI_SET_CHAT_SESSION,
  AI_CLEAR,
  AI_ERROR,
} from "./ai.type";

const initialState = {
  chatSession: null,
  messages: [],
  isLoading: false,
  summary: null,
  error: null,
};

const aiReducer = (state = initialState, action) => {
  switch (action.type) {
    case AI_SET_CHAT_SESSION:
      return { ...state, chatSession: action.payload, error: null };
    case AI_RECEIVE_MESSAGE:
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload.userMessage,
          action.payload.aiMessage,
        ],
        chatSession: action.payload.chat,
        error: null,
      };
    case AI_SET_LOADING:
      return { ...state, isLoading: action.payload };
    case AI_SUMMARIZE_CHAT:
      return { ...state, summary: action.payload, error: null };
    case AI_ERROR:
      return { ...state, error: action.payload };
    case AI_CLEAR:
      return initialState;
    default:
      return state;
  }
};

export default aiReducer;
