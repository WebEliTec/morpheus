export default function InputValueDisplay({_}) {
  
  const value = _.getSignalValue( 'inputValue' );
  
  return (
    <div>InputValueDisplay {value}</div>
  )

}
