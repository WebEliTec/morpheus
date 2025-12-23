import { ArrowRight } from 'lucide-react';

export function getFormatedIdentity ( identity ) {

  return (
    <FormatedIdentity identity= {identity} />
  )

}

export function FormatedIdentity ( {identity} ) {

  const frameworkId = identity.frameworkId;
  const appId       = identity.appId;
  const instanceId  = identity.instanceId;

  return (
    <div className="identity-formatter">
      <span>{frameworkId}</span>
      <span className="arrow-separator"><ArrowRight size="14" /></span>
      <span>{appId}</span>
      <span className="arrow-separator"><ArrowRight size="14" /></span>
      <span>{instanceId}</span>
    </div>
  )

}

export function createIdentityString( identity, separator = '.', toLowerCase = false ) {

  const string = `${identity.frameworkId}${separator}${identity.appId}${separator}${identity.instanceId}`

  return toLowerCase ? string.toLowerCase() : string;
}

export function validateModuleExports( module ) {

  if (!module || typeof module !== 'object') {
    return { hasDefault: false, hasAnyExports: false, hasUsefulDefault: false, hasNamedExports: false };
  }
  
  const keys             = Object.keys(module);
  const hasDefault       = 'default' in module;
  const hasUsefulDefault = hasDefault && module.default !== undefined && module.default !== null && !(typeof module.default === 'object' && Object.keys(module.default).length === 0);
  const namedExports     = keys.filter(key => key !== '__esModule' && key !== 'default');
  const hasNamedExports  = namedExports.length > 0;

  const hasNamedExportsButNoDefaultExport = hasNamedExports && !hasUsefulDefault;
  const hasNoMeaningfulDefaultExport      = !hasNamedExports && !hasUsefulDefault;
  
  return { hasNamedExportsButNoDefaultExport, hasNoMeaningfulDefaultExport };

}


export function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

export function toSnakeCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[-\s]+/g, '_').toLowerCase();
}

export function toSeparatedLowerCase(str, separator = '-')  {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1$2').replace(/[\s_-]+/g, separator).toLowerCase();
}