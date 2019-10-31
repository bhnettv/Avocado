<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import Endpoints from './Endpoints.svelte';
import List from './List.svelte';
import ListLabelItem from './ListLabelItem.svelte';
import ListCountItem from './ListCountItem.svelte';
import Profile from './Profile.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Summary from './Summary.svelte';
import Tab from './Tab.svelte';
import TabBar from './TabBar.svelte';
import Timeline from './Timeline.svelte';

import { search_term } from './developers.js';
import { developer_list } from './developers.js';
import { filtered_list } from './developers.js';
import { organization_list } from './developers.js';
import { add_disabled } from './developers.js';

import { summary_tab } from './developers.js';
import { profile_tab } from './developers.js';
import { social_tab } from './developers.js';
import { notes_tab } from './developers.js';

import { summary_selected } from './developers.js';
import { profile_selected } from './developers.js';
import { social_selected } from './developers.js';
import { notes_selected } from './developers.js';

import { summary_hidden } from './developers.js';
import { profile_hidden } from './developers.js';
import { endpoints_hidden } from './developers.js';
import { timeline_hidden } from './developers.js';
import { notes_hidden } from './developers.js';

import { summary_disabled } from './developers.js';
import { profile_disabled } from './developers.js';
import { endpoints_disabled } from './developers.js';

import { developer_id } from './developers.js';
import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_image } from './developers.js';
import { developer_organizations } from './developers.js';
import { developer_location } from './developers.js';

import { notes_list } from './developers.js';

import { controls_mode } from './developers.js';

// Filter developer list on search term
function filter() {
  let trimmed = $search_term.trim();

  if( trimmed.length === 0 ) {
    $filtered_list = $developer_list.slice();
  } else {
    let matches = [];

    for( let a = 0; a < $developer_list.length; a++ ) {
      if( $developer_list[a].name.indexOf( trimmed ) >= 0 ) {
        matches.push( $developer_list[a] );
      }
    }

    $filtered_list = matches.slice();
  }
}

// Add clicked
function doAddClick( evt ) {
  $add_disabled = true;

  $summary_tab = false;
  $profile_tab = false;
  $social_tab = false;
  $notes_tab = true;

  $summary_selected = true;
  $profile_selected = false;
  $social_selected = false;
  $notes_selected = false;

  $summary_hidden = false;
  $profile_hidden = true;
  $endpoints_hidden = true;
  $timeline_hidden = true;
  $notes_hidden = true;

  $summary_disabled = false;
  $profile_disabled = false;
  $endpoints_disabled = false;

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';

  $controls_mode = 1;
}

function doCancelNew( evt ) {
  $add_disabled = false;

  $summary_tab = false;
  $profile_tab = true;
  $social_tab = true;
  $notes_tab = true;

  $summary_selected = true;
  $profile_selected = false;
  $social_selected = false;
  $notes_selected = false;

  $summary_hidden = false;
  $profile_hidden = true;
  $endpoints_hidden = true;

  $summary_disabled = true;
  $profile_disabled = true;
  $endpoints_disabled = true;

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';

  $controls_mode = 0;
}

function doDeveloperClick( evt ) {
  fetch( `/api/developer/${evt.detail.item.id}` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_id = data.id;
    $developer_name = data.name;
    $developer_email = data.email;
    $developer_location = data.location;

    $profile_tab = false;
    $social_tab = false;
    $notes_tab = false;

    $controls_mode = 2;
  } );

  fetch( `/api/developer/${evt.detail.item.id}/note` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $notes_list = data.slice();
  } );
}

// Save new developer
function doSaveNew( evt ) {
  fetch( '/api/developer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( {
      name: $developer_name.trim().length > 0 ? $developer_name : null,
      email: $developer_email.trim().length > 0 ? $developer_email : null,      
      description: null,      
      image: $developer_image.trim().length > 0 ? $developer_image : null,
      location: $developer_location.trim().length > 0 ? $developer_location : null,      
      latitude: null,      
      longitude: null,
      public: 0
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_id = data.id;
    $developer_list.push( Object.assign( {}, data ) );
    $developer_list.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;
      return 0;
    } );
    $developer_list = $developer_list.slice();
    filter();

    $add_disabled = false;

    $summary_tab = false;
    $profile_tab = false;
    $social_tab = false;
    $notes_tab = false;

    $summary_disabled = true;
    $profile_disabled = true;
    $endpoints_disabled = true;

    $controls_mode = 2;
  } );
}

