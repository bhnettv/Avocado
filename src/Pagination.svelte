<script>
import { createEventDispatcher } from 'svelte';

export let index = 1;
export let length = 10;
export let noun = 'items';

const dispatch = createEventDispatcher();
</script>

<style>
button {
  background: none;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 20px;
  border: none;
  border-left: solid 1px #e0e0e0;
  cursor: pointer;
  height: 47px;
  width: 47px;
}

button:hover {
  background-color: #e5e5e5;
}

button:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;  
}

button.next {
  background-image: url( /img/arrow-right.svg );
}

button.previous {
  background-image: url( /img/arrow-left.svg );
}

div {
  align-items: center;
  border-top: solid 1px #e0e0e0;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0;
}

p {
  color: #393939;
  flex-basis: 0;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 47px;
  margin: 0;
  padding: 0 0 0 16px;
}
</style>

<div>
  <slot></slot>
  <p>{index} of {length} {noun}</p>
  <button class="previous" on:click="{() => dispatch( 'previous' )}"></button>
  <button class="next" on:click="{() => dispatch( 'next' )}"></button>
</div>
