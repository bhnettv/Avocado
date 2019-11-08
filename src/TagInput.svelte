<script>
import Menu from './Menu.svelte';
import Tag from './Tag.svelte';

export let characters = 3;
export let data = [];
export let dataField = 'data';
export let disabled = false;
export let helper = undefined;
export let label = undefined;
export let labelField = 'label';
export let limit = 4;
export let menu = [];
export let placeholder = '';
export let value = [];

let control = undefined;
let focus = false;
let height = 0;
let index = -1;

function doBlur() {
  menu = [];
  focus = false;
}

function doFocus( evt ) {
  focus = true;  
  height = control.clientHeight;
}

function doKeyUp( evt ) {
  // Enter
  if( evt.keyCode === 13 ) {
    // From menu
    if( index > -1 ) {
      value.push( menu[index] );
      focus = true;
    } else {
      let found = false;
      let tags = [];

      // Multiples separated by comma
      if( evt.target.value.indexOf( ',' ) > 0 ) {
        tags = evt.target.value.split( ',' );
      } else {
        tags = [evt.target.value];
      }

      // Iterate provided value(s)
      for( let t = 0; t < tags.length; t++ ) {
        let exists = null;

        // Look in provided values
        for( let d = 0; d < data.length; d++ ) {
          if( data[d][labelField] === tags[t] ) {
            exists = data[d];
            break;

          }
        }

        // Use provided value if match
        if( exists !== null ) {
          value.push( exists );
        } else {
          // Check if already in list
          for( let v = 0; v < value.length; v++ ) {
            if( value[v] === tags[t].trim() ) {
              found = true;
              break;
            }
          }

          // Totally unique tag
          // Add to list with null ID
          if( !found ) {
            let tag = {id: null};
            tag[labelField] = tags[t];
            value.push( tag );
          }          
        }
      }      
    }

    // Update form field value
    // Clear value provided
    // Hide menu
    // Clear menu selection
    value = value.slice( 0 );
    evt.target.value = '';
    menu = [];
    index = -1;
  }

  // Backspace and empty input
  if( evt.keyCode === 8 && evt.target.value.trim().length === 0 ) {
    evt.preventDefault();

    // List has values
    // User wants to delete from values
    if( value.length > 0 ) {
      value.pop();
      value = value.slice( 0 );
    }
  }

  // Down arrow
  if( evt.keyCode === 40 ) {
    // A menu is present
    // Move displayed focus
    if( menu.length > 0 ) {
      if( index === -1 ) {
        focus = false;        
        index = 0;
      } else {
        if( index === ( menu.length - 1 ) ) {
          index = 0;
        } else {
          index = index + 1;
        }
      }      
    }
  }

  // Up arrow
  if( evt.keyCode === 38 ) {
    // A menu is present
    // Move displayed focus    
    if( menu.length > 0 ) {
      if( index === -1 ) {
        focus = false;          
        index = menu.length - 1;
      } else {
        if( index === 0 ) {
          index = menu.length - 1;
        } else {
          index = index - 1;
        }
      }
    }
  }

  // Field has enough characters to display menu
  if( evt.target.value.trim().length >= characters ) {
    // Clear existing
    menu = [];

    // Build new menu
    // Case-insensitive
    for( let a = 0; a < data.length; a++ ) {
      if( data[a][labelField].toLowerCase().indexOf( evt.target.value.toLowerCase().trim() ) > -1 ) {
        let found = false;

        for( let b = 0; b < value.length; b++ ) {
          if( data[a][labelField].toLowerCase() === evt.target.value[b].toLowerCase() ) {
            found = true;
            break;
          }
        }

        if( !found ) {
          menu.push( data[a] );
        }
      }
    }

    // Trigger update
    // Limit to number of desired matches
    menu = menu.slice( 0, limit );
  }
}

// Remove specific tag by mouse click
function doRemove( id, index ) {
  value.splice( index, 1 );
  value = [...value];
}

// TODO: Allow mouse select on menu
// TODO: Not yet fully implemented
function doSelect( evt ) {
  console.log( 'Select via click' );
  console.log( evt.detail.item );

  value.push( evt.detail.item );
  value = [...value];
}
</script>

<style>
div.control {
  display: flex;
  flex-direction: column;
  flex-grow: 1; 
  position: relative;
}

div.content {
  background-color: #f4f4f4;
  border-bottom: solid 1px #8d8d8d;
  display: flex;
  flex-direction: row;
  flex-grow: 1;
  flex-wrap: wrap;
  min-height: 39px;
  margin: 0;
  outline: solid 2px transparent;
  outline-offset: -2px;  
  padding: 0 16px 0 16px;  
}

input {
  background: none;
  border: none;
  color: #161616;
  display: block;
  flex-grow: 1;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 14px;
  font-weight: 400;
  height: 39px;
  line-height: 40px;
  margin: 0;
  outline: none;
  padding: 0;
}

input:disabled {
  cursor: not-allowed;
}

label {
  color: #393939;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: 0 0 8px 0;
}

p {
  color: #6f6f6f;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 12px;
  font-weight: 400;
  padding: 0;
  margin: -6px 0 8px 0;
}

.content.disabled {
  border-bottom: solid 1px transparent !important;
  cursor: not-allowed;
  outline: none;  
}

.focus {
  outline: solid 2px #0062ff !important;
}
</style>

<div class="control" bind:this="{control}">

  {#if label !== undefined}

    <label style="color: {disabled ? '#c6c6c6' : '#393939'}">{label}</label>

  {/if}

  {#if helper !== undefined}

    <p style="color: {disabled ? '#c6c6c6' : '#6f6f6f'}">{helper}</p>

  {/if}

  <div class="content" class:focus="{focus}" class:disabled="{disabled}">

    {#each value as tag, t}
      <Tag 
        {disabled} 
        on:click="{() => doRemove( tag[dataField], t )}">{tag[labelField]}</Tag>      
    {/each}

    <input 
      type="text"
      placeholder="{placeholder}" 
      on:keyup="{doKeyUp}" 
      on:focus="{doFocus}"
      on:blur="{doBlur}"
      {disabled}>

  </div>

  {#if menu.length > 0}

    <Menu 
      index="{index}"
      options="{menu}" 
      top="{height + 3}" 
      labelField="name"/>
  
  {/if}

</div>
