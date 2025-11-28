export default function AnotherModule({ _ }) {

  const currentURL = _.router.getUrl().url;

  return (
    <div>
      Current Url: { currentURL }
    </div>
  )
}
