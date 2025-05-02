// hash-password.js
const bcrypt = require('bcrypt');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Password yang ingin di-hash (akan diminta saat runtime)
readline.question('Masukkan password untuk admin: ', (password) => {
  if (!password) {
    console.error('Password tidak boleh kosong.');
    readline.close();
    process.exit(1);
  }

  // Jumlah salt rounds (samakan dengan yang digunakan di User entity jika ada, biasanya 10)
  const saltRounds = 10;

  console.log(`Menghasilkan hash untuk password: "${password}" ...`);

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.error('Error hashing password:', err);
    } else {
      console.log('\n--- HASH PASSWORD (Salin ini) ---');
      console.log(hash); // Ini adalah hash yang akan Anda masukkan ke database
      console.log('----------------------------------\n');
      console.log('Catatan: Hash ini sudah termasuk salt.');
    }
    readline.close();
  });
});
