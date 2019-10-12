<script>
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import DeveloperForm from './DeveloperForm.svelte';
import DeveloperList from './DeveloperList.svelte';
import IconButton from './IconButton.svelte';
import LabelList from './LabelList.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Tabs from './Tabs.svelte';
import Timeline from './Timeline.svelte';

let selectedPanel = 0;
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
      <IconButton label="Add" icon="/img/add.svg"/>
    </div>
    <DeveloperList/>
    <Details summary="Labels">
      <LabelList/>
    </Details>
  </aside>
  <article>
    <Tabs on:tab="{( evt ) => selectedPanel = evt.detail}"/>
    <DeveloperForm visible="{selectedPanel === 0 ? true : false}"/>
    <Timeline visible="{selectedPanel === 1 ? true : false}"/>
    <Notes visible="{selectedPanel === 2 ? true : false}"/>
    <Controls visible="{selectedPanel < 2 ? true : false}"/>
  </article>
  <aside></aside>
</div>
