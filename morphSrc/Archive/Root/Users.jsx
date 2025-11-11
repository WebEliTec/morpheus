export default function Users ( { _, Module } ) {

  const hasUserId = _.router.isSegmentSet( 2 );
  
  console.log( ' hasUserId ', hasUserId );

  return (
    <div>Users <br /> { hasUserId && <Module id="UserDetails" /> } </div>
    
  )
}
