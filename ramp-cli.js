#!/usr/bin/env node
import fs from 'fs';
import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  extractModelsWithProperties,
  loadAndCompileTemplates,
  generateFilesForModel,
  readPrismaSchema,
  createFileIfNotExists,
} from './utils.js';
import {
  promptForFilter,
  promptForFilterProperty,
  promptForModel,
} from './prompts.js';

async function createRAMP() {
  const prismaSchema = await readPrismaSchema();
  const modelsWithProperties = extractModelsWithProperties(prismaSchema);

  const modelNames = Object.keys(modelsWithProperties).filter(
    (modelName) => modelName !== 'Password'
  );

  const {
    dashboardTsxTemplateCompiled,
    dashboardTemplateContentPathTemplateCompiled,
  } = await loadAndCompileTemplates();

  await createFileIfNotExists(
    `./app/routes/dashboard.tsx`,
    dashboardTsxTemplateCompiled({ modelNames }),
    'Archivo dashboard.tsx creado',
    'El archivo ya existe. No se sobrescribirá.'
  );

  await createFileIfNotExists(
    `./app/routes/dashboard._index.tsx`,
    dashboardTemplateContentPathTemplateCompiled({}),
    'Archivo dashboard._index.tsx creado',
    'El archivo ya existe. No se sobrescribirá.'
  );
}

yargs(hideBin(process.argv))
  .command(
    'create',
    'Crea las rutas base para el remix admin panel',
    {},
    createRAMP
  )
  .help()
  .parse();

async function generateModelFiles() {
  const prismaSchema = await readPrismaSchema();
  const modelsWithProperties = extractModelsWithProperties(prismaSchema);

  const modelNames = Object.keys(modelsWithProperties).filter(
    (modelName) => modelName !== 'Password'
  );

  const selectedModel = await promptForModel(modelNames);
  const addFilter = await promptForFilter();

  if (addFilter) {
    const filterProperty = await promptForFilterProperty(
      modelsWithProperties[selectedModel]
    );
    await generateFilesForModel(
      selectedModel,
      modelsWithProperties[selectedModel],
      addFilter,
      filterProperty
    );
  } else {
    await generateFilesForModel(
      selectedModel,
      modelsWithProperties[selectedModel]
    );
  }
}

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Genera archivos para un modelo seleccionado',
    {},
    generateModelFiles
  )
  .demandCommand(1, 'Debe especificar un comando para ejecutar')
  .help()
  .parse();
