<script>
export let disabled = false;
export let label = undefined;
export let placeholder = '';
export let value = [];

let focus = false;

function doKeyboard( evt ) {
  if( evt.keyCode === 13 ) {
    evt.preventDefault();

    let found = false;

    for( let v = 0; v < value.length; v++ ) {
      if( value[v] === evt.target.value ) {
        found = true;
        break;
      }
    }

    if( !found ) {
      value = [...value, evt.target.value];
      evt.target.value = '';
    }
  }
}

function doRemove( evt ) {
  let index = evt.target.getAttribute( 'data-id' );

  value.splice( index, 1 );
  value = [...value];
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

div {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

input {
  background: none;
  border: none;
  color: #171717;
  display: block;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 40px;
  margin: 0;
  outline: none;
  padding: 0;
  width: 100%;
}

input:disabled {
  cursor: not-allowed;
}

label {
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

li.input {
  width: 100%;
}

li.tag {
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
  height: 40px;  
  list-style: none;
  min-height: 40px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;  
  padding: 0 16px 0 16px;
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

<div>

  {#if label !== undefined}

    <label>{label}</label>

  {/if}

  <ul class:focus="{focus}" class:disabled="{disabled}">

  {#each value as tag, t}

    <li class="tag">
      <p>{tag}</p>
      <button data-id="{t}" type="button" on:click="{doRemove}"></button>
    </li>

  {/each}

    <li class="input">
      <input 
        placeholder="{value.length === 0 ? placeholder : ''}" 
        on:keydown="{doKeyboard}" 
        on:focus="{() => focus = true}"
        on:blur="{() => focus = false}"
        {disabled}>  
    </li>

  </ul>

</div>
