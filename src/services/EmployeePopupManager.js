/**
 * Global Employee Popup Manager
 * Shows beautiful popups from anywhere in the app
 */

let showPopupCallback = null;

export const setShowPopupCallback = (callback) => {
  showPopupCallback = callback;
};

export const showEmployeeNotificationPopup = (data) => {
  if (showPopupCallback) {
    showPopupCallback(data);
  } else {
    console.warn('⚠️ Employee popup callback not set');
  }
};

export default {
  setShowPopupCallback,
  showEmployeeNotificationPopup,
};
