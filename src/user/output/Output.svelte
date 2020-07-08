<script>
  import { Calendar, Day } from '/Users/spencer/mountain/somehow-calendar/src'
</script>

<style>
  .container {
    margin-top: 3rem;
    flex-grow: 1;
    align-items: flex-start;
    width: 90%;
    border-radius: 5px;
    /* border: 2px solid #fbfbfb; */
  }
  .div {
    left: 10%;
    width: 80%;
    height: 10px;
    border-radius: 5px;
    background-color: #fbfbfb;
  }
</style>

<div class="container">
  <div class="g2 div" />
  <Calendar start="jan 1 2020" end="today" align="row" width="10rem">
    <Day date="Jul 8th" color="blue" />
  </Calendar>
</div>
