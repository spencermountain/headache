<script>
  import Calendar from './Calendar.svelte'
</script>

<style>
  .container {
    margin-top: 4rem;
    border-left: 3px solid #a2a8b3;
    border-right: 3px solid #a2a8b3;
    scroll-snap-type: x mandatory;
    overflow-y: scroll;
    overflow-x: scroll;
    min-height: 1000px;
    min-width: 600px;
    max-width: 600px;
    flex-wrap: nowrap !important;
    justify-content: stretch;
    align-items: self-start;
    align-self: center;
  }
  section {
    padding: 1rem;
    min-width: 100%;
    height: 30rem;
    border-radius: 4px;
    scroll-snap-align: start;
    text-align: center;
    position: relative;
  }
</style>

<div class="container row nowrap">
  <section>
    <Calendar />
  </section>
  <section>output two</section>
  <section>output three</section>
</div>
