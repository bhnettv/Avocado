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

import { controls_hidden } from './developers.js';
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
  
  $summary_selected = true;
  $profile_selected = false;
  $social_selected = false;
  $notes_selected = false;

  $summary_tab = false;
  $profile_tab = false;
  $social_tab = false;
  $notes_tab = true;

  $summary_disabled = false;
  $profile_disabled = false;
  $endpoints_disabled = false;

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';

  controls_hidden.set( false );
  controls_mode.set( 1 );
}

function doCancelNew( evt ) {
  $add_disabled = false;

  $summary_selected = true;
  $profile_selected = false;
  $social_selected = false;
  $notes_selected = false;

  $summary_tab = false;
  $profile_tab = true;
  $social_tab = true;
  $notes_tab = true;

  $summary_disabled = true;
  $profile_disabled = true;
  $endpoints_disabled = true;

  $developer_id = null;
  $developer_name = '';
  $developer_email = '';
  $developer_image = '';
  $developer_organizations = [];
  $developer_location = '';

  $controls_hidden = true;
  $controls_mode = 0;
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
    $developer_list.push( data );
    $developer_list.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;
      return 0;
    } );
    $developer_list = $developer_list.slice();
    filter( $developer_list, $search_term, $filtered_list );

    $add_disabled = false;

    $summary_tab = false;
    $profile_tab = false;
    $social_tab = false;
    $notes_tab = false;

    $summary_disabled = true;
    $profile_disabled = true;
    $endpoints_disabled = true;

    $controls_mode = 2;
    $controls_hidden = true;
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

      $controls_hidden = false;
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
      
      $controls_hidden = false;      
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
      
      $controls_hidden = false;
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

      $controls_hidden = true;
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

