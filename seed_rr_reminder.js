const db = require("./config/sequelize");
(async () => {
  try {
    // UWAGA: to zakłada, że kolumny ReservationID/ClassID są NULLable
    // Jeśli nie są, alter table trzeba było wprowadzić migracją.
    await db.query(`
      INSERT INTO email_reminders
        (UserID, RoomReservationID, ScheduledTime, Status, CreatedAt, UpdatedAt)
      SELECT rr.CreatedByUserID,
             rr.RoomReservationID,
             DATE_SUB(rr.StartTime, INTERVAL 60 MINUTE),
             'pending',
             UTC_TIMESTAMP(), UTC_TIMESTAMP()
      FROM room_reservations rr
      LEFT JOIN email_reminders er
        ON er.RoomReservationID = rr.RoomReservationID
       AND er.Status = 'pending'
      WHERE rr.RoomReservationID = 4
        AND er.EmailReminderID IS NULL
      LIMIT 1
    `);

    const [rows] = await db.query(`
      SELECT EmailReminderID, Status,
             DATE_FORMAT(ScheduledTime,'%Y-%m-%d %H:%i:%s') AS ScheduledTime,
             RoomReservationID
      FROM email_reminders
      WHERE RoomReservationID = 4
      ORDER BY EmailReminderID DESC
      LIMIT 5
    `);
    console.table(rows);
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    process.exit(0);
  }
})();
