class DataTableColumn extends HTMLElement {
  constructor() {
    super();

    const template = document.createElement( 'template' );
    template.innerHTML = `
      <style>
      :host {
        display: flex;
        flex-basis: 0;
        flex-direction: row;
        flex-grow: 1;
      }

      :host( :hover ) {
        background: #cacaca;
      }

      button {
        background: none;
        background-image: url( /img/swap-vertical.svg );
        background-position: right 8px center;
        background-repeat: no-repeat;
        background-size: 20px;
        border: none;
        display: none;
        height: 47px;
        outline: none;
        width: 40px;
      }

      p {
        color: #171717;
        flex-grow: 1;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 14px;
        font-weight: 600;
        height: 47px;
        line-height: 48px;
        margin: 0;
        padding: 0 0 0 8px;
      }      
      </style>
      <p></p>      
      <button></button>
    `;

    this._dataField = null;
    this._editable = false;
    this._headerText = null;
    this._itemEditor = 'cv-datatableitemeditor';
    this._itemRenderer = 'cv-datatableitemrenderer';
    this._labelFunction = null;
    this._width = null;

    this._shadowRoot = this.attachShadow( {mode: 'open'} );
    this._shadowRoot.appendChild( template.content.cloneNode( true ) );

    this.$label = this._shadowRoot.querySelector( 'p' );
    this.$sort = this._shadowRoot.querySelector( 'button' );
  }

  _render() {
    if( this._headerText === null ) {
      this.$label.innerHTML = '';
    } else {
      this.$label.innerHTML = this._headerText;
    }
  }

  static get observedAttributes() {
    return ['datafield', 'editable', 'headertext', 'itemeditor', 'itemrenderer', 'labelfunction', 'width'];
  }  

  attributeChangedCallback( attribute, old, value ) {
    switch( attribute ) {
      case 'datafield':
        this.dataField = value;
        break;
      case 'editable': 
        this.editable = value === 'true' ? true : false;
        break;
      case 'headertext':
        this.headerText = value;
        break;
      case 'itemeditor':
        this.itemEditor = value;
        break;
      case 'itemrenderer':
        this.itemRenderer = value;
        break;        
      case 'labelfunction':
        this.labelFunction = value;
        break;        
      case 'width':
        this.width = value;
        break;
    }
  } 

  get dataField() {
    return this._dataField;
  }

  set dataField( value ) {
    if( value === null ) {
      this._dataField = null;
    } else {
      if( value.trim().length === 0 ) {
        this._dataField = null;
      } else {
        this._dataField = value.trim();
      }
    }
  }

  get editable() {
    return this._editable;
  }

  set editable( value ) {
    this._editable = value;
  }

  get headerText() {
    return this._headerText;
  }

  set headerText( value ) {
    if( value === null ) {
      this._headerText = null;
    } else {
      if( value.trim().length === 0 ) {
        this._headerText = null;
      } else {
        this._headerText = value;
      }
    }

    this._render();
  }

  get itemEditor() {
    return this._itemEditor;
  }

  set itemEditor( value ) {
    this._itemEditor = value;
  }

  get itemRenderer() {
    return this._itemRenderer;
  }

  set itemRenderer( value ) {
    if( value === null ) {
      this._itemRenderer = 'cv-datatableitemrenderer';
    } else {
      this._itemRenderer = value;
    }
  }

  get labelFunction() {
    return this._labelFunction;
  }

  set labelFunction( value ) {
    this._labelFunction = value;
  }

  get width() {
    return this._width;
  }

  set width( value ) {
    if( isNaN( value ) ) {
      this._width = null;
      this.style.flexBasis = 0;
      this.style.flexGrow = 1;
      this.style.width = 'initial';
    } else {
      this._width = parseInt( value );
      this.style.flexBasis = 'initial';
      this.style.flexGrow = 'initial';
      this.style.width = this._width + 'px';      
    }
  }
}

window.customElements.define( 'cv-datatablecolumn', DataTableColumn );
