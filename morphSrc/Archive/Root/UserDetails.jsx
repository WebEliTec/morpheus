export default function UserDetails( { _, Module } ) {

  const userId = _.router.getSecondSegment();

  return (
    <div>UserDetails
      <br /> 
      { userId }
    </div>
  )
}
