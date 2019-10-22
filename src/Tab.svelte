<script>
import { getContext } from 'svelte';

export let disabled = false;
export let label = 'Tab';

const { register, selected } = getContext( 'tabs' );

register( {
  label: label,
  disabled: disabled
} );
</script>

{#if $selected === label}

  <slot></slot>

{/if}
