<script>
import { createEventDispatcher } from 'svelte';

export let data = [];
export let selectable = true;
export let selectedIndex = undefined;
export let selectedItem = undefined;

const dispatch = createEventDispatcher();

function doSelect( item, index ) { 
  if( !selectable ) {
    return;
  }

  selectedItem = item;
  selectedIndex = index;

  dispatch( 'change', {
    item: selectedItem,
    index: selectedIndex
  } );
}
</script>

<style>
ul {
  flex-basis: 0;
  flex-grow: 1;
  list-style: none;
  margin: 0;
  overflow-y: scroll;
  padding: 0;
}

li {
  border-bottom: solid 1px #dcdcdc;
  border-top: solid 1px transparent;  
  margin: 0;
  padding: 0;
}

li:hover {
  background-color: #e5e5e5;
}

li.selected {
  background-color: #dcdcdc;
}

li.selected:first-of-type {
  border-top: solid 1px #c6c6c6;
}

li.selected:hover {
  background-color: #c6c6c6;  
}
</style>

<ul>

  {#each data as item, i}    

    <li 
      on:click="{() => doSelect( item, i )}"
      class:selected="{selectedIndex === i ? true : false}">
      <slot item="{item}"></slot>
    </li>

  {/each}

</ul>
