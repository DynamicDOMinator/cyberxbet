/**
 * Simple health check endpoint
 * This is used to verify the server is running and responding
 */
export default function handler(req, res) {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
}
