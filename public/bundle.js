
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Button.svelte generated by Svelte v3.12.1 */

    const file = "src/Button.svelte";

    // (112:0) {:else}
    function create_else_block(ctx) {
    	var button, t, button_class_value, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-ohxw0l");
    			set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			add_location(button, file, 113, 0, 1863);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-ohxw0l")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (changed.disabled || changed.disabledIcon || changed.icon) {
    				set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			}

    			if (changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(112:0) {:else}", ctx });
    	return block;
    }

    // (102:0) {#if icon === null}
    function create_if_block(ctx) {
    	var button, t, button_class_value, dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(ctx.label);
    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-ohxw0l");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			add_location(button, file, 103, 0, 1689);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-ohxw0l")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(102:0) {#if icon === null}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.icon === null) return create_if_block;
    		return create_else_block;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { disabled = false, icon = null, disabledIcon = null, label = '', kind = 'primary', title = '', visible = true } = $$props;

    const dispatch = createEventDispatcher();

    function doClick( evt ) {
      dispatch( 'click', null );
    }

    	const writable_props = ['disabled', 'icon', 'disabledIcon', 'label', 'kind', 'title', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('disabledIcon' in $$props) $$invalidate('disabledIcon', disabledIcon = $$props.disabledIcon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, icon, disabledIcon, label, kind, title, visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('disabledIcon' in $$props) $$invalidate('disabledIcon', disabledIcon = $$props.disabledIcon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return {
    		disabled,
    		icon,
    		disabledIcon,
    		label,
    		kind,
    		title,
    		visible,
    		doClick
    	};
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["disabled", "icon", "disabledIcon", "label", "kind", "title", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Button", options, id: create_fragment.name });
    	}

    	get disabled() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabledIcon() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabledIcon(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get kind() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set kind(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Controls.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Controls.svelte";

    function create_fragment$1(ctx) {
    	var div, t0, t1, current;

    	var button0 = new Button({
    		props: {
    		label: "Cancel",
    		kind: "secondary",
    		visible: ctx.mode === 2 ? true : false
    	},
    		$$inline: true
    	});
    	button0.$on("click", ctx.doCancel);

    	var button1 = new Button({
    		props: {
    		label: "Save",
    		icon: "/img/save-white.svg",
    		visible: ctx.mode === 2 ? true : false
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.doSave);

    	var button2 = new Button({
    		props: {
    		label: "Edit",
    		icon: "/img/edit.svg",
    		visible: ctx.mode === 1 ? true : false
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0.$$.fragment.c();
    			t0 = space();
    			button1.$$.fragment.c();
    			t1 = space();
    			button2.$$.fragment.c();
    			set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			attr_dev(div, "class", "svelte-zdehd6");
    			add_location(div, file$1, 29, 0, 451);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(button0, div, null);
    			append_dev(div, t0);
    			mount_component(button1, div, null);
    			append_dev(div, t1);
    			mount_component(button2, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.mode) button0_changes.visible = ctx.mode === 2 ? true : false;
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.mode) button1_changes.visible = ctx.mode === 2 ? true : false;
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.mode) button2_changes.visible = ctx.mode === 1 ? true : false;
    			button2.$set(button2_changes);

    			if (!current || changed.visible) {
    				set_style(div, "display", (ctx.visible ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			transition_in(button2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_component(button0);

    			destroy_component(button1);

    			destroy_component(button2);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    let { mode = 0, visible = true } = $$props;

    const dispatch = createEventDispatcher();

    function doCancel( evt ) {
      dispatch( 'cancel' );
    }

    function doSave( evt ) {
      dispatch( 'save' );
    }

    	const writable_props = ['mode', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Controls> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { mode, visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { mode, visible, doCancel, doSave };
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["mode", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Controls", options, id: create_fragment$1.name });
    	}

    	get mode() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Controls>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Details.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Details.svelte";

    function create_fragment$2(ctx) {
    	var div1, div0, button, t0, p, t1, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			button = element("button");
    			t0 = space();
    			p = element("p");
    			t1 = text(ctx.summary);
    			t2 = space();

    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "svelte-19j4uhf");
    			toggle_class(button, "closed", !ctx.opened);
    			add_location(button, file$2, 55, 4, 913);
    			attr_dev(p, "class", "svelte-19j4uhf");
    			add_location(p, file$2, 59, 4, 1019);
    			attr_dev(div0, "class", "summary svelte-19j4uhf");
    			add_location(div0, file$2, 54, 2, 887);

    			attr_dev(div1, "class", "pane svelte-19j4uhf");
    			toggle_class(div1, "closed", !ctx.opened);
    			add_location(div1, file$2, 53, 0, 841);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.opened) {
    				toggle_class(button, "closed", !ctx.opened);
    			}

    			if (!current || changed.summary) {
    				set_data_dev(t1, ctx.summary);
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.opened) {
    				toggle_class(div1, "closed", !ctx.opened);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { opened = true, summary = 'Details' } = $$props;

    	const writable_props = ['opened', 'summary'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Details> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = (evt) => $$invalidate('opened', opened = !opened);

    	$$self.$set = $$props => {
    		if ('opened' in $$props) $$invalidate('opened', opened = $$props.opened);
    		if ('summary' in $$props) $$invalidate('summary', summary = $$props.summary);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { opened, summary };
    	};

    	$$self.$inject_state = $$props => {
    		if ('opened' in $$props) $$invalidate('opened', opened = $$props.opened);
    		if ('summary' in $$props) $$invalidate('summary', summary = $$props.summary);
    	};

    	return {
    		opened,
    		summary,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Details extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["opened", "summary"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Details", options, id: create_fragment$2.name });
    	}

    	get opened() {
    		throw new Error("<Details>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opened(value) {
    		throw new Error("<Details>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get summary() {
    		throw new Error("<Details>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set summary(value) {
    		throw new Error("<Details>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Endpoints.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/Endpoints.svelte";

    function create_fragment$3(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Endpoints";
    			add_location(p, file$3, 16, 2, 172);
    			attr_dev(div, "class", "svelte-v4jhh2");
    			toggle_class(div, "display", ctx.visible);
    			add_location(div, file$3, 15, 0, 138);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},

    		p: function update(changed, ctx) {
    			if (changed.visible) {
    				toggle_class(div, "display", ctx.visible);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { visible = false } = $$props;

    	const writable_props = ['visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Endpoints> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { visible };
    }

    class Endpoints extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Endpoints", options, id: create_fragment$3.name });
    	}

    	get visible() {
    		throw new Error("<Endpoints>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Endpoints>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Avatar.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/Avatar.svelte";

    // (23:0) {:else}
    function create_else_block$1(ctx) {
    	var button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			set_style(button, "background-image", "url( " + ctx.image + " )");
    			attr_dev(button, "class", "svelte-1usb6a5");
    			add_location(button, file$4, 24, 0, 382);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.image) {
    				set_style(button, "background-image", "url( " + ctx.image + " )");
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(23:0) {:else}", ctx });
    	return block;
    }

    // (19:0) {#if image === null}
    function create_if_block$1(ctx) {
    	var button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			set_style(button, "border", "solid 1px #8c8c8c");
    			attr_dev(button, "class", "svelte-1usb6a5");
    			add_location(button, file$4, 20, 0, 319);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(button);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(19:0) {#if image === null}", ctx });
    	return block;
    }

    function create_fragment$4(ctx) {
    	var if_block_anchor;

    	function select_block_type(changed, ctx) {
    		if (ctx.image === null) return create_if_block$1;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block) {
    				if_block.p(changed, ctx);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { image = null } = $$props;

    	const writable_props = ['image'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Avatar> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('image' in $$props) $$invalidate('image', image = $$props.image);
    	};

    	$$self.$capture_state = () => {
    		return { image };
    	};

    	$$self.$inject_state = $$props => {
    		if ('image' in $$props) $$invalidate('image', image = $$props.image);
    	};

    	return { image };
    }

    class Avatar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["image"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Avatar", options, id: create_fragment$4.name });
    	}

    	get image() {
    		throw new Error("<Avatar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Avatar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TagInput.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/TagInput.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	return child_ctx;
    }

    // (109:0) {#each value as tag}
    function create_each_block(ctx) {
    	var li, p, t0_value = ctx.tag + "", t0, t1, button;

    	const block = {
    		c: function create() {
    			li = element("li");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			attr_dev(p, "class", "svelte-1qipp0t");
    			add_location(p, file$5, 111, 4, 1910);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-1qipp0t");
    			add_location(button, file$5, 112, 4, 1927);
    			attr_dev(li, "class", "svelte-1qipp0t");
    			add_location(li, file$5, 110, 2, 1901);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, p);
    			append_dev(p, t0);
    			append_dev(li, t1);
    			append_dev(li, button);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.value) && t0_value !== (t0_value = ctx.tag + "")) {
    				set_data_dev(t0, t0_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(109:0) {#each value as tag}", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var ul, t, input, dispose;

    	let each_value = ctx.value;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-1qipp0t");
    			add_location(input, file$5, 117, 2, 1979);
    			attr_dev(ul, "class", "svelte-1qipp0t");
    			toggle_class(ul, "disabled", ctx.disabled);
    			toggle_class(ul, "focus", ctx.focus);
    			add_location(ul, file$5, 106, 0, 1821);

    			dispose = [
    				listen_dev(input, "keydown", ctx.doKeyboard),
    				listen_dev(input, "focus", ctx.focus_handler),
    				listen_dev(input, "blur", ctx.blur_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t);
    			append_dev(ul, input);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) {
    				each_value = ctx.value;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    				toggle_class(ul, "disabled", ctx.disabled);
    			}

    			if (changed.focus) {
    				toggle_class(ul, "focus", ctx.focus);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { disabled = false, placeholder = '', value = [] } = $$props;

    let focus = false;

    function doKeyboard( evt ) {
      if( evt.keyCode === 13 ) {
        evt.preventDefault();
        $$invalidate('value', value = [...value, evt.target.value]);
        evt.target.value = '';
      }
    }

    	const writable_props = ['disabled', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TagInput> was created with unknown prop '${key}'`);
    	});

    	const focus_handler = () => $$invalidate('focus', focus = true);

    	const blur_handler = () => $$invalidate('focus', focus = false);

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, placeholder, value, focus };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('focus' in $$props) $$invalidate('focus', focus = $$props.focus);
    	};

    	return {
    		disabled,
    		placeholder,
    		value,
    		focus,
    		doKeyboard,
    		focus_handler,
    		blur_handler
    	};
    }

    class TagInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["disabled", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TagInput", options, id: create_fragment$5.name });
    	}

    	get disabled() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextArea.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/TextArea.svelte";

    function create_fragment$6(ctx) {
    	var textarea, dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			textarea.disabled = ctx.disabled;
    			attr_dev(textarea, "placeholder", ctx.placeholder);
    			attr_dev(textarea, "class", "svelte-o1jkx");
    			add_location(textarea, file$6, 36, 0, 648);
    			dispose = listen_dev(textarea, "input", ctx.textarea_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);

    			set_input_value(textarea, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value) set_input_value(textarea, ctx.value);

    			if (changed.disabled) {
    				prop_dev(textarea, "disabled", ctx.disabled);
    			}

    			if (changed.placeholder) {
    				attr_dev(textarea, "placeholder", ctx.placeholder);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(textarea);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { disabled = false, placeholder = '', value = '' } = $$props;

    	const writable_props = ['disabled', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		placeholder,
    		value,
    		textarea_input_handler
    	};
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["disabled", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$6.name });
    	}

    	get disabled() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TextInput.svelte generated by Svelte v3.12.1 */

    const file$7 = "src/TextInput.svelte";

    function create_fragment$7(ctx) {
    	var input, dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-18nvst2");
    			add_location(input, file$7, 36, 0, 628);
    			dispose = listen_dev(input, "input", ctx.input_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { disabled = false, placeholder = '', value = '' } = $$props;

    	const writable_props = ['disabled', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		placeholder,
    		value,
    		input_input_handler
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["disabled", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextInput", options, id: create_fragment$7.name });
    	}

    	get disabled() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Developer.svelte generated by Svelte v3.12.1 */

    const file$8 = "src/Developer.svelte";

    function create_fragment$8(ctx) {
    	var form, div2, t0, div0, t1, t2, div1, t3, t4, div5, div3, t5, div4, t6, t7, div8, div6, t8, div7, t9, t10, div11, div9, t11, div10, t12, current;

    	var avatar = new Avatar({ $$inline: true });

    	var textinput0 = new TextInput({
    		props: {
    		placeholder: "Name",
    		disabled: ctx.disabled,
    		value: ctx.name
    	},
    		$$inline: true
    	});

    	var textinput1 = new TextInput({
    		props: {
    		placeholder: "Email",
    		disabled: ctx.disabled,
    		value: ctx.email
    	},
    		$$inline: true
    	});

    	var taginput0 = new TagInput({
    		props: {
    		placeholder: "Labels",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var taginput1 = new TagInput({
    		props: {
    		placeholder: "Skills",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var textarea = new TextArea({
    		props: {
    		placeholder: "Description",
    		disabled: ctx.disabled,
    		value: ctx.description
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			form = element("form");
    			div2 = element("div");
    			avatar.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput0.$$.fragment.c();
    			t2 = space();
    			div1 = element("div");
    			t3 = space();
    			textinput1.$$.fragment.c();
    			t4 = space();
    			div5 = element("div");
    			div3 = element("div");
    			t5 = space();
    			div4 = element("div");
    			t6 = space();
    			taginput0.$$.fragment.c();
    			t7 = space();
    			div8 = element("div");
    			div6 = element("div");
    			t8 = space();
    			div7 = element("div");
    			t9 = space();
    			taginput1.$$.fragment.c();
    			t10 = space();
    			div11 = element("div");
    			div9 = element("div");
    			t11 = space();
    			div10 = element("div");
    			t12 = space();
    			textarea.$$.fragment.c();
    			attr_dev(div0, "class", "gap svelte-fxazwq");
    			add_location(div0, file$8, 71, 4, 1114);
    			attr_dev(div1, "class", "gap svelte-fxazwq");
    			add_location(div1, file$8, 76, 4, 1237);
    			attr_dev(div2, "class", "line svelte-fxazwq");
    			add_location(div2, file$8, 69, 2, 1077);
    			attr_dev(div3, "class", "icon labels svelte-fxazwq");
    			add_location(div3, file$8, 84, 4, 1391);
    			attr_dev(div4, "class", "gap svelte-fxazwq");
    			add_location(div4, file$8, 85, 4, 1427);
    			attr_dev(div5, "class", "line svelte-fxazwq");
    			add_location(div5, file$8, 83, 2, 1368);
    			attr_dev(div6, "class", "icon skills svelte-fxazwq");
    			add_location(div6, file$8, 90, 4, 1547);
    			attr_dev(div7, "class", "gap svelte-fxazwq");
    			add_location(div7, file$8, 91, 4, 1583);
    			attr_dev(div8, "class", "line svelte-fxazwq");
    			add_location(div8, file$8, 89, 2, 1524);
    			attr_dev(div9, "class", "icon description svelte-fxazwq");
    			add_location(div9, file$8, 96, 4, 1703);
    			attr_dev(div10, "class", "gap svelte-fxazwq");
    			add_location(div10, file$8, 97, 4, 1744);
    			attr_dev(div11, "class", "line svelte-fxazwq");
    			add_location(div11, file$8, 95, 2, 1680);
    			attr_dev(form, "class", "svelte-fxazwq");
    			toggle_class(form, "display", ctx.visible);
    			add_location(form, file$8, 67, 0, 1041);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div2);
    			mount_component(avatar, div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			mount_component(textinput0, div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div2, t3);
    			mount_component(textinput1, div2, null);
    			append_dev(form, t4);
    			append_dev(form, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div5, t6);
    			mount_component(taginput0, div5, null);
    			append_dev(form, t7);
    			append_dev(form, div8);
    			append_dev(div8, div6);
    			append_dev(div8, t8);
    			append_dev(div8, div7);
    			append_dev(div8, t9);
    			mount_component(taginput1, div8, null);
    			append_dev(form, t10);
    			append_dev(form, div11);
    			append_dev(div11, div9);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			append_dev(div11, t12);
    			mount_component(textarea, div11, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.disabled) textinput0_changes.disabled = ctx.disabled;
    			if (changed.name) textinput0_changes.value = ctx.name;
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.disabled) textinput1_changes.disabled = ctx.disabled;
    			if (changed.email) textinput1_changes.value = ctx.email;
    			textinput1.$set(textinput1_changes);

    			var taginput0_changes = {};
    			if (changed.disabled) taginput0_changes.disabled = ctx.disabled;
    			taginput0.$set(taginput0_changes);

    			var taginput1_changes = {};
    			if (changed.disabled) taginput1_changes.disabled = ctx.disabled;
    			taginput1.$set(taginput1_changes);

    			var textarea_changes = {};
    			if (changed.disabled) textarea_changes.disabled = ctx.disabled;
    			if (changed.description) textarea_changes.value = ctx.description;
    			textarea.$set(textarea_changes);

    			if (changed.visible) {
    				toggle_class(form, "display", ctx.visible);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(avatar.$$.fragment, local);

    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(taginput0.$$.fragment, local);

    			transition_in(taginput1.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(avatar.$$.fragment, local);
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(taginput0.$$.fragment, local);
    			transition_out(taginput1.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(avatar);

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(taginput0);

    			destroy_component(taginput1);

    			destroy_component(textarea);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

    let { image = null, name = '', email = '', labels = [], skills = [], description = '', disabled = true, visible = false } = $$props;

    	const writable_props = ['image', 'name', 'email', 'labels', 'skills', 'description', 'disabled', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Developer> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('image' in $$props) $$invalidate('image', image = $$props.image);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('labels' in $$props) $$invalidate('labels', labels = $$props.labels);
    		if ('skills' in $$props) $$invalidate('skills', skills = $$props.skills);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { image, name, email, labels, skills, description, disabled, visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('image' in $$props) $$invalidate('image', image = $$props.image);
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('email' in $$props) $$invalidate('email', email = $$props.email);
    		if ('labels' in $$props) $$invalidate('labels', labels = $$props.labels);
    		if ('skills' in $$props) $$invalidate('skills', skills = $$props.skills);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return {
    		image,
    		name,
    		email,
    		labels,
    		skills,
    		description,
    		disabled,
    		visible
    	};
    }

    class Developer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["image", "name", "email", "labels", "skills", "description", "disabled", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Developer", options, id: create_fragment$8.name });
    	}

    	get image() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set image(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get name() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get email() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set email(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labels() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labels(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get skills() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set skills(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Developer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Developer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/List.svelte generated by Svelte v3.12.1 */

    const file$9 = "src/List.svelte";

    const get_default_slot_changes = ({ item, data }) => ({ item: data });
    const get_default_slot_context = ({ item, data }) => ({ item: item });

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (27:0) {#each data as item}
    function create_each_block$1(ctx) {
    	var li, t, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();
    			t = space();

    			attr_dev(li, "class", "svelte-1tlgp7t");
    			add_location(li, file$9, 28, 0, 277);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(li_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);

    			if (default_slot) {
    				default_slot.m(li, null);
    			}

    			append_dev(li, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && (changed.$$scope || changed.data)) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, get_default_slot_changes),
    					get_slot_context(default_slot_template, ctx, get_default_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(27:0) {#each data as item}", ctx });
    	return block;
    }

    function create_fragment$9(ctx) {
    	var ul, current;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "svelte-1tlgp7t");
    			add_location(ul, file$9, 24, 0, 247);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.$$scope || changed.data) {
    				each_value = ctx.data;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { data = [] } = $$props;

    	const writable_props = ['data'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { data };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    	};

    	return { data, $$slots, $$scope };
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["data"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "List", options, id: create_fragment$9.name });
    	}

    	get data() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$a = "src/Select.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (48:0) {#each options as option}
    function create_each_block$2(ctx) {
    	var option, t_value = ctx.option[ctx.label] + "", t, option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.option[ctx.value];
    			option.value = option.__value;
    			add_location(option, file$a, 48, 2, 952);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.options || changed.label) && t_value !== (t_value = ctx.option[ctx.label] + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.options || changed.value) && option_value_value !== (option_value_value = ctx.option[ctx.value])) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(option);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(48:0) {#each options as option}", ctx });
    	return block;
    }

    function create_fragment$a(ctx) {
    	var select, dispose;

    	let each_value = ctx.options;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr_dev(select, "class", "svelte-lm9cgx");
    			add_location(select, file$a, 45, 0, 890);
    			dispose = listen_dev(select, "change", ctx.select_change_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
    		},

    		p: function update(changed, ctx) {
    			if (changed.options || changed.value || changed.label) {
    				each_value = ctx.options;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.selected) select_option(select, ctx.selected);
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(select);
    			}

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { value = 'id', label = 'name', options = [], selected = null } = $$props;

    	const writable_props = ['value', 'label', 'options', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('options', options);
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { value, label, options, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		value,
    		label,
    		options,
    		selected,
    		select_change_handler
    	};
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["value", "label", "options", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$a.name });
    	}

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Notes.svelte generated by Svelte v3.12.1 */

    const file$b = "src/Notes.svelte";

    function create_fragment$b(ctx) {
    	var div2, form, div0, p0, t1, updating_selected, t2, updating_value, t3, div1, t4, p1, current;

    	function select_selected_binding(value) {
    		ctx.select_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		options: ctx.activity,
    		value: "id",
    		label: "name"
    	};
    	if (ctx.activity_id !== void 0) {
    		select_props.selected = ctx.activity_id;
    	}
    	var select = new Select({ props: select_props, $$inline: true });

    	binding_callbacks.push(() => bind(select, 'selected', select_selected_binding));

    	function textarea_value_binding(value_1) {
    		ctx.textarea_value_binding.call(null, value_1);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textarea_props = { placeholder: "What happened?" };
    	if (ctx.text !== void 0) {
    		textarea_props.value = ctx.text;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	var button = new Button({
    		props: { label: "Save", disabled: ctx.text.trim().length > 0 ? false : true },
    		$$inline: true
    	});
    	button.$on("click", ctx.doSave);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Where:";
    			t1 = space();
    			select.$$.fragment.c();
    			t2 = space();
    			textarea.$$.fragment.c();
    			t3 = space();
    			div1 = element("div");
    			button.$$.fragment.c();
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Notes";
    			attr_dev(p0, "class", "svelte-3vm7ki");
    			add_location(p0, file$b, 83, 6, 1502);
    			attr_dev(div0, "class", "activity svelte-3vm7ki");
    			add_location(div0, file$b, 82, 4, 1473);
    			attr_dev(div1, "class", "controls svelte-3vm7ki");
    			add_location(div1, file$b, 87, 4, 1693);
    			attr_dev(form, "class", "svelte-3vm7ki");
    			add_location(form, file$b, 81, 2, 1462);
    			attr_dev(p1, "class", "svelte-3vm7ki");
    			add_location(p1, file$b, 94, 2, 1877);
    			attr_dev(div2, "class", "panel svelte-3vm7ki");
    			set_style(div2, "display", (ctx.visible ? 'flex': 'none'));
    			add_location(div2, file$b, 80, 0, 1396);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			mount_component(select, div0, null);
    			append_dev(form, t2);
    			mount_component(textarea, form, null);
    			append_dev(form, t3);
    			append_dev(form, div1);
    			mount_component(button, div1, null);
    			append_dev(div2, t4);
    			append_dev(div2, p1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var select_changes = {};
    			if (changed.activity) select_changes.options = ctx.activity;
    			if (!updating_selected && changed.activity_id) {
    				select_changes.selected = ctx.activity_id;
    			}
    			select.$set(select_changes);

    			var textarea_changes = {};
    			if (!updating_value && changed.text) {
    				textarea_changes.value = ctx.text;
    			}
    			textarea.$set(textarea_changes);

    			var button_changes = {};
    			if (changed.text) button_changes.disabled = ctx.text.trim().length > 0 ? false : true;
    			button.$set(button_changes);

    			if (!current || changed.visible) {
    				set_style(div2, "display", (ctx.visible ? 'flex': 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div2);
    			}

    			destroy_component(select);

    			destroy_component(textarea);

    			destroy_component(button);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	

    let { developer = null, visible = false } = $$props;

    let activity = [];
    let activity_id = null;
    let text = '';

    onMount( async () => {
      $$invalidate('activity', activity = await fetch( '/api/activity' )
      .then( ( response ) => response.json() ));
      $$invalidate('activity_id', activity_id = activity[0].id);
    } );

    function doSave( evt ) {
      fetch( '/api/developer/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          developer_id: developer.id,
          activity_id: activity_id,
          full_text: text
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $$invalidate('text', text = '');
      } );
    }

    	const writable_props = ['developer', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Notes> was created with unknown prop '${key}'`);
    	});

    	function select_selected_binding(value) {
    		activity_id = value;
    		$$invalidate('activity_id', activity_id);
    	}

    	function textarea_value_binding(value_1) {
    		text = value_1;
    		$$invalidate('text', text);
    	}

    	$$self.$set = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { developer, visible, activity, activity_id, text };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    		if ('activity_id' in $$props) $$invalidate('activity_id', activity_id = $$props.activity_id);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    	};

    	return {
    		developer,
    		visible,
    		activity,
    		activity_id,
    		text,
    		doSave,
    		select_selected_binding,
    		textarea_value_binding
    	};
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["developer", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$b.name });
    	}

    	get developer() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set developer(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Search.svelte generated by Svelte v3.12.1 */

    const file$c = "src/Search.svelte";

    function create_fragment$c(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-bn9xay");
    			add_location(input, file$c, 24, 0, 465);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { placeholder = 'Search' } = $$props;

    	const writable_props = ['placeholder'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    	};

    	$$self.$capture_state = () => {
    		return { placeholder };
    	};

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    	};

    	return { placeholder };
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["placeholder"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$c.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tabs.svelte generated by Svelte v3.12.1 */

    const file$d = "src/Tabs.svelte";

    function create_fragment$d(ctx) {
    	var ul, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			if (default_slot) default_slot.c();

    			attr_dev(ul, "class", "svelte-1g56lkf");
    			add_location(ul, file$d, 11, 0, 148);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(ul_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			if (default_slot) {
    				default_slot.m(ul, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(ul);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {};

    	return { $$slots, $$scope };
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tabs", options, id: create_fragment$d.name });
    	}
    }

    /* src/Tab.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Tab.svelte";

    function create_fragment$e(ctx) {
    	var li, button, t, dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t = text(ctx.label);
    			button.disabled = ctx.disabled;
    			attr_dev(button, "class", "svelte-hduzsm");
    			toggle_class(button, "selected", ctx.selected);
    			add_location(button, file$e, 54, 2, 884);
    			attr_dev(li, "class", "svelte-hduzsm");
    			add_location(li, file$e, 53, 0, 877);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.selected) {
    				toggle_class(button, "selected", ctx.selected);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { disabled = true, label = '', selected = false } = $$props;

    const dispatch = createEventDispatcher();

    function doClick( evt ) {
      dispatch( 'click' );
    }

    	const writable_props = ['disabled', 'label', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, label, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return { disabled, label, selected, doClick };
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, ["disabled", "label", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tab", options, id: create_fragment$e.name });
    	}

    	get disabled() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Timeline.svelte generated by Svelte v3.12.1 */

    const file$f = "src/Timeline.svelte";

    function create_fragment$f(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Timeline";
    			add_location(p, file$f, 16, 2, 172);
    			attr_dev(div, "class", "svelte-v4jhh2");
    			toggle_class(div, "display", ctx.visible);
    			add_location(div, file$f, 15, 0, 138);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},

    		p: function update(changed, ctx) {
    			if (changed.visible) {
    				toggle_class(div, "display", ctx.visible);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let { visible = false } = $$props;

    	const writable_props = ['visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { visible };
    	};

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	return { visible };
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, ["visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timeline", options, id: create_fragment$f.name });
    	}

    	get visible() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Developers.svelte generated by Svelte v3.12.1 */

    const file$g = "src/Developers.svelte";

    // (177:4) <List data="{developers}" let:item="{developer}">
    function create_default_slot_3(ctx) {
    	var p, t_value = ctx.developer.name + "", t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "developer svelte-wdthxg");
    			add_location(p, file$g, 177, 6, 3323);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.developer) && t_value !== (t_value = ctx.developer.name + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(177:4) <List data=\"{developers}\" let:item=\"{developer}\">", ctx });
    	return block;
    }

    // (184:6) <List data="{labels}" let:item="{label}">
    function create_default_slot_2(ctx) {
    	var p, t0_value = ctx.label.name + "", t0, span, t1_value = ctx.label.count + "", t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "svelte-wdthxg");
    			add_location(span, file$g, 184, 37, 3543);
    			attr_dev(p, "class", "label svelte-wdthxg");
    			add_location(p, file$g, 184, 8, 3514);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, span);
    			append_dev(span, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.label) && t0_value !== (t0_value = ctx.label.name + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.label) && t1_value !== (t1_value = ctx.label.count + "")) {
    				set_data_dev(t1, t1_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(184:6) <List data=\"{labels}\" let:item=\"{label}\">", ctx });
    	return block;
    }

    // (183:4) <Details summary="Labels">
    function create_default_slot_1(ctx) {
    	var current;

    	var list = new List({
    		props: {
    		data: ctx.labels,
    		$$slots: {
    		default: [create_default_slot_2, ({ item: label }) => ({ label })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			list.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(list, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var list_changes = {};
    			if (changed.labels) list_changes.data = ctx.labels;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			list.$set(list_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(list, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(183:4) <Details summary=\"Labels\">", ctx });
    	return block;
    }

    // (195:4) <Tabs>
    function create_default_slot(ctx) {
    	var t0, t1, current;

    	var tab0 = new Tab({
    		props: {
    		label: "Overview",
    		selected: ctx.tab === 0 ? true : false,
    		disabled: !overview_tab
    	},
    		$$inline: true
    	});
    	tab0.$on("click", ctx.click_handler);

    	var tab1 = new Tab({
    		props: {
    		label: "Social",
    		selected: ctx.tab === 1 ? true : false,
    		disabled: !ctx.social_tab
    	},
    		$$inline: true
    	});
    	tab1.$on("click", ctx.click_handler_1);

    	var tab2 = new Tab({
    		props: {
    		label: "Notes",
    		selected: ctx.tab === 2 ? true : false,
    		disabled: !ctx.notes_tab
    	},
    		$$inline: true
    	});
    	tab2.$on("click", ctx.click_handler_2);

    	const block = {
    		c: function create() {
    			tab0.$$.fragment.c();
    			t0 = space();
    			tab1.$$.fragment.c();
    			t1 = space();
    			tab2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tab0_changes = {};
    			if (changed.tab) tab0_changes.selected = ctx.tab === 0 ? true : false;
    			tab0.$set(tab0_changes);

    			var tab1_changes = {};
    			if (changed.tab) tab1_changes.selected = ctx.tab === 1 ? true : false;
    			if (changed.social_tab) tab1_changes.disabled = !ctx.social_tab;
    			tab1.$set(tab1_changes);

    			var tab2_changes = {};
    			if (changed.tab) tab2_changes.selected = ctx.tab === 2 ? true : false;
    			if (changed.notes_tab) tab2_changes.disabled = !ctx.notes_tab;
    			tab2.$set(tab2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);

    			transition_in(tab1.$$.fragment, local);

    			transition_in(tab2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(tab1, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(tab2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(195:4) <Tabs>", ctx });
    	return block;
    }

    function create_fragment$g(ctx) {
    	var div1, aside0, div0, t0, t1, h4, t3, t4, t5, article, t6, t7, t8, t9, t10, t11, aside1, current;

    	var search_1 = new Search({ $$inline: true });

    	var button = new Button({
    		props: {
    		label: "Add",
    		icon: "/img/add-white.svg",
    		disabledIcon: "/img/add.svg",
    		disabled: !ctx.can_add
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.doAdd);

    	var list = new List({
    		props: {
    		data: ctx.developers,
    		$$slots: {
    		default: [create_default_slot_3, ({ item: developer }) => ({ developer })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var details = new Details({
    		props: {
    		summary: "Labels",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var tabs = new Tabs({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var developer_1 = new Developer({
    		props: {
    		disabled: !ctx.editable,
    		image: ctx.developer === null ? '' : ctx.developer.image,
    		name: ctx.developer === null ? '' : ctx.developer.name,
    		email: ctx.developer === null ? '' : ctx.developer.email,
    		description: ctx.developer === null ? '' : ctx.developer.description,
    		visible: ctx.tab === 0 ? true : false
    	},
    		$$inline: true
    	});

    	var timeline = new Timeline({
    		props: { visible: (ctx.tab === 1 && !ctx.editable) ? true : false },
    		$$inline: true
    	});

    	var endpoints = new Endpoints({
    		props: { visible: (ctx.tab === 1 && ctx.editable) ? true : false },
    		$$inline: true
    	});

    	var notes = new Notes({
    		props: {
    		developer: ctx.developers[developer_index],
    		visible: ctx.tab === 2 ? true : false
    	},
    		$$inline: true
    	});

    	var controls_1 = new Controls({
    		props: {
    		mode: ctx.controls,
    		visible: ctx.tab < 2 ? true : false
    	},
    		$$inline: true
    	});
    	controls_1.$on("cancel", ctx.doCancel);
    	controls_1.$on("save", doSave);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			aside0 = element("aside");
    			div0 = element("div");
    			search_1.$$.fragment.c();
    			t0 = space();
    			button.$$.fragment.c();
    			t1 = space();
    			h4 = element("h4");
    			h4.textContent = "Developers";
    			t3 = space();
    			list.$$.fragment.c();
    			t4 = space();
    			details.$$.fragment.c();
    			t5 = space();
    			article = element("article");
    			tabs.$$.fragment.c();
    			t6 = space();
    			developer_1.$$.fragment.c();
    			t7 = space();
    			timeline.$$.fragment.c();
    			t8 = space();
    			endpoints.$$.fragment.c();
    			t9 = space();
    			notes.$$.fragment.c();
    			t10 = space();
    			controls_1.$$.fragment.c();
    			t11 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-wdthxg");
    			add_location(div0, file$g, 164, 4, 2996);
    			attr_dev(h4, "class", "svelte-wdthxg");
    			add_location(h4, file$g, 175, 4, 3243);
    			attr_dev(aside0, "class", "svelte-wdthxg");
    			add_location(aside0, file$g, 161, 2, 2963);
    			attr_dev(article, "class", "svelte-wdthxg");
    			add_location(article, file$g, 191, 2, 3648);
    			attr_dev(aside1, "class", "svelte-wdthxg");
    			add_location(aside1, file$g, 244, 2, 5120);
    			attr_dev(div1, "class", "panel svelte-wdthxg");
    			add_location(div1, file$g, 158, 0, 2918);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, aside0);
    			append_dev(aside0, div0);
    			mount_component(search_1, div0, null);
    			append_dev(div0, t0);
    			mount_component(button, div0, null);
    			append_dev(aside0, t1);
    			append_dev(aside0, h4);
    			append_dev(aside0, t3);
    			mount_component(list, aside0, null);
    			append_dev(aside0, t4);
    			mount_component(details, aside0, null);
    			append_dev(div1, t5);
    			append_dev(div1, article);
    			mount_component(tabs, article, null);
    			append_dev(article, t6);
    			mount_component(developer_1, article, null);
    			append_dev(article, t7);
    			mount_component(timeline, article, null);
    			append_dev(article, t8);
    			mount_component(endpoints, article, null);
    			append_dev(article, t9);
    			mount_component(notes, article, null);
    			append_dev(article, t10);
    			mount_component(controls_1, article, null);
    			append_dev(div1, t11);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.can_add) button_changes.disabled = !ctx.can_add;
    			button.$set(button_changes);

    			var list_changes = {};
    			if (changed.developers) list_changes.data = ctx.developers;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			list.$set(list_changes);

    			var details_changes = {};
    			if (changed.$$scope || changed.labels) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);

    			var tabs_changes = {};
    			if (changed.$$scope || changed.tab || changed.notes_tab || changed.social_tab) tabs_changes.$$scope = { changed, ctx };
    			tabs.$set(tabs_changes);

    			var developer_1_changes = {};
    			if (changed.editable) developer_1_changes.disabled = !ctx.editable;
    			if (changed.developer) developer_1_changes.image = ctx.developer === null ? '' : ctx.developer.image;
    			if (changed.developer) developer_1_changes.name = ctx.developer === null ? '' : ctx.developer.name;
    			if (changed.developer) developer_1_changes.email = ctx.developer === null ? '' : ctx.developer.email;
    			if (changed.developer) developer_1_changes.description = ctx.developer === null ? '' : ctx.developer.description;
    			if (changed.tab) developer_1_changes.visible = ctx.tab === 0 ? true : false;
    			developer_1.$set(developer_1_changes);

    			var timeline_changes = {};
    			if (changed.tab || changed.editable) timeline_changes.visible = (ctx.tab === 1 && !ctx.editable) ? true : false;
    			timeline.$set(timeline_changes);

    			var endpoints_changes = {};
    			if (changed.tab || changed.editable) endpoints_changes.visible = (ctx.tab === 1 && ctx.editable) ? true : false;
    			endpoints.$set(endpoints_changes);

    			var notes_changes = {};
    			if (changed.developers) notes_changes.developer = ctx.developers[developer_index];
    			if (changed.tab) notes_changes.visible = ctx.tab === 2 ? true : false;
    			notes.$set(notes_changes);

    			var controls_1_changes = {};
    			if (changed.controls) controls_1_changes.mode = ctx.controls;
    			if (changed.tab) controls_1_changes.visible = ctx.tab < 2 ? true : false;
    			controls_1.$set(controls_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search_1.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(list.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			transition_in(tabs.$$.fragment, local);

    			transition_in(developer_1.$$.fragment, local);

    			transition_in(timeline.$$.fragment, local);

    			transition_in(endpoints.$$.fragment, local);

    			transition_in(notes.$$.fragment, local);

    			transition_in(controls_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search_1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
    			transition_out(tabs.$$.fragment, local);
    			transition_out(developer_1.$$.fragment, local);
    			transition_out(timeline.$$.fragment, local);
    			transition_out(endpoints.$$.fragment, local);
    			transition_out(notes.$$.fragment, local);
    			transition_out(controls_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(search_1);

    			destroy_component(button);

    			destroy_component(list);

    			destroy_component(details);

    			destroy_component(tabs);

    			destroy_component(developer_1);

    			destroy_component(timeline);

    			destroy_component(endpoints);

    			destroy_component(notes);

    			destroy_component(controls_1);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    let search = '';

    let developer_index = 0;

    let label_index = 0;

    let overview_tab = true;

    function doSave( evt ) {
    console.log( 'Hooray!' );
    }

    function instance$g($$self, $$props, $$invalidate) {
    	
    let can_add = true;
    let developers = [];
    let labels = [];
    let tab = 0;
    let social_tab = false;
    let notes_tab = false;
    let editable = false;
    let developer = null;
    let controls = 0;

    // Load external data
    onMount( async () => {
      $$invalidate('developers', developers = await fetch( '/api/developer' )
      .then( ( response ) => response.json() ));

      $$invalidate('labels', labels = await fetch( '/api/label' )
      .then( ( response ) => response.json() ));  
    } );

    // Add new developer
    function doAdd( evt ) {
      $$invalidate('can_add', can_add = false);

      $$invalidate('tab', tab = 0);
      $$invalidate('social_tab', social_tab = true);
      $$invalidate('notes_tab', notes_tab = false);

      $$invalidate('developer', developer = {
        name: '',
        email: '',
        labels: [],
        skills: [],
        description: '',
        image: ''
      });
      $$invalidate('editable', editable = true);

      $$invalidate('controls', controls = 2);
    }

    // Cancel adding a developer
    // ?? Cancel edit also
    function doCancel( evt ) {
      $$invalidate('can_add', can_add = true);

      $$invalidate('tab', tab = 0);
      $$invalidate('social_tab', social_tab = false);
      $$invalidate('notes_tab', notes_tab = false);

      $$invalidate('developer', developer = null);
      $$invalidate('editable', editable = false);

      $$invalidate('controls', controls = 0);  
    }

    	const click_handler = () => $$invalidate('tab', tab = 0);

    	const click_handler_1 = () => $$invalidate('tab', tab = 1);

    	const click_handler_2 = () => $$invalidate('tab', tab = 2);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('search' in $$props) search = $$props.search;
    		if ('can_add' in $$props) $$invalidate('can_add', can_add = $$props.can_add);
    		if ('developers' in $$props) $$invalidate('developers', developers = $$props.developers);
    		if ('developer_index' in $$props) $$invalidate('developer_index', developer_index = $$props.developer_index);
    		if ('labels' in $$props) $$invalidate('labels', labels = $$props.labels);
    		if ('label_index' in $$props) label_index = $$props.label_index;
    		if ('tab' in $$props) $$invalidate('tab', tab = $$props.tab);
    		if ('overview_tab' in $$props) $$invalidate('overview_tab', overview_tab = $$props.overview_tab);
    		if ('social_tab' in $$props) $$invalidate('social_tab', social_tab = $$props.social_tab);
    		if ('notes_tab' in $$props) $$invalidate('notes_tab', notes_tab = $$props.notes_tab);
    		if ('editable' in $$props) $$invalidate('editable', editable = $$props.editable);
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('controls' in $$props) $$invalidate('controls', controls = $$props.controls);
    	};

    	return {
    		can_add,
    		developers,
    		labels,
    		tab,
    		social_tab,
    		notes_tab,
    		editable,
    		developer,
    		controls,
    		doAdd,
    		doCancel,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class Developers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Developers", options, id: create_fragment$g.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$h = "src/Header.svelte";

    function create_fragment$h(ctx) {
    	var div, p0, t0, span, t2, p1, t3;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("Avocado ");
    			span = element("span");
    			span.textContent = "Developer Relations";
    			t2 = space();
    			p1 = element("p");
    			t3 = text(ctx.version);
    			attr_dev(span, "class", "svelte-13teco");
    			add_location(span, file$h, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$h, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$h, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$h, 35, 0, 439);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, span);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(p1, t3);
    		},

    		p: function update(changed, ctx) {
    			if (changed.version) {
    				set_data_dev(t3, ctx.version);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { version = '2019.10.21' } = $$props;

    	const writable_props = ['version'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('version' in $$props) $$invalidate('version', version = $$props.version);
    	};

    	$$self.$capture_state = () => {
    		return { version };
    	};

    	$$self.$inject_state = $$props => {
    		if ('version' in $$props) $$invalidate('version', version = $$props.version);
    	};

    	return { version };
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$h.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$i = "src/Switcher.svelte";

    function create_fragment$i(ctx) {
    	var div, button0, t_1, button1, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Developers";
    			t_1 = space();
    			button1 = element("button");
    			button1.textContent = "Repositories";
    			attr_dev(button0, "class", "svelte-1tj6usy");
    			toggle_class(button0, "selected", ctx.selectedIndex === 0);
    			add_location(button0, file$i, 32, 2, 504);
    			attr_dev(button1, "class", "svelte-1tj6usy");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$i, 35, 2, 619);
    			attr_dev(div, "class", "svelte-1tj6usy");
    			add_location(div, file$i, 31, 0, 496);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t_1);
    			append_dev(div, button1);
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedIndex) {
    				toggle_class(button0, "selected", ctx.selectedIndex === 0);
    				toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { selectedIndex = 0 } = $$props;

    	const writable_props = ['selectedIndex'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate('selectedIndex', selectedIndex = 0);

    	const click_handler_1 = () => $$invalidate('selectedIndex', selectedIndex = 1);

    	$$self.$set = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	$$self.$capture_state = () => {
    		return { selectedIndex };
    	};

    	$$self.$inject_state = $$props => {
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    	};

    	return {
    		selectedIndex,
    		click_handler,
    		click_handler_1
    	};
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$i.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$j(ctx) {
    	var t0, t1, current;

    	var header = new Header({ $$inline: true });

    	var switcher = new Switcher({ $$inline: true });

    	var developers = new Developers({ $$inline: true });

    	const block = {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			switcher.$$.fragment.c();
    			t1 = space();
    			developers.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(switcher, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(developers, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(switcher.$$.fragment, local);

    			transition_in(developers.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(switcher.$$.fragment, local);
    			transition_out(developers.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(header, detaching);

    			if (detaching) {
    				detach_dev(t0);
    			}

    			destroy_component(switcher, detaching);

    			if (detaching) {
    				detach_dev(t1);
    			}

    			destroy_component(developers, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$j.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$j, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$j.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
