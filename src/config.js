// Homeocentrum UI API hosts.
// Keep exactly one module.exports block active. Comment out the other two.

module.exports = {
  api: {
         /* 1. Production */
         //  API_Base_URL: "https://api1.homeocentrum.com/api",

          /* 2. Stage */
          //API_Base_URL: "https://stageapi1.homeocentrum.com/api",

          /* 3. Development */
          //API_Base_URL: "https://devapi2.homeocentrum.com/api",

          /* 4. Migration */
          API_Base_URL: "https://devmaigrationapi.homeocentrum.com/api",

         /* 5. Local Development */
          //API_Base_URL: "http://localhost:5000/api",
   }
 };