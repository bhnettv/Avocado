<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Controls from './Controls.svelte';
import Details from './Details.svelte';
import Endpoints from './Endpoints.svelte';
import List from './List.svelte';
import ListLabelItem from './ListLabelItem.svelte';
import ListCountItem from './ListCountItem.svelte';
import Overview from './Overview.svelte';
import Notes from './Notes.svelte';
import Search from './Search.svelte';
import Tab from './Tab.svelte';
import TabBar from './TabBar.svelte';
import Timeline from './Timeline.svelte';

import Summary from './Summary.svelte';
import Profile from './Profile.svelte';

import { search } from './developers.js';
import { developer_list } from './developers.js';
import { developer_index } from './developers.js';
import { label_list } from './developers.js';
import { label_index } from './developers.js';
import { skill_list } from './developers.js';
import { add_disabled } from './developers.js';
import { tab_index } from './developers.js';
import { social_disabled } from './developers.js';
import { social_index } from './developers.js';
import { notes_disabled } from './developers.js';
import { notes_list } from './developers.js';
import { overview_disabled } from './developers.js';
import { developer_id } from './developers.js';
import { developer_name } from './developers.js';
import { developer_email } from './developers.js';
import { developer_image } from './developers.js';
import { developer_labels } from './developers.js';
import { developer_skills } from './developers.js';
import { developer_description } from './developers.js';
import { controls_mode } from './developers.js';

// Load external data
onMount( async () => {
  $developer_list = await fetch( '/api/developer' )
  .then( ( response ) => response.json() );

  $label_list = await fetch( '/api/label' )
  .then( ( response ) => response.json() );

  $skill_list = await fetch( '/api/skill' )
  .then( ( response ) => response.json() );  
} );

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
      <Search/>
      <Button
        icon="/img/add-white.svg"
        disabledIcon="/img/add.svg"
        on:click="{doAdd}"
        disabled="{$add_disabled}">Add</Button>
    </div>

    <!-- Developer list -->
    <h4>Developers</h4>
    <List 
      data="{$developer_list}" 
      let:item="{developer}" 
      on:change="{( evt ) => doDeveloper( evt )}">
      <ListLabelItem>{developer.name}</ListLabelItem>
    </List>

    <!-- Label list -->
    <!-- Collapsable -->
    <Details summary="Organizations">
      <List 
        data="{$label_list}" 
        let:item="{label}" 
        on:change="{( evt ) => console.log( evt.detail )}">
        <ListCountItem>
          <span slot="label">{label.name}</span>
          <span slot="count">{label.count}</span>
        </ListCountItem>      
      </List>
    </Details>

  </aside>

  <!-- Center panel -->
  <article>

    <!-- Tabs -->
    <TabBar>
      <Tab 
        on:click="{() => $tab_index = 0}"
        selected="{$tab_index === 0 ? true : false}">Summary</Tab>
      <Tab 
        on:click="{() => $tab_index = 1}"
        selected="{$tab_index === 1 ? true : false}">Profile</Tab>        
      <Tab 
        on:click="{() => $tab_index = 2}"
        selected="{$tab_index === 2 ? true : false}" 
        disabled="{$social_disabled}">Social</Tab>
      <Tab 
        on:click="{() => $tab_index = 3}"
        selected="{$tab_index === 3 ? true : false}" 
        disabled="{$notes_disabled}">Notes</Tab>
    </TabBar>

    <!-- Views -->
    <!-- Work directly with store -->
    <!-- <Overview/> -->
    <!-- <Profile/> -->
    <Summary/>
    <Endpoints/>    
    <Timeline/>
    <Notes/>

    <!-- Controls -->
    <!-- Cancel, Save, Edit, Delete -->
    <Controls 
      on:cancelnew="{doCancelNew}" 
      on:savenew="{doSaveNew}"
      on:edit="{doEdit}"
      on:delete="{doDelete}"
      on:saveexisting="{doSaveExisting}"
      on:cancelexisting="{doCancelExisting}"/>

  </article>

  <!-- Right panel -->
  <!-- Statistics -->
  <aside></aside>

</div>
