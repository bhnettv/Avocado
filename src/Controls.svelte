<script>
import { createEventDispatcher } from 'svelte';

import Button from './Button.svelte';

export let mode = 0;
export let visible = true;

const dispatch = createEventDispatcher();

function doCancel( evt ) {
  dispatch( 'cancel' );
}

function doSave( evt ) {
  dispatch( 'save' );
}
</script>

<style>
div {
  border-top: solid 1px #f3f3f3;
  display: flex;
  flex-direction: row;
  min-height: 48px;
  justify-content: flex-end;
}
</style>

<div style="display: {visible ? 'flex' : 'none'}">
  <Button 
    label="Cancel" 
    kind="secondary" 
    on:click="{doCancel}"
    visible="{mode === 2 ? true : false}"/>
  <Button 
    label="Save" 
    icon="/img/save-white.svg" 
    on:click="{doSave}"
    visible="{mode === 2 ? true : false}"/>  
  <Button 
    label="Edit" 
    icon="/img/edit.svg" 
    visible="{mode === 1 ? true : false}"/>
</div>
