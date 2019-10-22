<script>
import { createEventDispatcher } from 'svelte';

import Button from './Button.svelte';

export let mode = 0;

const dispatch = createEventDispatcher();

function doCancel( evt ) {
  dispatch( 'cancel' );
}

function doDelete( evt ) {
  dispatch( 'delete' );
}

function doEdit( evt ) {
  dispatch( 'edit' );
}

function doSave( evt ) {
  dispatch( 'save' );
}
</script>

<style>
div {
  /* border-top: solid 1px #f3f3f3; */
  display: flex;
  flex-direction: row;
  min-height: 48px;
  justify-content: flex-end;
}
</style>

<div>

<!-- Default: Nothing -->

<!-- Creating: Cancel, Save -->
{#if mode === 1}

  <Button 
    label="Cancel" 
    kind="secondary" 
    on:click="{doCancel}"/>
  <Button 
    label="Save" 
    icon="/img/save-white.svg" 
    on:click="{doSave}"/>

{/if}

<!-- Viewing: Edit -->
{#if mode === 2}

  <Button 
    label="Edit" 
    icon="/img/edit.svg"
    on:click="{doEdit}"/>

{/if}

<!-- Editing: Delete, Cancel, Save -->
{#if mode === 3}

  <Button 
    label="Delete" 
    kind="secondary" 
    on:click="{doDelete}"/>
  <Button 
    label="Cancel" 
    kind="secondary" 
    on:click="{doCancel}"/>
  <Button 
    label="Save" 
    icon="/img/save-white.svg" 
    on:click="{doSave}"/>

{/if}

</div>
