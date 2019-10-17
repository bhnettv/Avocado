<script>
export let image = null;
</script>

<style>
button {
  background: none;
  background-image: url( /img/person.svg );
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border: none;
  border-radius: 28px;
  height: 56px;
  width: 56px;
}
</style>

{#if image === null}

<button style="border: solid 1px #8c8c8c;"></button>

{:else}

<button style="background-image: url( {image} );"></button>

{/if}
