<script>
import { onMount } from 'svelte';

import Button from './Button.svelte';
import Select from './Select.svelte';
import TextArea from './TextArea.svelte';

export let developer = null;
export let visible = false;

let activity = [];

onMount( async () => {
  activity = await fetch( '/api/activity' )
  .then( ( response ) => response.json() );
} );

function doSave( evt ) {
  evt.preventDefault();
  evt.stopImmediatePropagation();

  console.log( 'Save' );
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
  margin: 16px 0 0 0;
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
  padding: 16px;
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

<div class="panel" style="display: {visible ? 'flex': 'none'}">
  <form on:submit="{doSave}">
    <div class="activity">
      <p>Activity:</p>
      <Select options="{activity}" value="id" label="name"/>      
    </div>
    <TextArea placeholder="What's happening?"/>
    <div class="controls">
      <Button label="Save"/>    
    </div>
  </form>
  <p>Notes</p>
</div>
