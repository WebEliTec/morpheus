import fs from 'fs';
import fse from 'fs-extra';
import SingleNodeCompiler from '../morpheus/core/resourceCompiler/singleNodeCompiler.js';
import appConfig from '../morphSrc/app.config.js';
import chalk from 'chalk';


class MorphSrcBuildDirectoryBuilder {

  constructor() {
      this.appConfig = appConfig;
      this.nodeIds   = Object.keys(appConfig.nodeRegistry);
  }

  build() {
      //this.setDirectory();
      this.createResourceFiles();
  }

  setDirectory() {

      try {
        if (fse.existsSync('morphBuildSrc')) {
          fse.removeSync('morphBuildSrc');
        }
      } catch (error) {
        console.error('Failed to delete former directory "morphBuildSrc":', error.message);
        process.exit(1);
      }
      
      try {
        fse.copySync('morphSrc', 'morphBuildSrc');
      } catch (error) {
        console.error('Failed to create duplicate of directory "morphSrc":', error.message);
        process.exit(1);
      }

  }

  createResourceFiles() {

    for (const nodeId of this.nodeIds) {
        try {
            console.log( `Processing ${nodeId}...` );
            this.createSingleResourceFiles( nodeId );
        } catch(e) {
            console.log(`Falied to compile resource file of node '${nodeId}'`);
        }
    }

  }

  async createSingleResourceFiles( nodeId ) {

    const nodeItem          = this.appConfig.nodeRegistry[nodeId]; 
    const isSingleFile      = nodeItem?.isFile;
    const compiler          = new SingleNodeCompiler({ inheritanceLevel: 'echo',  nodeId,  nodeItem,  executionContext: 'app', contextConfig: appConfig,  environment: 'server' });
    const nodeResources     = await compiler.loadNodeResources();
    const configDirSubPath  = nodeResources.configDirSubPath;
    const configDirPath     = `morphSrc/${configDirSubPath}`;
    const fileName          = `${nodeId}.config.jsx`;
    const filePath          = `${configDirPath}/${fileName}`;
    const configFileExists  = fs.existsSync(filePath);

    if( !configFileExists ) {
      console.warn( `Configuration file '${fileName }' of node '${nodeId}' not found in '${filePath }'` );
      return null;
    }

    const sourceCode        = this.extractSourceCode( filePath );
    const configFileImports = this.extractImportStatements( sourceCode );
    const componentExports  = this.extractComponentExports( sourceCode, isSingleFile );
    const moduleRegistry    = nodeResources?.moduleRegistry;

    const imports           = [...configFileImports]; 

    this.processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath );

  }

  extractSourceCode( filePath ) {
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    return sourceCode;
  }

  extractImportStatements( sourceCode ) {

    const importRegex      = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
    const importStatements = sourceCode.match(importRegex) || [];
    const confirmedImports = importStatements.filter( statement => statement.startsWith('import ') );
    return confirmedImports;

  }

  extractComponentExports( sourceCode, isSingleFile ) {

    if( isSingleFile ) {
      return []
    }

    const exportRegex      = /export\s+function\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const componentExports = sourceCode.match(exportRegex) || [];
    return componentExports;
  
  }

  processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath )  {

    if( !moduleRegistry ) {
      return null;
    }

    const moduleIdentifiers = {};

    Object.entries( moduleRegistry ).forEach( ( [ moduleId, moduleRegistryItem ] ) => {

      const isShared               = moduleRegistryItem?.isShared;
      const internalModulePath     = moduleRegistryItem.internalPath;


      moduleIdentifiers[moduleId]  = moduleId;
      moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;
      const importPath             = `@morphBuildSrc/${configDirSubPath}/${internalModulePath}`;

      console.log( chalk.red( importPath ) );

      /*
      console.log(chalk.blue(configDirSubPath));
      console.log(chalk.blue(internalModulePath));*/


    });

  }


}

const morphsSrcBuildDirectoryBuilder = new MorphSrcBuildDirectoryBuilder();

morphsSrcBuildDirectoryBuilder.build();