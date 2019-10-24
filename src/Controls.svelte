<script>
import { createEventDispatcher } from 'svelte';

import Button from './Button.svelte';

import { controls_mode } from './stores.js';

const dispatch = createEventDispatcher();
</script>

<style>
div {
  /* border-top: solid 1px #f3f3f3; */
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  min-height: 48px;
}
</style>

<div>

<!-- Default: Nothing -->

<!-- Creating: Cancel, Save -->
{#if $controls_mode === 1}

  <Button kind="secondary" on:click="{() => dispatch( 'cancel' )}">Cancel</Button>
  <Button icon="/img/save.svg" on:click="{() => dispatch( 'save' )}">Save</Button>

{/if}

<!-- Viewing: Edit -->
{#if $controls_mode === 2}

  <Button icon="/img/edit.svg" on:click="{() => dispatch( 'edit' )}">Edit</Button>

{/if}

<!-- Editing: Delete, Cancel, Save -->
{#if $controls_mode === 3}

  <Button kind="secondary" on:click="{() => dispatch( 'delete' )}">Delete</Button>
  <Button kind="secondary" on:click="{() => dispatch( 'cancel' )}">Cancel</Button>
  <Button icon="/img/save-white.svg" on:click="{() => dispatch( 'save' )}">Save</Button>

{/if}

</div>
