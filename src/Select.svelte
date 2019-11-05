<script>
export let dataField = 'data';
export let disabled = false;
export let helper = undefined;
export let inline = false;
export let label = undefined;
export let labelField = 'label';
export let options = [];
export let selected = null;
export let value = 'id';
</script>

<style>
div {
  display: flex;
}

div.outline {
  flex-direction: column;
}

div.inline {
  align-items: center;
  flex-direction: row;
}

div.inline > label {
  margin: 0 16px 0 0;
}

label {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

select {
  appearance: none;
  -moz-appearance: none;
  -webkit-appearance: none;
  background: none;
  background-image: url( /img/arrow-down.svg );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;    
  border: none;
  border-radius: 0;
  box-shadow: none;
  color: #161616;
  cursor: pointer;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 40px;
  line-height: 40px;
  margin: 0;
  min-width: 100px;
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 0 60px 0 16px;
}

select.inline {
  background-color: #ffffff;
}

select.inline:disabled {
  background-image: url( /img/arrow-down-disabled.svg );  
  cursor: not-allowed;
}

select.outline {
  background-color: #f4f4f4;
  border-bottom: solid 1px #8d8d8d;
}

select:focus {
  outline: solid 2px #0062ff;
}

select.inline:disabled:hover {
  background-color: #ffffff;
}

select:hover {
  background-color: #e5e5e5;
}

p {
  color: #6f6f6f;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: -6px 0 8px 0;  
}
</style>

<div class:inline class:outline="{inline === false ? true : false}">

  {#if label !== undefined}
    <label style="color: {disabled ? '#c6c6c6' : '#393939'}">{label}</label>
  {/if}

  {#if inline === false}
    {#if helper !== undefined}
      <p>{helper}</p>
    {/if}  
  {/if}

  <select 
    bind:value="{selected}" 
    class:inline 
    class:outline="{inline === false ? true : false}" 
    {disabled}>
    {#each options as option}
      <option value="{option[dataField]}">{option[labelField]}</option>
    {/each}  
  </select>  

  {#if inline === true}
    {#if helper !== undefined}
      <p>{helper}</p>
    {/if}  
  {/if}

</div>
