// Homeocentrum UI API hosts.
// Keep exactly one module.exports block active. Comment out the other two.

module.exports = {
  api: {
         /* 1. Production */
         //  New_API_Base_URL: "https://api1.homeocentrum.com/api",
         //  Old_API_Base_URL: "https://api.homeocentrum.com/api"

          /* 2. Stage */
          //New_API_Base_URL: "https://stageapi1.homeocentrum.com/api",
          //Old_API_Base_URL: "https://stageapi2.homeocentrum.com/api"

          /* 3. Development */
          New_API_Base_URL: "https://devapi2.homeocentrum.com/api",
          Old_API_Base_URL: "https://devapi1.homeocentrum.com/api"

         /* 3. Local Development */
          // New_API_Base_URL: "http://localhost:5002/api",
          // Old_API_Base_URL: "http://localhost:5001/api"
   }
 };