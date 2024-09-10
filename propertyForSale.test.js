// const supertest = require("supertest");
// const axios = require("axios");
// const fs = require("fs");
// const { createObjectCsvWriter } = require("csv-writer");
// const csvParser = require("csv-parser");
// const chai = require("chai");
// const expect = chai.expect;
// require("dotenv").config();

// const ENDPOINT = process.env.ENDPOINT;
// const API_KEY = process.env.API_KEY;
// const OUTPUT_FILEPATH = process.env.OUTPUT_FILEPATH;

// describe("API Test", function () {
//   this.timeout(600000); // Increase timeout to 600 seconds (10 minutes)

//   it("should fetch data from the API and save to CSV", async function () {
//     const requestBody1 = {
//       ApiKey: API_KEY,
//       RequestTypeId: 2,
//       RequestVerb: "POST",
//       Endpoint: ENDPOINT,
//       Page: 1,
//       PageSize: 50,
//       SortColumn: 2,
//       SortDirection: 2,
//       SearchRequest: {
//         PropertyClassIds: [1],
//         PropertyStatusIds: [2, 12],
//         ChannelIds: [1],
//         Polygons: [],
//       },
//     };

//     const requestBody2 = {
//       ApiKey: API_KEY,
//       RequestTypeId: 2,
//       RequestVerb: "POST",
//       Endpoint: ENDPOINT,
//       Page: 1,
//       PageSize: 50,
//       SortColumn: 2,
//       SortDirection: 2,
//       Url: "https://www.myhome.ie/residential/ireland/property-for-sale?query=Refurbishment+Renovation",
//     };

//     const fetchData = async (requestBody, page, retries = 3, delay = 1000) => {
//       try {
//         requestBody.Page = page;
//         const response = await axios.post(requestBody.Endpoint, requestBody);
//         expect(response.status).to.equal(200);
//         return response.data;
//       } catch (error) {
//         if (retries > 0 && error.response && error.response.status === 504) {
//           console.warn(`Retrying page ${page} after ${delay}ms...`);
//           await new Promise((res) => setTimeout(res, delay));
//           return fetchData(requestBody, page, retries - 1, delay * 2);
//         } else {
//           console.error(`Error fetching data for page ${page}:`, error);
//           return { SearchResults: [], ResultCount: 0 };
//         }
//       }
//     };

//     const readExistingCSV = async (filePath) => {
//       return new Promise((resolve, reject) => {
//         const records = [];
//         if (!fs.existsSync(filePath)) {
//           resolve(records);
//         } else {
//           fs.createReadStream(filePath)
//             .pipe(csvParser())
//             .on("data", (data) => records.push(data))
//             .on("end", () => resolve(records))
//             .on("error", (error) => reject(error));
//         }
//       });
//     };

//     const writeCSV = async (data, filePath) => {
//       const csvWriterInstance = createObjectCsvWriter({
//         path: filePath,
//         header: [
//           { id: "ID", title: "ID" },
//           { id: "PropertyId", title: "PropertyId" },
//           { id: "Address", title: "Address" },
//           { id: "BerRating", title: "BER Rating" },
//           { id: "GroupName", title: "GroupName" },
//           { id: "SeoUrl", title: "SeoUrl" },
//           { id: "BedsString", title: "No. of Bedrooms" },
//           { id: "PriceAsString", title: "Price" },
//           { id: "SizeStringMeters", title: "Property Size" },
//           { id: "PropertyType", title: "Property Type" },
//           { id: "BathString", title: "No. of Bathrooms" },
//           { id: "CreatedOnDate", title: "Created On Date" },
//           { id: "Refurbishments", title: "Refurbishments/Renovations" },
//         ],
//       });

//       await csvWriterInstance.writeRecords(data);
//       console.log("Data successfully written to CSV file");
//     };

//     const getAllResults = async () => {
//       let allResults = [];
//       let page = 1;
//       let totalFetchedResults = 0;
//       const filePath = OUTPUT_FILEPATH;
//       const existingRecords = await readExistingCSV(filePath);
//       const existingIds = new Set(
//         existingRecords.map((record) => record.PropertyId)
//       );
//       const maxExistingId = existingRecords.reduce((maxId, record) => {
//         const id = parseInt(record.ID, 10);
//         return isNaN(id) ? maxId : Math.max(maxId, id);
//       }, 0);
//       let idCounter = maxExistingId + 1;
//       let newRecordsCount = 0;

