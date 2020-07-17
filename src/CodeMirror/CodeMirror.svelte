<script>
  import { onMount } from 'svelte'
  export let text = ''
  let editor
  let el

  const getOffsets = function(str = '') {
    let firstWord = str.match(/\.\w+/)
    if (!firstWord) {
      return { start: 0, end: 0 }
    }
    return {
      start: firstWord.index,
      end: firstWord[0].length + firstWord.index,
    }
  }

  const clear = function(doc) {
    doc.getAllMarks().forEach(m => m.clear())
  }
  const enterKey = function() {
    console.log('enter')
  }

  onMount(() => {
    editor = CodeMirror.fromTextArea(el, {
      lineNumbers: false,
      autofocus: true,
      extraKeys: {
        Enter: enterKey,
      },
    })

    editor.on('change', doc => {
      clear(doc)
      let str = doc.getValue()
      let first = getOffsets(str)
      let start = doc.posFromIndex(first.start)
      let end = doc.posFromIndex(first.end)
      editor.markText(start, end, {
        className: 'tag',
      })
    })
    //run highlighting on init
    CodeMirror.signal(editor, 'change', editor)
  })
</script>

<style>
  .textarea {
    max-height: 3rem;
    max-width: 20rem;
  }
</style>

<div>
  <textarea class="textarea" bind:this={el}>{text}</textarea>
</div>
