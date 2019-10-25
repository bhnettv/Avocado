<script>
export let disabled = false;
export let helper = undefined;
export let label = undefined;
export let placeholder = '';
export let value = '';
</script>

<style>
div {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

label {
  color: #171717;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

textarea {
  background: none;
  background-color: #f4f4f4;
  border: none;  
  border-bottom: solid 1px #8d8d8d;
  color: #171717;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  margin: 0;
  min-height: 79px; 
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 11px 16px 11px 16px;
}

textarea:disabled {
  border-bottom: solid 1px #f4f4f4;  
  cursor: not-allowed;
  outline: none;
}

textarea:focus {
  outline: solid 2px #0062ff;
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

  <textarea 
    {disabled} 
    placeholder="{placeholder}" 
    bind:value="{value}"></textarea>

</div>
