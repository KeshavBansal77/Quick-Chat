import axios from "axios";
import {
  AI_RECEIVE_MESSAGE,
  AI_SET_LOADING,
  AI_SUMMARIZE_CHAT,
  AI_SET_CHAT_SESSION,
  AI_ERROR,
} from "./ai.type";

const SERVER_ACCESS_BASE_URL = process.env.REACT_APP_SERVER_ACCESS_BASE_URL;

// Get or create AI chat session
export const getAIChatSession = () => async (dispatch) => {
  try {
    const token = JSON.parse(localStorage.getItem("ETalkUser"))?.token;
    const response = await axios({
      method: "GET",
      url: `${SERVER_ACCESS_BASE_URL}/api/ai/chat-session`,
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch({ type: AI_SET_CHAT_SESSION, payload: response.data });
    return response.data;
  } catch (error) {
    dispatch({
      type: AI_ERROR,
      payload: error.response?.data?.message || "Failed to create AI chat session",
    });
  }
};

// Send message to AI
export const sendAIMessage = (message, chatId) => async (dispatch) => {
  try {
    dispatch({ type: AI_SET_LOADING, payload: true });
    const token = JSON.parse(localStorage.getItem("ETalkUser"))?.token;
    const response = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/ai/chat`,
      headers: { Authorization: `Bearer ${token}` },
      data: { message, chatId },
    });
    dispatch({ type: AI_RECEIVE_MESSAGE, payload: response.data });
    dispatch({ type: AI_SET_LOADING, payload: false });
    return response.data;
  } catch (error) {
    dispatch({ type: AI_SET_LOADING, payload: false });
    dispatch({
      type: AI_ERROR,
      payload: error.response?.data?.message || "AI service unavailable",
    });
  }
};

// Summarize a chat
export const summarizeChat = (chatId) => async (dispatch) => {
  try {
    dispatch({ type: AI_SET_LOADING, payload: true });
    const token = JSON.parse(localStorage.getItem("ETalkUser"))?.token;
    const response = await axios({
      method: "POST",
      url: `${SERVER_ACCESS_BASE_URL}/api/ai/summarize`,
      headers: { Authorization: `Bearer ${token}` },
      data: { chatId },
    });
    dispatch({ type: AI_SUMMARIZE_CHAT, payload: response.data });
    dispatch({ type: AI_SET_LOADING, payload: false });
    return response.data;
  } catch (error) {
    dispatch({ type: AI_SET_LOADING, payload: false });
    dispatch({
      type: AI_ERROR,
      payload: error.response?.data?.message || "Summarization failed",
    });
  }
};
