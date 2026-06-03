const bcrypt = require('bcryptjs');

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run hash-password -- "your admin password"');
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log(hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

