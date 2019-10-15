<script>
export let disabled = false;
export let placeholder = '';
export let value = '';
</script>

<style>
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
</style>

<input placeholder="{placeholder}" bind:value="{value}" {disabled}>
