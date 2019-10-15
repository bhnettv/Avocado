<script>
export let labels = [];
</script>

<style>
li {  
  background: none;
  background-image: url( /img/label.svg );
  background-position: center left 15px;
  background-repeat: no-repeat;
  background-size: 18px;
  border-bottom: solid 1px #e0e0e0;
  border-top: solid 1px transparent;
  display: flex;
  flex-direction: row;
  margin: 0;
  padding: 0 0 0 40px;
}

li:hover {
  background-color: #e5e5e5;
}

p {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 46px;  
  margin: 0;
  padding: 0 16px 0 0;
}

p:first-of-type {
  flex-grow: 1;
}

ul {
  flex-basis: 0;
  flex-grow: 1;
  margin: 0;
  padding: 0;
  overflow-y: scroll;
}
</style>

<ul>

{#each labels as label}
  <li>
    <p>{label.name}</p>
    <p>{label.count}</p>
  </li>
{/each}

</ul>
