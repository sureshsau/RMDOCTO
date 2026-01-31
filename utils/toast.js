import Toast from "react-native-toast-message";

export const showSuccess = (text) => {
  Toast.show({
    type: "success",
    text2: text,
    position: "bottom",
    visibilityTime: 3000,
    autoHide: true
  });
};

export const showError = (text) => {
  Toast.show({
    type: "error",
    text2: text,
    position: "bottom",
    visibilityTime: 3000
  });
};

export const showInfo = (text) => {
  Toast.show({
    type: "info",
    text2: text,
    position: "bottom",
    visibilityTime: 2500
  });
};
