<script>
export let disabled = false;
export let selected = false;
</script>

<style>
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
  margin: 0 2px 0 0;
  min-width: 125px;
  outline: none;
  padding: 0;
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

<button class:selected="{selected}" on:click {disabled}>
  <slot></slot>
</button>
