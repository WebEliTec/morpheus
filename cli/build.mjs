import fs from 'fs';
import fse from 'fs-extra';
import SingleNodeCompiler from '../morpheus/core/resourceCompiler/singleNodeCompiler.js';
import appConfig from '../morphSrc/app.config.js';

try {
  if (fse.existsSync('morphBuildSrc')) {
    fse.removeSync('morphBuildSrc');
  }
} catch (error) {
  console.error('✗ Failed to clean:', error.message);
  process.exit(1);
}

try {
  fse.copySync('morphSrc', 'morphBuildSrc');
} catch (error) {
  console.error('✗ Failed to copy:', error.message);
  process.exit(1);
}

// Step 3: Compile each node and write resources

const nodeIds = Object.keys(appConfig.nodeRegistry);

for (const nodeId of nodeIds) {

  try {

    const nodeItem          = appConfig.nodeRegistry[nodeId];
    const isSingleFile      = nodeItem?.isFile;

    const compiler          = new SingleNodeCompiler({ inheritanceLevel: 'echo',  nodeId,  nodeItem,  executionContext: 'app', contextConfig: appConfig,  environment: 'server' });

    const nodeResources     = await compiler.loadNodeResources();
    const subConfigDirPath  = nodeResources.subConfigDirPath;

    const configDirPath     = `morphSrc/${subConfigDirPath}`;
    const configImports     = extractImportsFromFile( configDirPath, nodeId );

    const componentExports  = isSingleFile ? extractComponentExportsFromFile(configDirPath, nodeId) : [];
    
    const imports           = [...configImports]; // Start with config imports
    const moduleIdentifiers = {};

    if ( nodeResources.moduleRegistry ) {

      Object.entries( nodeResources.moduleRegistry ).forEach( ( [ moduleId, moduleRegistryItem ] ) => {

        
        if ( isSingleFile && !moduleRegistryItem.isShared ) {

          moduleIdentifiers[moduleId]  = moduleId;
          moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

        } else if ( isSingleFile && moduleRegistryItem.isShared ) {

          const importPath             = `@morphBuildSrc/${moduleRegistryItem.internalPath}`;
          imports.push(`import ${moduleId} from '${importPath}';`);
          moduleIdentifiers[moduleId]  = moduleId;
          moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

        } else if ( !isSingleFile && !moduleRegistryItem.isShared ) {

          const importPath             = `./${moduleRegistryItem.internalPath}`;
          imports.push(`import ${moduleId} from '${importPath}';`);
          moduleIdentifiers[moduleId]  = moduleId;
          moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

        } else if ( !isSingleFile && moduleRegistryItem.isShared ) {

          const importPath             = `@morphBuildSrc/${moduleRegistryItem.internalPath}`;
          imports.push(`import ${moduleId} from '${importPath}';`);
          moduleIdentifiers[moduleId]  = moduleId;
          moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

        } else if (moduleRegistryItem.path) {

          const importPath             = `./${moduleRegistryItem.internalPath}`;
          imports.push(`import ${moduleId} from '${importPath}';`);
          moduleIdentifiers[moduleId]  = moduleId;
          moduleRegistryItem.component = `__IDENTIFIER__${moduleId}`;

        }

      });

    }
    
    const importStatements          = imports.length > 0 ? imports.join('\n') + '\n\n' : '';
  
    appConfig.nodeRegistry[nodeId].subConfigDirPath = nodeResources.subConfigDirPath;

    delete nodeResources.subConfigDirPath;
    
    const serializedResources       = serializeValue(nodeResources, 0, moduleIdentifiers);
    const componentExportStatements = componentExports.length > 0 ? '\n\n' + componentExports.join('\n\n'): '';
    const output                    = `${importStatements}const nodeResources = ${serializedResources};\n\nexport default nodeResources;${componentExportStatements}`;
    const outputPath                = `morphBuildSrc/${subConfigDirPath}/${nodeId}.resources.jsx`;
    
    fs.writeFileSync(outputPath, output, 'utf8');
    
    console.log(`  ✓ ${nodeId} compiled to ${outputPath}`);

  } catch (error) {

    console.error(`  ✗ Failed to compile ${nodeId}:`, error.message);

  }
}

createResourceProvider( nodeIds );
cleanupMorphBuildSrc();

console.log('✓ Build complete!');


function serializeValue(value, indent = 2, moduleIdentifiers = {}) {
  
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

      const serializedVal = serializeValue(val, indent + 2, moduleIdentifiers);

      return `${spaces}  ${key}: ${serializedVal}`;

    }).join(',\n');
    
    return `{\n${serialized}\n${spaces}}`;
    
  }
  
  // Fallback for primitives (strings, numbers, booleans)
  return JSON.stringify(value);
}


