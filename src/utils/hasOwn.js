// Preserve own-property checks on Safari 15, including objects with a null
// prototype or a property named hasOwnProperty. Do not trust inherited values.
export function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