//       console.log("Fetching data from API...");
//       console.log("existingIds count:", existingIds.size);

//       // Fetch the first page to get the total results count for the first request
//       const firstPageResponse = await fetchData(requestBody1, page);
//       const totalResults = firstPageResponse.ResultCount;
//       console.log(`Total results to fetch: ${totalResults}`);
//       firstPageResponse.SearchResults.forEach((result) => {
//         if (!existingIds.has(result.PropertyId.toString())) {
//           result.ID = idCounter++;
//           allResults.push(result);
//           newRecordsCount++;
//         }
//       });
//       totalFetchedResults += firstPageResponse.SearchResults.length;

//       // Fetch the remaining pages
//       while (totalFetchedResults < totalResults) {
//         page++;
//         const response = await fetchData(requestBody1, page);
//         response.SearchResults.forEach((result) => {
//           if (!existingIds.has(result.PropertyId.toString())) {
//             result.ID = idCounter++;
//             allResults.push(result);
//             newRecordsCount++;
//           }
//         });
//         totalFetchedResults += response.SearchResults.length;

//         if (response.SearchResults.length === 0) {
//           break;
//         }
//       }

//       // Fetch data for the second request
//       const refurbishmentsResults = [];
//       page = 1;
//       totalFetchedResults = 0;
//       const totalRefurbResults = await fetchData(requestBody2, page);

//       totalResultsRefurb = totalRefurbResults.ResultCount;

//       totalRefurbResults.SearchResults.forEach((result) => {
//         refurbishmentsResults.push(result.PropertyId);
//       });

//       totalFetchedResults += totalRefurbResults.SearchResults.length;

//       while (totalFetchedResults < totalResultsRefurb) {
//         page++;
//         const response = await fetchData(requestBody2, page);
//         response.SearchResults.forEach((result) => {
//           refurbishmentsResults.push(result.PropertyId);
//         });
//         totalFetchedResults += response.SearchResults.length;

//         if (response.SearchResults.length === 0) {
//           break;
//         }
//       }

//       // Mark refurbishments in the allResults array
//       allResults.forEach((result) => {
//         if (refurbishmentsResults.includes(result.PropertyId)) {
//           result.Refurbishments = "YES";
//         } else {
//           result.Refurbishments = "NO";
//         }
//       });

//       // Append new records to existing records
//       const combinedResults = existingRecords.concat(allResults);
//       await writeCSV(combinedResults, filePath);
//       console.log(`Number of new records added: ${newRecordsCount}`);
//     };

//     try {
//       await getAllResults();
//     } catch (error) {
//       console.error("Error fetching data from API:", error);
//       throw error;
//     }
//   });
// });

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

// const supertest = require("supertest");
// const axios = require("axios");
// const fs = require("fs");
// const { createObjectCsvWriter } = require("csv-writer");
// const csvParser = require("csv-parser");
// const chai = require("chai");
// const expect = chai.expect;
// require("dotenv").config();

// const ENDPOINT = process.env.ENDPOINT;
// const API_KEY = process.env.API_KEY;
// const OUTPUT_FILEPATH = process.env.OUTPUT_FILEPATH;

// describe("API Test", function () {
//   this.timeout(600000); // Increase timeout to 600 seconds (10 minutes)

//   it("should fetch data from the API and save to CSV", async function () {
//     const requestBody1 = {
//       ApiKey: API_KEY,
//       RequestTypeId: 2,
//       RequestVerb: "POST",
//       Endpoint: ENDPOINT,
//       Page: 1,
//       PageSize: 50,
//       SortColumn: 2,
//       SortDirection: 2,
//       SearchRequest: {
//         PropertyClassIds: [1],
//         PropertyStatusIds: [2, 12],
//         ChannelIds: [1],
//         Polygons: [],
//       },
//     };

//     const requestBody2 = {
//       ApiKey: API_KEY,
//       RequestTypeId: 2,
//       RequestVerb: "POST",
//       Endpoint: ENDPOINT,
//       Page: 1,
//       PageSize: 50,
//       SortColumn: 2,
//       SortDirection: 2,
//       Url: "https://www.myhome.ie/residential/ireland/property-for-sale?query=Refurbishment+Renovation",
//     };

