/**
 * Get the first item that pass the test
 * by second argument function
 *
 * @param {Array} list
 * @param {Function} f
 * @return {*}
 */
export function find(list, f) {
  return list.filter(f)[0]
}

/**
 * Deep copy the given object considering circular structure.
 * This function caches all nested objects and its copies.
 * If it detects circular structure, use cached copy to avoid infinite loop.
 *
 * @param {*} obj
 * @param {Array<Object>} cache
 * @return {*}
 */
export function deepCopy(obj, readonly: boolean, cache: any[]) {
  if (!readonly) readonly = false
  if (!cache) cache = []
  // just return if obj is immutable value
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (obj.constructor.name === "Date") {
    return new Date(obj.getTime())
  }

  // if obj is hit, it is in circular structure
  const hit = find(cache, c => c.original === obj)
  if (hit) {
    return hit.copy
  }

  const copy = Array.isArray(obj) ? [] : {}
  // put the copy into cache at first
  // because we want to refer it in recursive deepCopy
  cache.push({
    original: obj,
    copy
  })

  Object.keys(obj).forEach(key => {
    if (readonly) Object.defineProperty(copy, key, { get: () => deepCopy(obj[key], readonly, cache), enumerable: true })
    else copy[key] = deepCopy(obj[key], readonly, cache)
  })

  return copy
}