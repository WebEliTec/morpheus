import '@morpheus/dev/ui/morpheus-ui.scss';

export default function Root({ _, Module }) {

  const shouldShowUi = _.shouldShowUI();

  if( !shouldShowUi ) {
    return (
      <Module id="Trigger" />
    )
  } else {
    return (
      <Module id="Main"/> 
    )
  }
}