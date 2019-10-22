<script>
export let disabled = false;
export let message = '';
export let placeholder = '';
export let value = '';
</script>

<style>
div {
  display: flex;
  flex-basis: 0;
  flex-direction: column;
  flex-grow: 1;
}

input {
  background: none;
  background-color: #f4f4f4;
  border: none;  
  border-bottom: solid 1px #8d8d8d;
  color: #171717;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 39px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;
  padding: 0 16px 0 16px;
}

input:disabled {
  border-bottom: solid 1px #f4f4f4;  
  cursor: not-allowed;
  outline: none;
}

input:focus {
  outline: solid 2px #0062ff;
}

p {
  color: #6f6f6f;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 4px 0 4px 0;
}
</style>

{#if message.trim().length === 0}

  <input placeholder="{placeholder}" bind:value="{value}" {disabled}>

{:else}

  <div>
    <input placeholder="{placeholder}" bind:value="{value}" {disabled}>
    <p>{message}</p>
  </div>

{/if}
