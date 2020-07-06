<script>
  // window.global = window
  // import PouchDB from 'pouchdb-browser'
  let db = new PouchDB('db')
  const replication = PouchDB.sync('db', 'http://34.86.136.15:5984/headache', {
    live: true,
    retry: false,
  })
    .on('change', async function(info) {
      console.log(info)
    })
    .on('error', function(err) {
      console.log('Replication error:', err)
    })
</script>

<style>

</style>

<div>pouchdb</div>
