// Homeocentrum UI API hosts.
// Keep exactly one module.exports block active. Comment out the other two.
//
// 1. Production — live public APIs
//    New API  https://api1.homeocentrum.com/api
//    Old API  https://api.homeocentrum.com/api
//
// 2. Development — shared dev servers
//    New API  https://devapi2.homeocentrum.com/api
//    Old API  https://devapi1.homeocentrum.com/api
//
// 3. Local — this PC (New API :5002, Old API :5001)
//    New API  http://localhost:5002/api
//    Old API  http://localhost:5001/api

//// 1. Production
// module.exports = {
//   api: {
//     New_API_Base_URL: "https://api1.homeocentrum.com/api",
//     Old_API_Base_URL: "https://api.homeocentrum.com/api",
//   }
// };

//// 2. Development
 module.exports = {
    api: {
        New_API_Base_URL: "https://devapi2.homeocentrum.com/api",
        Old_API_Base_URL: "https://devapi1.homeocentrum.com/api",
    }
 };

//// 3. Local (active)
// module.exports = {
//     api: {
//         New_API_Base_URL: "http://localhost:5002/api",
//         Old_API_Base_URL: "http://localhost:5001/api",
//     }
// };
