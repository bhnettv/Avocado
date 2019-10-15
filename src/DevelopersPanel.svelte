<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import DeveloperForm from './DeveloperForm.svelte';
import DeveloperList from './DeveloperList.svelte';
import LabelList from './LabelList.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Tabs from './Tabs.svelte';
import Timeline from './Timeline.svelte';

let developers = [];
let labels = [];
let selectedDeveloper = null;
let selectedPanel = 0;

onMount( async () => {
  developers = await fetch( '/api/developer' )
  .then( ( response ) => response.json() );

  labels = await fetch( '/api/label' )
  .then( ( response ) => response.json() );  
} );

function doAdd( evt ) {
  console.log( 'Add developer.' );
}

function doDeveloperChange( evt ) {
  selectedDeveloper = evt.detail.selectedItem;
}
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
      <Button label="Add" icon="/img/add.svg" on:click="{doAdd}"/>
    </div>
    <DeveloperList developers="{developers}" on:change="{doDeveloperChange}"/>
    <!--
    <Details summary="Labels">
      <LabelList labels="{labels}"/>
    </Details>
    -->
  </aside>
  <article>
    <Tabs on:tab="{( evt ) => selectedPanel = evt.detail}"/>
    <DeveloperForm visible="{selectedPanel === 0 ? true : false}"/>
    <Timeline visible="{selectedPanel === 1 ? true : false}"/>
    <Notes 
      developer="{selectedDeveloper}" 
      visible="{selectedPanel === 2 ? true : false}"/>
    <Controls visible="{selectedPanel < 2 ? true : false}"/>
  </article>
  <aside></aside>
</div>
