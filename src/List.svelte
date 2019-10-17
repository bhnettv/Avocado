<script>
export let data = [];
</script>

<style>
ul {
  flex-basis: 0;
  flex-grow: 1;
  list-style: none;
  margin: 0;
  overflow-y: scroll;
  padding: 0;
}

li {
  margin: 0;
  padding: 0;
}

li:hover {
  background-color: #e5e5e5;
}
</style>

<ul>

{#each data as item}
  
<li>
  <slot item="{item}"></slot>
</li>
	
{/each}

</ul>
