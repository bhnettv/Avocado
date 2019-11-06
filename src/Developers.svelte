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

// Store
import { organizations } from './developers.js';
import { developer_id } from './developers.js';
import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_image } from './developers.js';
import { developer_organizations } from './developers.js';
import { developer_location } from './developers.js';
import { developer_latitude } from './developers.js';
import { developer_longitude } from './developers.js';
import { developer_description } from './developers.js';
import { developer_public } from './developers.js';
import { notes } from './developers.js';

// View state
let add = false;
let controls = 0;
let developers = [];
let enabled = 0;
let filtered = [];
let index = -1;
let search = '';
let social = 0;
let tab = 0;

// Panels disabled
let endpoints = true;
let profile = true;
let summary = true;

// Changes
let before_organizations = [];

// Filter developer list on search term
function filter() {
  let trimmed = search.trim().toLowerCase();

  if( trimmed.length === 0 ) {
    filtered = developers.slice();
  } else {
    let matches = [];

    for( let a = 0; a < developers.length; a++ ) {
      if( developers[a].name.toLowerCase().indexOf( trimmed ) >= 0 ) {
        matches.push( developers[a] );
      }
    }

    filtered = matches.slice();
  }
}

function refreshOrganization( create = false ) {
  fetch( `/api/developer/${$developer_id}/organization`, {
    method: create === true ? 'POST' : 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( $developer_organizations )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_organizations = data.slice();
    return fetch( '/api/organization' );
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $organizations = data.slice();
  } );
}

// Add clicked
function doAddClick( evt ) {
  add = true;
  tab = 0;
  enabled = 2;
  social = 0;
  summary = false;
  profile = false;
  endpoints = false;
  controls = 1;  

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';
  $developer_latitude = null;
  $developer_longitude = null;
  $developer_description = '';
}

function doCancelExisting( evt ) {
  fetch( `/api/developer/${$developer_id}` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_id = data.id;
    $developer_name = data.name;
    $developer_email = data.email;
    $developer_image = data.image;
    $developer_location = data.location;
    $developer_latitude = data.latitude;
    $developer_longitude = data.longitude;
    $developer_public = data.public;

    fetch( `/api/developer/${$developer_id}/organization` )
    .then( ( response ) => response.json() )
    .then( ( data ) => {
      $developer_organizations = data.slice();
    } );

    add = false;
    enabled = 3;
    social = 1;
    summary = true;
    profile = true;
    endpoints = true;
    controls = 2;    
  } );
}

function doCancelNew( evt ) {
  add = false;
  tab = 0;
  enabled = 0;
  social = 0;
  summary = true;
  profile = true;
  endpoints = true;
  controls = 0;  

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';
  $developer_latitude = null;
  $developer_longitude = null;
  $developer_description = '';
  $developer_public = 0;
}

function doDelete( evt ) {
  fetch( `/api/developer/${$developer_id}`, {
    method: 'DELETE'
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    for( let a = 0; a < developers.length; a++ ) {
      if( developers[a].id === $developer_id ) {
        developers.splice( a, 1 );
        break;
      }
    }

    filter();

    $developer_id = null;
    $developer_name = '';
    $developer_email = '';
    $developer_image = '';
    $developer_organizations = [];
    $developer_location = '';
    $developer_latitude = null;
    $developer_longitude = null;
    $developer_description = '';
    $developer_public = 0;

    add = false;
    enabled = 0;
    social = 1;
    summary = true;
    profile = true;
    endpoints = true;
    controls = 0;     
  } ); 
}

function doDeveloperClick( evt ) {
  fetch( `/api/developer/${evt.detail.item.id}` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_id = data.id;
    $developer_name = data.name === null ? '' : data.name;
    $developer_email = data.email === null ? '' : data.email;
    $developer_image = data.image === null ? '' : data.image;
    $developer_location = data.location === null ? '' : data.location;
    $developer_latitude = data.latitude;
    $developer_longitude = data.longitude;
    $developer_description = data.description === null ? '' : data.description;
    $developer_public = data.public;

    fetch( `/api/developer/${$developer_id}/organization` )
    .then( ( response ) => response.json() )
    .then( ( data ) => { 
      $developer_organizations = data.slice();
    } );

    enabled = 3;
    social = 1;
    summary = true;
    profile = true;
    endpoints = true;
    controls = 2;
  } );

  fetch( `/api/developer/${evt.detail.item.id}/note` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $notes = data.slice();
  } );
}

function doEdit( evt ) {
  add = true;
  enabled = 3;
  social = 0;
  summary = false;
  profile = false;
  endpoints = false;
  controls = 3;
}