/*
// Add new developer
function doAdd( evt ) {
  $add_disabled = true;
  $tab_index = 0;
  $social_disabled = false;
  $notes_disabled = true;
  $overview_disabled = false;
  $developer_id = '';
  $developer_name = '';
  $developer_email = '';
  $developer_description = '';
  $developer_image = ''; 
  $social_index = 0;  
  $controls_mode = 1;
}

// Edit existing developer
function doEdit( evt ) {
  $overview_disabled = false;
  $social_index = 0;
  $controls_mode = 3;
}

// Cancel editing a developer
function doCancelExisting( evt ) {
  $overview_disabled = true;
  $social_index = 1;
  $controls_mode = 2;  

  $developer_name = $developer_list[$developer_index].name === null ? '' : $developer_list[$developer_index].name;
  $developer_email = $developer_list[$developer_index].email === null ? '' : $developer_list[$developer_index].email;
  $developer_description = $developer_list[$developer_index].description === null ? '' : $developer_list[$developer_index].description;
  $developer_image = $developer_list[$developer_index].image === null ? '' : $developer_list[$developer_index].image;
}

// Cancel adding a developer
function doCancelNew( evt ) {
  $add_disabled = false;
  $tab_index = 0;
  $social_disabled = true;
  $overview_disabled = true;
  $social_index = 1;
  $controls_mode = 0;
  $developer_labels = [];
  $developer_skills = [];
}

// Delete existing developer
function doDelete( evt ) {
  fetch( `/api/developer/${$developer_id}`, {
    method: 'DELETE'
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    for( let d = 0; d < $developer_list.length; d++ ) {
      if( $developer_list[d].id === data.id ) {
        $developer_list.splice( d, 1 );
        $developer_list = $developer_list.slice( 0 );
        break;
      }
    }

    $social_disabled = true;
    $notes_disabled = true;
    $overview_disabled = true;
    $developer_id = '';
    $developer_name = '';
    $developer_email = '';
    $developer_labels = [];
    $developer_description = '';
    $developer_image = ''; 
    $social_index = 0;    
    $controls_mode = 0;
  } )
}

// Show existing developer
function doDeveloper( evt ) {
  let id = evt.detail.item.id;

  for( let d = 0; d < $developer_list.length; d++ ) {
    if( id === $developer_list[d].id ) {
      $developer_index = d;
      break;
    }
  }

  $add_disabled = false;

  $overview_disabled = true;
  $social_disabled = false;
  $social_index = 1;
  $notes_disabled = false;

  $developer_id = id;
  $developer_name = $developer_list[$developer_index].name === null ? '' : $developer_list[$developer_index].name;
  $developer_email = $developer_list[$developer_index].email === null ? '' : $developer_list[$developer_index].email;
  $developer_description = $developer_list[$developer_index].description === null ? '' : $developer_list[$developer_index].description;
  $developer_image = $developer_list[$developer_index].image === null ? '' : $developer_list[$developer_index].image;
  
  $controls_mode = 2;

  fetch( `/api/developer/${$developer_id}/label` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    let labels = [];

    for( let a = 0; a < data.length; a++ ) {
      labels.push( data[a].name );
    }

    $developer_labels = labels.slice( 0 );
  } );

  fetch( `/api/developer/${$developer_id}/note` )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $notes_list = data.slice( 0 );
  } );
}

// Save exissting developer
function doSaveExisting( evt ) {
  $add_disabled = false;
  $social_disabled = false;
  $overview_disabled = true;
  $social_index = 1;
  $notes_disabled = false;
  $controls_mode = 2;  

  let developer = {
    name: $developer_name,
    email:  $developer_email.trim().length === 0 ? null : $developer_email,
    description: $developer_description.trim().length === 0 ? null : $developer_description,
    image: $developer_image.trim().length === 0 ? null : $developer_image
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
    for( let d = 0; d < $developer_list.length; d++ ) {
      if( $developer_list[d].id === data.id ) {
        $developer_list[d] = data;
        break;
      }
    }

    $developer_list.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;

      return 0;
    } );
    $developer_list = $developer_list.slice( 0 );
  } );
}

// Save new developer
function doSaveNew( evt ) {
  $add_disabled = false;
  $tab_index = 0;
  $social_disabled = false;
  $overview_disabled = true;
  $social_index = 1;
  $notes_disabled = false;
  $controls_mode = 2;  

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
  .then( async ( data ) => {
    $developer_list.push( data );
    $developer_list.sort( ( a, b ) => {
      if( a.name > b.name ) return 1;
      if( a.name < b.name ) return -1;

      return 0;
    } );
    $developer_list = $developer_list.slice( 0 );
    $developer_id = data.id;

    let later = [];

    for( let a = 0; a < $developer_labels.length; a++ ) {
      let found = false;
      let label_id = null;

      for( let b = 0; b < $label_list.length; b++ ) {
        if( $developer_labels[a] === $label_list[b].name ) {
          found = true;
          label_id = $label_list[b].id;
          break;
        }
      }

      if( !found ) {
        let label = await fetch( '/api/label', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify( {
            name: $developer_labels[a]
          } )
        } )
        .then( ( response ) => response.json() );

        later.push( label );
        label_id = label.id;
      }

      await fetch( `/api/developer/${$developer_id}/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          label_id: label_id
        } )
      } );      
    }

    for( let a = 0; a < later.length; a++ ) {
      $label_list.push( later[a] );
      $label_list.sort();
      $label_list = $label_list.slice( 0 );
    }
  } );
}
*/
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
      hide="{$summary_hidden}"
      disabled="{$summary_disabled}"/>
    <Profile 
      hide="{$profile_hidden}"
      disabled="{$profile_disabled}"/>
    <Endpoints 
      hide="{$endpoints_hidden}"
      disabled="{$endpoints_disabled}"/>    
    <Timeline hide="{$timeline_hidden}"/>
    <Notes hide="{$notes_hidden}"/>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls 
      mode="{$controls_mode}"
      hidden="{$controls_hidden}"
      on:cancelnew="{doCancelNew}"
      on:savenew="{doSaveNew}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
