<script>
import { createEventDispatcher } from 'svelte';

export let collapse = false;
export let disabled = false;
export let helper = undefined;
export let label = undefined;
export let placeholder = '';
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

  if( collapse ) {
    if( value.trim().length === 0 ) {
      evt.target.classList.add( 'collapse' );
    }
  }
}

function doFocus( evt ) {
  original = evt.target.value.trim();

  if( collapse ) {
    evt.target.classList.remove( 'collapse' );
  }
}
</script>

<style>
div {
  display: flex;
  flex-basis: 0;  
  flex-direction: column;
  flex-grow: 1;
}

label {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

textarea {
  background: none;
  background-color: #f4f4f4;
  border: none;  
  border-bottom: solid 1px #8d8d8d;
  color: #161616;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  /* min-height: 79px; */
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 11px 16px 11px 16px;
}

textarea.collapse {
  height: 39px;
  line-height: 40px;
  min-height: 39px;
  padding: 0 16px 0 16px;
}

textarea:disabled {
  border-bottom: solid 1px #f4f4f4;  
  cursor: not-allowed;
  outline: none;
}

textarea:focus {
  outline: solid 2px #0062ff;
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

  <textarea 
    {disabled} 
    on:blur="{doBlur}"
    on:focus="{doFocus}"
    class:collapse="{collapse}"
    placeholder="{placeholder}" 
    bind:value="{value}"></textarea>

</div>
