<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Pagination from './Pagination.svelte';
import Select from './Select.svelte';
import TextArea from './TextArea.svelte';

import { notes_list } from './developers.js';
import { developer_name } from './developers.js';

export let hide = false;
export let disabled = false;

let activity = [];
let activity_id = null;
let index = 0;
let text = '';

onMount( async () => {
  activity = await fetch( '/api/activity' )
  .then( ( response ) => response.json() );
  activity_id = activity[0].id;
} );

function format( updated ) {
  let hours = [
    12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
  ];
  let months = [
    'Jan', 'Feb', 'Mar', 'Apr', 
    'May', 'Jun', 'Jul', 'Aug', 
    'Sep', 'Oct', 'Nov', 'Dec'
  ];
  let now = new Date();
  let result = null;

  if( now.getFullYear() !== updated.getFullYear()  ) {
    result = `${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()}`;
  } else {
    if( updated.getMonth() === now.getMonth() && updated.getDate() === now.getDate() ) {
      result = `${months[updated.getMonth()]} ${updated.getDate()} @ ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )}`;
    } else {
      result = `${months[updated.getMonth()]} ${updated.getDate()}`;
    }
  }

  return result;
}

/*
function doNext( evt ) {
  if( index === ( $notes_list.length - 1 ) ) {
    index = 0;
  } else {
    index = index + 1;
  }
}

function doPrevious( evt ) {
  if( index === 0 ) {
    index = $notes_list.length - 1;
  } else {
    index = index - 1;
  }
}

function doSave( evt ) {
  console.log( {
    developer_id: $developer_id,
    activity_id: activity_id,
    full_text: text
  } );

  fetch( '/api/developer/note', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify( {
      developer_id: $developer_id,
      activity_id: activity_id,
      full_text: text
    } )
  } )
  .then( ( response ) => response.json() )
  .then( ( data ) => {
    $notes_list.push( data );
    $notes_list.sort( ( a, b ) => {
      a = new Date( a.updated_at ).getTime();
      b = new Date( b.updated_at ).getTime();

      if( a < b ) return 1;
      if( a > b ) return -1;
      return 0;
    } );
    $notes_list = $notes_list.slice( 0 );

    index = 0;
    text = '';
  } );
}
*/
</script>

<style>
div.activity {
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  margin: 0 0 16px 0;
  padding: 0;
}

div.controls {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin: 16px 0 0 0;
}

div.none {
  align-items: center;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: center;
}

div.panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

form {
  /* border-bottom: solid 1px #f3f3f3; */
  border-bottom: solid 1px #e0e0e0;  
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 16px 16px 16px 16px;
}

p {
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px; 
  margin: 0 0 8px 0;
  padding: 0;   
}

p.pagination {
  border-right: solid 1px #e0e0e0;
  color: #393939;
  flex-basis: 0;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 47px;
  margin: 0;
  padding: 0 0 0 16px;
}

div.panel.hide {
  display: none;
}
</style>

<div class="panel" class:hide>
  <form>
    <div class="activity">
      <Select 
        label="Activity"
        helper="Where did this take place?"
        options="{activity}" 
        bind:selected="{activity_id}" 
        labelField="name"
        dataField="id"/>      
    </div>
    <TextArea 
      label="Note" 
      helper="Description of the interaction"
      placeholder="What happened?" 
      bind:value="{text}"/>
    <div class="controls">
      <Button 
        icon="/img/save-white.svg"
        disabledIcon="/img/save.svg"
        disabled="{text.trim().length > 0 ? false : true}">Save</Button>    
    </div>
  </form>

  {#if $notes_list.length > 0}

    <div style="flex-grow: 1; padding: 16px;">
      <p>{$notes_list[index].full_text}</p>
    </div>
    <Pagination 
      index="{index + 1}" 
      length="{$notes_list.length}" 
      noun="notes">
      <p class="pagination">{format( new Date( $notes_list[index].updated_at ) )}</p>
      <p class="pagination">{$notes_list[index].activity_name}</p>
    </Pagination>

  {:else}

    <div class="none">
      <p>No notes available for {$developer_name}.</p>
    </div>

  {/if}

</div>
