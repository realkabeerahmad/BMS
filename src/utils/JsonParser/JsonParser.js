// jsonParser.js
class JSONParser {
  constructor(schema) {
    this.schema = schema;
  }

  // Method to validate and parse the data
  parse(data) {
    try {
      const parsedData = this._parseObject(this.schema, data);
      return { valid: true, data: parsedData };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Recursive method to parse and validate an object
  _parseObject(schema, data) {
    const parsedObject = {};

    for (const key in schema) {
      if (schema.hasOwnProperty(key)) {
        const fieldSchema = schema[key];
        const value = data[key];

        if (fieldSchema.required && (value === undefined || value === null)) {
          throw new Error(`Missing required field: ${key}`);
        }

        if (value !== undefined && value !== null) {
          if (fieldSchema.type === "object") {
            parsedObject[key] = this._parseObject(
              fieldSchema.properties,
              value
            );
          } else if (fieldSchema.type === "array") {
            parsedObject[key] = this._parseArray(fieldSchema.items, value);
          } else {
            parsedObject[key] = this._validateType(
              value,
              fieldSchema.type,
              key
            );
          }
        }
      }
    }

    return parsedObject;
  }

  // Method to parse and validate an array
  _parseArray(itemSchema, data) {
    if (!Array.isArray(data)) {
      throw new Error(`Expected an array, but got ${typeof data}`);
    }

    return data.map((item) => {
      if (itemSchema.type === "object") {
        return this._parseObject(itemSchema.properties, item);
      }
      return this._validateType(item, itemSchema.type);
    });
  }

  // Method to validate the type of a value
  _validateType(value, type, key) {
    switch (type) {
      case "string":
        if (typeof value !== "string") {
          throw new Error(
            `Expected ${key} to be a string, but got ${typeof value}`
          );
        }
        return value;
      case "number":
        if (typeof value !== "number") {
          throw new Error(
            `Expected ${key} to be a number, but got ${typeof value}`
          );
        }
        return value;
      case "boolean":
        if (typeof value !== "boolean") {
          throw new Error(
            `Expected ${key} to be a boolean, but got ${typeof value}`
          );
        }
        return value;
      case "object":
        if (typeof value !== "object" || Array.isArray(value)) {
          throw new Error(
            `Expected ${key} to be an object, but got ${typeof value}`
          );
        }
        return value;
      default:
        throw new Error(`Unsupported type: ${type}`);
    }
  }
}

module.exports = JSONParser;
