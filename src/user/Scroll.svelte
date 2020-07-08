<script>
  import { data } from '../store'
</script>

<style>
  #scroll {
    width: 200px;
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    border-right: 4px solid white;
    padding: 1rem;
  }
  .note {
    height: 70px;
    margin: 0.3rem;
    padding: 10px;
    width: 180px;
    font-size: 15px;
    border: 1px solid lightgrey;
    border-radius: 4px;
  }
</style>

<div id="scroll">
  {#each Object.keys($data.dates) as date}
    <div class="col note">
      <div class="left blue ulred">{date}</div>
      <!-- <div>{$data.dates[date]}</div> -->
    </div>
  {/each}
</div>
