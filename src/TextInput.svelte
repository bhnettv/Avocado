<script>
import { createEventDispatcher } from 'svelte';

export let disabled = false;
export let label = undefined;
export let helper = undefined;
export let placeholder = 'Text input';
export let value = '';

const dispatch = createEventDispatcher();

let original = undefined;

function doBlur( evt ) {
  if( original !== evt.target.value.trim() ) {
    dispatch( 'change', {
      original: original,
      value: evt.target.value.trim()
    } );
  }
}

function doFocus( evt ) {
  original = evt.target.value.trim();
}
</script>

<style>
div {
  display: flex;
  flex-basis: 0;
  flex-direction: column;
  flex-grow: 1;
}

input {
  background: none;
  background-color: #f4f4f4;
  border: none;  
  border-bottom: solid 1px #8d8d8d;
  color: #161616;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 39px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 0 16px 0 16px;
}

input:disabled {
  border-bottom: solid 1px #f4f4f4;  
  cursor: not-allowed;
  outline: none;
}

input:focus {
  outline: solid 2px #0062ff;
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
  color: #6f6f6f;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: -6px 0 8px 0;
}
</style>

<div>

  {#if label !== undefined}
    <label style="color: {disabled ? '#c6c6c6' : '#393939'}">{label}</label>
  {/if}

  {#if helper !== undefined}
    <p style="color: {disabled ? '#c6c6c6' : '#6f6f6f'}">{helper}</p>
  {/if}

  <input 
    on:blur="{doBlur}"
    on:focus="{doFocus}"    
    placeholder="{placeholder}" 
    bind:value="{value}" 
    {disabled}>

</div>
