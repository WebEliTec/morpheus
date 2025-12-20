import fs from 'fs';
import fse from 'fs-extra';
import SingleNodeCompiler from '../morpheus/core/resourceCompiler/singleNodeCompiler.js';
import NodeCompiler from '../morpheus/core/resourceCompiler/nodeCompiler.js';
import appConfig from '../morphSrc/app.config.js';
import libraryNodeConfig from '../morpheus/core/configs/libraryNode.config';
import chalk from 'chalk';

class MorphSrcBuildDirectoryBuilder {
  constructor() {
    this.appConfig             = appConfig;
    this.nodeRegistry          = this.appConfig.nodes;
    this.nodeIds               = Object.keys( this.nodeRegistry );
    this.lazyLoadNodeResources = this.appConfig.lazyLoadNodes ?? false;
  }

  async build() {
    this.resetmorphBuildDirectory();
    await this.createResourceFiles();
    this.cleanupmorphBuild();
    this.createNodeResourceProvider();
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
        console.log(chalk.red(`Failed to compile resource file of node '${nodeId}'`));
        console.log(chalk.red(`  Error: ${e.message}`));
      }
    }
  }

  async createResourceFile( nodeId ) {
    const nodeItem     = this.nodeRegistry[nodeId]; 
    const isSingleFile = nodeItem?.isFile;

    // ####################CHANGE - START##################
    // Handle single file nodes separately
    if ( isSingleFile ) {
      await this.createSingleFileResourceFile( nodeId );
      return;
    }
    // ####################CHANGE - END####################

    const compiler = new NodeCompiler({
      nodeRegistry:           this.nodeRegistry,
      nodeId, 
      executionContext:       'app', 
      executionContextConfig: this.appConfig, 
      libraryNodeConfig, 
      runtimeEnvironment:     'server',
    });

    const nodeResources    = await compiler.exec();
    
    const configDirSubPath = nodeResources?.configDirSubPath;
    const configDirPath    = `morphSrc/${configDirSubPath}`;
    const configFileName   = `${nodeId}.config.jsx`;
    const configFilePath   = `${configDirPath}/${configFileName}`;
    const configFileExists = fs.existsSync(configFilePath);

    if( !configFileExists ) {
      console.warn(chalk.yellow(`  ⚠️  Configuration file '${configFileName}' not found in '${configFilePath}'`));
      return null;
    }
  
    const sourceCode           = this.extractSourceCode( configFilePath );
    const importStatements     = this.extractImportStatements( sourceCode );
    const componentExports     = this.extractComponentExports( sourceCode, isSingleFile );
    const moduleRegistry       = nodeResources?.modules; 
    const componentRegistry    = nodeResources?.components;
    const imports              = [...importStatements]; 
    const moduleIdentifiers    = {};
    const componentIdentifiers = {};

    this.processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath, moduleIdentifiers );
    this.processComponentRegistry( nodeId, componentRegistry, imports, isSingleFile, configDirSubPath, componentIdentifiers );

    const resourceFileImports = imports.length > 0 ? imports.join('\n') + '\n\n' : '';

    this.nodeRegistry[nodeId].configDirSubPath = nodeResources.configDirSubPath;
    delete nodeResources.configDirSubPath;
    
    const allIdentifiers            = { ...moduleIdentifiers, ...componentIdentifiers };
    const serializedResources       = this.serializeValue( nodeResources, 0, allIdentifiers );
    const componentExportStatements = componentExports.length > 0 ? '\n\n' + componentExports.join('\n\n') : '';
    
    const resourceFileName       = `${nodeId}.resources.jsx`;
    const resourceFileSourceCode = `${resourceFileImports}const nodeResources = ${serializedResources};\n\nexport default nodeResources;${componentExportStatements}`;
    const targetPath             = configDirPath ? `morphBuild/${configDirSubPath}/${resourceFileName}` : `morphBuild/${resourceFileName}`;

    console.log('  Writing to path: ' + targetPath);
    fs.writeFileSync(targetPath, resourceFileSourceCode, 'utf8');
  }

  // ####################CHANGE - START##################
  /* Single File Node Compilation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  async createSingleFileResourceFile( nodeId ) {
    const nodeItem = this.nodeRegistry[nodeId];
    
    // Compile node resources (handles inheritance from delta level)
    const compiler = new NodeCompiler({
      nodeRegistry:           this.nodeRegistry,
      nodeId,
      executionContext:       'app',
      executionContextConfig: this.appConfig,
      libraryNodeConfig,
      runtimeEnvironment:     'server',
    });
    
    const nodeResources = await compiler.exec();
    
    // Determine file path based on dir config
    const customDir   = nodeItem?.dir;
    const isRootLevel = customDir === '/' || !customDir;
    
    let configDirSubPath;
    let configFilePath;
    
    if (isRootLevel) {
      configDirSubPath = '';
      configFilePath   = `morphSrc/${nodeId}.config.jsx`;
    } else {
      configDirSubPath = customDir.startsWith('/') ? customDir.slice(1) : customDir;
      configFilePath   = `morphSrc/${configDirSubPath}/${nodeId}.config.jsx`;
    }
    
    if (!fs.existsSync(configFilePath)) {
      console.warn(chalk.yellow(`  ⚠️  Single file node '${nodeId}' not found at '${configFilePath}'`));
      return null;
    }
    
    // Extract source code and imports
    const sourceCode       = this.extractSourceCode(configFilePath);
    const importStatements = this.extractImportStatements(sourceCode);
    
    // Extract named export names (to verify they exist)
    const namedExports = this.extractNamedExports(sourceCode);
    
    const imports              = [...importStatements];
    const moduleIdentifiers    = {};
    const componentIdentifiers = {};
    const moduleRegistry       = nodeResources?.modules;
    const componentRegistry    = nodeResources?.components;
    
    // Track which inline exports we need to import from config file
    const inlineModules    = [];
    const inlineComponents = [];
    
    // Process modules
    if (moduleRegistry) {
      for (const [moduleId, moduleRegistryItem] of Object.entries(moduleRegistry)) {
        const isShared = moduleRegistryItem?.isShared;
        
        if (isShared) {
          // Shared modules - import from sharedModules/
          const moduleSubPath = moduleRegistryItem.subPath;
          imports.push(`import ${moduleId} from '@morphBuild/${moduleSubPath}';`);
        } else {
          // Inline modules - will be imported from config file
          if (namedExports.includes(moduleId)) {
            inlineModules.push(moduleId);
          } else {
            console.warn(chalk.yellow(`  ⚠️  Module '${moduleId}' declared in config but not exported from '${configFilePath}'`));
          }
        }
        
        moduleIdentifiers[moduleId]      = moduleId;
        moduleRegistryItem.component     = `__IDENTIFIER__${moduleId}`;
        delete moduleRegistryItem.inheritanceLevel;
      }
    }
    
    // Process components
    if (componentRegistry) {
      for (const [componentId, componentRegistryItem] of Object.entries(componentRegistry)) {
        const isShared = componentRegistryItem?.isShared;
        
        if (isShared) {
          // Shared components - import from sharedComponents/
          const componentSubPath  = componentRegistryItem.subPath;
          const componentImportId = `Component_${componentId}`;
          imports.push(`import ${componentImportId} from '@morphBuild/${componentSubPath}';`);
          componentIdentifiers[componentId] = componentImportId;
          componentRegistryItem.component   = `__IDENTIFIER__${componentImportId}`;
        } else {
          // Inline components - will be imported from config file
          if (namedExports.includes(componentId)) {
            inlineComponents.push(componentId);
            componentIdentifiers[componentId] = componentId;
            componentRegistryItem.component   = `__IDENTIFIER__${componentId}`;
          } else {
            console.warn(chalk.yellow(`  ⚠️  Component '${componentId}' declared in config but not exported from '${configFilePath}'`));
          }
        }
        
        delete componentRegistryItem.inheritanceLevel;
      }
    }
    
    // Store configDirSubPath for ResourceProvider
    this.nodeRegistry[nodeId].configDirSubPath = configDirSubPath;
    delete nodeResources.configDirSubPath;
    
    // Build import line for inline modules/components from config file
    const inlineExports = [...inlineModules, ...inlineComponents];
    let configImportLine = '';
    
    if (inlineExports.length > 0) {
      const configImportPath = configDirSubPath 
        ? `@morphBuild/${configDirSubPath}/${nodeId}.config`
        : `@morphBuild/${nodeId}.config`;
      configImportLine = `import { ${inlineExports.join(', ')} } from '${configImportPath}';\n`;
    }
    
    // Build final imports section (filter out original imports from config file)
    const filteredImports     = imports.filter(imp => !imp.includes(`${nodeId}.config`));
    const otherImports        = filteredImports.join('\n');
    const resourceFileImports = configImportLine + (otherImports ? otherImports + '\n\n' : '\n');
    
    // Serialize node resources
    const allIdentifiers      = { ...moduleIdentifiers, ...componentIdentifiers };
    const serializedResources = this.serializeValue(nodeResources, 0, allIdentifiers);
    
    // Generate final source code
    const resourceFileName       = `${nodeId}.resources.jsx`;
    const resourceFileSourceCode = `${resourceFileImports}const nodeResources = ${serializedResources};\n\nexport default nodeResources;`;
    
    // Determine target path
    const targetPath = configDirSubPath 
      ? `morphBuild/${configDirSubPath}/${resourceFileName}` 
      : `morphBuild/${resourceFileName}`;
    
    console.log(chalk.blue(`  Writing single file node to: ${targetPath}`));
    fs.writeFileSync(targetPath, resourceFileSourceCode, 'utf8');
  }

  /**
   * Extracts named export names from source code.
   * Used to verify that declared modules/components are actually exported.
   * 
   * @param {string} sourceCode - The source code to parse
   * @returns {string[]} - Array of export names
   */
  extractNamedExports(sourceCode) {
    const exports = [];
    
    // Match: export function Name(...) { ... }
    const exportFunctionRegex = /export\s+function\s+(\w+)/g;
    let match;
    while ((match = exportFunctionRegex.exec(sourceCode)) !== null) {
      exports.push(match[1]);
    }
    
    // Match: export const Name = ...
    const exportConstRegex = /export\s+const\s+(\w+)/g;
    while ((match = exportConstRegex.exec(sourceCode)) !== null) {
      exports.push(match[1]);
    }
    
    // Match: export { Name1, Name2 }
    const exportBracesRegex = /export\s*\{([^}]+)\}/g;
    while ((match = exportBracesRegex.exec(sourceCode)) !== null) {
      const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/)[0].trim());
      exports.push(...names);
    }
    
    return exports;
  }

  /**
   * Removes the default export and config object from a single file node config.
   * This keeps the named exports (modules/components) but removes framework internals.
   * 
   * @param {string} filePath - Path to the config file in morphBuild
   */
  removeDefaultExportFromConfigFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    let sourceCode = fs.readFileSync(filePath, 'utf8');
    
    // Remove the config object definition: const config = { ... };
    // This regex matches from 'const config = {' to the matching '};'
    // Using a function to handle nested braces properly
    sourceCode = this.removeConfigObject(sourceCode);
    
    // Remove "export default config;" or similar
    sourceCode = sourceCode.replace(/export\s+default\s+\w+\s*;?\s*/g, '');
    
    // Remove "export default { ... };" (inline default export) - rare but possible
    sourceCode = sourceCode.replace(/export\s+default\s*\{[\s\S]*?\n\};\s*/g, '');
    
    // Clean up excessive newlines
    sourceCode = sourceCode.replace(/\n{3,}/g, '\n\n');
    
    // Trim leading/trailing whitespace
    sourceCode = sourceCode.trim() + '\n';
    
    fs.writeFileSync(filePath, sourceCode, 'utf8');
    
    console.log(chalk.dim(`    Cleaned config file: ${filePath}`));
  }

  /**
   * Removes the config object from source code using brace counting.
   * Handles nested objects properly.
   * 
   * @param {string} sourceCode - The source code
   * @returns {string} - Source code with config object removed
   */
  removeConfigObject(sourceCode) {
    // Find "const config = {"
    const configStartRegex = /const\s+config\s*=\s*\{/g;
    const match = configStartRegex.exec(sourceCode);
    
    if (!match) {
      return sourceCode;
    }
    
    const startIndex = match.index;
    const braceStart = match.index + match[0].length - 1; // Index of opening brace
    
    // Count braces to find the matching closing brace
    let depth = 0;
    let endIndex = -1;
    let inString = false;
    let stringChar = '';
    let inTemplate = false;
    
    for (let i = braceStart; i < sourceCode.length; i++) {
      const char     = sourceCode[i];
      const prevChar = sourceCode[i - 1];
      
      // Handle template literals
      if (!inString && char === '`') {
        inTemplate = !inTemplate;
        continue;
      }
      if (inTemplate) continue;
      
      // Handle strings
      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
        continue;
      }
      if (inString && char === stringChar && prevChar !== '\\') {
        inString = false;
        continue;
      }
      if (inString) continue;
      
      // Count braces
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
    
    if (endIndex === -1) {
      return sourceCode;
    }
    
    // Find the semicolon after the closing brace
    let semicolonIndex = endIndex + 1;
    while (semicolonIndex < sourceCode.length && /\s/.test(sourceCode[semicolonIndex])) {
      semicolonIndex++;
    }
    if (sourceCode[semicolonIndex] === ';') {
      semicolonIndex++;
    }
    
    // Remove the config object
    return sourceCode.slice(0, startIndex) + sourceCode.slice(semicolonIndex);
  }
  // ####################CHANGE - END####################

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
      return [];
    }
    const exportRegex      = /export\s+function\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const componentExports = sourceCode.match(exportRegex) || [];
    return componentExports;
  }

  processModuleRegistry( nodeId, moduleRegistry, imports, isSingleFile, configDirSubPath, moduleIdentifiers ) {
    if( !moduleRegistry ) {
      return null;
    }

    Object.entries( moduleRegistry ).forEach( ( [ moduleId, moduleRegistryItem ] ) => {
      const isShared      = moduleRegistryItem?.isShared;
      const moduleSubPath = moduleRegistryItem.subPath;
      
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

  processComponentRegistry( nodeId, componentRegistry, imports, isSingleFile, configDirSubPath, componentIdentifiers ) {
    if( !componentRegistry ) {
      return null;
    }

    Object.entries( componentRegistry ).forEach( ( [ componentId, componentRegistryItem ] ) => {
      const isShared         = componentRegistryItem?.isShared;
      const componentSubPath = componentRegistryItem.subPath;
      
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

  serializeValue(value, indent = 2, moduleIdentifiers = {}) {
  
    const spaces = ' '.repeat(indent);
    
    if (typeof value === 'string' && value.startsWith('__IDENTIFIER__')) {
      return value.replace('__IDENTIFIER__', '');
    }
    
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    
    if (value === null || value === undefined) {
      return String(value);
    }
  
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return '{}';
      
      const serialized = entries.map(([key, val]) => {
    
        if (typeof val === 'function') {
          const funcStr = val.toString();
          
          const isAsync = funcStr.startsWith('async ');
          const asyncPrefix = isAsync ? 'async ' : '';
          
          const normalizedFuncStr = isAsync ? funcStr.replace(/^async\s+/, '') : funcStr;
          
          if (normalizedFuncStr.startsWith('function')) {
            const methodStr = normalizedFuncStr.replace(/^function\s+/, '');
            
            const lines = methodStr.split('\n');
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return line;
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            return `${spaces}  ${asyncPrefix}${indentedLines.join('\n')}`;
            
          } else if (normalizedFuncStr.includes('=>')) {
            const lines = funcStr.split('\n');
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return line.trim();
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            return `${spaces}  ${key}: ${indentedLines.join('\n')}`;
            
          } else {
            const lines = normalizedFuncStr.split('\n');
            const indentedLines = lines.map((line, index) => {
              if (index === 0) return `${asyncPrefix}${key}${line.substring(normalizedFuncStr.indexOf('('))}`;
              if (index === lines.length - 1) return `${spaces}  ${line.trim()}`;
              return `${spaces}    ${line.trim()}`;
            });
            
            return `${spaces}  ${indentedLines.join('\n')}`;
          }
        }
        
        const serializedVal = this.serializeValue(val, indent + 2, moduleIdentifiers);
        return `${spaces}  ${key}: ${serializedVal}`;
      }).join(',\n');
      
      return `{\n${serialized}\n${spaces}}`;
    }
  
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
      'components.js',
      'components.jsx',
    ];
    
    // ####################CHANGE - START##################
    // Track single file node config files to preserve (but modify)
    const singleFileConfigs = this.nodeIds
      .filter(nodeId => this.nodeRegistry[nodeId]?.isFile)
      .map(nodeId => `${nodeId}.config.jsx`);
    // ####################CHANGE - END####################
    
    const self = this;
    
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
          // ####################CHANGE - START##################
          // Preserve single file node config files but remove default export
          if (singleFileConfigs.includes(item)) {
            self.removeDefaultExportFromConfigFile(fullPath);
            continue;
          }
          // ####################CHANGE - END####################
          
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
  createNodeResourceProvider() {
    if (!this.lazyLoadNodeResources) {
      this.createEagerNodeResourceProvider();
    } else {
      this.createLazyNodeResourceProvider();
    }
  }

  createEagerNodeResourceProvider() {
    const importStatements = this.createEagerImportStatements();
    const registryItems    = this.createEagerRegistryItems();
    
    const nodeResourceProviderSourceCode = 
`${importStatements}

class NodeResourceProvider {
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

export default new NodeResourceProvider();
`;

    const outputPath = 'morphBuild/NodeResourceProvider.js';
    fs.writeFileSync(outputPath, nodeResourceProviderSourceCode, 'utf8');
    console.log(chalk.green(`  ✓ Created NodeResourceProvider.js (eager loading)`));
  }

  createEagerImportStatements() {
    const importStatementsArray = this.nodeIds.map(nodeId => {
      const nodeItem         = this.nodeRegistry[nodeId];
      const isSingleFile     = nodeItem?.isFile;
      const configDirSubPath = this.nodeRegistry[nodeId].configDirSubPath;
      
      // ####################CHANGE - START##################
      // Skip nodes that failed to compile
      if (configDirSubPath === undefined) {
        console.log(chalk.yellow(`  Skipping: Node '${nodeId}' failed to compile. It is excluded from NodeResourceProvider.`));
        return null;
      }
      
      // Handle single file nodes - they may have empty configDirSubPath
      if (isSingleFile) {
        const importPath = configDirSubPath 
          ? `@morphBuild/${configDirSubPath}/${nodeId}.resources`
          : `@morphBuild/${nodeId}.resources`;
        return `import ${nodeId}Resources from '${importPath}';`;
      }
      
      // Handle directory nodes
      const importPath = `@morphBuild/${configDirSubPath}/${nodeId}.resources`;
      return `import ${nodeId}Resources from '${importPath}';`;
      // ####################CHANGE - END####################
    });

    const filteredStatements = importStatementsArray.filter(item => item !== null);
    return filteredStatements.join('\n');
  }

  createEagerRegistryItems() {
    const registryItemsArray = this.nodeIds.map(nodeId => {
      // ####################CHANGE - START##################
      const configDirSubPath = this.nodeRegistry[nodeId].configDirSubPath;

      // Skip nodes that failed to compile
      if (configDirSubPath === undefined) {
        return null;
      }

      return `'${nodeId}': ${nodeId}Resources`;
      // ####################CHANGE - END####################
    });

    const filteredItems = registryItemsArray.filter(item => item !== null);
    return filteredItems.join(',\n      ');
  }

  createLazyNodeResourceProvider() {
    const loaderItems = this.createLazyLoaderItems();
  
    const nodeResourceProviderSourceCode = 
`class NodeResourceProvider {
  constructor() {
    this.loaders = {
      ${loaderItems}
    };
    this.cache = {};
  }
  
  async getNodeResources(nodeId) {
    // Return from cache if already loaded
    if (this.cache[nodeId]) {
      return this.cache[nodeId];
    }
    
    const loader = this.loaders[nodeId];
    
    if (!loader) {
      throw new Error(\`Node resources not found for: \${nodeId}\`);
    }
    
    // Dynamic import - creates a separate chunk
    const module = await loader();
    this.cache[nodeId] = module.default;
    
    return module.default;
  }
  
  // Optional: Preload a node's resources without blocking
  preload(nodeId) {
    if (this.cache[nodeId]) return Promise.resolve();
    
    const loader = this.loaders[nodeId];
    if (!loader) return Promise.resolve();
    
    return loader().then(module => {
      this.cache[nodeId] = module.default;
    });
  }
  
  // Optional: Check if a node is already loaded
  isLoaded(nodeId) {
    return !!this.cache[nodeId];
  }
}

export default new NodeResourceProvider();
`;

    const outputPath = 'morphBuild/NodeResourceProvider.js';
    fs.writeFileSync(outputPath, nodeResourceProviderSourceCode, 'utf8');
    console.log(chalk.green(`  ✓ Created NodeResourceProvider.js (lazy loading)`));
  }

  createLazyLoaderItems() {
    const loaderItemsArray = this.nodeIds.map(nodeId => {
      // ####################CHANGE - START##################
      const nodeItem         = this.nodeRegistry[nodeId];
      const isSingleFile     = nodeItem?.isFile;
      const configDirSubPath = this.nodeRegistry[nodeId].configDirSubPath;

      // Skip nodes that failed to compile
      if (configDirSubPath === undefined) {
        console.log(chalk.yellow(`  Skipping: Node '${nodeId}' failed to compile. It is excluded from NodeResourceProvider.`));
        return null;
      }

      // Handle single file nodes - they may have empty configDirSubPath
      if (isSingleFile) {
        const importPath = configDirSubPath 
          ? `@morphBuild/${configDirSubPath}/${nodeId}.resources`
          : `@morphBuild/${nodeId}.resources`;
        return `'${nodeId}': () => import('${importPath}')`;
      }

      // Handle directory nodes
      const importPath = `@morphBuild/${configDirSubPath}/${nodeId}.resources`;
      return `'${nodeId}': () => import('${importPath}')`;
      // ####################CHANGE - END####################
    });

    const filteredItems = loaderItemsArray.filter(item => item !== null);
    return filteredItems.join(',\n      ');
  }
}

const morphsSrcBuildDirectoryBuilder = new MorphSrcBuildDirectoryBuilder();
morphsSrcBuildDirectoryBuilder.build();