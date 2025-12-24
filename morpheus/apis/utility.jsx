export default class Utility {
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  toSnakeCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
  }

  toSeparatedLowerCase(str, separator = '-') {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1$2').replace(/[\s_-]+/g, separator).toLowerCase();
  }
}