// Tab clicked
function doTabClick( index ) {
  switch( index ) {
    case 0:
      $summary_selected = true;
      $profile_selected = false;
      $social_selected = false;
      $notes_selected = false;

      $summary_hidden = false;
      $profile_hidden = true;
      $endpoints_hidden = true;
      $timeline_hidden = true;
      $notes_hidden = true;

      if( $developer_id === null && $add_disabled ) {
        $controls_mode = 1;
      } else {
        $controls_mode = 2;
      }
      break;

    case 1:
      $summary_selected = false;
      $profile_selected = true;
      $social_selected = false;
      $notes_selected = false;

      $summary_hidden = true;
      $profile_hidden = false;
      $endpoints_hidden = true;
      $timeline_hidden = true;
      $notes_hidden = true;  
      
      if( $developer_id === null && $add_disabled ) {
        $controls_mode = 1;
      } else {
        $controls_mode = 2;
      }
      break;      

    case 2:
      $summary_selected = false;
      $profile_selected = false;
      $social_selected = true;
      $notes_selected = false;

      $summary_hidden = true;
      $profile_hidden = true;
      $endpoints_hidden = $add_disabled ? false : true;
      $timeline_hidden = $add_disabled ? true : false;      
      $notes_hidden = true;     

      if( $developer_id === null && $add_disabled ) {
        $controls_mode = 1;
      } else {
        $controls_mode = 2;
      }
      break;      

    case 3:
      $summary_selected = false;
      $profile_selected = false;
      $social_selected = false;
      $notes_selected = true;

      $summary_hidden = true;
      $profile_hidden = true;
      $endpoints_hidden = true;
      $timeline_hidden = true;
      $notes_hidden = false;      

      $controls_mode = 0;
      break;      
  }
}

// Load external data
onMount( async () => {
  fetch( '/api/developer' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    developer_list.set( data.slice() );
    filter();    
  } );

  fetch( '/api/organization' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    organization_list.set( data.slice() );
  } );
} );
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
</style>

<div class="panel">

  <!-- Left panel -->
  <aside>

    <!-- Search -->
    <div class="search">
      <Search bind:value="{$search_term}" on:keyup="{filter}"/>
      <Button
        on:click="{doAddClick}"
        icon="/img/add-white.svg"
        disabledIcon="/img/add.svg"
        disabled="{$add_disabled}">Add</Button>
    </div>

    <!-- Developer list -->
    <h4>Developers</h4>
    <List 
      on:change="{doDeveloperClick}"
      data="{$filtered_list}" 
      let:item="{developer}">
      <ListLabelItem>{developer.name}</ListLabelItem>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Organizations">
      <List 
        data="{$organization_list}" 
        let:item="{organization}">
        <ListCountItem>
          <span slot="label">{organization.name}</span>
          <span slot="count">{organization.count}</span>
        </ListCountItem>      
      </List>
    </Details>

  </aside>

  <!-- Center panel -->
  <article>

    <!-- Tabs -->
    <TabBar>
      <Tab 
        on:click="{() => doTabClick( 0 )}"
        selected="{$summary_selected}"
        disabled="{$summary_tab}">Summary</Tab>
      <Tab 
        on:click="{() => doTabClick( 1 )}"      
        selected="{$profile_selected}"
        disabled="{$profile_tab}">Profile</Tab>        
      <Tab 
        on:click="{() => doTabClick( 2 )}"      
        selected="{$social_selected}" 
        disabled="{$social_tab}">Social</Tab>
      <Tab 
        on:click="{() => doTabClick( 3 )}"      
        selected="{$notes_selected}" 
        disabled="{$notes_tab}">Notes</Tab>
    </TabBar>

    <!-- Views -->
    <!-- Work directly with store -->
    <Summary 
      hidden="{$summary_hidden}"
      disabled="{$summary_disabled}"/>
    <Profile 
      hidden="{$profile_hidden}"
      disabled="{$profile_disabled}"/>
    <Endpoints 
      hidden="{$endpoints_hidden}"
      disabled="{$endpoints_disabled}"/>    
    <Timeline hidden="{$timeline_hidden}"/>
    <Notes hidden="{$notes_hidden}"/>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls 
      mode="{$controls_mode}"
      on:cancelnew="{doCancelNew}"
      on:savenew="{doSaveNew}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
