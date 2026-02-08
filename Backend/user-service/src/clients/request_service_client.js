const axios = require("axios");

const REQUEST_SERVICE_URL = process.env.REQUEST_SERVICE_URL || "http://localhost:3010";

async function fetchStaffPerformance(authToken) {
  try {
    const res = await axios.get(
      `${REQUEST_SERVICE_URL}/analytics/staff/performance`,
      {
        headers: {
          Authorization: authToken,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error(
      "Failed to fetch staff performance:",
      err.response?.data || err.message
    );
    return null;
  }
}

module.exports = {
  fetchStaffPerformance,
};