// Function to extract import statements from source file
function extractImportsFromFile( configDirPath, nodeId ) {
  
  //console.log( 'configDirPath', configDirPath );
  
  // Try both .jsx and .js extensions
  const possiblePaths = [ `${configDirPath}/${nodeId}.config.jsx`, `${configDirPath}/${nodeId}.config.js`];
  
  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      try {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        // Extract all import statements from the top of the file
        const importRegex = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
        const imports     = sourceCode.match(importRegex) || [];
        
        // Filter to only actual import statements
        const relevantImports = imports.filter(imp => imp.startsWith('import '));
        console.log(relevantImports);
        return relevantImports;
      } catch (error) {
        console.warn(`Could not read imports from ${filePath}:`, error.message);
        return [];
      }
    }
  }
  
  console.warn(`Config file not found at ${possiblePaths.join(' or ')}`);
  return [];
}

//console.log('✓ Build complete!');

function extractComponentExportsFromFile(configDirPath, nodeId) {
  
  const filePath = `${configDirPath}/${nodeId}.config.jsx`

  console.log( 'filePath', filePath )
  
  if (fs.existsSync(filePath)) {

      try {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        
        // Extract export function statements
        // Matches: export function Name() { ... } including multiline

        const exportRegex      = /export\s+function\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
        const componentExports = sourceCode.match(exportRegex) || [];
        
        return componentExports;
      } catch (error) {
        console.warn(`Could not extract component exports from ${filePath}:`, error.message);
        return [];
      }
    }
    
    return [];

}

// Function to recursively delete specific files from morphBuildSrc
function cleanupMorphBuildSrc() {
  const directoryPath = 'morphBuildSrc';
  
  // Files to delete (exact matches or patterns)
  const filesToDelete = [
    'constants.js',
    'constants.jsx',
    'metaData.js',
    'metaData.jsx',
    'coreData.js',
    'coreData.jsx',
    'signalClusters.js',
    'signalClusters.jsx',
    'signals.js',
    'signals.jsx',
    'moduleRegistry.js',
    'moduleRegistry.jsx',
    'instanceRegistry.js',
    'instanceRegistry.jsx',
    'kernel.js',
    'kernel.jsx'
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
        // Recursively process subdirectories
        deleteFilesRecursively(fullPath);
      } else if (stat.isFile()) {
        // Check if file should be deleted
        
        // Check for .config files (any extension)
        if (item.includes('.config.')) {
          fs.unlinkSync(fullPath);
          //console.log(`  Deleted: ${fullPath}`);
          continue;
        }
        
        // Check for specific filenames
        if (filesToDelete.includes(item)) {
          fs.unlinkSync(fullPath);
          //console.log(`  Deleted: ${fullPath}`);
        }
      }
    }
  }
  
  console.log('Cleaning up morphBuildSrc...');
  deleteFilesRecursively(directoryPath);
  console.log('✓ Cleanup complete');
}

function createResourceProvider( nodeIds ) {

    const imports = nodeIds.map(nodeId => {

      const nodeItem     = appConfig.nodeRegistry[nodeId];
      const isSingleFile = nodeItem?.isFile;
      
      let importPath;

      if (isSingleFile) {
        const customDir = nodeItem?.dir?.replace(/^\//, '');
        importPath      = customDir ? `./${customDir}/${nodeId}.resources` : `./${nodeId}.resources`;

      } else {

        //const customDir = nodeItem?.dir?.replace(/^\//, '');
        //const basePath = customDir ? `${customDir}/${nodeId}` : nodeId;
        const basePath = appConfig.nodeRegistry[nodeId].subConfigDirPath;
        importPath     = `./${basePath}/${nodeId}.resources`;

      }
      
      return `import ${nodeId}Resources from '${importPath}';`;

  }).join('\n');
  
  // Generate the registry object
  const registryEntries = nodeIds.map(nodeId => 
    `  '${nodeId}': ${nodeId}Resources`
  ).join(',\n');
  
  // Build the ResourceProvider class
  const providerCode = `${imports}

class ResourceProvider {
  constructor() {
    this.registry = {
${registryEntries}
    };
  }
  
  getNodeResources(nodeId) {
    const resources = this.registry[nodeId];
    
    if (!resources) {
      throw new Error(\`Node resources not found for: \${nodeId}\`);
    }
    
    return resources;
  }
  
  hasNode(nodeId) {
    return nodeId in this.registry;
  }
  
  getAllNodeIds() {
    return Object.keys(this.registry);
  }
}

export default new ResourceProvider();
`;
  
  // Write the ResourceProvider file
  const outputPath = 'morphBuildSrc/ResourceProvider.js';
  fs.writeFileSync(outputPath, providerCode, 'utf8');
  console.log(`  ✓ ResourceProvider created at ${outputPath}`);
}