//     const fetchData = async (requestBody, page, retries = 3, delay = 1000) => {
//       try {
//         requestBody.Page = page;
//         const response = await axios.post(requestBody.Endpoint, requestBody);
//         expect(response.status).to.equal(200);
//         return response.data;
//       } catch (error) {
//         if (retries > 0 && error.response && error.response.status === 504) {
//           console.warn(`Retrying page ${page} after ${delay}ms...`);
//           await new Promise((res) => setTimeout(res, delay));
//           return fetchData(requestBody, page, retries - 1, delay * 2);
//         } else {
//           console.error(`Error fetching data for page ${page}:`, error);
//           return { SearchResults: [], ResultCount: 0 };
//         }
//       }
//     };

//     const readExistingCSV = async (filePath) => {
//       return new Promise((resolve, reject) => {
//         const records = [];
//         if (!fs.existsSync(filePath)) {
//           resolve(records);
//         } else {
//           fs.createReadStream(filePath)
//             .pipe(csvParser())
//             .on("data", (data) => records.push(data))
//             .on("end", () => resolve(records))
//             .on("error", (error) => reject(error));
//         }
//       });
//     };

//     const writeCSV = async (data, filePath) => {
//       const csvWriterInstance = createObjectCsvWriter({
//         path: filePath,
//         header: [
//           { id: "ID", title: "ID" },
//           { id: "PropertyId", title: "PropertyId" },
//           { id: "Address", title: "Address" },
//           { id: "BerRating", title: "BER Rating" },
//           { id: "GroupName", title: "GroupName" },
//           { id: "SeoUrl", title: "SeoUrl" },
//           { id: "BedsString", title: "No. of Bedrooms" },
//           { id: "PriceAsString", title: "Price" },
//           { id: "SizeStringMeters", title: "Property Size" },
//           { id: "PropertyType", title: "Property Type" },
//           { id: "BathString", title: "No. of Bathrooms" },
//           { id: "CreatedOnDate", title: "Created On Date" },
//           { id: "Refurbishments", title: "Refurbishments/Renovations" },
//         ],
//       });

//       await csvWriterInstance.writeRecords(data);
//       console.log("Data successfully written to CSV file");
//     };

//     const getAllResults = async () => {
//       let allResults = [];
//       let page = 1;
//       let totalFetchedResults = 0;
//       const filePath = OUTPUT_FILEPATH;
//       const existingRecords = await readExistingCSV(filePath);
//       const existingIds = new Set(
//         existingRecords.map((record) => record.PropertyId)
//       );
//       const maxExistingId = existingRecords.reduce((maxId, record) => {
//         const id = parseInt(record.ID, 10);
//         return isNaN(id) ? maxId : Math.max(maxId, id);
//       }, 0);
//       let idCounter = maxExistingId + 1;
//       let newRecordsCount = 0;

//       console.log("Fetching data from API...");
//       console.log("existingIds count:", existingIds.size);

//       // Fetch the first page to get the total results count for the first request
//       const firstPageResponse = await fetchData(requestBody1, page);
//       const totalResults = firstPageResponse.ResultCount;
//       console.log(`Total results to fetch: ${totalResults}`);
//       firstPageResponse.SearchResults.forEach((result) => {
//         if (!existingIds.has(result.PropertyId.toString())) {
//           result.ID = idCounter++;
//           allResults.push(result);
//           newRecordsCount++;
//         }
//       });
//       totalFetchedResults += firstPageResponse.SearchResults.length;
//       console.log(`Fetched ${totalFetchedResults} records so far`);

//       // Fetch the remaining pages
//       while (totalFetchedResults < totalResults) {
//         page++;
//         const response = await fetchData(requestBody1, page);
//         response.SearchResults.forEach((result) => {
//           if (!existingIds.has(result.PropertyId.toString())) {
//             result.ID = idCounter++;
//             allResults.push(result);
//             newRecordsCount++;
//           }
//         });
//         totalFetchedResults += response.SearchResults.length;
//         console.log(`Fetched ${totalFetchedResults} records so far`);

//         if (response.SearchResults.length === 0) {
//           break;
//         }
//       }

//       // Fetch data for the second request
//       const refurbishmentsResults = [];
//       page = 1;
//       totalFetchedResults = 0;
//       const totalRefurbResults = await fetchData(requestBody2, page);

