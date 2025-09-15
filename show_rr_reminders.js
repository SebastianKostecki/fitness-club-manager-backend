const db = require("./config/sequelize");
(async () => {
  const [rows] = await db.query(`
    SELECT rr.RoomReservationID, rr.StartTime,
           er.EmailReminderID, er.Status, er.ScheduledTime
    FROM room_reservations rr
    LEFT JOIN email_reminders er
      ON er.RoomReservationID = rr.RoomReservationID
    WHERE rr.RoomReservationID IN (4)
    ORDER BY rr.RoomReservationID DESC
  `);
  console.table(rows);
  process.exit(0);
})();
