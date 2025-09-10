(async () => {
  try {
    const svc = require("./services/reminderService");
    const result = await svc.processPendingReminders();
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
