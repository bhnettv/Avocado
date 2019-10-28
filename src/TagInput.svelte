<script>
import Menu from './Menu.svelte';

export let characters = 3;
export let data = [];
export let disabled = false;
export let label = undefined;
export let labelField = 'label';
export let limit = 4;
export let placeholder = '';
export let value = [];

let focus = false;
let height = 0;
let menu = [];

function doBlur() {
  menu = [];
  focus = false;
}

function doKeyboard( evt ) {
  if( evt.keyCode === 13 ) {
    evt.preventDefault();

    let found = false;
    let tags = [];

    if( evt.target.value.indexOf( ',' ) > 0 ) {
      tags = evt.target.value.split( ',' );
    } else {
      tags = [evt.target.value];
    }

    for( let t = 0; t < tags.length; t++ ) {
      for( let v = 0; v < value.length; v++ ) {
        if( value[v] === tags[t].trim() ) {
          found = true;
          break;
        }
      }

      if( !found ) {
        value.push( tags[t] );
      }
    }

    value = value.splice( 0 );
    evt.target.value = '';
  }

  if( evt.keyCode === 8 && evt.target.value.trim().length === 0 ) {
    value.pop();
    value = value.slice( 0 );
  }

  if( evt.target.value.trim().length >= characters ) {
    menu = [];

    for( let a = 0; a < data.length; a++ ) {
      if( data[a][labelField].toLowerCase().indexOf( evt.target.value.toLowerCase().trim() ) > -1 ) {
        menu.push( data[a] );
      }
    }

    menu = menu.slice( 0, limit );
  }
}

function doRemove( evt ) {
  let index = evt.target.getAttribute( 'data-id' );

  value.splice( index, 1 );
  value = [...value];
}
</script>

<style>
button {
  background: none;
  background-image: url( /img/close-white.svg );
  background-position: center;
  background-repeat: no-repeat;
  background-size: 14px;
  border: none;
  cursor: pointer;
  height: 20px;
  margin: 2px 2px 0 3px;
  outline: none;
  padding: 0;
  width: 20px;
}

div.control {
  display: flex;
  flex-direction: column;
  flex-grow: 1; 
  position: relative;
}

div.content {
  background-color: #f4f4f4;
  border-bottom: solid 1px #8d8d8d;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-wrap: wrap;
  min-height: 39px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;  
  padding: 0 16px 0 16px;  
}

div.tag {
  background-color: #393939;
  border-radius: 12px;
  display: inline-flex;  
  height: 24px;
  margin: 8px 8px 0 0;
  padding: 0 0 0 8px; 
}

input {
  background: none;
  border: none;
  color: #161616;
  display: block;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 40px;
  margin: 0;
  outline: none;
  padding: 0;
}

input:disabled {
  cursor: not-allowed;
}

label {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

p {
  color: #ffffff;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;  
  line-height: 24px;
  margin: 0;
  padding: 0;
}

.content.disabled {
  border-bottom: solid 1px transparent !important;
  cursor: not-allowed;
  outline: none;  
}

.focus {
  outline: solid 2px #0062ff !important;
}

.tag.disabled {
  cursor: not-allowed;
  padding: 0 9px 0 8px;
}
</style>

<div class="control" bind:clientHeight="{height}">

  {#if label !== undefined}

    <label style="color: {disabled ? '#c6c6c6' : '#393939'}">{label}</label>

  {/if}

  <div class="content" class:focus="{focus}" class:disabled="{disabled}">

    {#each value as tag, t}
      <div class="tag" class:disabled="{disabled}">
        <p>{tag}</p>
        <button 
          data-id="{t}" 
          type="button" 
          on:click="{doRemove}" 
          style="display: {disabled ? 'none' : 'initial'};"></button>
      </div>
      
    {/each}

    <input 
      placeholder="{placeholder}" 
      on:keydown="{doKeyboard}" 
      on:focus="{() => focus = true}"
      on:blur="{doBlur}"
      {disabled}>

  </div>

  {#if data.length > 0}

    <Menu data="{menu}" top="{height + 3}" labelField="name"/>
  
  {/if}

</div>
