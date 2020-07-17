<script>
  import CheckBox from '../../../components/CheckBox/CheckBox.svelte'
  import { parsed } from '../../store'
</script>

<style>
  .square {
    display: inline-block;
    border-radius: 6px;
    height: 2rem;
    width: 2rem;
    box-shadow: 2px 2px 8px 0px rgba(0, 0, 0, 0.2);
  }
  .tagBox {
    min-width: 6rem;
  }
  .tag-name {
    font-size: 0.8rem;
    margin-left: 8px;
    margin-right: 8px;
  }
  .row-left {
    justify-content: flex-start;
  }
  .taglist {
    border-left: 5px solid #51627e;
  }
</style>

<div class="row m1 nowrap row-left taglist">
  {#each $parsed.tags as tag}
    <div class="tagBox">
      <div class="square" style="background-color:{tag.color}">
        <CheckBox checked={tag.checked} size="2rem" name={tag.tag} primaryColor="white" change={e => console.log(e)} />
        <!-- <input type="checkbox" style="min-width:20px;" /> -->
      </div>
      <div class="tag-name" style="border-bottom:2px solid {tag.color}">.{tag.tag}</div>
    </div>
  {/each}
</div>
