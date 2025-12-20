import fs from 'fs';
import fse from 'fs-extra';
import SingleNodeCompiler from '../morpheus/core/resourceCompiler/singleNodeCompiler.js';
import NodeCompiler from '../morpheus/core/resourceCompiler/nodeCompiler.js';
import appConfig from '../morphSrc/app.config.js';
import libraryNodeConfig from '../morpheus/core/configs/libraryNode.config';
import chalk from 'chalk';

class MorphSrcBuildDirectoryBuilder {

  constructor() {
    this.appConfig    = appConfig;
    this.nodeRegistry = this.appConfig.nodes;
    this.nodeIds      = Object.keys( this.nodeRegistry );
  }

  async build() {
    this.resetmorphBuildDirectory();
    await this.createResourceFiles();
    this.cleanupmorphBuild();
    this.createResourceProvider();
  }

  resetmorphBuildDirectory() {

    try {
      if (fse.existsSync('morphBuild')) {
        fse.removeSync('morphBuild');
      }
    } catch (error) {
      console.error('Failed to delete former directory "morphBuild":', error.message);
      process.exit(1);
    }
    
    try {
      fse.copySync('morphSrc', 'morphBuild');
    } catch (error) {
      console.error('Failed to create duplicate of directory "morphSrc":', error.message);
      process.exit(1);
    }

  }

  async createResourceFiles() {

    for (const nodeId of this.nodeIds) {
      try {
          console.log( `Processing ${nodeId}...` );
          await this.createResourceFile( nodeId );
      } catch(e) {
          console.log(`Falied to compile resource file of node '${nodeId}'`);
      }
    }

  }

  async createResourceFile( nodeId ) {

    const nodeItem          = this.nodeRegistry[nodeId]; 
    const isSingleFile      = nodeItem?.isFile;

    if ( isSingleFile ) {
      cconsole.log(chalk.dim(`  Skipping: Node '${nodeId}' is a single file (not yet supported)`));
      return;
    }

    const compiler          = new NodeCompiler({
      nodeRegistry:           this.nodeRegistry,
      nodeId, 
      executionContext:       'app', 
      executionContextConfig: this.appConfig, 
      libraryNodeConfig, 
      runtimeEnvironment:     'server',
    })

    const nodeResources     = await compiler.exec();
    
    const configDirSubPath  = nodeResources?.configDirSubPath;
    const configDirPath     = `morphSrc/${configDirSubPath}`;
    const configFileName    = `${nodeId}.config.jsx`;
    const configFilePath    = `${configDirPath}/${configFileName}`;
    const configFileExists  = fs.existsSync(configFilePath);

    if( !configFileExists ) {
      console.warn(chalk.yellow(`  ⚠️  Configuration file '${configFileName}' not found in '${configFilePath}'`));
      return null;
    }
  
    const sourceCode          = this.extractSourceCode( configFilePath );
    const importStatements    = this.extractImportStatements( sourceCode );
    const componentExports    = this.extractComponentExports( sourceCode, isSingleFile );
    const moduleRegistry      = nodeResources?.modules; 

    // ####################CHANGE - START##################
    const componentRegistry   = nodeResources?.components;
    // ####################CHANGE - END####################

    const imports             = [...importStatements]; 

    const moduleIdentifiers   = {};

    // ####################CHANGE - START##################
    const componentIdentifiers = {};
    // ####################CHANGE - END####################

    this.processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath, moduleIdentifiers );

    // ####################CHANGE - START##################
    this.processComponentRegistry( nodeId, componentRegistry, imports, isSingleFile, configDirSubPath, componentIdentifiers );
    // ####################CHANGE - END####################

    const resourceFileImports = imports.length > 0 ? imports.join('\n') + '\n\n' : '';

    //Purpose of these two lines is unclear
    this.nodeRegistry[nodeId].configDirSubPath = nodeResources.configDirSubPath;
    delete nodeResources.configDirSubPath;
    

    // ####################CHANGE - START##################
    const allIdentifiers            = { ...moduleIdentifiers, ...componentIdentifiers };
    const serializedResources       = this.serializeValue( nodeResources, 0, allIdentifiers );
    // ####################CHANGE - END####################


    const componentExportStatements = componentExports.length > 0 ? '\n\n' + componentExports.join('\n\n'): '';
    
