import axios from "axios";
import {
  SEND_MESSAGE,
  GET_ALL_MESSAGE,
  UPDATE_GET_ALL_MESSAGE,
  SHOW_TOOGLE_LOADING,
  SHOW_NETWORK_ERROR,
} from "./message.type";

const SERVER_ACCESS_BASE_URL = process.env.REACT_APP_SERVER_ACCESS_BASE_URL;

// get all messages
export const getAllChats = (selectedChat) => async (dispatch) => {
  try {
    dispatch(loadingToggleAction(true));
    const allMessage = await axios({
      method: "GET",
      url: `${SERVER_ACCESS_BASE_URL}/api/message/${selectedChat._id}`,
    });
    dispatch(loadingToggleAction(false));
    // console.log(allMessage);
    return dispatch({ type: GET_ALL_MESSAGE, payload: allMessage.data });
  } catch (error) {
    dispatch(showNetworkError(true));
    return dispatch({ type: "ERROR", payload: error });
  }
  //   }
};

// updateing get all message
export const updateGetAllChats = (messageRecived) => async (dispatch) => {
  try {
    // console.log(messageRecived);
    if (!messageRecived.sender) {
      return;
    }
    const updatedAllMessage = messageRecived;
    return dispatch({
      type: UPDATE_GET_ALL_MESSAGE,
      payload: updatedAllMessage,
    });
  } catch (error) {
    dispatch(showNetworkError(true));
    return dispatch({ type: "ERROR", payload: error });
  }
};

// send message
export const sendMessge = (messageData) => async (dispatch) => {
  try {
    const newMessage = await axios({
      method: "POSt",
      url: `${SERVER_ACCESS_BASE_URL}/api/message`,
      data: { ...messageData },
    });

    // If this is an AI chat, the response contains both userMessage and aiMessage
    if (newMessage.data.isAIChat) {
      dispatch({ type: SEND_MESSAGE, payload: newMessage.data.userMessage });
      // Add AI response after a small delay for natural feel
      setTimeout(() => {
        dispatch({ type: UPDATE_GET_ALL_MESSAGE, payload: newMessage.data.aiMessage });
      }, 300);
      return dispatch({ type: "AI_RESPONSE", payload: newMessage.data });
    }

    return dispatch({ type: SEND_MESSAGE, payload: newMessage.data });
  } catch (error) {
    dispatch(showNetworkError(true));
    return dispatch({ type: "ERROR", payload: error });
  }
};

// clear all message
export const clearSelectedMessage = () => async (dispatch) => {
  try {
    return dispatch({
      type: "CLEAR_ALL_MESSAGE",
      payload: "",
    });
  } catch (error) {
    dispatch(showNetworkError(true));
    return dispatch({ type: "ERROR", payload: error });
  }
};

export const loadingToggleAction = (state) => {
  return {
    type: SHOW_TOOGLE_LOADING,
    payload: state,
  };
};

export const showNetworkError = (state) => {
  return {
    type: SHOW_NETWORK_ERROR,
    payload: state,
  };
};
