<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import Endpoints from './Endpoints.svelte';
import List from './List.svelte';
import Overview from './Overview.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Tab from './Tab.svelte';
import TabBar from './TabBar.svelte';
import Timeline from './Timeline.svelte';

import { search } from './stores.js';
import { developer_list } from './stores.js';
import { developer_index } from './stores.js';
import { label_list } from './stores.js';
import { label_index } from './stores.js';
import { add_disabled } from './stores.js';
import { tab_index } from './stores.js';
import { social_disabled } from './stores.js';
import { social_index } from './stores.js';
import { notes_disabled } from './stores.js';
import { overview_disabled } from './stores.js';
import { developer_name } from './stores.js';
import { developer_email } from './stores.js';
import { developer_image } from './stores.js';
import { developer_description } from './stores.js';
import { controls_mode } from './stores.js';

// Load external data
onMount( async () => {
  $developer_list = await fetch( '/api/developer' )
  .then( ( response ) => response.json() );

  $label_list = await fetch( '/api/label' )
  .then( ( response ) => response.json() );
} );

// Add new developer
function doAdd( evt ) {
  $add_disabled = true;
  $tab_index = 0;
  $social_disabled = false;
  $notes_disabled = true;
  $overview_disabled = false;
  $social_index = 0;  
  $controls_mode = 1;
}

// Cancel adding a developer
// ?? Cancel edit also
function doCancel( evt ) {
  $add_disabled = false;
  $tab_index = 0;
  $social_disabled = true;
  $overview_disabled = true;
  $social_index = 1;
  $controls_mode = 0;  
}

// Save new developer
function doSave( evt ) {
  $add_disabled = false;
  $tab_index = 0;
  $social_disabled = true;
  $overview_disabled = true;
  $social_index = 1;
  $controls_mode = 0;  

  let developer = {
    name: $developer_name,
    email:  $developer_email.trim().length === 0 ? null : $developer_email,
    description: $developer_description.trim().length === 0 ? null : $developer_description,
    image: $developer_image.trim().length === 0 ? null : $developer_image
  };

  fetch( '/api/developer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( developer )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_list.push( data );
    $developer_list.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;

      return 0;
    } );
    $developer_list = $developer_list.slice( 0 );
  } );
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
  padding: 0 21px 0 40px;
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
        icon="/img/add.svg"
        disabledIcon="/img/add-disabled.svg"
        on:click="{doAdd}"
        disabled="{$add_disabled}">Add</Button>
    </div>

    <!-- Developer list -->
    <h4>Developers</h4>
    <List data="{$developer_list}" let:item="{developer}">
      <p data-id="{developer.id}" class="developer">{developer.name}</p>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Labels">
      <List data="{$label_list}" let:item="{label}">
        <p data-id="{label.id}" class="label">{label.name}<span>{label.count}</span></p>
      </List>
    </Details>

  </aside>

  <!-- Center panel -->
  <article>

    <!-- Tabs -->
    <TabBar>
      <Tab 
        on:click="{() => $tab_index = 0}"
        selected="{$tab_index === 0 ? true : false}">Overview</Tab>
      <Tab 
        on:click="{() => $tab_index = 1}"
        selected="{$tab_index === 1 ? true : false}" 
        disabled="{$social_disabled}">Social</Tab>
      <Tab 
        on:click="{() => $tab_index = 2}"
        selected="{$tab_index === 2 ? true : false}" 
        disabled="{$notes_disabled}">Notes</Tab>
    </TabBar>

    <!-- Views -->
    <!-- Work directly with store -->
    <Overview/>
    <Endpoints/>    
    <Timeline/>
    <Notes/>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls on:cancel="{doCancel}" on:save="{doSave}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
