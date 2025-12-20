console.log('=== REMINDER DEBUG SCRIPT ===');
console.log('Current time:', new Date().toISOString());
console.log('Service status:', window.GlobalReminderService?.getStatus());
console.log('Forcing reminder check...');
window.GlobalReminderService?.forceCheck();
setTimeout(() => {
  console.log('Clearing cache and rechecking...');
  window.GlobalReminderService?.clearCheckedReminders();
  window.GlobalReminderService?.forceCheck();
}, 3000);
