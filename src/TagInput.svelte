<script>
export let disabled = false;
export let placeholder = '';
export let value = [];

let focus = false;

function doKeyboard( evt ) {
  if( evt.keyCode === 13 ) {
    evt.preventDefault();
    value = [...value, evt.target.value];
    evt.target.value = '';
  }
}
</script>

<style>
button {
  background: none;
  background-image: url( /img/close-white.svg );
  background-position: center;
  background-repeat: no-repeat;
  background-size: 14px;
  border: none;
  cursor: pointer;
  height: 20px;
  margin: 2px 2px 0 3px;
  outline: none;
  padding: 0;
  width: 20px;
}

input {
  background: none;
  border: none;
  color: #171717;
  display: inline-block;
  flex-basis: 100px;
  flex-grow: 1;  
  flex-shrink: 0;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 40px;
  margin: 0;
  width: 100px;
  outline: none;
  padding: 0;
}

input:disabled {
  cursor: not-allowed;
}

li {
  background-color: #393939;
  border-radius: 12px;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  flex-direction: row;
  height: 24px;
  margin: 8px 8px 0 0;
  overflow: hidden;
  padding: 0 0 0 8px;
  position: relative;
}

ul {
  background-color: #f4f4f4;
  border-bottom: solid 1px #8d8d8d;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-wrap: wrap;
  list-style: none;
  min-height: 40px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;  
  padding: 0 16px 0 16px;
  width: 100%;
}

p {
  color: #ffffff;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 24px;
  margin: 0;
  padding: 0;
}

.disabled {
  border-bottom: solid 1px transparent;
  cursor: not-allowed;
  outline: none;  
}

.focus {
  outline: solid 2px #0062ff;
}
</style>

<ul class:disabled="{disabled}" class:focus="{focus}">

{#each value as tag}

  <li>
    <p>{tag}</p>
    <button type="button"></button>
  </li>

{/each}

  <input 
    placeholder="{placeholder}" 
    on:keydown="{doKeyboard}" 
    on:focus="{() => focus = true}"
    on:blur="{() => focus = false}"
    {disabled}>

</ul>
