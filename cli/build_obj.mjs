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
            this.createSingleResourceFile( nodeId );
        } catch(e) {
            console.log(`Falied to compile resource file of node '${nodeId}'`);
        }
    }

  }

  async createSingleResourceFile( nodeId ) {

    const nodeItem          = this.appConfig.nodeRegistry[nodeId]; 
    const isSingleFile      = nodeItem?.isFile;
    
    const compiler          = new SingleNodeCompiler({ inheritanceLevel: 'echo',  nodeId,  nodeItem,  executionContext: 'app', contextConfig: appConfig,  environment: 'server' });
    const nodeResources     = await compiler.loadNodeResources();
    
    const configDirSubPath  = nodeResources?.configDirSubPath;
    const configDirPath     = `morphSrc/${configDirSubPath}`;
    const configFileName    = `${nodeId}.config.jsx`;
    const configFilePath    = `${configDirPath}/${configFileName}`;
    const configFileExists  = fs.existsSync(configFilePath);

    if( !configFileExists ) {
      console.warn( `Configuration file '${configFileName}' of node '${nodeId}' not found in '${configFilePath }'` );
      return null;
    }
  
    const sourceCode          = this.extractSourceCode( configFilePath );
    const importStatements    = this.extractImportStatements( sourceCode );
    const componentExports    = this.extractComponentExports( sourceCode, isSingleFile );
    const moduleRegistry      = nodeResources?.moduleRegistry; 

    const imports             = [...importStatements]; 

    const moduleIdentifiers   = {};

    this.processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath, moduleIdentifiers );

    const resourceFileImports = imports.length > 0 ? imports.join('\n') + '\n\n' : '';

    //Purpose of these two lines is unclear
    appConfig.nodeRegistry[nodeId].configDirSubPath = nodeResources.configDirSubPath;
    delete nodeResources.configDirSubPath;

    //console.log( nodeResources );

    const serializedResources       = this.serializeValue( nodeResources, 0, moduleIdentifiers );
    const componentExportStatements = componentExports.length > 0 ? '\n\n' + componentExports.join('\n\n'): '';
    
    const resourceFileName          = `${nodeId}.resources.jsx`;
    const resourceFileSourceCode    = `${resourceFileImports}const nodeResources = ${serializedResources};\n\nexport default nodeResources;${componentExportStatements}`;

    const outputPath                = configDirPath ? `morphBuildSrc/${configDirSubPath}/${resourceFileName}` : `morphBuildSrc/${resourceFileName}`;

    console.log(outputPath);

    //console.log( serializedResources );
    

  }

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
      const internalModulePath     = moduleRegistryItem.internalPath;
      moduleIdentifiers[moduleId]  = moduleId;

      moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

      if ( isSingleFile && !isShared ) {
        return;
      } 
        
      const importPath = `@morphBuildSrc/${configDirSubPath}/${internalModulePath}`;

      imports.push(`import ${moduleId} from '${importPath}';`);

    });

  }

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
      
      // Handle functions with method shorthand syntax
      if (typeof val === 'function') {
        
        const funcStr = val.toString();
        
        if (funcStr.startsWith('function')) {
          // Convert: function name() { ... } → name() { ... }
          const methodStr = funcStr.replace(/^function\s+/, '');
          
          // Fix indentation of function body
          const lines = methodStr.split('\n');
          const indentedLines = lines.map((line, index) => {
            if (index === 0) return line; // First line (function signature)
            if (index === lines.length - 1) return `${spaces}  ${line.trim()}`; // Last line (closing brace)
            return `${spaces}    ${line.trim()}`; // Body lines
          });
          
          return `${spaces}  ${indentedLines.join('\n')}`;
        } else if (funcStr.includes('=>')) {
          // Arrow function: keep as property with proper indentation
          const lines = funcStr.split('\n');
          const indentedLines = lines.map((line, index) => {
            if (index === 0) return line.trim();
            if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
            return `${spaces}    ${line.trim()}`;
          });
          
          return `${spaces}  ${key}: ${indentedLines.join('\n')}`;
        } else {
          // Method shorthand with proper indentation
          const lines = funcStr.split('\n');
          const indentedLines = lines.map((line, index) => {
            if (index === 0) return `${key}${line.substring(funcStr.indexOf('('))}`;
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


}

const morphsSrcBuildDirectoryBuilder = new MorphSrcBuildDirectoryBuilder();

morphsSrcBuildDirectoryBuilder.build();