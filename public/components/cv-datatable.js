class DataTable extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement( 'template' );
    template.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
        }

        cv-checkbox {
          width: 40px;
        }

        div.list {
          flex-grow: 1;
        }

        header {
          background: #dcdcdc;
          border-bottom: solid 1px #bebebe;          
          display: flex;
          flex-direction: row;  
          height: 47px;
        }

        header cv-checkbox:hover {
          background-color: #cacaca;
        }

        div.row {
          border-bottom: solid 1px #dcdcdc;          
          display: flex;
          flex-direction: row;
          height: 47px;
        }

        div.row.selected {
          background: #dcdcdc;
        }

        div.row:hover {
          background: #e5e5e5;
        }
      </style>
      <header>
        <cv-checkbox></cv-checkbox>
        <slot></slot>
      </header>
      <div class="list"></div>
    `;
    
    this._dataProvider = null;
    this._selectable = true;
    this._showHeaders = true;

    this._shadowRoot = this.attachShadow( {mode: 'open'} );
    this._shadowRoot.appendChild( template.content.cloneNode( true ) );   

    this.$all = this._shadowRoot.querySelector( 'cv-checkbox' );
    this.$columns = null;
    this.$header = this._shadowRoot.querySelector( 'header' );
    this.$list = this._shadowRoot.querySelector( '.list' );

    this.$slot = this.shadowRoot.querySelector( 'slot' );
    this.$slot.addEventListener( 
      'slotchange', 
      ( evt ) => this.doSlotChange( evt ) 
    );    
  }

  doSlotChange( evt ) {
    const elements = this.$slot.assignedElements(); 

    if( elements.length > 0 ) {
      this.$columns = elements;
    } else {
      this.$columns = null;
    }

    this._render();
  }  

  _render() {
    // Nothing to render
    if( this._dataProvider === null ) {
      return;
    }

    // No data to render
    if( this._dataProvider.length === 0 ) {
      return;
    }

    // Keys in an object
    const keys = Object.keys( this._dataProvider[0] );

    // No columns defined
    // Create based on keys
    if( this.$columns === null ) {
      for( let k = 0; k < keys.length; k++ ) {
        const column = document.createElement( 'cv-datatablecolumn' );
        column.dataField = keys[k];
        column.headerText = keys[k];
        this.appendChild( column );
      }  
    }

    // Empty the list
    // TODO: Remove row events
    // TODO: Virtual scrolling
    while( this.$list.children.length > 0 ) {
      this.$list.children[0].remove();
    }

    // Iterate data
    for( let d = 0; d < this._dataProvider.length; d++ ) {
      const row = document.createElement( 'div' );
      row.classList.add( 'row' );

      // Selectable
      // Hidden in access method
      // Keep from rebuilding entire table
      const checkbox = document.createElement( 'cv-checkbox' );
      row.appendChild( checkbox );

      // Columns have been defined
      if( this.$columns !== null ) {
        // Create a cell for each column
        for( let c = 0; c < this.$columns.length; c++ ) {
          // Populate with requested data
          for( let k = 0; k < keys.length; k++ ) {          
            if( keys[k] === this.$columns[c].dataField ) {
              const column = document.createElement( this.$columns[c].itemRenderer );

              // Manage sizing
              // Stretch by default
              if( this.$columns[c].width !== null ) {
                column.style.flexBasis = 'initial';
                column.style.flexGrow = 'initial';
                column.style.width = this.$columns[c].width + 'px';
              }
  
              // Custom formatting of textual content
              if( this.$columns[c].labelFunction !== null ) {
                column.label = window[this.$columns[c].labelFunction](
                  this._dataProvider[d],
                  this.$columns[c]
                );
              } else {
                // Or just what is there
                column.label = this._dataProvider[d][keys[k]];
              }

              // Append column to row
              row.appendChild( column );      

              // Found the column
              // No more looping keys needed
              break;              
            }
          }
        }
      }

      // Append row to list
      this.$list.appendChild( row );      
    }
  }

  static get observedAttributes() {
    return ['dataprovider', 'selectable', 'showheaders'];
  }  
  
  attributeChangedCallback( attrName, oldVal, newVal ) {
    switch( attrName ) {
      case 'dataprovider':
        this.dataProvider = newVal;
        break;
      case 'selectable':
        this.selectable = newVal === 'true' ? true : false;
        break;
      case 'showheaders':
        this.showHeaders = newVal === 'true' ? true : false;
        break;        
    }
  }  
  
  get dataProvider() {
    return this._dataProvider;
  }

  set dataProvider( value ) {
    this._dataProvider = value.splice( 0 );
    this._render();
  }

  get selectable() {
    return this._selectable;
  }

  set selectable( value ) {
    this._selectable = value;

    if( this._selectable ) {
      this.$all.style.display = 'initial';
    } else {
      this.$all.style.display = 'none';
    }

    for( let r = 0; r < this.$list.children.length; r++ ) {
      if( this._selectable ) {
        this.$list.children[r].children[0].style.display = 'initial';
      } else {
        this.$list.children[r].children[0].style.display = 'none';
      }
    }
  }

  get selectedItems() {
    let results = [];

    for( let r = 0; r < this.$list.children.length; r++ ) {
      if( this.$list.children[r].children[0].selected ) {
        results.push( this._dataProvider[r] );
      }
    }

    return results;
  }

  get showHeaders() {
    return this._showHeaders;
  }

  set showHeaders( value ) {
    this._shadowHeaders = value;

    if( this._shadowHeaders ) {
      this.$headers.style.display = 'flex';
    } else {
      this.$headers.style.display = 'none';
    }
  }  
}

window.customElements.define( 'cv-datatable', DataTable );
