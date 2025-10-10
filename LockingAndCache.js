// Locking and cache utilities for concurrency and performance

function withLock(key, fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function cacheGet(key) {
  var cache = CacheService.getScriptCache();
  var value = cache.get(key);
  return value ? JSON.parse(value) : null;
}

function cacheSet(key, value, ttlSeconds) {
  var cache = CacheService.getScriptCache();
  cache.put(key, JSON.stringify(value), ttlSeconds || 60);
}