//       totalResultsRefurb = totalRefurbResults.ResultCount;

//       totalRefurbResults.SearchResults.forEach((result) => {
//         refurbishmentsResults.push(result.PropertyId);
//       });

//       totalFetchedResults += totalRefurbResults.SearchResults.length;
//       console.log(
//         `Fetched ${totalFetchedResults} refurbishment records so far`
//       );

//       while (totalFetchedResults < totalResultsRefurb) {
//         page++;
//         const response = await fetchData(requestBody2, page);
//         response.SearchResults.forEach((result) => {
//           refurbishmentsResults.push(result.PropertyId);
//         });
//         totalFetchedResults += response.SearchResults.length;
//         console.log(
//           `Fetched ${totalFetchedResults} refurbishment records so far`
//         );

//         if (response.SearchResults.length === 0) {
//           break;
//         }
//       }

//       // Mark refurbishments in the allResults array
//       allResults.forEach((result) => {
//         if (refurbishmentsResults.includes(result.PropertyId)) {
//           result.Refurbishments = "YES";
//         } else {
//           result.Refurbishments = "NO";
//         }
//       });

//       // Append new records to existing records
//       const combinedResults = existingRecords.concat(allResults);
//       await writeCSV(combinedResults, filePath);
//       console.log(`Number of new records added: ${newRecordsCount}`);
//     };

//     try {
//       await getAllResults();
//     } catch (error) {
//       console.error("Error fetching data from API:", error);
//       throw error;
//     }
//   });
// });

////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////

const supertest = require("supertest");
const axios = require("axios");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");
const csvParser = require("csv-parser");
const chai = require("chai");
const expect = chai.expect;
require("dotenv").config();

const ENDPOINT = process.env.ENDPOINT;
const API_KEY = process.env.API_KEY;
const OUTPUT_FILEPATH = process.env.OUTPUT_FILEPATH;

