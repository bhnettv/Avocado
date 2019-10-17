<script>
import { createEventDispatcher } from 'svelte';

export let disabled = true;
export let label = '';
export let selected = false;

const dispatch = createEventDispatcher();

function doClick( evt ) {
  dispatch( 'click' );
}
</script>

<style>
li {
  margin: 0;
  padding: 0;
}

button {
  background: none;
  border: none;
  border-bottom: solid 2px transparent;  
  color: #393939;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 44px;
  margin: 0;
  min-width: 95px;
  outline: none;
  padding: 2px 16px 0 16px;
  transition: all 0.60s;
}

button:disabled {
  color: #c6c6c6;
  cursor: not-allowed;
}

button.selected {
  border-bottom: solid 2px #0062ff;
  color: #171717;
  font-weight: 600;
}

button:not( :disabled ):not( .selected ):hover {
  border-bottom: solid 2px #8d8d8d;   
}
</style>

<li>
  <button 
    class:selected="{selected}" 
    on:click="{doClick}" 
    {disabled}>{label}</button>
</li>
