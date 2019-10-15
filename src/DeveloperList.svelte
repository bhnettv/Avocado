<script>
import { createEventDispatcher } from 'svelte';

export let developers = [];
export let selected = null;

const dispatch = createEventDispatcher();

function doSelect( evt ) {
  let id = evt.target.getAttribute( 'data-id' );

  for( let d = 0; d < developers.length; d++ ) {
    if( developers[d].id === id ) {
      selected = developers[d];
      break;
    }
  }

  dispatch( 'change', {
    selectedItem: selected
  } );
}
</script>

<style>
button {
  border: none;
  background: none;
  background-image: url( /img/checkbox.svg );
  background-position: center left 15px;
  background-repeat: no-repeat;
  background-size: 18px;  
  outline: none;
  width: 40px;
}

div {
  background-color: #dcdcdc;    
  display: flex;
  flex-direction: row;
}

h4 {
  color: #393939;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 48px;
  margin: 0;
  padding: 0 16px 0 0;  
}

li {
  border-bottom: solid 1px #dcdcdc;
  border-top: solid 1px transparent;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

li:hover {
  background-color: #e5e5e5;  
}

li.selected {
  background-color: red;
}

p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 46px;
  margin: 0;
  padding: 0 16px 0 0;  
}

ul {
  flex-basis: 0;
  flex-grow: 1;
  margin: 0;
  padding: 0;
  overflow-y: scroll;
}
</style>

<div>
  <button></button>
  <h4>Developers</h4>
</div>

<ul>

{#each developers as developer}

  <li data-id="{developer.id}" on:click="{doSelect}">
    <button></button>
    <p>{developer.name}</p>
  </li>

{/each}

</ul>
