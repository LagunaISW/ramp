#!/usr/bin/env node
import fs from 'fs';
import promises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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

function extractModelsWithProperties(schema) {
  const models = extractModels(schema);
  const modelsWithProperties = {};

  for (const model of models) {
    modelsWithProperties[model] = extractProperties(model, schema);
  }

  return modelsWithProperties;
}

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

async function loadAndCompileTemplates() {
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

function generateFilesForModel(
  modelName,
  properties,
  indexTsxTemplateCompiled,
  createTsxTemplateCompiled,
  modelServerTemplateCompiled,
  modelsWithProperties,
  addFilter = false,
  filterProperty = null
) {
  const indexTsxContent = indexTsxTemplateCompiled({ modelName });
  if (!fs.existsSync(`./app/routes/dashboard.${modelName}._index.tsx`)) {
    fs.writeFileSync(
      `./app/routes/dashboard.${modelName}._index.tsx`,
      indexTsxContent
    );
    console.log(
      `Archivo index.tsx creado para el modelo dashboard.${modelName}.`
    );
  } else {
    console.log(
      `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`
    );
  }

  const enhancedProperties = properties.map((property) => {
    const defaultValue = property.type === 'String' ? "''" : 'null';
    const inputType = property.type === 'DateTime' ? 'datetime-local' : 'text';
    return { name: property.property, defaultValue, inputType };
  });

  const createTsxContent = createTsxTemplateCompiled({
    modelName,
    properties: enhancedProperties,
  });

  if (!fs.existsSync(`./app/routes/dashboard.${modelName}.create.tsx`)) {
    fs.writeFileSync(
      `./app/routes/dashboard.${modelName}.create.tsx`,
      createTsxContent
    );
    console.log(
      `Archivo create.tsx creado para el modelo dashboard.${modelName}.`
    );
  } else {
    console.log(
      `El archivo ya existe para el modelo dashboard.${modelName}. No se sobrescribirá.`
    );
  }

  // Crear la carpeta ./app/models/dashboard si no existe
  if (!fs.existsSync('./app/models/dashboard')) {
    fs.mkdirSync('./app/models/dashboard');
  }

  const modelServerContent = modelServerTemplateCompiled({
    modelName,
    properties: enhancedProperties,
    addFilter,
    filterProperty,
  });

  if (!fs.existsSync(`./app/models/dashboard/${modelName}.server.ts`)) {
    fs.writeFileSync(
      `./app/models/dashboard/${modelName}.server.ts`,
      modelServerContent
    );
    console.log(
      `Archivo ${modelName}.server.ts creado para el modelo ${modelName}.`
    );
  } else {
    console.log(
      `El archivo ya existe para el modelo ${modelName}.server No se sobrescribirá.`
    );
  }
}

yargs(hideBin(process.argv))
  .command(
    'create',
    'Crea las rutas base para el remix admin panel',
    {},
    async () => {
      fs.readFile('prisma/schema.prisma', 'utf8', async (err, data) => {
        if (err) {
          console.error(`Error al leer el archivo: ${err}`);
          return;
        }

        const prismaSchema = data;
        const modelsWithProperties = extractModelsWithProperties(prismaSchema);

        const modelNames = Object.keys(modelsWithProperties).filter(
          (modelName) => modelName !== 'Password'
        );

        const {
          dashboardTsxTemplateCompiled,
          dashboardTemplateContentPathTemplateCompiled,
        } = await loadAndCompileTemplates();

        if (!fs.existsSync(`./app/routes/dashboard.tsx`)) {
          fs.writeFileSync(
            `./app/routes/dashboard.tsx`,
            dashboardTsxTemplateCompiled({ modelNames })
          );
          console.log(`Archivo dashboard.tsx creado`);
        } else {
          console.log(`El archivo ya existe. No se sobrescribirá.`);
        }

        if (!fs.existsSync(`./app/routes/dashboard._index.tsx`)) {
          fs.writeFileSync(
            `./app/routes/dashboard._index.tsx`,
            dashboardTemplateContentPathTemplateCompiled({})
          );
          console.log(`Archivo dashboard._index.tsx creado`);
        } else {
          console.log(`El archivo ya existe. No se sobrescribirá.`);
        }
      });
    }
  )
  .help()
  .parse();

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Genera archivos para un modelo seleccionado',
    {},
    async () => {
      fs.readFile('prisma/schema.prisma', 'utf8', async (err, data) => {
        if (err) {
          console.error(`Error al leer el archivo: ${err}`);
          return;
        }

        const prismaSchema = data;
        const modelsWithProperties = extractModelsWithProperties(prismaSchema);

        const modelNames = Object.keys(modelsWithProperties).filter(
          (modelName) => modelName !== 'Password'
        );

        const { selectedModel } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedModel',
            message: 'Seleccione un modelo para generar los archivos:',
            choices: modelNames,
          },
        ]);

        const { addFilter } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addFilter',
            message: '¿Desea agregar un filtro?',
            default: false,
          },
        ]);

        console.log({ addFilter });

        // Si el usuario quiere agregar un filtro, se le pregunta por la propiedad a filtrar
        if (addFilter) {
          const { filterProperty } = await inquirer.prompt([
            {
              type: 'list',
              name: 'filterProperty',
              message: 'Seleccione una propiedad para filtrar:',
              choices: modelsWithProperties[selectedModel].map(
                (property) => property.property
              ),
            },
          ]);

          const {
            indexTsxTemplateCompiled,
            createTsxTemplateCompiled,
            modelServerTemplateCompiled,
          } = await loadAndCompileTemplates();

          generateFilesForModel(
            selectedModel,
            modelsWithProperties[selectedModel],
            indexTsxTemplateCompiled,
            createTsxTemplateCompiled,
            modelServerTemplateCompiled,
            modelsWithProperties,
            addFilter,
            filterProperty
          );
        } else {
          const {
            indexTsxTemplateCompiled,
            createTsxTemplateCompiled,
            modelServerTemplateCompiled,
          } = await loadAndCompileTemplates();

          generateFilesForModel(
            selectedModel,
            modelsWithProperties[selectedModel],
            indexTsxTemplateCompiled,
            createTsxTemplateCompiled,
            modelServerTemplateCompiled,
            modelsWithProperties
          );
        }
      });
    }
  )
  .demandCommand(1, 'Debe especificar un comando para ejecutar')
  .help()
  .parse();
