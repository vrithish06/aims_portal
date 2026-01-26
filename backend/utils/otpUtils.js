/**
 * Generate a random 6-digit OTP
 * @returns {string} Random 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Calculate OTP expiry time (10 minutes from now)
 * @returns {string} Expiry timestamp as ISO string
 */
export const getOTPExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10);
  return expiryTime.toISOString();
};

/**
 * Check if OTP is still valid
 * @param {string|Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} True if OTP is still valid
 */
export const isOTPValid = (expiresAt) => {
  if (!expiresAt) return false;

  let expiryDate;
  // Handle string from DB which might lack 'Z' because column is timestamp without time zone
  if (typeof expiresAt === 'string') {
    // DB returns timestamp like "2023-10-27T10:00:00.123" (No Z)
    // If we do new Date("..."), it treats it as Local Time (IST)
    // We MUST treat it as UTC.
    let timeString = expiresAt;
    if (!timeString.endsWith('Z') && !timeString.includes('+')) {
      timeString += 'Z';
    }
    expiryDate = new Date(timeString);
  } else {
    // If it's already a date object, we compare directly (assuming correct instantiation)
    // But honestly, for safety with this specific DB column issue, strings are better.
    expiryDate = new Date(expiresAt);
  }

  // Use simple comparison of timestamps
  return new Date() < expiryDate;
};
