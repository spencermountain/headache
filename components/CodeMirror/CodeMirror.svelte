<script>
  import { onMount } from 'svelte'
  import CodeMirror from './lib.js'
  export let text = ''
  export let autofocus = true
  let editor
  let el
  export let highlight = () => {}
  export let onEnter = e => {
    return CodeMirror.Pass
  }
  const clear = function(doc) {
    doc.getAllMarks().forEach(m => m.clear())
  }

  onMount(() => {
    // create codemirror instance
    editor = CodeMirror.fromTextArea(el, {
      autofocus: autofocus,
      extraKeys: {
        Enter: onEnter,
      },
    })
    // update each keypress
    editor.on('change', doc => {
      clear(doc)
      text = doc.getValue()
      let offsets = highlight(text)
      offsets.forEach(m => {
        let start = doc.posFromIndex(m.start)
        let end = doc.posFromIndex(m.end)
        editor.markText(start, end, {
          className: m.tag,
        })
      })
    })
    CodeMirror.signal(editor, 'change', editor)
  })
</script>

<style>
  :global(.CodeMirror) {
    height: 3rem !important;
    width: 35rem !important;
    background-color: #51627e !important;
    color: white !important;
    border-left: 4px solid lightsteelblue !important;
    border-bottom: none !important;
    text-align: left !important;
  }
</style>

<svelte:head>
  <link rel="stylesheet" href="./components/CodeMirror/style.css" />
</svelte:head>

<textarea class="textarea" bind:this={el} tabindex="0 ">{text}</textarea>
