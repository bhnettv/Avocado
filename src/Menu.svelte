<script>
import { createEventDispatcher } from 'svelte';

export let data = [];
export let labelField = 'label';
export let selectedIndex = undefined;
export let selectedItem = undefined;
export let top = 0;

const dispatch = createEventDispatcher();

function doSelect( item, index ) {
  console.log( 'Menu select' );

  selectedIndex = index;
  selectedItem = item;

  dispatch( 'select', {
    index: index,
    item: item,
    label: item[labelField]
  } );
}
</script>

<style>
button {
  background: none;
  border: none;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 40px;
  text-align: left;
  width: 100%;
}

ul {
  background-color: #f4f4f4;
  box-shadow: 0 2px 6px 0 rgba( 0, 0, 0, 0.3 );
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  width: 100%;
  z-index: 100;
}

li {
  outline: solid 2px transparent;    
  outline-offset: -2px;    
  width: 100%;
}

li.selected {
  background-color: #e5e5e5; 
  outline: solid 2px #0062ff;  
}

li:hover {
  background-color: #e5e5e5;
}
</style>

<ul style="display: {data.length > 0 ? 'flex' : 'none'}; top: {top}px;">

  {#each data as item, i}    

    <li class:selected="{selectedIndex === i ? true : false}">
      <button 
        on:click="{() => doSelect( item, i )}" 
        type="button">{item[labelField]}</button>
    </li>

  {/each}

</ul>