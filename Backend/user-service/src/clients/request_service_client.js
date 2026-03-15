const axios = require("axios");

const REQUEST_SERVICE_URL =
  process.env.REQUEST_SERVICE_URL || "http://localhost:3010";

async function fetchStaffPerformance(authToken) {
  try {
    const res = await axios.get(
      `${REQUEST_SERVICE_URL}/analytics/staff/performance`,
      {
        headers: {
          Authorization: authToken,
        },
      },
    );

    return res.data;
  } catch (err) {
    console.error(
      "Failed to fetch staff performance:",
      err.response?.data || err.message,
    );
    return null;
  }
}

// ✅ Create a request via the request service
async function createRequest(authToken, requestData) {
  try {
    const res = await axios.post(
      `${REQUEST_SERVICE_URL}/requests`,
      requestData,
      {
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(`✅ Request created: ${res.data.request?.id}`);
    return res.data;
  } catch (err) {
    console.error(
      "Failed to create request:",
      err.response?.data || err.message,
    );
    throw err;
  }
}

module.exports = {
  fetchStaffPerformance,
  createRequest,
};
