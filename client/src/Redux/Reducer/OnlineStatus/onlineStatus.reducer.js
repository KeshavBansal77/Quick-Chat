const initialState = {
  onlineUsers: [],
};

const onlineStatusReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_ONLINE_USERS":
      return { ...state, onlineUsers: action.payload };
    case "USER_ONLINE":
      if (state.onlineUsers.includes(action.payload)) {
        return state;
      }
      return { ...state, onlineUsers: [...state.onlineUsers, action.payload] };
    case "USER_OFFLINE":
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter((id) => id !== action.payload),
      };
    default:
      return state;
  }
};

export default onlineStatusReducer;
