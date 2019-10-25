<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Select from './Select.svelte';
import TextArea from './TextArea.svelte';

import { tab_index } from './stores.js';
import { developer_id } from './stores.js';

export let developer = null;
export let visible = false;

let activity = [];
let activity_id = null;
let text = '';

onMount( async () => {
  activity = await fetch( '/api/activity' )
  .then( ( response ) => response.json() );
  activity_id = activity[0].id;
} );

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
    text = '';
  } );
}
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
  margin: 24px 0 0 0;
}

div.panel {
  display: none;
  flex-direction: column;
  flex-grow: 1;
}

form {
  border-bottom: solid 1px #f3f3f3;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 24px 16px 16px 16px;
}

p {
  color: #565656;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 40px;
  margin: 0;
  padding: 0 16px 0 0;
}
</style>

<div class="panel" style="display: {$tab_index === 2 ? 'flex': 'none'}">
  <form>
    <div class="activity">
      <p>Where:</p>
      <Select 
        options="{activity}" 
        bind:selected="{activity_id}" 
        value="id" 
        label="name"/>      
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
        disabled="{text.trim().length > 0 ? false : true}"        
        on:click="{doSave}">Save</Button>    
    </div>
  </form>
  <p>Notes</p>
</div>
