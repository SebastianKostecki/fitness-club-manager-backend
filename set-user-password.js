/**
 * Ustaw nowe hasło użytkownika po adresie email (bcrypt jak w Auth.js).
 * Hasło NIE trafia do repozytorium — podaj je tylko lokalnie / w CI secrets.
 *
 * PowerShell:
 *   $env:NEW_PASSWORD="TwojeNoweHaslo1!"; node set-user-password.js sebastiankostecki25@gmail.com
 *
 * bash:
 *   NEW_PASSWORD='TwojeNoweHaslo1!' node set-user-password.js sebastiankostecki25@gmail.com
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const Users = require('./models/Users');

async function main() {
  const email = process.argv[2];
  const newPassword = process.env.NEW_PASSWORD;

  if (!email) {
    console.error('Użycie: NEW_PASSWORD=<hasło> node set-user-password.js <email>');
    process.exit(1);
  }
  if (!newPassword || newPassword.length < 8) {
    console.error('Ustaw zmienną NEW_PASSWORD (min. 8 znaków).');
    process.exit(1);
  }

  const user = await Users.findOne({ where: { Email: email } });

  if (!user) {
    console.error('Nie znaleziono użytkownika o tym emailu.');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(newPassword, salt);
  await user.update({ Password: hashPassword });
  console.log('OK — zaktualizowano hasło dla:', user.Email, '(UserID:', user.UserID + ')');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
