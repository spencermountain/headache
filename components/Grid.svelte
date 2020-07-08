<script>
  export let sections = ['Monday', 'Tuesday', 'Wednesday', 'Section 4', 'Section 5']
</script>

<style>
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .slider {
    font-family: sans-serif;
    scroll-snap-type: x mandatory;
    display: flex;
    -webkit-overflow-scrolling: touch;
    overflow-x: scroll;

    overscroll-behavior-x: none;
  }
  section {
    border: 1px solid white;
    padding: 1rem;
    min-width: 100%;
    height: 30rem;
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
