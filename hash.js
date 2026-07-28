const bcrypt = require('bcrypt');

const password = 'prajwal1234'; // Change to your new password

bcrypt.hash(password, 10).then(hash => {
  console.log(hash);
});