describe("API Test", function () {
  this.timeout(600000); // Increase timeout to 600 seconds (10 minutes)

  it("should fetch data from the API and save to CSV", async function () {
    const requestBody1 = {
      ApiKey: API_KEY,
      RequestTypeId: 2,
      RequestVerb: "POST",
      Endpoint: ENDPOINT,
      Page: 1,
      PageSize: 50,
      SortColumn: 2,
      SortDirection: 2,
      SearchRequest: {
        PropertyClassIds: [1],
        PropertyStatusIds: [2, 12],
        ChannelIds: [1],
        Polygons: [],
      },
    };

    const requestBody2 = {
      ApiKey: API_KEY,
      RequestTypeId: 2,
      RequestVerb: "POST",
      Endpoint: ENDPOINT,
      Page: 1,
      PageSize: 50,
      SortColumn: 2,
      SortDirection: 2,
      Url: "https://www.myhome.ie/residential/ireland/property-for-sale?query=Refurbishment+Renovation",
    };

    const fetchData = async (requestBody, page, retries = 3, delay = 1000) => {
      try {
        requestBody.Page = page;
        const response = await axios.post(requestBody.Endpoint, requestBody);
        expect(response.status).to.equal(200);
        return response.data;
      } catch (error) {
        if (retries > 0 && error.response && error.response.status === 504) {
          console.warn(`Retrying page ${page} after ${delay}ms...`);
          await new Promise((res) => setTimeout(res, delay));
          return fetchData(requestBody, page, retries - 1, delay * 2);
        } else {
          console.error(`Error fetching data for page ${page}:`, error);
          return { SearchResults: [], ResultCount: 0 };
        }
      }
    };

    const readExistingCSV = async (filePath) => {
      return new Promise((resolve, reject) => {
        const records = [];
        if (!fs.existsSync(filePath)) {
          resolve(records);
        } else {
          fs.createReadStream(filePath)
            .pipe(csvParser())
            .on("data", (data) => records.push(data))
            .on("end", () => resolve(records))
            .on("error", (error) => reject(error));
        }
      });
    };

    const appendNewRecordsToCSV = async (data, filePath) => {
      // Check if the file already exists
      const fileExists = fs.existsSync(filePath);

      // Create the CSV writer instance
      const csvWriterInstance = createObjectCsvWriter({
        path: filePath,
        header: [
          { id: "ID", title: "ID" },
          { id: "PropertyId", title: "PropertyId" },
          { id: "Address", title: "Address" },
          { id: "BerRating", title: "BER Rating" },
          { id: "GroupName", title: "GroupName" },
          { id: "SeoUrl", title: "SeoUrl" },
          { id: "BedsString", title: "No. of Bedrooms" },
          { id: "PriceAsString", title: "Price" },
          { id: "SizeStringMeters", title: "Property Size" },
          { id: "PropertyType", title: "Property Type" },
          { id: "BathString", title: "No. of Bathrooms" },
          { id: "CreatedOnDate", title: "Created On Date" },
          { id: "Refurbishments", title: "Refurbishments/Renovations" },
        ],
        append: fileExists, // Append if the file exists
      });

      // Only write the data if there are records to append
      if (data.length > 0) {
        await csvWriterInstance.writeRecords(data);
        console.log(
          `${data.length} new records successfully appended to CSV file`
        );
      } else {
        console.log("No new records to append.");
      }
    };

    const getAllResults = async () => {
      let allResults = [];
      let page = 1;
      let totalFetchedResults = 0;
      const filePath = OUTPUT_FILEPATH;
      const existingRecords = await readExistingCSV(filePath);
      const existingIds = new Set(
        existingRecords.map((record) => record.PropertyId)
      );
      const maxExistingId = existingRecords.reduce((maxId, record) => {
        const id = parseInt(record.ID, 10);
        return isNaN(id) ? maxId : Math.max(maxId, id);
      }, 0);
      let idCounter = maxExistingId + 1;
      let newRecordsCount = 0;

      console.log("Fetching data from API...");
      console.log("existingIds count:", existingIds.size);

      // Fetch the first page to get the total results count
      const firstPageResponse = await fetchData(requestBody1, page);
      const totalResults = firstPageResponse.ResultCount;
      console.log(`Total results to fetch: ${totalResults}`);
      firstPageResponse.SearchResults.forEach((result) => {
        if (!existingIds.has(result.PropertyId.toString())) {
          result.ID = idCounter++;
          allResults.push(result);
          newRecordsCount++;
        }
      });
      totalFetchedResults += firstPageResponse.SearchResults.length;
      console.log(`Fetched ${totalFetchedResults} records so far`);

      // Fetch the remaining pages
      while (totalFetchedResults < totalResults) {
        page++;
        const response = await fetchData(requestBody1, page);
        response.SearchResults.forEach((result) => {
          if (!existingIds.has(result.PropertyId.toString())) {
            result.ID = idCounter++;
            allResults.push(result);
            newRecordsCount++;
          }
        });
        totalFetchedResults += response.SearchResults.length;
        console.log(`Fetched ${totalFetchedResults} records so far`);

        if (response.SearchResults.length === 0) {
          break;
        }
      }

      // Fetch data for the second request (Refurbishment/Renovation)
      const refurbishmentsResults = [];
      page = 1;
      totalFetchedResults = 0;
      const totalRefurbResults = await fetchData(requestBody2, page);
      totalResultsRefurb = totalRefurbResults.ResultCount;

      totalRefurbResults.SearchResults.forEach((result) => {
        refurbishmentsResults.push(result.PropertyId);
      });

      totalFetchedResults += totalRefurbResults.SearchResults.length;
      console.log(
        `Fetched ${totalFetchedResults} refurbishment records so far`
      );

      while (totalFetchedResults < totalResultsRefurb) {
        page++;
        const response = await fetchData(requestBody2, page);
        response.SearchResults.forEach((result) => {
          refurbishmentsResults.push(result.PropertyId);
        });
        totalFetchedResults += response.SearchResults.length;
        console.log(
          `Fetched ${totalFetchedResults} refurbishment records so far`
        );

        if (response.SearchResults.length === 0) {
          break;
        }
      }

      // Mark refurbishments in the allResults array
      allResults.forEach((result) => {
        if (refurbishmentsResults.includes(result.PropertyId)) {
          result.Refurbishments = "YES";
        } else {
          result.Refurbishments = "NO";
        }
      });

      // Append new records to the existing CSV without rewriting the existing records
      await appendNewRecordsToCSV(allResults, filePath);
      console.log(`Number of new records added: ${newRecordsCount}`);
    };

    try {
      await getAllResults();
    } catch (error) {
      console.error("Error fetching data from API:", error);
      throw error;
    }
  });
});
