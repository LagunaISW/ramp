import inquirer from 'inquirer';

export async function promptForModel(modelNames) {
  const { selectedModel } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedModel',
      message: 'Seleccione un modelo para generar los archivos:',
      choices: modelNames,
    },
  ]);
  return selectedModel;
}

export async function promptForFilter() {
  const { addFilter } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addFilter',
      message: '¿Desea agregar un filtro?',
      default: false,
    },
  ]);
  return addFilter;
}

export async function promptForFilterProperty(properties) {
  const { filterProperty } = await inquirer.prompt([
    {
      type: 'list',
      name: 'filterProperty',
      message: 'Seleccione una propiedad para filtrar:',
      choices: properties.map((property) => property.property),
    },
  ]);
  return filterProperty;
}
