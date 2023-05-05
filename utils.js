import fs from 'fs';

export function readPrismaSchema() {
  return new Promise((resolve, reject) => {
    fs.readFile('prisma/schema.prisma', 'utf8', (err, data) => {
      if (err) {
        reject(`Error al leer el archivo: ${err}`);
      } else {
        resolve(data);
      }
    });
  });
}

// Funciones para extraer modelos y propiedades
function extractModels(schema) {
  const models = schema
    .split('\n')
    .filter((line) => line.startsWith('model'))
    .map((line) => line.split(' ')[1]);

  return models;
}

function extractProperty(property) {
  const [name, type, ...rest] = property.trim().split(/\s+/);
  const result = {
    name,
    type,
    optional: false,
    relation: false,
    defaultValue: null,
    generated: false,
  };
  // If type contains a '?' or has a default value, it's an optional property
  if (type.includes('?') || rest.some((word) => word.includes('@default'))) {
    result.type = type.replace('?', '');
    result.optional = true;
  }
  // If a element of 'rest' array contains '@relation', it's a relation property
  const relationIndex = rest.findIndex((word) => word.includes('@relation'));
  if (relationIndex !== -1) {
    result.relation = true;
    const relationString = rest[relationIndex + 1];
    // Get the value from relationString ex: [PostToUser]
    const value = relationString.match(/\[(.*)\]/)[1];
    result.relationName = value;
  }

  // Get default value
  const defaultIndex = rest.findIndex((word) => word.includes('@default'));
  if (defaultIndex !== -1) {
    const defaultString = rest[defaultIndex];
    // Get the value from defaultString ex: @default("value") or @default(2) or @default(dbgenerated())
    const value = defaultString.match(/@default\((.*)\)/)[1];

    if (value.includes('(') && value.includes(')')) {
      result.generated = true;
    }

    result.defaultValue = value;
  }

  if (name.includes('Id')) {
    result.relationalId = true;
    result.generated = true;
  }

  if (name.includes('createdAt') || name.includes('updatedAt')) {
    result.generated = true;
  }

  if (type.includes('[]')) {
    result.generated = true;
    result.type = type.replace('[]', '');
  }

  return result;
}

function extractProperties(modelName, schema) {
  const modelRegex = new RegExp(`model ${modelName} {([\\s\\S]*?)}`, 'g');
  const modelContent = modelRegex.exec(schema);
  if (!modelContent) return [];

  const properties = modelContent[1]
    .trim()
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      return extractProperty(line);
    })
    .filter((property) => !property.generated);
  return properties;
}

export function extractModelsWithProperties(schema) {
  const models = extractModels(schema);
  const modelsWithProperties = {};

  for (const model of models) {
    modelsWithProperties[model] = extractProperties(model, schema);
  }

  return modelsWithProperties;
}

export function createFileIfNotExists(
  filePath,
  content,
  successMessage,
  errorMessage,
  force = false
) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath) || force) {
      fs.writeFileSync(filePath, content);
      console.log(successMessage);
      resolve();
    } else {
      console.log(errorMessage);
      resolve();
    }
  });
}

const propertyConfigurations = {
  String: { inputType: 'text', defaultValue: '""' },
  Number: { inputType: 'number', defaultValue: '0' },
  Float: { inputType: 'number', defaultValue: '0' },
  Decimal: { inputType: 'number', defaultValue: '0' },
  Int: { inputType: 'number', defaultValue: '0' },
  Boolean: { inputType: 'text', defaultValue: 'false' },
  DateTime: { inputType: 'datetime-local', defaultValue: 'null' },
  Date: { inputType: 'date', defaultValue: 'null' },
  Time: { inputType: 'time', defaultValue: 'null' },
};

const getPropertyConfigurations = (property) => {
  const { inputType, defaultValue } =
    propertyConfigurations[property.type] || {};

  return {
    name: property.name,
    inputType: inputType || 'text',
    defaultValue: defaultValue || 'null',
    optional: property.optional,
    relation: property.relation,
    relationName: property.relationName,
  };
};

export const getFormValues = (properties) => {
  const result = properties.map(getPropertyConfigurations);
  console.log(result);
  return result;
};
