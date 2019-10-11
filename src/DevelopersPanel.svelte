<script>
import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import DeveloperForm from './DeveloperForm.svelte';
import DeveloperList from './DeveloperList.svelte';
import LabelList from './LabelList.svelte';
import Search from './Search.svelte';
import Tabs from './Tabs.svelte';
import Timeline from './Timeline.svelte';
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
  display: flex;
  flex-direction: column;
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
      <Button label="Add" icon="/img/add.svg"/>
    </div>
    <DeveloperList/>
    <Details summary="Labels">
      <LabelList/>
    </Details>
  </aside>
  <article>
    <Tabs/>
    <DeveloperForm visible="true"/>
    <Timeline/>
    <Controls/>
  </article>
  <aside></aside>
</div>
