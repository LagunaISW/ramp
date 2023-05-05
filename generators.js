import promises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { createFileIfNotExists, getFormValues } from './utils.js';

// Registra el helper 'capitalize'
Handlebars.registerHelper('capitalize', (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function pascalToCamel(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Registra el helper 'camelCase'
Handlebars.registerHelper('camelCase', (str) => {
  if (!str) return str;
  const pascalText = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map((word) => pascalToCamel(word))
    .join('');
  return pascalText.charAt(0).toLowerCase() + pascalText.slice(1);
});

Handlebars.registerHelper('lowercaseWithId', function (str) {
  if (!str) return str;
  const words = str.split(' ');
  const newWords = words.map((word) => {
    if (/^[A-Z]/.test(word)) {
      return word.toLowerCase() + 'Id';
    } else {
      return word;
    }
  });
  return newWords.join(' ');
});

// Registra el helper 'pluralize' para pluralizar la terminación de una palabra en ingles
Handlebars.registerHelper('pluralize', function (str) {
  if (!str) return str;
  const lastLetter = str.charAt(str.length - 1);
  if (lastLetter === 'y') {
    return str.slice(0, str.length - 1) + 'ies';
  } else {
    return str + 's';
  }
});

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const templateDir = path.join(currentDir, 'templates');
const dashboardTemplatePath = path.join(templateDir, 'dashboard.tsx.hbs');
const dashboardTemplateIndexPath = path.join(
  templateDir,
  'dashboard._index.tsx.hbs'
);
const indexTemplatePath = path.join(templateDir, 'models/index.tsx.hbs');
const createTemplatePath = path.join(templateDir, 'models/create.tsx.hbs');
const modelServerTemplatePath = path.join(
  templateDir,
  'server/model.server.ts.hbs'
);

export async function loadAndCompileTemplates() {
  const [
    dashboardTemplateContent,
    dashboardTemplateContentPath,
    indexTemplateContent,
    createTemplateContent,
    modelServerTemplateContent,
  ] = await Promise.all([
    promises.readFile(dashboardTemplatePath, 'utf-8'),
    promises.readFile(dashboardTemplateIndexPath, 'utf-8'),
    promises.readFile(indexTemplatePath, 'utf-8'),
    promises.readFile(createTemplatePath, 'utf-8'),
    promises.readFile(modelServerTemplatePath, 'utf-8'),
  ]);

  return {
    dashboardTsxTemplateCompiled: Handlebars.compile(dashboardTemplateContent),
    dashboardTemplateContentPathTemplateCompiled: Handlebars.compile(
      dashboardTemplateContentPath
    ),
    indexTsxTemplateCompiled: Handlebars.compile(indexTemplateContent),
    createTsxTemplateCompiled: Handlebars.compile(createTemplateContent),
    modelServerTemplateCompiled: Handlebars.compile(modelServerTemplateContent),
  };
}

export async function generateFilesForModel(
  modelName,
  properties,
  force = false,
  addFilter = false,
  filterProperty = null
) {
  const templates = await loadAndCompileTemplates();
  await createIndexFile(
    modelName,
    properties,
    addFilter,
    templates.indexTsxTemplateCompiled,
    force
  );
  await createCreateFile(
    modelName,
    properties,
    templates.createTsxTemplateCompiled,
    force
  );
  await createModelServerFile(
    modelName,
    properties,
    addFilter,
    filterProperty,
    templates.modelServerTemplateCompiled,
    force
  );
}

async function createIndexFile(
  modelName,
  properties,
  addFilter,
  indexTsxTemplateCompiled,
  force
) {
  const indexTsxContent = indexTsxTemplateCompiled({
    modelName,
    properties: getFormValues(properties),
    addFilter,
  });
  const filePath = `./app/routes/dashboard.${modelName}._index.tsx`;

  await createFileIfNotExists(
    filePath,
    indexTsxContent,
    `Archivo index.tsx creado para el modelo dashboard.${modelName}.`,
    `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`,
    force
  );
}

async function createCreateFile(
  modelName,
  properties,
  createTsxTemplateCompiled,
  force
) {
  const createTsxContent = createTsxTemplateCompiled({
    modelName,
    properties: getFormValues(properties),
  });
  const filePath = `./app/routes/dashboard.${modelName}.create.tsx`;

  await createFileIfNotExists(
    filePath,
    createTsxContent,
    `Archivo create.tsx creado para el modelo dashboard.${modelName}.`,
    `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`,
    force
  );
}

async function createModelServerFile(
  modelName,
  properties,
  addFilter,
  filterProperty,
  modelServerTemplateCompiled,
  force
) {
  const filteredProperties = properties.filter((property) => {
    const { type } = property;

    const validTypes = [
      'String',
      'Date',
      'Int',
      'Boolean',
      'Number',
      'Float',
      'Decimal',
      'DateTime',
      'Date',
      'Time',
    ];

    return validTypes.includes(type) || property.relation;
  });

  const modelServerContent = modelServerTemplateCompiled({
    modelName,
    properties: filteredProperties,
    addFilter,
    filterProperty,
  });
  const filePath = `./app/models/dashboard/${modelName}.server.ts`;

  await createFileIfNotExists(
    filePath,
    modelServerContent,
    `Archivo ${modelName}.server.ts creado para el modelo ${modelName}.`,
    `El archivo ya existe para el modelo ${modelName}.server No se sobrescribirá.`,
    force
  );
}
