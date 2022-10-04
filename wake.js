const axios = require('axios');
const { backURI } = require('./constants');

module.exports = {
  wake: () => {
    console.log('first wake')
    setInterval(async () => {
      await axios
        .get(`${backURI}/wake`)
        .then((res) => {
          console.log(`Waked the system!, ${res.status}`);
        })
        .catch((err) => {
          console.log(`Waked system but error in fetch!, ${err}`);
        });
    }, 20 * 60 * 1000);
  }
}