<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Details from './Details.svelte';
import List from './List.svelte';
import ListLabelItem from './ListLabelItem.svelte';
import ListCountItem from './ListCountItem.svelte';
import ListRemoveItem from './ListRemoveItem.svelte';
import Profile from './Profile.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Social from './Social.svelte';
import Summary from './Summary.svelte';
import Tab from './Tab.svelte';
import TabBar from './TabBar.svelte';

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
import { developer_roles } from './developers.js';
import { developer_languages } from './developers.js';
import { developer_skills } from './developers.js';
import { social } from './developers.js';
import { notes } from './developers.js';

// View state
let add = false;
let developers = [];
let enabled = 0;
let filtered = [];
let index = 0;
let search = '';
let tab = 0;

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

// Add clicked
function doAddClick( evt ) {
  fetch( '/api/developer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( {
      id: null,
      name: 'New Developer',
      email: null,
      description: null,
      image: null,
      location: null,
      latitude: null,
      longitude: null,
      public: 0
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    tab = 0;

    $developer_id = data.id;
    $developer_name = data.name;
    $developer_email = '';
    $developer_image = '';
    $developer_organizations = [];
    $developer_location = '';
    $developer_latitude = null;
    $developer_longitude = null;
    $developer_description = '';
    $developer_public = data.public;

    $developer_roles = [];
    $developer_languages = [];
    $developer_skills = [];

    developers.push( Object.assign( {}, data ) );
    developers.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;
      return 0;
    } );

    filter();

    for( let f = 0; f < filtered.length; f++ ) {
      if( filtered[f].id === $developer_id ) {
        index = f;
        break;
      }
    }
  } );
}

function doDeveloperClick( evt ) {
  fetch( `/api/developer/${evt.detail.item.id}` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    console.log( data );
    $developer_id = data.id;
    $developer_name = data.name === null ? '' : data.name;
    $developer_email = data.email === null ? '' : data.email;
    $developer_image = data.image === null ? '' : data.image;
    $developer_location = data.location === null ? '' : data.location;
    $developer_latitude = data.latitude;
    $developer_longitude = data.longitude;
    $developer_description = data.description === null ? '' : data.description;
    $developer_public = data.public;
  } );

  fetch( `/api/developer/${evt.detail.item.id}/organization` )
  .then( ( response ) => response.json() )
  .then( ( data ) => { 
    $developer_organizations = data.slice();
  } );

  fetch( `/api/developer/${evt.detail.item.id}/role` )
  .then( ( response ) => response.json() )
  .then( ( data ) => { 
    $developer_roles = data.slice();
  } );  

  fetch( `/api/developer/${evt.detail.item.id}/language` )
  .then( ( response ) => response.json() )
  .then( ( data ) => { 
    $developer_languages = data.slice();
  } );    

  fetch( `/api/developer/${evt.detail.item.id}/skill` )
  .then( ( response ) => response.json() )
  .then( ( data ) => { 
    $developer_skills = data.slice();
  } );      

  fetch( `/api/developer/${evt.detail.item.id}/social` )
  .then( ( response ) => response.json() )
  .then( ( data ) => { 
    $social = data.slice();
  } );        

  fetch( `/api/note/developer/${evt.detail.item.id}` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $notes = data.slice();
  } );
}

function doDeveloperChange( evt ) {
  for( let d = 0; d < developers.length; d++ ) {
    if( developers[d].id === evt.detail.id ) {
      developers[d] = Object.assign( {}, evt.detail );
      break;
    }
  }

  developers.sort( ( a, b ) => {
    if( a.name > b.name ) return 1;
    if( a.name < b.name ) return -1;
    return 0;
  } );  

  filter();

  for( let f = 0; f < filtered.length; f++ ) {
    if( filtered[f].id === evt.detail.id ) {
      index = f;
      break;
    }
  }
}

function doDeveloperRemove( evt ) {
  let later = index;

  // Remove from database
  fetch( `/api/developer/${evt.id}`, {
    method: 'DELETE'
  } )
  .then( ( response ) => response.json() )
  .then( async ( data ) => {
    // Remove from list of developers
    for( let a = 0; a < developers.length; a++ ) {
      if( developers[a].id === data.id ) {
        developers.splice( a, 1 );
        break;
      }
    }

    // In order to reset list
    filter();

    // Force reselect
    // index = later;
  } ); 
}

// Load external data
onMount( async () => {
  fetch( '/api/developer' )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    developers = data.slice();

    $developer_id = data[0].id;
    $developer_name = data[0].name === null ? '' : data[0].name;
    $developer_email = data[0].email === null ? '' : data[0].email;
    $developer_image = data[0].image === null ? '' : data[0].image;
    $developer_location = data[0].location === null ? '' : data[0].location;
    $developer_latitude = data[0].latitude;
    $developer_longitude = data[0].longitude;
    $developer_description = data[0].description === null ? '' : data[0].description;
    $developer_public = data[0].public;

    filter();    

    fetch( `/api/note/developer/${$developer_id}` )
    .then( ( response ) => response.json() )
    .then( ( data ) => {
      $notes = data.slice();
    } );

    fetch( `/api/developer/${$developer_id}/organization` )
    .then( ( response ) => response.json() )
    .then( ( data ) => { 
      $developer_organizations = data.slice();
    } );
    
    fetch( `/api/developer/${$developer_id}/role` )
    .then( ( response ) => response.json() )
    .then( ( data ) => { 
      $developer_roles = data.slice();
    } );    

    fetch( `/api/developer/${$developer_id}/language` )
    .then( ( response ) => response.json() )
    .then( ( data ) => { 
      $developer_languages = data.slice();
    } );    

    fetch( `/api/developer/${$developer_id}/skill` )
    .then( ( response ) => response.json() )
    .then( ( data ) => { 
      $developer_skills = data.slice();
    } );        

    fetch( `/api/developer/${$developer_id}/social` )
    .then( ( response ) => response.json() )
    .then( ( data ) => {
      console.log( data );
    } );
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
      <ListRemoveItem 
        label="{developer.name}" 
        on:click="{() => doDeveloperRemove( developer )}"/>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Organizations">
      <List 
        data="{$organizations}" 
        let:item="{organization}">
        <ListCountItem 
          label="{organization.name}" 
          count="{organization.count}"/>
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
        selected="{tab === 1 ? true : false}">Profile</Tab>        
      <Tab 
        on:click="{() => tab = 2}"      
        selected="{tab === 2 ? true : false}">Social</Tab>
      <Tab 
        on:click="{() => tab = 3}"      
        selected="{tab === 3 ? true : false}">Notes</Tab>
    </TabBar>

    <!-- Views -->
    <!-- Work directly with store -->
    <Summary 
      hidden="{tab === 0 ? false : true}" 
      on:change="{doDeveloperChange}"/>
    <Profile hidden="{tab === 1 ? false : true}"/>
    <Social hidden="{tab === 2 ? false : true}" data="{$social}"/>
    <Notes hidden="{tab === 3 ? false : true}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
