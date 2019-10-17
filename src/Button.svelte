<script>
import { createEventDispatcher } from 'svelte';

export let disabled = false;
export let icon = null;
export let disabledIcon = null;
export let label = '';
export let kind = 'primary';
export let title = '';
export let visible = true;

const dispatch = createEventDispatcher();

function doClick( evt ) {
  dispatch( 'click', null );
}
</script>

<style>
button {
  background: none;
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;
  border: solid 3px transparent;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 48px;
  margin: 0;
  outline: solid 1px transparent;
  outline-offset: -4px;
  padding: 0 60px 0 16px;
  position: relative;
}

button:disabled {
  cursor: not-allowed;
}

.primary {
  background-color: #0062ff;
  color: #ffffff;
}

.primary:active {
  background-color: #002d9c;
  border-color: #0062ff;
}

.primary:disabled {
  background-color: #bebebe;
  color: #8c8c8c;
}

.primary:focus {
  background-color: #0062ff;
  outline-color: #ffffff;
}

.primary:disabled:hover {
  background-color: #bebebe;
  color: #8c8c8c;
}

.primary:hover {
  background-color: #0353e9;
}

.secondary {
  background-color: #3d3d3d;
  color: #ffffff;
}

.secondary:active {
  background-color: #6f6f6f;
  border-color: #0062ff;
}

.secondary:disabled {
  background-color: #bebebe;
  color: #8c8c8c;
}

.secondary:focus {
  background-color: #3d3d3d;
  border-color: #0062ff;
  outline-color: #ffffff;
}

.secondary:disabled:hover {
  background-color: #bebebe;
  color: #8c8c8c;
}

.secondary:hover {
  background-color: #4c4c4c;
}
</style>

{#if icon === null}

<button 
  type="button" 
  {disabled}
  title="{title}"
  class="{kind}"
  style="display: {visible ? 'block' : 'none'}"  
  on:click="{doClick}">{label}</button>

{:else}

<button 
  type="button" 
  {disabled}
  title="{title}"
  class="{kind}"
  style="background-image: url( {disabled ? disabledIcon : icon} ); display: {visible ? 'block' : 'none'}"
  on:click="{doClick}">{label}</button>

{/if}
