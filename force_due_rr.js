const db = require("./config/sequelize");
(async () => {
  await db.query(`
    UPDATE email_reminders
       SET ScheduledTime = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 MINUTE)
     WHERE Status = 'pending'
       AND RoomReservationID = 4
  `);
  const [rows] = await db.query(`
    SELECT EmailReminderID, Status,
           DATE_FORMAT(ScheduledTime,'%Y-%m-%d %H:%i:%s') AS ScheduledTime
    FROM email_reminders
    WHERE RoomReservationID = 4
    ORDER BY EmailReminderID DESC
    LIMIT 5
  `);
  console.table(rows);
  process.exit(0);
})();
