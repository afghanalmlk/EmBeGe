// src/utils/responseHelper.js

/**
 * Helper untuk standardisasi format response API.
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (misal: 200, 201, 400, 500)
 * @param {string} message - Pesan respons
 * @param {any} data - Data payload (opsional)
 */
const sendResponse = (res, statusCode, message, data = null) => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    
    const response = {
      status: isSuccess ? 'success' : 'error',
      message,
    };
  
    // Hanya tambahkan key 'data' jika data tersedia
    if (data) {
      response.data = data;
    }
  
    return res.status(statusCode).json(response);
  };
  
  module.exports = { sendResponse };