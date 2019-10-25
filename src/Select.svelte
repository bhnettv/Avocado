<script>
export let dataField = 'data';
export let helper = undefined;
export let label = undefined;
export let labelField = 'label';
export let options = [];
export let selected = null;
export let value = 'id';
</script>

<style>
div {
  display: flex;
  flex-direction: column;
}

label {
  color: #171717;
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
  background-color: #f4f4f4;
  background-image: url( /img/arrow-down.svg );
  background-position: center right 16px;
  background-repeat: no-repeat;
  background-size: 20px;    
  border: none;
  border-bottom: solid 1px #8d8d8d;
  border-radius: 0;
  box-shadow: none;
  color: #171717;
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

select:focus {
  outline: solid 2px #0062ff;
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

<div>

  {#if label !== undefined}
    <label>{label}</label>
  {/if}
  {#if helper !== undefined}
    <p>{helper}</p>
  {/if}  
  <select bind:value="{selected}">
    {#each options as option}
      <option value="{option[dataField]}">{option[labelField]}</option>
    {/each}  
  </select>  

</div>