    const resourceFileName          = `${nodeId}.resources.jsx`;
    const resourceFileSourceCode    = `${resourceFileImports}const nodeResources = ${serializedResources};\n\nexport default nodeResources;${componentExportStatements}`;

    const targetPath                = configDirPath ? `morphBuild/${configDirSubPath}/${resourceFileName}` : `morphBuild/${resourceFileName}`;

    //Create morphBuild Directory
    console.log('Writing to path ' +  targetPath );
    fs.writeFileSync(targetPath, resourceFileSourceCode, 'utf8');
    
  }

  /* Directory Handling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  extractSourceCode( configFilePath ) {
    const sourceCode = fs.readFileSync(configFilePath, 'utf8');
    return sourceCode;
  }

  extractImportStatements( sourceCode ) {

    const importRegex               = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
    const importStatements          = sourceCode.match(importRegex) || [];
    const validatedImportStatements = importStatements.filter( statement => statement.startsWith('import ') );
    return validatedImportStatements;

  }

  extractComponentExports( sourceCode, isSingleFile ) {

    if( !isSingleFile ) {
      return []
    }

    const exportRegex      = /export\s+function\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const componentExports = sourceCode.match(exportRegex) || [];
    return componentExports;
  
  }

  processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath, moduleIdentifiers )  {

    if( !moduleRegistry ) {
      return null;
    }

    Object.entries( moduleRegistry ).forEach( ( [ moduleId, moduleRegistryItem ] ) => {

      const isShared               = moduleRegistryItem?.isShared;
      const moduleSubPath          = moduleRegistryItem.subPath;

      
      moduleIdentifiers[moduleId]  = moduleId;

      moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;
      delete moduleRegistryItem.inheritanceLevel;

      if ( isSingleFile && !isShared ) {
        return;
      } 
  
      const importPath = `@morphBuild/${moduleSubPath}`;

      imports.push(`import ${moduleId} from '${importPath}';`);

    });

  }

  // ####################CHANGE - START##################
  processComponentRegistry( nodeId, componentRegistry, imports, isSingleFile, configDirSubPath, componentIdentifiers ) {
    if( !componentRegistry ) {
      return null;
    }

    Object.entries( componentRegistry ).forEach( ( [ componentId, componentRegistryItem ] ) => {
      const isShared                  = componentRegistryItem?.isShared;
      const componentSubPath          = componentRegistryItem.subPath;
      
      // Create a unique identifier to avoid naming conflicts with modules
      const componentImportId               = `Component_${componentId}`;
      componentIdentifiers[componentId]     = componentImportId;
      componentRegistryItem.component       = `__IDENTIFIER__${componentImportId}`;
      delete componentRegistryItem.inheritanceLevel;

      if ( isSingleFile && !isShared ) {
        return;
      } 
  
      const importPath = `@morphBuild/${componentSubPath}`;
      imports.push(`import ${componentImportId} from '${importPath}';`);
    });
  }
  // ####################CHANGE - END####################


  serializeValue(value, indent = 2, moduleIdentifiers = {}) {
  
    const spaces = ' '.repeat(indent);
    
    // Handle component identifier placeholders (for imports)
    if (typeof value === 'string' && value.startsWith('__IDENTIFIER__')) {
      return value.replace('__IDENTIFIER__', '');
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return String(value);
    }
  
    // Handle objects (recursive)
    if (typeof value === 'object') {

      const entries = Object.entries(value);

      if (entries.length === 0) return '{}';
      
      const serialized = entries.map(([key, val]) => {
    
        if (typeof val === 'function') {
          const funcStr = val.toString();
          
          // Check for async functions first
          const isAsync = funcStr.startsWith('async ');
          const asyncPrefix = isAsync ? 'async ' : '';
          
          // Remove 'async ' prefix for further processing
          const normalizedFuncStr = isAsync ? funcStr.replace(/^async\s+/, '') : funcStr;
          
          if (normalizedFuncStr.startsWith('function')) {
            // Convert: function name() { ... } → name() { ... }
            const methodStr = normalizedFuncStr.replace(/^function\s+/, '');
            
            // Fix indentation of function body
            const lines = methodStr.split('\n');
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return line;
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            // Prepend async if needed
            return `${spaces}  ${asyncPrefix}${indentedLines.join('\n')}`;
            
          } else if (normalizedFuncStr.includes('=>')) {
            // Arrow function
            const lines = funcStr.split('\n'); // Use original funcStr to preserve async
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return line.trim();
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            return `${spaces}  ${key}: ${indentedLines.join('\n')}`;
            
          } else {
            // Method shorthand (e.g., methodName() { ... })
            const lines = normalizedFuncStr.split('\n');
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return `${asyncPrefix}${key}${line.substring(normalizedFuncStr.indexOf('('))}`;
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            return `${spaces}  ${indentedLines.join('\n')}`;
          }
        }
        
        // Handle all other values recursively

        const serializedVal = this.serializeValue(val, indent + 2, moduleIdentifiers);

        return `${spaces}  ${key}: ${serializedVal}`;

      }).join(',\n');
      
      return `{\n${serialized}\n${spaces}}`;
      
    }
  
    // Fallback for primitives (strings, numbers, booleans)
    return JSON.stringify(value);
  }

  cleanupmorphBuild() {

    const directoryPath = 'morphBuild';
    
    const filesToDelete = [
      'constants.js',
      'constants.jsx',
      'metaData.js',
      'metaData.jsx',
      'coreData.js',
      'coreData.jsx',
      'signalGroups.js',
      'signalGroups.jsx',
      'signals.js',
      'signals.jsx',
      'moduleRegistry.js',
      'moduleRegistry.jsx',
      'instanceRegistry.js',
      'instanceRegistry.jsx',
      'kernel.js',
      'kernel.jsx',
      // ####################CHANGE - START##################
      'components.js',
      'components.jsx',
      // ####################CHANGE - END####################
    ];
    
    function deleteFilesRecursively(dir) {
      if (!fs.existsSync(dir)) {
        return;
      }
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
  
        const fullPath = `${dir}/${item}`;
        const stat     = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          deleteFilesRecursively(fullPath);
        } else if (stat.isFile()) {
          if (item.includes('.config.')) {
            fs.unlinkSync(fullPath);
            continue;
          }
          
          if (filesToDelete.includes(item)) {
            fs.unlinkSync(fullPath);
          }
        }
      }
    }
    
    deleteFilesRecursively(directoryPath);

  }

  /* Resource Provider Creation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createResourceProvider() {
    const importStatements = this.createResourceProviderImportStatements();
    this.createResourceProviderClassFile( importStatements );
  }

  createResourceProviderImportStatements() {

    const importStatementsArray = this.nodeIds.map( nodeId => {

      const nodeItem     = this.nodeRegistry[nodeId];
      const isSingleFile = nodeItem?.isFile;

      if ( isSingleFile ) {
        console.log(chalk.dim(`  Skipping: Node '${nodeId}' is a single file (not yet supported). It is excluded from resourceProvider.`));
        return;
      }
      
      const configDirSubPath = this.nodeRegistry[nodeId].configDirSubPath;
      const importPath       = `@morphBuild/${configDirSubPath}/${nodeId}.resources`;
      
      return `import ${nodeId}Resources from '${importPath}';`;
    });

    const importStatements = importStatementsArray.join('\n');

    return importStatements;

  }

  createResourceProviderClassFile( importStatements ) {
    
    const registryItemsArray = this.nodeIds.map( nodeId => {

      const isFile = this.nodeRegistry[ nodeId ]?.isFile;

      //Sort out until singleFiles are not supported
      if ( isFile ) {
        console.log(chalk.dim(`  Skipping: Node '${nodeId}' is a single file (not yet supported). It is excluded from registry of class 'ResourceProvider'`));
        return null;
      }

      return `'${nodeId}': ${nodeId}Resources`
    } );

    //Remove until singleFiles are not supported
    registryItemsArray.filter(item => item !== null);

    const registryItems              = registryItemsArray.join(',\n      ');

    const resourceProviderSourceCode = 
`
${importStatements}
class ResourceProvider {

  constructor() {

    this.registry = {
      ${registryItems}
    };

  }
  
  getNodeResources(nodeId) {

    const resources = this.registry[nodeId];
    
    if (!resources) {
      throw new Error(\`Node resources not found for: \${nodeId}\`);
    }
    
    return resources;

  }

}

export default new ResourceProvider();
`;

  const outputPath = 'morphBuild/ResourceProvider.js';
  fs.writeFileSync(outputPath, resourceProviderSourceCode, 'utf8');


  }


}

const morphsSrcBuildDirectoryBuilder = new MorphSrcBuildDirectoryBuilder();

morphsSrcBuildDirectoryBuilder.build();