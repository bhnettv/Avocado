<script>
import { createEventDispatcher } from 'svelte';

export let selectedIndex = 0;

const dispatch = createEventDispatcher();

function doTabClick( evt ) {
  selectedIndex = parseInt( evt.target.getAttribute( 'data-index' ) );
  dispatch( 'tab', selectedIndex );
}
</script>

<style>
div {
  border-bottom: solid 1px #f3f3f3;
}

button {
  background: none;
  border: none;
  border-bottom: solid 2px transparent;  
  color: #565656;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 44px;
  margin: 0;
  outline: none;
  padding: 2px 16px 0 16px;
  transition: all 0.60s;
}

button.selected {
  border-bottom: solid 2px #0062ff;
  color: #171717;
}
</style>

<div>
  <button 
    data-index="0"
    class:selected="{selectedIndex === 0}"
    on:click="{doTabClick}">Overview</button>
  <button 
    data-index="1"  
    class:selected="{selectedIndex === 1}"
    on:click="{doTabClick}">Social</button>
  <button 
    data-index="2"  
    class:selected="{selectedIndex === 2}"
    on:click="{doTabClick}">Notes</button>
</div>
