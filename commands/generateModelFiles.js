import { extractModelsWithProperties, readPrismaSchema } from '../utils.js';
import {
  promptForFilter,
  promptForFilterProperty,
  promptForModel,
} from '../prompts.js';
import { generateFilesForModel } from '../generators.js';

export async function generateModelFiles(argv) {
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
      argv.force,
      addFilter,
      filterProperty
    );
  } else {
    await generateFilesForModel(
      selectedModel,
      modelsWithProperties[selectedModel],
      argv.force
    );
  }
}
