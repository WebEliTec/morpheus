const config = {

  parentId: 'MenuDelta',

  modules: {

    NodeEcho: {
      isRoot: true,
      dir: '/',
    },

    SomeModule: {
      dir: '/',
    },

  }

}

export default config;

export function NodeEcho( { Module } ) {
  return (
    <div>NodeEcho From File
      <Module id="SomeModule" />
      <Module id="Wrapper" />
    </div>
  )
}

export function SomeModule() {
  return (
    <div>SomeModule</div>
  )
}

