const bcrypt = require('bcryptjs');

const main = async () => {
  const password = process.argv[2] || '';
  if (!password) {
    console.error('Usage: node scripts/hash.js <password>');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
};

main();


