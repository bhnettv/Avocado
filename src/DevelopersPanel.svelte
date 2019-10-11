<script>
import Button from './Button.svelte';
import Details from './Details.svelte';
import DeveloperList from './DeveloperList.svelte';
import LabelList from './LabelList.svelte';
import Search from './Search.svelte';
</script>

<style>
div.panel {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

div.search {
  display: flex;
  flex-direction: row;
}

article {
  background-color: #ffffff;
  flex-grow: 1;
}

aside {
  background-color: #f3f3f3;
  display: flex;
  flex-direction: column;
  min-width: 300px;
}
</style>

<div class="panel">
  <aside>
    <div class="search">
      <Search/>
      <Button label="Add"/>
    </div>
    <DeveloperList/>
    <Details>
      <LabelList/>
    </Details>
  </aside>
  <article></article>
  <aside></aside>
</div>
