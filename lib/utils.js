/**
 * Format bytes to human-readable string
 * @param {string|number} bytes - Bytes value
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0 || bytes === "0") return "0 Bytes";

  const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"];
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(1024));
  return (
    parseFloat((Number(bytes) / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i]
  );
}
