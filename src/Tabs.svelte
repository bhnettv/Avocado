<script>
import { onMount } from 'svelte';
import { setContext } from 'svelte';
import { writable } from 'svelte/store';

export let index = 0;

let tabs = [];

const selected = writable( null );

function select( idx ) {
  index = idx;
  selected.set( tabs[index].label );
}

setContext( 'tabs', {
  register( tab ) {
    tabs = [...tabs, tab];
  },
  selected
} );

onMount( () => {
  select( 0 );
} );
</script>

<style>
div {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

ul {
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  flex-direction: row;
  margin: 0 2px 0 0;
  padding: 0;
}

button {
  background: none;
  border: none;
  border-bottom: solid 3px #e0e0e0;
  color: #171717;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 48px;
  line-height: 48px;
  min-width: 125px;
  outline: none;
  transition: all 0.60s;
}

button:disabled {
  border-bottom: solid 3px rgb( 244, 244, 244 );
  color: rgb( 198, 198, 198 );
  cursor: not-allowed;
}

button:not( :disabled ):hover {
  border-bottom: solid 3px rgb( 141, 141, 141 );
}

button.selected {
  border-bottom: solid 3px #0062ff;
  font-weight: 600;
}

button.selected:hover {
  border-bottom: solid 3px #0062ff;
  font-weight: 600;
}
</style>

<ul>

{#each tabs as tab, i}
  <li>
    <button
      class:selected="{index === i ? true : false}"
      disabled="{tab.disabled}"
      on:click="{() => select( i )}">{tab.label}</button>
  </li>
{/each}

</ul>

<div>
	<slot></slot>
</div>
