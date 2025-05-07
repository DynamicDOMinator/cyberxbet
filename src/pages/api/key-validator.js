/**
 * Key validator diagnostic endpoint
 * This is used to verify key encryption/decryption is working properly
 */
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Key array for testing
  const keyArray = [
    29, 13, 55, 30, 32, 38, 56, 51, 43, 59, 28, 30, 37, 44, 56, 36, 40, 43, 39,
    57,
  ];

  // Encryption function from __sys_ctrl.js
  const encrypt = (arr, salt = 7) =>
    arr.map((n) => String.fromCharCode(n ^ salt)).join("");

  // Get the encrypted key
  const encryptedKey = encrypt(keyArray);

  // Check if a test key was provided
  const testKey = req.query.testKey || "";

  // Response data
  const responseData = {
    status: "success",
    keyArray: keyArray,
    encryptedKey: encryptedKey,
    testKey: testKey,
    testMatches: testKey === encryptedKey,
    rawKey: "cb209876540331298765",
    rawMatches: "cb209876540331298765" === encryptedKey,
  };

  // Check for JSONP callback
  const callback = req.query.callback;
  if (callback) {
    // Return JSONP response
    const jsonpResponse = `${callback}(${JSON.stringify(responseData)})`;
    res.setHeader("Content-Type", "text/javascript");
    return res.status(200).send(jsonpResponse);
  }

  // Return normal JSON response
  return res.status(200).json(responseData);
}
