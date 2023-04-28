#!/usr/bin/env node
import inquirer from 'inquirer';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createRAMP } from './commands/createRAMP.js';
import { generateModelFiles } from './commands/generateModelFiles.js';

yargs(hideBin(process.argv))
  .command(
    'create',
    'Crea las rutas base para el remix admin panel',
    {
      force: {
        alias: 'f',
        description: 'Sobrescribe los archivos existentes',
        type: 'boolean',
        default: false,
      },
    },
    createRAMP
  )
  .help()
  .parse();

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Genera archivos para un modelo seleccionado',
    {
      force: {
        alias: 'f',
        description: 'Sobrescribe los archivos existentes',
        type: 'boolean',
        default: false,
      },
    },
    generateModelFiles
  )
  .demandCommand(1, 'Debe especificar un comando para ejecutar')
  .help()
  .parse();
