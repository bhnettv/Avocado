<script>
import { createEventDispatcher } from 'svelte';

import Button from './Button.svelte';

export let mode = 0;

const dispatch = createEventDispatcher();
</script>

<style>
div {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  min-height: 48px;
}

div.block {
  flex-grow: 1;
}
</style>

<div>

<!-- Default: Nothing -->

<!-- Creating: Cancel, Save -->
{#if mode === 1}

  <Button kind="secondary" on:click="{() => dispatch( 'cancelnew' )}">Cancel</Button>
  <Button 
    icon="/img/save-white.svg" 
    on:click="{() => dispatch( 'savenew' )}">Save</Button>

{/if}

<!-- Viewing: Edit -->
{#if mode === 2}

  <Button icon="/img/edit.svg" on:click="{() => dispatch( 'edit' )}">Edit</Button>

{/if}

<!-- Editing: Delete, Cancel, Save -->
{#if mode === 3}

  <Button 
    kind="danger" 
    on:click="{() => dispatch( 'delete' )}">Delete</Button>
  <div class="block"></div>
  <Button 
    kind="secondary" 
    on:click="{() => dispatch( 'cancelexisting' )}">Cancel</Button>
  <Button 
    icon="/img/save-white.svg" 
    on:click="{() => dispatch( 'saveexisting' )}">Save</Button>

{/if}

</div>
