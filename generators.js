import promises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import { createFileIfNotExists, getFormValues } from './utils.js';

// Registra el helper 'capitalize'
Handlebars.registerHelper('capitalize', (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

function pascalToCamel(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Registra el helper 'camelCase'
Handlebars.registerHelper('camelCase', (str) => {
  const pascalText = str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map((word) => pascalToCamel(word))
    .join('');
  return pascalText.charAt(0).toLowerCase() + pascalText.slice(1);
});

Handlebars.registerHelper('lowercaseWithId', function (str) {
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
  addFilter = false,
  filterProperty = null
) {
  const templates = await loadAndCompileTemplates();
  await createIndexFile(modelName, templates.indexTsxTemplateCompiled);
  await createCreateFile(
    modelName,
    properties,
    templates.createTsxTemplateCompiled
  );
  await createModelServerFile(
    modelName,
    properties,
    addFilter,
    filterProperty,
    templates.modelServerTemplateCompiled
  );
}

async function createIndexFile(modelName, indexTsxTemplateCompiled) {
  const indexTsxContent = indexTsxTemplateCompiled({ modelName });
  const filePath = `./app/routes/dashboard.${modelName}._index.tsx`;

  await createFileIfNotExists(
    filePath,
    indexTsxContent,
    `Archivo index.tsx creado para el modelo dashboard.${modelName}.`,
    `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`
  );
}

async function createCreateFile(
  modelName,
  properties,
  createTsxTemplateCompiled
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
    `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`
  );
}

async function createModelServerFile(
  modelName,
  properties,
  addFilter,
  filterProperty,
  modelServerTemplateCompiled
) {
  const enhancedProperties = properties.map((property) => {
    const defaultValue = property.type === 'String' ? "''" : 'null';
    const inputType = property.type === 'DateTime' ? 'datetime-local' : 'text';
    return { name: property.property, defaultValue, inputType };
  });

  const modelServerContent = modelServerTemplateCompiled({
    modelName,
    properties: enhancedProperties,
    addFilter,
    filterProperty,
  });
  const filePath = `./app/models/dashboard/${modelName}.server.ts`;

  await createFileIfNotExists(
    filePath,
    modelServerContent,
    `Archivo ${modelName}.server.ts creado para el modelo ${modelName}.`,
    `El archivo ya existe para el modelo ${modelName}.server No se sobrescribirá.`
  );
}
