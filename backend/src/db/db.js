const mongoose = require('mongoose');

function connectToDB() {
  return mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log('Server is connected To DB.');
    })
    .catch((err) => {
      console.log('Server is failed to connect with DB.', err);
      throw err;
    });
}

function disconnectDB(force = false) {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    return mongoose.connection.close(force);
  }
  return Promise.resolve();
}

module.exports = connectToDB;
module.exports.connectToDB = connectToDB;
module.exports.disconnectDB = disconnectDB;
