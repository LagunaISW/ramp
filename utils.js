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

function extractProperties(modelName, schema) {
  const modelRegex = new RegExp(`model ${modelName} {([\\s\\S]*?)}`, 'g');
  const modelContent = modelRegex.exec(schema);
  if (!modelContent) return [];

  const properties = modelContent[1]
    .trim()
    .split('\n')
    .map((line) => {
      const [property, type, ...rest] = line.trim().split(/\s+/);
      return { property, type };
    })
    .filter(
      (property) =>
        !['createdAt', 'updatedAt', 'id', ''].includes(property.property)
    );

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
  errorMessage
) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
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
  const inputType = property.type;
  const { inputType: defaultInputType, defaultValue } =
    propertyConfigurations[inputType] || {};

  if (!defaultInputType) return { name: 'deleteThisProperty' };

  return {
    name: property.property,
    inputType: defaultInputType || 'text',
    defaultValue: defaultValue || 'null',
  };
};

export const getFormValues = (properties) => {
  return properties
    .map(getPropertyConfigurations)
    .filter((property) => property.name !== 'deleteThisProperty');
};
