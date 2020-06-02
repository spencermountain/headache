<script>
  import parse from './parse'
  export let value = ''
  export let callback = () => {}
  export let onInput = () => {
    let res = parse(value)
    callback(res)
  }
</script>

<style>
  .textarea {
    flex: 1;
    min-width: 80%;
    min-height: 10rem;
    font-size: 1.5rem;
    padding: 2rem;
    border-radius: 5px;
  }
</style>

<textarea class="textarea" bind:value on:input={onInput} />
