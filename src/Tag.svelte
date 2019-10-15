<script>
export let placeholder = '';
export let value = [];
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

li {
  background-color: #393939;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  height: 24px;
  margin: 8px 8px 0 0;
  padding: 0 0 0 8px;
}

ul {
  background-color: #f4f4f4;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  height: 40px;
  margin: 0;
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
</style>

<ul>

{#each value as tag}

  <li>
    <p>{tag}</p>
    <button type="button"></button>
  </li>

{/each}

</ul>
