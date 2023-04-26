import {
  extractModelsWithProperties,
  readPrismaSchema,
  createFileIfNotExists,
} from '../utils.js';
import { loadAndCompileTemplates } from '../generators.js';

export async function createRAMP() {
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