function doSaveExisting( evt ) {
  console.log( $developer_organizations );

  let developer = {
    id: $developer_id,
    name: $developer_name.trim().length === 0 ? null : $developer_name.trim(),
    email: $developer_email.trim().length === 0 ? null : $developer_email.trim(),
    description: $developer_description.trim().length === 0 ? null : $developer_description.trim(),
    image: $developer_image.trim().length === 0 ? null : $developer_image.trim(),
    location: $developer_location.trim().length === 0 ? null : $developer_location.trim(),
    latitude: $developer_location.trim().length === 0 ? null : $developer_latitude,
    longitude: $developer_location.trim().length === 0 ? null : $developer_longitude,
    public: $developer_public
  };

  fetch( `/api/developer/${$developer_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( developer )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    add = false;
    enabled = 3;
    social = 1;
    summary = true;
    profile = true;
    endpoints = true;
    controls = 2;    

    refreshOrganization( false );

    $developer_latitude = data.latitude === null ? null : data.latitude;
    $developer_longitude = data.longitude === null ? null : data.longitude;

    for( let a = 0; a < developers.length; a++ ) {
      if( developers[a].id === developer.id ) {
        developers[a] = Object.assign( {}, developer );
        filter();
        break;
      }
    }
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
      description: $developer_description.trim().length > 0 ? $developer_description : null,      
      image: $developer_image.trim().length > 0 ? $developer_image : null,
      location: $developer_location.trim().length > 0 ? $developer_location : null,      
      latitude: null,      
      longitude: null,
      public: $developer_public
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $developer_id = data.id;
    $developer_latitude = data.latitude === null ? null : data.latitude;
    $developer_longitude = data.longitude === null ? null : data.longitude;
    developers.push( Object.assign( {}, data ) );
    developers.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;
      return 0;
    } );
    developers = developers.slice();
    filter();

    refreshOrganization( true );

    add = false;
    enabled = 3;
    summary = true;
    profile = true;
    endpoints = true;
    controls = 2;
  } );
}

// Load external data
onMount( async () => {
  fetch( '/api/developer' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    developers = data.slice();
    filter();    
  } );

  fetch( '/api/organization' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $organizations = data.slice();
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
      <Search bind:value="{search}" on:keyup="{filter}"/>
      <Button
        on:click="{doAddClick}"
        icon="/img/add-white.svg"
        disabledIcon="/img/add.svg"
        disabled="{add}">Add</Button>
    </div>

    <!-- Developer list -->
    <h4>Developers</h4>
    <List 
      bind:selectedIndex="{index}"
      on:change="{doDeveloperClick}"
      data="{filtered}" 
      let:item="{developer}">
      <ListLabelItem label="{developer.name}"/>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Organizations">
      <List 
        data="{$organizations}" 
        let:item="{organization}">
        <ListCountItem label="{organization.name}" count="{organization.count}"/>
      </List>
    </Details>

  </aside>

  <!-- Center panel -->
  <article>

    <!-- Tabs -->
    <TabBar>
      <Tab 
        on:click="{() => tab = 0}"
        selected="{tab === 0 ? true : false}">Summary</Tab>
      <Tab 
        on:click="{() => tab = 1}"      
        selected="{tab === 1 ? true : false}"
        disabled="{enabled >= 1 ? false : true}">Profile</Tab>        
      <Tab 
        on:click="{() => tab = 2}"      
        selected="{tab === 2 ? true : false}" 
        disabled="{enabled >= 2 ? false : true}">Social</Tab>
      <Tab 
        on:click="{() => tab = 3}"      
        selected="{tab === 3 ? true : false}" 
        disabled="{enabled >= 3 ? false : true}">Notes</Tab>
    </TabBar>

    <!-- Views -->
    <!-- Work directly with store -->
    <Summary 
      hidden="{tab === 0 ? false : true}"
      disabled="{summary}"/>
    <Profile 
      hidden="{tab === 1 ? false : true}"
      disabled="{profile}"/>
    <Endpoints 
      hidden="{social === 0 && tab === 2 ? false : true}"
      disabled="{endpoints}"/>    
    <Timeline 
      hidden="{social === 1 && tab === 2 ? false : true}"/>
    <Notes 
      hidden="{tab === 3 ? false : true}"/>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls 
      hidden="{tab === 3 ? true : false}"
      mode="{controls}"
      on:cancelnew="{doCancelNew}"
      on:savenew="{doSaveNew}"
      on:edit="{doEdit}"
      on:cancelexisting="{doCancelExisting}"
      on:saveexisting="{doSaveExisting}"
      on:delete="{doDelete}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
