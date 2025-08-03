const pendingRequests = new Map();

function addPendingRequest(correlationId, resolve, reject) {
  const timeout = setTimeout(() => {
    pendingRequests.delete(correlationId);
    reject(new Error("Timeout: Yanıt alınamadı."));
  }, 5000); // 5 saniye timeout

  pendingRequests.set(correlationId, { resolve, reject, timeout });
}

function resolvePendingRequest(correlationId, data) {
  const request = pendingRequests.get(correlationId);
  if (request) {
    clearTimeout(request.timeout);
    request.resolve(data);
    pendingRequests.delete(correlationId);
  }
}

module.exports = {
  addPendingRequest,
  resolvePendingRequest,
};