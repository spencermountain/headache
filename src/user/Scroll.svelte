<script>
  import { data } from '../store'
</script>

<style>
  #scroll {
    width: 150px;
    margin-right: 1rem;
    margin-top: 1rem;
  }
  .scroll {
    overflow-y: scroll;
    overflow-x: hidden;
    border-right: 4px solid lightgrey;
    height: 700px;
  }
  .counter {
    border-bottom: 1px solid lightgrey;
    text-align: left;
    margin-left: 1rem;
  }
  .note {
    height: 50px;
    margin: 1rem;
    padding: 10px;
    width: 100px;
    font-size: 15px;
    border: 1px solid dimgrey;
    border-radius: 4px;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
  }
</style>

<div id="scroll">
  <div class="f1 counter">{Object.keys($data.dates).length} notes:</div>
  <div class="scroll">
    {#each Object.keys($data.dates) as date}
      <div class="col note shadow">
        <div class="left blue ulred">{date}</div>
        <!-- <div>{$data.dates[date]}</div> -->
      </div>
    {/each}
  </div>
</div>
