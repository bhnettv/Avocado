<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import List from './List.svelte';
import Overview from './Overview.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Social from './Social.svelte';
import Tabs from './Tabs.svelte';
import Tab from './Tab.svelte';

// State
let search = '';
let can_add = true;
let developers = [];
let developer_index = 0;
let labels = [];
let label_index = 0;
let social = 0;
let tab = 0;
let controls = 0;

// Load external data
onMount( async () => {
  developers = await fetch( '/api/developer' )
  .then( ( response ) => response.json() );

  labels = await fetch( '/api/label' )
  .then( ( response ) => response.json() );
} );

// Add new developer
function doAdd( evt ) {
  can_add = false;
  tab = 0;
  social = 1;
  controls = 1;
}

// Cancel adding a developer
// ?? Cancel edit also
function doCancel( evt ) {
  can_add = true;
  tab = 0;
  social = 0;
  controls = 0;
}

function doDeveloperChange( evt ) {
  // selectedDeveloper = evt.detail.selectedItem;
}

// Save new developer
// ?? Save changes
function doSave( evt ) {
  console.log( evt );
}
</script>

<style>
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
  max-width: 300px;
  min-width: 300px;
  width: 300px;
}

div.panel {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
}

div.search {
  display: flex;
  flex-direction: row;
}

h4 {
  background-color: #dcdcdc;
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 48px;
  margin: 0;
  padding: 0 16px 0 16px;
}

p.developer {
  border-bottom: solid 1px #dcdcdc;
  border-top: solid 1px transparent;
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 16px;
}

p.label {
  background-image: url( /img/label.svg );
  background-position: center left 15px;
  background-repeat: no-repeat;
  background-size: 18px;
  border-bottom: solid 1px #dcdcdc;
  border-top: solid 1px transparent;
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 46px;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 40px;
}

span {
  float: right;
}
</style>

<div class="panel">

  <!-- Left panel -->
  <aside>

    <!-- Search -->
    <div class="search">
      <Search/>
      <Button
        label="Add"
        icon="/img/add-white.svg"
        disabledIcon="/img/add.svg"
        on:click="{doAdd}"
        disabled="{!can_add}"/>
    </div>

    <!-- Developer list -->
    <h4>Developers</h4>
    <List data="{developers}" let:item="{developer}">
      <p class="developer">{developer.name}</p>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Labels">
      <List data="{labels}" let:item="{label}">
        <p class="label">{label.name}<span>{label.count}</span></p>
      </List>
    </Details>

  </aside>

  <!-- Center panel -->
  <article>

    <!-- Tabs/views -->
    <Tabs index="{tab}">
      <Tab label="Overview">
        <Overview disabled="{can_add}"/>
      </Tab>
      <Tab label="Social">
        <Social mode="{social}"/>
      </Tab>
      <Tab label="Notes" disabled>
        <Notes/>
      </Tab>
    </Tabs>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls mode="{controls}" on:cancel="{doCancel}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
