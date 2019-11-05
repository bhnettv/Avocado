<script>
import Menu from './Menu.svelte';
import Tag from './Tag.svelte';

export let characters = 3;
export let data = [];
export let disabled = false;
export let helper = undefined;
export let label = undefined;
export let labelField = 'label';
export let limit = 4;
export let placeholder = '';
export let value = [];

let focus = false;
let height = 0;
let index = -1;
let menu = [];

function doBlur() {
  menu = [];
  focus = false;
}

function doKeyUp( evt ) {
  if( evt.keyCode === 13 ) {
    if( index > -1 ) {
      value.push( menu[index] );
      focus = true;
    } else {
      let found = false;
      let tags = [];

      if( evt.target.value.indexOf( ',' ) > 0 ) {
        tags = evt.target.value.split( ',' );
      } else {
        tags = [evt.target.value];
      }

      for( let t = 0; t < tags.length; t++ ) {
        let exists = null;

        for( let d = 0; d < data.length; d++ ) {
          if( data[d][labelField] === tags[t] ) {
            exists = data[d];
            break;

          }
        }

        if( exists !== null ) {
          value.push( exists );
        } else {
          for( let v = 0; v < value.length; v++ ) {
            if( value[v] === tags[t].trim() ) {
              found = true;
              break;
            }
          }

          if( !found ) {
            let tag = {id: null};
            tag[labelField] = tags[t];
            value.push( tag );
          }          
        }
      }      
    }

    value = value.splice( 0 );
    evt.target.value = '';
    menu = [];
    index = -1;
  }

  if( evt.keyCode === 8 && evt.target.value.trim().length === 0 ) {
    if( value.length > 0 ) {
      value.pop();
      value = value.slice( 0 );
    }
  }

  if( evt.keyCode === 40 ) {
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

  if( evt.keyCode === 38 ) {
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

  if( evt.target.value.trim().length >= characters ) {
    menu = [];

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

    menu = menu.slice( 0, limit );
  }
}

function doRemove( evt ) {
  let index = evt.target.getAttribute( 'data-id' );

  value.splice( index, 1 );
  value = [...value];
}

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

<div class="control" bind:clientHeight="{height}">

  {#if label !== undefined}

    <label style="color: {disabled ? '#c6c6c6' : '#393939'}">{label}</label>

  {/if}

  {#if helper !== undefined}

    <p style="color: {disabled ? '#c6c6c6' : '#6f6f6f'}">{helper}</p>

  {/if}

  <div class="content" class:focus="{focus}" class:disabled="{disabled}">

    {#each value as tag, t}
      <Tag>{tag[labelField]}</Tag>      
    {/each}

    <input 
      type="text"
      placeholder="{placeholder}" 
      on:keyup="{doKeyUp}" 
      on:focus="{() => focus = true}"
      on:blur="{doBlur}"
      {disabled}>

  </div>

  {#if data.length > 0}

    <Menu 
      data="{menu}" 
      top="{height + 3}" 
      labelField="name" 
      selectedIndex="{index}"
      on:select="{doSelect}"/>
  
  {/if}

</div>
