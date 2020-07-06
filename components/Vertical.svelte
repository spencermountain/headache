<script>
  export let sections = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
</script>

<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .slider {
    font-family: sans-serif;
    scroll-snap-type: y mandatory;
    display: flex;
    max-height: 30rem;
    flex-direction: column;
    -webkit-overflow-scrolling: touch;
    overflow-y: scroll;
  }
  section {
    border: 1px solid white;
    padding: 1rem;
    min-height: 30rem;
    width: 100%;
    border-radius: 4px;
    scroll-snap-align: start;
    text-align: center;
    position: relative;
  }
</style>

<!-- svelted version of https://codepen.io/chriscoyier/pen/pMRgwW -->
<div class="slider">
  {#each sections as section}
    <section>
      <div>{section}</div>
    </section>
  {/each}
</div>
