export default function CurrentUrlDisplay({ _ }) {

  const currentURL = _.router.getUrl();

  return (
    <div className="current-url-display-outer">
      <div className="morph-box-beta current-url-display flex items-center justify-center">
        Current Url: { currentURL }
      </div>
    </div>
  )
}
