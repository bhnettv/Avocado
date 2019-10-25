
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
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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

    const globals = (typeof window !== 'undefined' ? window : global);

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

    // (144:0) {:else}
    function create_else_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1i26tam");
    			set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			add_location(button, file, 145, 0, 2298);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
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

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (!current || changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((!current || changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1i26tam")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || changed.disabled || changed.disabledIcon || changed.icon) {
    				set_style(button, "background-image", "url( " + (ctx.disabled ? ctx.disabledIcon : ctx.icon) + " )");
    			}

    			if (!current || changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
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
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(144:0) {:else}", ctx });
    	return block;
    }

    // (132:0) {#if icon === null}
    function create_if_block(ctx) {
    	var button, button_class_value, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr_dev(button, "type", "button");
    			button.disabled = ctx.disabled;
    			attr_dev(button, "title", ctx.title);
    			attr_dev(button, "class", button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1i26tam");
    			set_style(button, "display", (ctx.visible ? 'block' : 'none'));
    			add_location(button, file, 133, 0, 2114);
    			dispose = listen_dev(button, "click", ctx.doClick);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
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

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (!current || changed.title) {
    				attr_dev(button, "title", ctx.title);
    			}

    			if ((!current || changed.kind) && button_class_value !== (button_class_value = "" + null_to_empty(ctx.kind) + " svelte-1i26tam")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || changed.visible) {
    				set_style(button, "display", (ctx.visible ? 'block' : 'none'));
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
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(132:0) {#if icon === null}", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.icon === null) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);

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

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('icon' in $$props) $$invalidate('icon', icon = $$props.icon);
    		if ('disabledIcon' in $$props) $$invalidate('disabledIcon', disabledIcon = $$props.disabledIcon);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('kind' in $$props) $$invalidate('kind', kind = $$props.kind);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
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
    		doClick,
    		$$slots,
    		$$scope
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const add_disabled = writable( false );
    const developer_list = writable( [] );
    const developer_index = writable( -1 );
    const label_list = writable( [] );
    const tab_index = writable( 0 );
    const social_disabled = writable( true );
    const notes_disabled = writable( true );
    const overview_disabled = writable( true );
    const social_index = writable( 0 );
    const developer_id = writable( '' );
    const developer_name = writable( '' );
    const developer_email = writable( '' );
    const developer_image = writable( '' );
    const developer_labels = writable( [] );
    const developer_skills = writable( [] );
    const developer_description = writable( '' );
    const endpoint_website = writable( '' );
    const endpoint_rss = writable( '' );
    const endpoint_devto = writable( '' );
    const endpoint_medium = writable( '' );
    const endpoint_youtube = writable( '' );
    const endpoint_twitter = writable( '' );
    const endpoint_so = writable( '' );
    const endpoint_github = writable( '' );
    const endpoint_reddit = writable( '' );
    const controls_mode = writable( 0 );

    /* src/Controls.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Controls.svelte";

    // (31:0) {#if $controls_mode === 1}
    function create_if_block_2(ctx) {
    	var t, current;

    	var button0 = new Button({
    		props: {
    		kind: "secondary",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button0.$on("click", ctx.click_handler);

    	var button1 = new Button({
    		props: {
    		icon: "/img/save-white.svg",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.click_handler_1);

    	const block = {
    		c: function create() {
    			button0.$$.fragment.c();
    			t = space();
    			button1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);

    			if (detaching) {
    				detach_dev(t);
    			}

    			destroy_component(button1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(31:0) {#if $controls_mode === 1}", ctx });
    	return block;
    }

    // (33:2) <Button kind="secondary" on:click="{() => dispatch( 'cancelnew' )}">
    function create_default_slot_5(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(33:2) <Button kind=\"secondary\" on:click=\"{() => dispatch( 'cancelnew' )}\">", ctx });
    	return block;
    }

    // (34:2) <Button      icon="/img/save-white.svg"      on:click="{() => dispatch( 'savenew' )}">
    function create_default_slot_4(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(34:2) <Button      icon=\"/img/save-white.svg\"      on:click=\"{() => dispatch( 'savenew' )}\">", ctx });
    	return block;
    }

    // (41:0) {#if $controls_mode === 2}
    function create_if_block_1(ctx) {
    	var current;

    	var button = new Button({
    		props: {
    		icon: "/img/edit.svg",
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.click_handler_2);

    	const block = {
    		c: function create() {
    			button.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(button, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(button, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(41:0) {#if $controls_mode === 2}", ctx });
    	return block;
    }

    // (43:2) <Button icon="/img/edit.svg" on:click="{() => dispatch( 'edit' )}">
    function create_default_slot_3(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Edit");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(43:2) <Button icon=\"/img/edit.svg\" on:click=\"{() => dispatch( 'edit' )}\">", ctx });
    	return block;
    }

    // (48:0) {#if $controls_mode === 3}
    function create_if_block$1(ctx) {
    	var t0, div, t1, t2, current;

    	var button0 = new Button({
    		props: {
    		kind: "danger",
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button0.$on("click", ctx.click_handler_3);

    	var button1 = new Button({
    		props: {
    		kind: "secondary",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button1.$on("click", ctx.click_handler_4);

    	var button2 = new Button({
    		props: {
    		icon: "/img/save-white.svg",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button2.$on("click", ctx.click_handler_5);

    	const block = {
    		c: function create() {
    			button0.$$.fragment.c();
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			button1.$$.fragment.c();
    			t2 = space();
    			button2.$$.fragment.c();
    			attr_dev(div, "class", "block svelte-lg5fnt");
    			add_location(div, file$1, 52, 2, 1065);
    		},

    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(button1, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
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
    			destroy_component(button0, detaching);

    			if (detaching) {
    				detach_dev(t0);
    				detach_dev(div);
    				detach_dev(t1);
    			}

    			destroy_component(button1, detaching);

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(button2, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(48:0) {#if $controls_mode === 3}", ctx });
    	return block;
    }

    // (50:2) <Button      kind="danger"      on:click="{() => dispatch( 'delete' )}">
    function create_default_slot_2(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(50:2) <Button      kind=\"danger\"      on:click=\"{() => dispatch( 'delete' )}\">", ctx });
    	return block;
    }

    // (54:2) <Button      kind="secondary"      on:click="{() => dispatch( 'cancelexisting' )}">
    function create_default_slot_1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(54:2) <Button      kind=\"secondary\"      on:click=\"{() => dispatch( 'cancelexisting' )}\">", ctx });
    	return block;
    }

    // (57:2) <Button      icon="/img/save-white.svg"      on:click="{() => dispatch( 'saveexisting' )}">
    function create_default_slot(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(57:2) <Button      icon=\"/img/save-white.svg\"      on:click=\"{() => dispatch( 'saveexisting' )}\">", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var div, t0, t1, current;

    	var if_block0 = (ctx.$controls_mode === 1) && create_if_block_2(ctx);

    	var if_block1 = (ctx.$controls_mode === 2) && create_if_block_1(ctx);

    	var if_block2 = (ctx.$controls_mode === 3) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			set_style(div, "display", (ctx.$tab_index < 2 ? 'flex' : 'none'));
    			attr_dev(div, "class", "svelte-lg5fnt");
    			add_location(div, file$1, 25, 0, 422);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.$controls_mode === 1) {
    				if (!if_block0) {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				} else transition_in(if_block0, 1);
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.$controls_mode === 2) {
    				if (!if_block1) {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				} else transition_in(if_block1, 1);
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}

    			if (ctx.$controls_mode === 3) {
    				if (!if_block2) {
    					if_block2 = create_if_block$1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, null);
    				} else transition_in(if_block2, 1);
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}

    			if (!current || changed.$tab_index) {
    				set_style(div, "display", (ctx.$tab_index < 2 ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $tab_index, $controls_mode;

    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });
    	validate_store(controls_mode, 'controls_mode');
    	component_subscribe($$self, controls_mode, $$value => { $controls_mode = $$value; $$invalidate('$controls_mode', $controls_mode); });

    	

    const dispatch = createEventDispatcher();

    	const click_handler = () => dispatch( 'cancelnew' );

    	const click_handler_1 = () => dispatch( 'savenew' );

    	const click_handler_2 = () => dispatch( 'edit' );

    	const click_handler_3 = () => dispatch( 'delete' );

    	const click_handler_4 = () => dispatch( 'cancelexisting' );

    	const click_handler_5 = () => dispatch( 'saveexisting' );

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    		if ('$controls_mode' in $$props) controls_mode.set($controls_mode);
    	};

    	return {
    		dispatch,
    		$tab_index,
    		$controls_mode,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	};
    }

    class Controls extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Controls", options, id: create_fragment$1.name });
    	}
    }

    /* src/Details.svelte generated by Svelte v3.12.1 */

    const file$2 = "src/Details.svelte";

    function create_fragment$2(ctx) {
    	var div1, div0, p, t0, t1, button, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(ctx.summary);
    			t1 = space();
    			button = element("button");
    			t2 = space();

    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "svelte-luq7pz");
    			add_location(p, file$2, 55, 4, 913);
    			attr_dev(button, "class", "svelte-luq7pz");
    			toggle_class(button, "closed", !ctx.opened);
    			add_location(button, file$2, 56, 4, 934);
    			attr_dev(div0, "class", "summary svelte-luq7pz");
    			add_location(div0, file$2, 54, 2, 887);

    			attr_dev(div1, "class", "pane svelte-luq7pz");
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
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(div1, t2);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.summary) {
    				set_data_dev(t0, ctx.summary);
    			}

    			if (changed.opened) {
    				toggle_class(button, "closed", !ctx.opened);
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

    /* src/TextInput.svelte generated by Svelte v3.12.1 */

    const file$3 = "src/TextInput.svelte";

    // (66:2) {#if label !== undefined}
    function create_if_block_1$1(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			attr_dev(label_1, "class", "svelte-13vrs16");
    			add_location(label_1, file$3, 67, 4, 1117);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$1.name, type: "if", source: "(66:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (76:2) {:else}
    function create_else_block$1(ctx) {
    	var p, t0, t1, input, dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(ctx.helper);
    			t1 = space();
    			input = element("input");
    			attr_dev(p, "class", "svelte-13vrs16");
    			add_location(p, file$3, 77, 4, 1268);
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-13vrs16");
    			add_location(input, file$3, 78, 4, 1288);
    			dispose = listen_dev(input, "input", ctx.input_input_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, input, anchor);

    			set_input_value(input, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t0, ctx.helper);
    			}

    			if (changed.value && (input.value !== ctx.value)) set_input_value(input, ctx.value);

    			if (changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    				detach_dev(t1);
    				detach_dev(input);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$1.name, type: "else", source: "(76:2) {:else}", ctx });
    	return block;
    }

    // (72:2) {#if helper === undefined}
    function create_if_block$2(ctx) {
    	var input, dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-13vrs16");
    			add_location(input, file$3, 73, 4, 1184);
    			dispose = listen_dev(input, "input", ctx.input_input_handler);
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

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$2.name, type: "if", source: "(72:2) {#if helper === undefined}", ctx });
    	return block;
    }

    function create_fragment$3(ctx) {
    	var div, t;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$1(ctx);

    	function select_block_type(changed, ctx) {
    		if (ctx.helper === ctx.undefined) return create_if_block$2;
    		return create_else_block$1;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "svelte-13vrs16");
    			add_location(div, file$3, 63, 0, 1077);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_block1.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(changed, ctx)) && if_block1) {
    				if_block1.p(changed, ctx);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);
    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { disabled = false, label = undefined, helper = undefined, placeholder = 'Text input', value = '' } = $$props;

    	const writable_props = ['disabled', 'label', 'helper', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextInput> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	function input_input_handler_1() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, label, helper, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		label,
    		helper,
    		placeholder,
    		value,
    		undefined,
    		input_input_handler,
    		input_input_handler_1
    	};
    }

    class TextInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["disabled", "label", "helper", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextInput", options, id: create_fragment$3.name });
    	}

    	get disabled() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TextInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TextInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
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

    /* src/Endpoints.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/Endpoints.svelte";

    function create_fragment$4(ctx) {
    	var div11, div1, updating_value, t0, div0, t1, updating_value_1, t2, div3, updating_value_2, t3, div2, t4, updating_value_3, t5, div5, updating_value_4, t6, div4, t7, updating_value_5, t8, div7, updating_value_6, t9, div6, t10, updating_value_7, t11, div10, updating_value_8, t12, div8, t13, div9, current;

    	function textinput0_value_binding(value) {
    		ctx.textinput0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput0_props = {
    		label: "Website",
    		placeholder: "Website",
    		helper: "Including HTTP/S"
    	};
    	if (ctx.$endpoint_website !== void 0) {
    		textinput0_props.value = ctx.$endpoint_website;
    	}
    	var textinput0 = new TextInput({ props: textinput0_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput0, 'value', textinput0_value_binding));

    	function textinput1_value_binding(value_1) {
    		ctx.textinput1_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let textinput1_props = {
    		label: "Feed",
    		placeholder: "Feed",
    		helper: "RSS or ATOM, including HTTP/S"
    	};
    	if (ctx.$endpoint_rss !== void 0) {
    		textinput1_props.value = ctx.$endpoint_rss;
    	}
    	var textinput1 = new TextInput({ props: textinput1_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput1, 'value', textinput1_value_binding));

    	function textinput2_value_binding(value_2) {
    		ctx.textinput2_value_binding.call(null, value_2);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let textinput2_props = {
    		label: "Dev.to",
    		placeholder: "Dev.to",
    		helper: "User name, after trailing slash of profile"
    	};
    	if (ctx.$endpoint_devto !== void 0) {
    		textinput2_props.value = ctx.$endpoint_devto;
    	}
    	var textinput2 = new TextInput({ props: textinput2_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput2, 'value', textinput2_value_binding));

    	function textinput3_value_binding(value_3) {
    		ctx.textinput3_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let textinput3_props = {
    		label: "Medium",
    		placeholder: "Medium",
    		helper: "User name, after the \"@\" symbol"
    	};
    	if (ctx.$endpoint_medium !== void 0) {
    		textinput3_props.value = ctx.$endpoint_medium;
    	}
    	var textinput3 = new TextInput({ props: textinput3_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput3, 'value', textinput3_value_binding));

    	function textinput4_value_binding(value_4) {
    		ctx.textinput4_value_binding.call(null, value_4);
    		updating_value_4 = true;
    		add_flush_callback(() => updating_value_4 = false);
    	}

    	let textinput4_props = {
    		label: "YouTube",
    		placeholder: "YouTube",
    		helper: "Channel ID, not user name"
    	};
    	if (ctx.$endpoint_youtube !== void 0) {
    		textinput4_props.value = ctx.$endpoint_youtube;
    	}
    	var textinput4 = new TextInput({ props: textinput4_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput4, 'value', textinput4_value_binding));

    	function textinput5_value_binding(value_5) {
    		ctx.textinput5_value_binding.call(null, value_5);
    		updating_value_5 = true;
    		add_flush_callback(() => updating_value_5 = false);
    	}

    	let textinput5_props = {
    		label: "Twitter",
    		placeholder: "Twitter",
    		helper: "User name, no \"@\" symbol"
    	};
    	if (ctx.$endpoint_twitter !== void 0) {
    		textinput5_props.value = ctx.$endpoint_twitter;
    	}
    	var textinput5 = new TextInput({ props: textinput5_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput5, 'value', textinput5_value_binding));

    	function textinput6_value_binding(value_6) {
    		ctx.textinput6_value_binding.call(null, value_6);
    		updating_value_6 = true;
    		add_flush_callback(() => updating_value_6 = false);
    	}

    	let textinput6_props = {
    		label: "Stack Overflow",
    		placeholder: "Stack Overflow",
    		helper: "User ID, not user name"
    	};
    	if (ctx.$endpoint_so !== void 0) {
    		textinput6_props.value = ctx.$endpoint_so;
    	}
    	var textinput6 = new TextInput({ props: textinput6_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput6, 'value', textinput6_value_binding));

    	function textinput7_value_binding(value_7) {
    		ctx.textinput7_value_binding.call(null, value_7);
    		updating_value_7 = true;
    		add_flush_callback(() => updating_value_7 = false);
    	}

    	let textinput7_props = {
    		label: "GitHub",
    		placeholder: "GitHub",
    		helper: "User name, after trailing slash"
    	};
    	if (ctx.$endpoint_github !== void 0) {
    		textinput7_props.value = ctx.$endpoint_github;
    	}
    	var textinput7 = new TextInput({ props: textinput7_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput7, 'value', textinput7_value_binding));

    	function textinput8_value_binding(value_8) {
    		ctx.textinput8_value_binding.call(null, value_8);
    		updating_value_8 = true;
    		add_flush_callback(() => updating_value_8 = false);
    	}

    	let textinput8_props = {
    		label: "Reddit",
    		placeholder: "Reddit",
    		helper: "User name, as shown in posts"
    	};
    	if (ctx.$endpoint_reddit !== void 0) {
    		textinput8_props.value = ctx.$endpoint_reddit;
    	}
    	var textinput8 = new TextInput({ props: textinput8_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput8, 'value', textinput8_value_binding));

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div1 = element("div");
    			textinput0.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput1.$$.fragment.c();
    			t2 = space();
    			div3 = element("div");
    			textinput2.$$.fragment.c();
    			t3 = space();
    			div2 = element("div");
    			t4 = space();
    			textinput3.$$.fragment.c();
    			t5 = space();
    			div5 = element("div");
    			textinput4.$$.fragment.c();
    			t6 = space();
    			div4 = element("div");
    			t7 = space();
    			textinput5.$$.fragment.c();
    			t8 = space();
    			div7 = element("div");
    			textinput6.$$.fragment.c();
    			t9 = space();
    			div6 = element("div");
    			t10 = space();
    			textinput7.$$.fragment.c();
    			t11 = space();
    			div10 = element("div");
    			textinput8.$$.fragment.c();
    			t12 = space();
    			div8 = element("div");
    			t13 = space();
    			div9 = element("div");
    			attr_dev(div0, "class", "gap svelte-d25dc9");
    			add_location(div0, file$4, 54, 4, 1185);
    			attr_dev(div1, "class", "line svelte-d25dc9");
    			add_location(div1, file$4, 48, 2, 1022);
    			attr_dev(div2, "class", "gap svelte-d25dc9");
    			add_location(div2, file$4, 68, 4, 1562);
    			attr_dev(div3, "class", "line svelte-d25dc9");
    			add_location(div3, file$4, 62, 2, 1378);
    			attr_dev(div4, "class", "gap svelte-d25dc9");
    			add_location(div4, file$4, 82, 4, 1942);
    			attr_dev(div5, "class", "line svelte-d25dc9");
    			add_location(div5, file$4, 76, 2, 1767);
    			attr_dev(div6, "class", "gap svelte-d25dc9");
    			add_location(div6, file$4, 96, 4, 2324);
    			attr_dev(div7, "class", "line svelte-d25dc9");
    			add_location(div7, file$4, 90, 2, 2147);
    			attr_dev(div8, "class", "gap svelte-d25dc9");
    			add_location(div8, file$4, 110, 4, 2697);
    			attr_dev(div9, "class", "block svelte-d25dc9");
    			add_location(div9, file$4, 111, 4, 2725);
    			attr_dev(div10, "class", "line svelte-d25dc9");
    			add_location(div10, file$4, 104, 3, 2526);
    			attr_dev(div11, "class", "endpoints svelte-d25dc9");
    			set_style(div11, "display", (( ctx.$tab_index === 1 && ctx.$social_index === 0 ) ? 'flex' : 'none'));
    			add_location(div11, file$4, 44, 0, 907);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div1);
    			mount_component(textinput0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(textinput1, div1, null);
    			append_dev(div11, t2);
    			append_dev(div11, div3);
    			mount_component(textinput2, div3, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div3, t4);
    			mount_component(textinput3, div3, null);
    			append_dev(div11, t5);
    			append_dev(div11, div5);
    			mount_component(textinput4, div5, null);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div5, t7);
    			mount_component(textinput5, div5, null);
    			append_dev(div11, t8);
    			append_dev(div11, div7);
    			mount_component(textinput6, div7, null);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div7, t10);
    			mount_component(textinput7, div7, null);
    			append_dev(div11, t11);
    			append_dev(div11, div10);
    			mount_component(textinput8, div10, null);
    			append_dev(div10, t12);
    			append_dev(div10, div8);
    			append_dev(div10, t13);
    			append_dev(div10, div9);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (!updating_value && changed.$endpoint_website) {
    				textinput0_changes.value = ctx.$endpoint_website;
    			}
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (!updating_value_1 && changed.$endpoint_rss) {
    				textinput1_changes.value = ctx.$endpoint_rss;
    			}
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (!updating_value_2 && changed.$endpoint_devto) {
    				textinput2_changes.value = ctx.$endpoint_devto;
    			}
    			textinput2.$set(textinput2_changes);

    			var textinput3_changes = {};
    			if (!updating_value_3 && changed.$endpoint_medium) {
    				textinput3_changes.value = ctx.$endpoint_medium;
    			}
    			textinput3.$set(textinput3_changes);

    			var textinput4_changes = {};
    			if (!updating_value_4 && changed.$endpoint_youtube) {
    				textinput4_changes.value = ctx.$endpoint_youtube;
    			}
    			textinput4.$set(textinput4_changes);

    			var textinput5_changes = {};
    			if (!updating_value_5 && changed.$endpoint_twitter) {
    				textinput5_changes.value = ctx.$endpoint_twitter;
    			}
    			textinput5.$set(textinput5_changes);

    			var textinput6_changes = {};
    			if (!updating_value_6 && changed.$endpoint_so) {
    				textinput6_changes.value = ctx.$endpoint_so;
    			}
    			textinput6.$set(textinput6_changes);

    			var textinput7_changes = {};
    			if (!updating_value_7 && changed.$endpoint_github) {
    				textinput7_changes.value = ctx.$endpoint_github;
    			}
    			textinput7.$set(textinput7_changes);

    			var textinput8_changes = {};
    			if (!updating_value_8 && changed.$endpoint_reddit) {
    				textinput8_changes.value = ctx.$endpoint_reddit;
    			}
    			textinput8.$set(textinput8_changes);

    			if (!current || changed.$tab_index || changed.$social_index) {
    				set_style(div11, "display", (( ctx.$tab_index === 1 && ctx.$social_index === 0 ) ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(textinput2.$$.fragment, local);

    			transition_in(textinput3.$$.fragment, local);

    			transition_in(textinput4.$$.fragment, local);

    			transition_in(textinput5.$$.fragment, local);

    			transition_in(textinput6.$$.fragment, local);

    			transition_in(textinput7.$$.fragment, local);

    			transition_in(textinput8.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(textinput3.$$.fragment, local);
    			transition_out(textinput4.$$.fragment, local);
    			transition_out(textinput5.$$.fragment, local);
    			transition_out(textinput6.$$.fragment, local);
    			transition_out(textinput7.$$.fragment, local);
    			transition_out(textinput8.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div11);
    			}

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(textinput2);

    			destroy_component(textinput3);

    			destroy_component(textinput4);

    			destroy_component(textinput5);

    			destroy_component(textinput6);

    			destroy_component(textinput7);

    			destroy_component(textinput8);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $tab_index, $social_index, $endpoint_website, $endpoint_rss, $endpoint_devto, $endpoint_medium, $endpoint_youtube, $endpoint_twitter, $endpoint_so, $endpoint_github, $endpoint_reddit;

    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });
    	validate_store(social_index, 'social_index');
    	component_subscribe($$self, social_index, $$value => { $social_index = $$value; $$invalidate('$social_index', $social_index); });
    	validate_store(endpoint_website, 'endpoint_website');
    	component_subscribe($$self, endpoint_website, $$value => { $endpoint_website = $$value; $$invalidate('$endpoint_website', $endpoint_website); });
    	validate_store(endpoint_rss, 'endpoint_rss');
    	component_subscribe($$self, endpoint_rss, $$value => { $endpoint_rss = $$value; $$invalidate('$endpoint_rss', $endpoint_rss); });
    	validate_store(endpoint_devto, 'endpoint_devto');
    	component_subscribe($$self, endpoint_devto, $$value => { $endpoint_devto = $$value; $$invalidate('$endpoint_devto', $endpoint_devto); });
    	validate_store(endpoint_medium, 'endpoint_medium');
    	component_subscribe($$self, endpoint_medium, $$value => { $endpoint_medium = $$value; $$invalidate('$endpoint_medium', $endpoint_medium); });
    	validate_store(endpoint_youtube, 'endpoint_youtube');
    	component_subscribe($$self, endpoint_youtube, $$value => { $endpoint_youtube = $$value; $$invalidate('$endpoint_youtube', $endpoint_youtube); });
    	validate_store(endpoint_twitter, 'endpoint_twitter');
    	component_subscribe($$self, endpoint_twitter, $$value => { $endpoint_twitter = $$value; $$invalidate('$endpoint_twitter', $endpoint_twitter); });
    	validate_store(endpoint_so, 'endpoint_so');
    	component_subscribe($$self, endpoint_so, $$value => { $endpoint_so = $$value; $$invalidate('$endpoint_so', $endpoint_so); });
    	validate_store(endpoint_github, 'endpoint_github');
    	component_subscribe($$self, endpoint_github, $$value => { $endpoint_github = $$value; $$invalidate('$endpoint_github', $endpoint_github); });
    	validate_store(endpoint_reddit, 'endpoint_reddit');
    	component_subscribe($$self, endpoint_reddit, $$value => { $endpoint_reddit = $$value; $$invalidate('$endpoint_reddit', $endpoint_reddit); });

    	function textinput0_value_binding(value) {
    		$endpoint_website = value;
    		endpoint_website.set($endpoint_website);
    	}

    	function textinput1_value_binding(value_1) {
    		$endpoint_rss = value_1;
    		endpoint_rss.set($endpoint_rss);
    	}

    	function textinput2_value_binding(value_2) {
    		$endpoint_devto = value_2;
    		endpoint_devto.set($endpoint_devto);
    	}

    	function textinput3_value_binding(value_3) {
    		$endpoint_medium = value_3;
    		endpoint_medium.set($endpoint_medium);
    	}

    	function textinput4_value_binding(value_4) {
    		$endpoint_youtube = value_4;
    		endpoint_youtube.set($endpoint_youtube);
    	}

    	function textinput5_value_binding(value_5) {
    		$endpoint_twitter = value_5;
    		endpoint_twitter.set($endpoint_twitter);
    	}

    	function textinput6_value_binding(value_6) {
    		$endpoint_so = value_6;
    		endpoint_so.set($endpoint_so);
    	}

    	function textinput7_value_binding(value_7) {
    		$endpoint_github = value_7;
    		endpoint_github.set($endpoint_github);
    	}

    	function textinput8_value_binding(value_8) {
    		$endpoint_reddit = value_8;
    		endpoint_reddit.set($endpoint_reddit);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    		if ('$social_index' in $$props) social_index.set($social_index);
    		if ('$endpoint_website' in $$props) endpoint_website.set($endpoint_website);
    		if ('$endpoint_rss' in $$props) endpoint_rss.set($endpoint_rss);
    		if ('$endpoint_devto' in $$props) endpoint_devto.set($endpoint_devto);
    		if ('$endpoint_medium' in $$props) endpoint_medium.set($endpoint_medium);
    		if ('$endpoint_youtube' in $$props) endpoint_youtube.set($endpoint_youtube);
    		if ('$endpoint_twitter' in $$props) endpoint_twitter.set($endpoint_twitter);
    		if ('$endpoint_so' in $$props) endpoint_so.set($endpoint_so);
    		if ('$endpoint_github' in $$props) endpoint_github.set($endpoint_github);
    		if ('$endpoint_reddit' in $$props) endpoint_reddit.set($endpoint_reddit);
    	};

    	return {
    		$tab_index,
    		$social_index,
    		$endpoint_website,
    		$endpoint_rss,
    		$endpoint_devto,
    		$endpoint_medium,
    		$endpoint_youtube,
    		$endpoint_twitter,
    		$endpoint_so,
    		$endpoint_github,
    		$endpoint_reddit,
    		textinput0_value_binding,
    		textinput1_value_binding,
    		textinput2_value_binding,
    		textinput3_value_binding,
    		textinput4_value_binding,
    		textinput5_value_binding,
    		textinput6_value_binding,
    		textinput7_value_binding,
    		textinput8_value_binding
    	};
    }

    class Endpoints extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Endpoints", options, id: create_fragment$4.name });
    	}
    }

    /* src/List.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/List.svelte";

    const get_default_slot_changes = ({ item, data }) => ({ item: data });
    const get_default_slot_context = ({ item, data }) => ({ item: item });

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (27:0) {#each data as item}
    function create_each_block(ctx) {
    	var li, t, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();
    			t = space();

    			attr_dev(li, "class", "svelte-1tlgp7t");
    			add_location(li, file$5, 28, 0, 277);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(27:0) {#each data as item}", ctx });
    	return block;
    }

    function create_fragment$5(ctx) {
    	var ul, current;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(ul, file$5, 24, 0, 247);
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$5.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["data"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "List", options, id: create_fragment$5.name });
    	}

    	get data() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TagInput.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/TagInput.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	child_ctx.t = i;
    	return child_ctx;
    }

    // (145:2) {#if label !== undefined}
    function create_if_block$3(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			attr_dev(label_1, "class", "svelte-12xjt6a");
    			add_location(label_1, file$6, 146, 4, 2406);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(145:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (153:2) {#each value as tag, t}
    function create_each_block$1(ctx) {
    	var li, p, t0_value = ctx.tag + "", t0, t1, button, dispose;

    	const block = {
    		c: function create() {
    			li = element("li");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			attr_dev(p, "class", "svelte-12xjt6a");
    			add_location(p, file$6, 155, 6, 2551);
    			attr_dev(button, "data-id", ctx.t);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-12xjt6a");
    			add_location(button, file$6, 156, 6, 2570);
    			attr_dev(li, "class", "tag svelte-12xjt6a");
    			add_location(li, file$6, 154, 4, 2528);
    			dispose = listen_dev(button, "click", ctx.doRemove);
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

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(153:2) {#each value as tag, t}", ctx });
    	return block;
    }

    function create_fragment$6(ctx) {
    	var div, t0, ul, t1, li, input, input_placeholder_value, dispose;

    	var if_block = (ctx.label !== ctx.undefined) && create_if_block$3(ctx);

    	let each_value = ctx.value;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			li = element("li");
    			input = element("input");
    			attr_dev(input, "placeholder", input_placeholder_value = ctx.value.length === 0 ? ctx.placeholder : '');
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-12xjt6a");
    			add_location(input, file$6, 162, 6, 2689);
    			attr_dev(li, "class", "input svelte-12xjt6a");
    			add_location(li, file$6, 161, 4, 2664);
    			attr_dev(ul, "class", "svelte-12xjt6a");
    			toggle_class(ul, "focus", ctx.focus);
    			toggle_class(ul, "disabled", ctx.disabled);
    			add_location(ul, file$6, 150, 2, 2441);
    			attr_dev(div, "class", "svelte-12xjt6a");
    			add_location(div, file$6, 142, 0, 2366);

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
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t1);
    			append_dev(ul, li);
    			append_dev(li, input);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (changed.value) {
    				each_value = ctx.value;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t1);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if ((changed.value || changed.placeholder) && input_placeholder_value !== (input_placeholder_value = ctx.value.length === 0 ? ctx.placeholder : '')) {
    				attr_dev(input, "placeholder", input_placeholder_value);
    			}

    			if (changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (changed.focus) {
    				toggle_class(ul, "focus", ctx.focus);
    			}

    			if (changed.disabled) {
    				toggle_class(ul, "disabled", ctx.disabled);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			if (if_block) if_block.d();

    			destroy_each(each_blocks, detaching);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { disabled = false, label = undefined, placeholder = '', value = [] } = $$props;

    let focus = false;

    function doKeyboard( evt ) {
      if( evt.keyCode === 13 ) {
        evt.preventDefault();

        let found = false;

        for( let v = 0; v < value.length; v++ ) {
          if( value[v] === evt.target.value ) {
            found = true;
            break;
          }
        }

        if( !found ) {
          $$invalidate('value', value = [...value, evt.target.value]);
          evt.target.value = '';
        }
      }
    }

    function doRemove( evt ) {
      let index = evt.target.getAttribute( 'data-id' );

      value.splice( index, 1 );
      $$invalidate('value', value = [...value]);
    }

    	const writable_props = ['disabled', 'label', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TagInput> was created with unknown prop '${key}'`);
    	});

    	const focus_handler = () => $$invalidate('focus', focus = true);

    	const blur_handler = () => $$invalidate('focus', focus = false);

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, label, placeholder, value, focus };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('focus' in $$props) $$invalidate('focus', focus = $$props.focus);
    	};

    	return {
    		disabled,
    		label,
    		placeholder,
    		value,
    		focus,
    		doKeyboard,
    		doRemove,
    		undefined,
    		focus_handler,
    		blur_handler
    	};
    }

    class TagInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["disabled", "label", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TagInput", options, id: create_fragment$6.name });
    	}

    	get disabled() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
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

    const file$7 = "src/TextArea.svelte";

    // (65:2) {#if label !== undefined}
    function create_if_block_1$2(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			attr_dev(label_1, "class", "svelte-1d4leea");
    			add_location(label_1, file$7, 66, 4, 1110);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$2.name, type: "if", source: "(65:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (71:2) {#if helper !== undefined}
    function create_if_block$4(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			attr_dev(p, "class", "svelte-1d4leea");
    			add_location(p, file$7, 72, 4, 1177);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$4.name, type: "if", source: "(71:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    function create_fragment$7(ctx) {
    	var div, t0, t1, textarea, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$2(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			textarea = element("textarea");
    			textarea.disabled = ctx.disabled;
    			attr_dev(textarea, "placeholder", ctx.placeholder);
    			attr_dev(textarea, "class", "svelte-1d4leea");
    			add_location(textarea, file$7, 76, 2, 1207);
    			attr_dev(div, "class", "svelte-1d4leea");
    			add_location(div, file$7, 62, 0, 1070);
    			dispose = listen_dev(textarea, "input", ctx.textarea_input_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			append_dev(div, textarea);

    			set_input_value(textarea, ctx.value);
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.helper !== ctx.undefined) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block$4(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

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
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { disabled = false, helper = undefined, label = undefined, placeholder = '', value = '' } = $$props;

    	const writable_props = ['disabled', 'helper', 'label', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, helper, label, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		disabled,
    		helper,
    		label,
    		placeholder,
    		value,
    		undefined,
    		textarea_input_handler
    	};
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["disabled", "helper", "label", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$7.name });
    	}

    	get disabled() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
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

    /* src/Overview.svelte generated by Svelte v3.12.1 */

    const file$8 = "src/Overview.svelte";

    function create_fragment$8(ctx) {
    	var form, div1, updating_value, t0, div0, t1, updating_value_1, t2, div2, updating_value_2, t3, div3, updating_value_3, t4, div4, updating_value_4, t5, div5, updating_value_5, current;

    	function textinput0_value_binding(value) {
    		ctx.textinput0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput0_props = {
    		label: "Full name",
    		placeholder: "Full name",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_name !== void 0) {
    		textinput0_props.value = ctx.$developer_name;
    	}
    	var textinput0 = new TextInput({ props: textinput0_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput0, 'value', textinput0_value_binding));

    	function textinput1_value_binding(value_1) {
    		ctx.textinput1_value_binding.call(null, value_1);
    		updating_value_1 = true;
    		add_flush_callback(() => updating_value_1 = false);
    	}

    	let textinput1_props = {
    		label: "Email address",
    		placeholder: "Email address",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_email !== void 0) {
    		textinput1_props.value = ctx.$developer_email;
    	}
    	var textinput1 = new TextInput({ props: textinput1_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput1, 'value', textinput1_value_binding));

    	function textinput2_value_binding(value_2) {
    		ctx.textinput2_value_binding.call(null, value_2);
    		updating_value_2 = true;
    		add_flush_callback(() => updating_value_2 = false);
    	}

    	let textinput2_props = {
    		label: "Profile image",
    		placeholder: "Profile image",
    		helper: "Full path to profile image, including HTTP/S",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_image !== void 0) {
    		textinput2_props.value = ctx.$developer_image;
    	}
    	var textinput2 = new TextInput({ props: textinput2_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput2, 'value', textinput2_value_binding));

    	function taginput0_value_binding(value_3) {
    		ctx.taginput0_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let taginput0_props = {
    		label: "Labels",
    		placeholder: "Labels",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_labels !== void 0) {
    		taginput0_props.value = ctx.$developer_labels;
    	}
    	var taginput0 = new TagInput({ props: taginput0_props, $$inline: true });

    	binding_callbacks.push(() => bind(taginput0, 'value', taginput0_value_binding));

    	function taginput1_value_binding(value_4) {
    		ctx.taginput1_value_binding.call(null, value_4);
    		updating_value_4 = true;
    		add_flush_callback(() => updating_value_4 = false);
    	}

    	let taginput1_props = {
    		label: "Skills",
    		placeholder: "Skills",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_skills !== void 0) {
    		taginput1_props.value = ctx.$developer_skills;
    	}
    	var taginput1 = new TagInput({ props: taginput1_props, $$inline: true });

    	binding_callbacks.push(() => bind(taginput1, 'value', taginput1_value_binding));

    	function textarea_value_binding(value_5) {
    		ctx.textarea_value_binding.call(null, value_5);
    		updating_value_5 = true;
    		add_flush_callback(() => updating_value_5 = false);
    	}

    	let textarea_props = {
    		label: "Description/Bio",
    		placeholder: "Description",
    		disabled: ctx.$overview_disabled
    	};
    	if (ctx.$developer_description !== void 0) {
    		textarea_props.value = ctx.$developer_description;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	const block = {
    		c: function create() {
    			form = element("form");
    			div1 = element("div");
    			textinput0.$$.fragment.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = space();
    			textinput1.$$.fragment.c();
    			t2 = space();
    			div2 = element("div");
    			textinput2.$$.fragment.c();
    			t3 = space();
    			div3 = element("div");
    			taginput0.$$.fragment.c();
    			t4 = space();
    			div4 = element("div");
    			taginput1.$$.fragment.c();
    			t5 = space();
    			div5 = element("div");
    			textarea.$$.fragment.c();
    			attr_dev(div0, "class", "gap svelte-3c5ya2");
    			add_location(div0, file$8, 53, 4, 1128);
    			attr_dev(div1, "class", "line svelte-3c5ya2");
    			add_location(div1, file$8, 47, 2, 955);
    			attr_dev(div2, "class", "line svelte-3c5ya2");
    			add_location(div2, file$8, 61, 2, 1321);
    			attr_dev(div3, "class", "line svelte-3c5ya2");
    			add_location(div3, file$8, 70, 2, 1571);
    			attr_dev(div4, "class", "line svelte-3c5ya2");
    			add_location(div4, file$8, 78, 2, 1748);
    			attr_dev(div5, "class", "line last svelte-3c5ya2");
    			add_location(div5, file$8, 86, 2, 1924);
    			set_style(form, "display", (ctx.$tab_index === 0 ? 'flex' : 'none'));
    			attr_dev(form, "class", "svelte-3c5ya2");
    			add_location(form, file$8, 45, 0, 890);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div1);
    			mount_component(textinput0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(textinput1, div1, null);
    			append_dev(form, t2);
    			append_dev(form, div2);
    			mount_component(textinput2, div2, null);
    			append_dev(form, t3);
    			append_dev(form, div3);
    			mount_component(taginput0, div3, null);
    			append_dev(form, t4);
    			append_dev(form, div4);
    			mount_component(taginput1, div4, null);
    			append_dev(form, t5);
    			append_dev(form, div5);
    			mount_component(textarea, div5, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.$overview_disabled) textinput0_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value && changed.$developer_name) {
    				textinput0_changes.value = ctx.$developer_name;
    			}
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.$overview_disabled) textinput1_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value_1 && changed.$developer_email) {
    				textinput1_changes.value = ctx.$developer_email;
    			}
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (changed.$overview_disabled) textinput2_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value_2 && changed.$developer_image) {
    				textinput2_changes.value = ctx.$developer_image;
    			}
    			textinput2.$set(textinput2_changes);

    			var taginput0_changes = {};
    			if (changed.$overview_disabled) taginput0_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value_3 && changed.$developer_labels) {
    				taginput0_changes.value = ctx.$developer_labels;
    			}
    			taginput0.$set(taginput0_changes);

    			var taginput1_changes = {};
    			if (changed.$overview_disabled) taginput1_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value_4 && changed.$developer_skills) {
    				taginput1_changes.value = ctx.$developer_skills;
    			}
    			taginput1.$set(taginput1_changes);

    			var textarea_changes = {};
    			if (changed.$overview_disabled) textarea_changes.disabled = ctx.$overview_disabled;
    			if (!updating_value_5 && changed.$developer_description) {
    				textarea_changes.value = ctx.$developer_description;
    			}
    			textarea.$set(textarea_changes);

    			if (!current || changed.$tab_index) {
    				set_style(form, "display", (ctx.$tab_index === 0 ? 'flex' : 'none'));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(textinput2.$$.fragment, local);

    			transition_in(taginput0.$$.fragment, local);

    			transition_in(taginput1.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(taginput0.$$.fragment, local);
    			transition_out(taginput1.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(textinput2);

    			destroy_component(taginput0);

    			destroy_component(taginput1);

    			destroy_component(textarea);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $tab_index, $overview_disabled, $developer_name, $developer_email, $developer_image, $developer_labels, $developer_skills, $developer_description;

    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });
    	validate_store(overview_disabled, 'overview_disabled');
    	component_subscribe($$self, overview_disabled, $$value => { $overview_disabled = $$value; $$invalidate('$overview_disabled', $overview_disabled); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(developer_labels, 'developer_labels');
    	component_subscribe($$self, developer_labels, $$value => { $developer_labels = $$value; $$invalidate('$developer_labels', $developer_labels); });
    	validate_store(developer_skills, 'developer_skills');
    	component_subscribe($$self, developer_skills, $$value => { $developer_skills = $$value; $$invalidate('$developer_skills', $developer_skills); });
    	validate_store(developer_description, 'developer_description');
    	component_subscribe($$self, developer_description, $$value => { $developer_description = $$value; $$invalidate('$developer_description', $developer_description); });

    	function textinput0_value_binding(value) {
    		$developer_name = value;
    		developer_name.set($developer_name);
    	}

    	function textinput1_value_binding(value_1) {
    		$developer_email = value_1;
    		developer_email.set($developer_email);
    	}

    	function textinput2_value_binding(value_2) {
    		$developer_image = value_2;
    		developer_image.set($developer_image);
    	}

    	function taginput0_value_binding(value_3) {
    		$developer_labels = value_3;
    		developer_labels.set($developer_labels);
    	}

    	function taginput1_value_binding(value_4) {
    		$developer_skills = value_4;
    		developer_skills.set($developer_skills);
    	}

    	function textarea_value_binding(value_5) {
    		$developer_description = value_5;
    		developer_description.set($developer_description);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    		if ('$overview_disabled' in $$props) overview_disabled.set($overview_disabled);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$developer_labels' in $$props) developer_labels.set($developer_labels);
    		if ('$developer_skills' in $$props) developer_skills.set($developer_skills);
    		if ('$developer_description' in $$props) developer_description.set($developer_description);
    	};

    	return {
    		$tab_index,
    		$overview_disabled,
    		$developer_name,
    		$developer_email,
    		$developer_image,
    		$developer_labels,
    		$developer_skills,
    		$developer_description,
    		textinput0_value_binding,
    		textinput1_value_binding,
    		textinput2_value_binding,
    		taginput0_value_binding,
    		taginput1_value_binding,
    		textarea_value_binding
    	};
    }

    class Overview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Overview", options, id: create_fragment$8.name });
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$9 = "src/Select.svelte";

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
    			add_location(option, file$9, 48, 2, 952);
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

    function create_fragment$9(ctx) {
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
    			add_location(select, file$9, 45, 0, 890);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$9.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["value", "label", "options", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$9.name });
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
    const { console: console_1 } = globals;

    const file$a = "src/Notes.svelte";

    // (106:6) <Button          icon="/img/save-white.svg"         disabledIcon="/img/save.svg"         disabled="{text.trim().length > 0 ? false : true}"                 on:click="{doSave}">
    function create_default_slot$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Save");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$1.name, type: "slot", source: "(106:6) <Button          icon=\"/img/save-white.svg\"         disabledIcon=\"/img/save.svg\"         disabled=\"{text.trim().length > 0 ? false : true}\"                 on:click=\"{doSave}\">", ctx });
    	return block;
    }

    function create_fragment$a(ctx) {
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

    	let textarea_props = {
    		label: "Note",
    		helper: "Description of the interaction",
    		placeholder: "What happened?"
    	};
    	if (ctx.text !== void 0) {
    		textarea_props.value = ctx.text;
    	}
    	var textarea = new TextArea({ props: textarea_props, $$inline: true });

    	binding_callbacks.push(() => bind(textarea, 'value', textarea_value_binding));

    	var button = new Button({
    		props: {
    		icon: "/img/save-white.svg",
    		disabledIcon: "/img/save.svg",
    		disabled: ctx.text.trim().length > 0 ? false : true,
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
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
    			attr_dev(p0, "class", "svelte-66eccr");
    			add_location(p0, file$a, 92, 6, 1721);
    			attr_dev(div0, "class", "activity svelte-66eccr");
    			add_location(div0, file$a, 91, 4, 1692);
    			attr_dev(div1, "class", "controls svelte-66eccr");
    			add_location(div1, file$a, 104, 4, 2028);
    			attr_dev(form, "class", "svelte-66eccr");
    			add_location(form, file$a, 90, 2, 1681);
    			attr_dev(p1, "class", "svelte-66eccr");
    			add_location(p1, file$a, 112, 2, 2274);
    			attr_dev(div2, "class", "panel svelte-66eccr");
    			set_style(div2, "display", (ctx.$tab_index === 2 ? 'flex': 'none'));
    			add_location(div2, file$a, 89, 0, 1606);
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
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			if (!current || changed.$tab_index) {
    				set_style(div2, "display", (ctx.$tab_index === 2 ? 'flex': 'none'));
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $developer_id, $tab_index;

    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });

    	

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
      console.log( {
        developer_id: $developer_id,
        activity_id: activity_id,
        full_text: text
      } );

      fetch( '/api/developer/note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          developer_id: $developer_id,
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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Notes> was created with unknown prop '${key}'`);
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
    		return { developer, visible, activity, activity_id, text, $developer_id, $tab_index };
    	};

    	$$self.$inject_state = $$props => {
    		if ('developer' in $$props) $$invalidate('developer', developer = $$props.developer);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    		if ('activity_id' in $$props) $$invalidate('activity_id', activity_id = $$props.activity_id);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    	};

    	return {
    		developer,
    		visible,
    		activity,
    		activity_id,
    		text,
    		doSave,
    		$tab_index,
    		select_selected_binding,
    		textarea_value_binding
    	};
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["developer", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$a.name });
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

    const file$b = "src/Search.svelte";

    function create_fragment$b(ctx) {
    	var input;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-bn9xay");
    			add_location(input, file$b, 24, 0, 465);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["placeholder"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$b.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tab.svelte generated by Svelte v3.12.1 */

    const file$c = "src/Tab.svelte";

    function create_fragment$c(ctx) {
    	var button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			button.disabled = ctx.disabled;
    			attr_dev(button, "class", "svelte-1ka61mn");
    			toggle_class(button, "selected", ctx.selected);
    			add_location(button, file$c, 45, 0, 801);
    			dispose = listen_dev(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
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

    			if (!current || changed.disabled) {
    				prop_dev(button, "disabled", ctx.disabled);
    			}

    			if (changed.selected) {
    				toggle_class(button, "selected", ctx.selected);
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
    				detach_dev(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { disabled = false, selected = false } = $$props;

    	const writable_props = ['disabled', 'selected'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { disabled, selected };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    	};

    	return {
    		disabled,
    		selected,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["disabled", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tab", options, id: create_fragment$c.name });
    	}

    	get disabled() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selected() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TabBar.svelte generated by Svelte v3.12.1 */

    const file$d = "src/TabBar.svelte";

    function create_fragment$d(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr_dev(div, "class", "svelte-1v24ktc");
    			add_location(div, file$d, 7, 0, 66);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
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
    				detach_dev(div);
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

    class TabBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TabBar", options, id: create_fragment$d.name });
    	}
    }

    /* src/Timeline.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Timeline.svelte";

    function create_fragment$e(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Timeline";
    			add_location(p, file$e, 13, 2, 239);
    			set_style(div, "display", (( ctx.$tab_index === 1 && ctx.$social_index === 1 ) ? 'flex' : 'none'));
    			attr_dev(div, "class", "svelte-cowull");
    			add_location(div, file$e, 11, 0, 147);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$tab_index || changed.$social_index) {
    				set_style(div, "display", (( ctx.$tab_index === 1 && ctx.$social_index === 1 ) ? 'flex' : 'none'));
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $tab_index, $social_index;

    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });
    	validate_store(social_index, 'social_index');
    	component_subscribe($$self, social_index, $$value => { $social_index = $$value; $$invalidate('$social_index', $social_index); });

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    		if ('$social_index' in $$props) social_index.set($social_index);
    	};

    	return { $tab_index, $social_index };
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timeline", options, id: create_fragment$e.name });
    	}
    }

    /* src/Developers.svelte generated by Svelte v3.12.1 */

    const file$f = "src/Developers.svelte";

    // (260:6) <Button         icon="/img/add-white.svg"         disabledIcon="/img/add.svg"         on:click="{doAdd}"         disabled="{$add_disabled}">
    function create_default_slot_7(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Add");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7.name, type: "slot", source: "(260:6) <Button         icon=\"/img/add-white.svg\"         disabledIcon=\"/img/add.svg\"         on:click=\"{doAdd}\"         disabled=\"{$add_disabled}\">", ctx });
    	return block;
    }

    // (269:4) <List data="{$developer_list}" let:item="{developer}">
    function create_default_slot_6(ctx) {
    	var p, t_value = ctx.developer.name + "", t, p_data_id_value, dispose;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "data-id", p_data_id_value = ctx.developer.id);
    			attr_dev(p, "class", "developer svelte-yqdwr7");
    			add_location(p, file$f, 269, 6, 6511);
    			dispose = listen_dev(p, "click", ctx.doDeveloper);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.developer) && t_value !== (t_value = ctx.developer.name + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.developer) && p_data_id_value !== (p_data_id_value = ctx.developer.id)) {
    				attr_dev(p, "data-id", p_data_id_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6.name, type: "slot", source: "(269:4) <List data=\"{$developer_list}\" let:item=\"{developer}\">", ctx });
    	return block;
    }

    // (279:6) <List data="{$label_list}" let:item="{label}">
    function create_default_slot_5$1(ctx) {
    	var p, t0_value = ctx.label.name + "", t0, span, t1_value = ctx.label.count + "", t1, p_data_id_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "svelte-yqdwr7");
    			add_location(span, file$f, 279, 58, 6834);
    			attr_dev(p, "data-id", p_data_id_value = ctx.label.id);
    			attr_dev(p, "class", "label svelte-yqdwr7");
    			add_location(p, file$f, 279, 8, 6784);
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

    			if ((changed.label) && p_data_id_value !== (p_data_id_value = ctx.label.id)) {
    				attr_dev(p, "data-id", p_data_id_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$1.name, type: "slot", source: "(279:6) <List data=\"{$label_list}\" let:item=\"{label}\">", ctx });
    	return block;
    }

    // (278:4) <Details summary="Labels">
    function create_default_slot_4$1(ctx) {
    	var current;

    	var list = new List({
    		props: {
    		data: ctx.$label_list,
    		$$slots: {
    		default: [create_default_slot_5$1, ({ item: label }) => ({ label })]
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
    			if (changed.$label_list) list_changes.data = ctx.$label_list;
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$1.name, type: "slot", source: "(278:4) <Details summary=\"Labels\">", ctx });
    	return block;
    }

    // (291:6) <Tab          on:click="{() => $tab_index = 0}"         selected="{$tab_index === 0 ? true : false}">
    function create_default_slot_3$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Overview");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$1.name, type: "slot", source: "(291:6) <Tab          on:click=\"{() => $tab_index = 0}\"         selected=\"{$tab_index === 0 ? true : false}\">", ctx });
    	return block;
    }

    // (294:6) <Tab          on:click="{() => $tab_index = 1}"         selected="{$tab_index === 1 ? true : false}"          disabled="{$social_disabled}">
    function create_default_slot_2$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Social");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$1.name, type: "slot", source: "(294:6) <Tab          on:click=\"{() => $tab_index = 1}\"         selected=\"{$tab_index === 1 ? true : false}\"          disabled=\"{$social_disabled}\">", ctx });
    	return block;
    }

    // (298:6) <Tab          on:click="{() => $tab_index = 2}"         selected="{$tab_index === 2 ? true : false}"          disabled="{$notes_disabled}">
    function create_default_slot_1$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Notes");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$1.name, type: "slot", source: "(298:6) <Tab          on:click=\"{() => $tab_index = 2}\"         selected=\"{$tab_index === 2 ? true : false}\"          disabled=\"{$notes_disabled}\">", ctx });
    	return block;
    }

    // (290:4) <TabBar>
    function create_default_slot$2(ctx) {
    	var t0, t1, current;

    	var tab0 = new Tab({
    		props: {
    		selected: ctx.$tab_index === 0 ? true : false,
    		$$slots: { default: [create_default_slot_3$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab0.$on("click", ctx.click_handler);

    	var tab1 = new Tab({
    		props: {
    		selected: ctx.$tab_index === 1 ? true : false,
    		disabled: ctx.$social_disabled,
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab1.$on("click", ctx.click_handler_1);

    	var tab2 = new Tab({
    		props: {
    		selected: ctx.$tab_index === 2 ? true : false,
    		disabled: ctx.$notes_disabled,
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
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
    			if (changed.$tab_index) tab0_changes.selected = ctx.$tab_index === 0 ? true : false;
    			if (changed.$$scope) tab0_changes.$$scope = { changed, ctx };
    			tab0.$set(tab0_changes);

    			var tab1_changes = {};
    			if (changed.$tab_index) tab1_changes.selected = ctx.$tab_index === 1 ? true : false;
    			if (changed.$social_disabled) tab1_changes.disabled = ctx.$social_disabled;
    			if (changed.$$scope) tab1_changes.$$scope = { changed, ctx };
    			tab1.$set(tab1_changes);

    			var tab2_changes = {};
    			if (changed.$tab_index) tab2_changes.selected = ctx.$tab_index === 2 ? true : false;
    			if (changed.$notes_disabled) tab2_changes.disabled = ctx.$notes_disabled;
    			if (changed.$$scope) tab2_changes.$$scope = { changed, ctx };
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$2.name, type: "slot", source: "(290:4) <TabBar>", ctx });
    	return block;
    }

    function create_fragment$f(ctx) {
    	var div1, aside0, div0, t0, t1, h4, t3, t4, t5, article, t6, t7, t8, t9, t10, t11, aside1, current;

    	var search_1 = new Search({ $$inline: true });

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		disabledIcon: "/img/add.svg",
    		disabled: ctx.$add_disabled,
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.doAdd);

    	var list = new List({
    		props: {
    		data: ctx.$developer_list,
    		$$slots: {
    		default: [create_default_slot_6, ({ item: developer }) => ({ developer })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var details = new Details({
    		props: {
    		summary: "Labels",
    		$$slots: { default: [create_default_slot_4$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var tabbar = new TabBar({
    		props: {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var overview = new Overview({ $$inline: true });

    	var endpoints = new Endpoints({ $$inline: true });

    	var timeline = new Timeline({ $$inline: true });

    	var notes = new Notes({ $$inline: true });

    	var controls = new Controls({ $$inline: true });
    	controls.$on("cancelnew", ctx.doCancelNew);
    	controls.$on("savenew", ctx.doSaveNew);
    	controls.$on("edit", ctx.doEdit);
    	controls.$on("delete", ctx.doDelete);

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
    			tabbar.$$.fragment.c();
    			t6 = space();
    			overview.$$.fragment.c();
    			t7 = space();
    			endpoints.$$.fragment.c();
    			t8 = space();
    			timeline.$$.fragment.c();
    			t9 = space();
    			notes.$$.fragment.c();
    			t10 = space();
    			controls.$$.fragment.c();
    			t11 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-yqdwr7");
    			add_location(div0, file$f, 257, 4, 6186);
    			attr_dev(h4, "class", "svelte-yqdwr7");
    			add_location(h4, file$f, 267, 4, 6426);
    			attr_dev(aside0, "class", "svelte-yqdwr7");
    			add_location(aside0, file$f, 254, 2, 6153);
    			attr_dev(article, "class", "svelte-yqdwr7");
    			add_location(article, file$f, 286, 2, 6933);
    			attr_dev(aside1, "class", "svelte-yqdwr7");
    			add_location(aside1, file$f, 322, 2, 7814);
    			attr_dev(div1, "class", "panel svelte-yqdwr7");
    			add_location(div1, file$f, 251, 0, 6108);
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
    			mount_component(tabbar, article, null);
    			append_dev(article, t6);
    			mount_component(overview, article, null);
    			append_dev(article, t7);
    			mount_component(endpoints, article, null);
    			append_dev(article, t8);
    			mount_component(timeline, article, null);
    			append_dev(article, t9);
    			mount_component(notes, article, null);
    			append_dev(article, t10);
    			mount_component(controls, article, null);
    			append_dev(div1, t11);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button_changes = {};
    			if (changed.$add_disabled) button_changes.disabled = ctx.$add_disabled;
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			var list_changes = {};
    			if (changed.$developer_list) list_changes.data = ctx.$developer_list;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			list.$set(list_changes);

    			var details_changes = {};
    			if (changed.$$scope || changed.$label_list) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);

    			var tabbar_changes = {};
    			if (changed.$$scope || changed.$tab_index || changed.$notes_disabled || changed.$social_disabled) tabbar_changes.$$scope = { changed, ctx };
    			tabbar.$set(tabbar_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search_1.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(list.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			transition_in(tabbar.$$.fragment, local);

    			transition_in(overview.$$.fragment, local);

    			transition_in(endpoints.$$.fragment, local);

    			transition_in(timeline.$$.fragment, local);

    			transition_in(notes.$$.fragment, local);

    			transition_in(controls.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search_1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
    			transition_out(tabbar.$$.fragment, local);
    			transition_out(overview.$$.fragment, local);
    			transition_out(endpoints.$$.fragment, local);
    			transition_out(timeline.$$.fragment, local);
    			transition_out(notes.$$.fragment, local);
    			transition_out(controls.$$.fragment, local);
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

    			destroy_component(tabbar);

    			destroy_component(overview);

    			destroy_component(endpoints);

    			destroy_component(timeline);

    			destroy_component(notes);

    			destroy_component(controls);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $developer_list, $label_list, $add_disabled, $tab_index, $social_disabled, $notes_disabled, $overview_disabled, $developer_id, $developer_name, $developer_email, $developer_description, $developer_image, $social_index, $controls_mode, $developer_index;

    	validate_store(developer_list, 'developer_list');
    	component_subscribe($$self, developer_list, $$value => { $developer_list = $$value; $$invalidate('$developer_list', $developer_list); });
    	validate_store(label_list, 'label_list');
    	component_subscribe($$self, label_list, $$value => { $label_list = $$value; $$invalidate('$label_list', $label_list); });
    	validate_store(add_disabled, 'add_disabled');
    	component_subscribe($$self, add_disabled, $$value => { $add_disabled = $$value; $$invalidate('$add_disabled', $add_disabled); });
    	validate_store(tab_index, 'tab_index');
    	component_subscribe($$self, tab_index, $$value => { $tab_index = $$value; $$invalidate('$tab_index', $tab_index); });
    	validate_store(social_disabled, 'social_disabled');
    	component_subscribe($$self, social_disabled, $$value => { $social_disabled = $$value; $$invalidate('$social_disabled', $social_disabled); });
    	validate_store(notes_disabled, 'notes_disabled');
    	component_subscribe($$self, notes_disabled, $$value => { $notes_disabled = $$value; $$invalidate('$notes_disabled', $notes_disabled); });
    	validate_store(overview_disabled, 'overview_disabled');
    	component_subscribe($$self, overview_disabled, $$value => { $overview_disabled = $$value; $$invalidate('$overview_disabled', $overview_disabled); });
    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_description, 'developer_description');
    	component_subscribe($$self, developer_description, $$value => { $developer_description = $$value; $$invalidate('$developer_description', $developer_description); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(social_index, 'social_index');
    	component_subscribe($$self, social_index, $$value => { $social_index = $$value; $$invalidate('$social_index', $social_index); });
    	validate_store(controls_mode, 'controls_mode');
    	component_subscribe($$self, controls_mode, $$value => { $controls_mode = $$value; $$invalidate('$controls_mode', $controls_mode); });
    	validate_store(developer_index, 'developer_index');
    	component_subscribe($$self, developer_index, $$value => { $developer_index = $$value; $$invalidate('$developer_index', $developer_index); });

    	

    // Load external data
    onMount( async () => {
      set_store_value(developer_list, $developer_list = await fetch( '/api/developer' )
      .then( ( response ) => response.json() ));

      set_store_value(label_list, $label_list = await fetch( '/api/label' )
      .then( ( response ) => response.json() ));
    } );

    // Add new developer
    function doAdd( evt ) {
      set_store_value(add_disabled, $add_disabled = true);
      set_store_value(tab_index, $tab_index = 0);
      set_store_value(social_disabled, $social_disabled = false);
      set_store_value(notes_disabled, $notes_disabled = true);
      set_store_value(overview_disabled, $overview_disabled = false);
      set_store_value(developer_id, $developer_id = '');
      set_store_value(developer_name, $developer_name = '');
      set_store_value(developer_email, $developer_email = '');
      set_store_value(developer_description, $developer_description = '');
      set_store_value(developer_image, $developer_image = ''); 
      set_store_value(social_index, $social_index = 0);  
      set_store_value(controls_mode, $controls_mode = 1);
    }

    // Edit existing developer
    function doEdit( evt ) {
      set_store_value(overview_disabled, $overview_disabled = false);
      set_store_value(social_index, $social_index = 0);
      set_store_value(controls_mode, $controls_mode = 3);
    }

    // Cancel adding a developer
    // ?? Cancel edit also
    function doCancelNew( evt ) {
      set_store_value(add_disabled, $add_disabled = false);
      set_store_value(tab_index, $tab_index = 0);
      set_store_value(social_disabled, $social_disabled = true);
      set_store_value(overview_disabled, $overview_disabled = true);
      set_store_value(social_index, $social_index = 1);
      set_store_value(controls_mode, $controls_mode = 0);  
    }

    // Delete existing developer
    function doDelete( evt ) {
      // TODO: At server ...
      // TODO: Delete associated labels
      // TODO: Delete associated skills
      // TODO: Delete associated notes
      // TODO: Delete associated labels
      // TODO: Delete associated social
      fetch( `/api/developer/${$developer_id}`, {
        method: 'DELETE'
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        for( let d = 0; d < $developer_list.length; d++ ) {
          if( $developer_list[d].id === data.id ) {
            $developer_list.splice( d, 1 );
            set_store_value(developer_list, $developer_list = $developer_list.slice( 0 ));
            break;
          }
        }

        set_store_value(social_disabled, $social_disabled = true);
        set_store_value(notes_disabled, $notes_disabled = true);
        set_store_value(overview_disabled, $overview_disabled = true);
        set_store_value(developer_id, $developer_id = '');
        set_store_value(developer_name, $developer_name = '');
        set_store_value(developer_email, $developer_email = '');
        set_store_value(developer_description, $developer_description = '');
        set_store_value(developer_image, $developer_image = ''); 
        set_store_value(social_index, $social_index = 0);    
        set_store_value(controls_mode, $controls_mode = 0);
      } );
    }

    // Show existing developer
    function doDeveloper( evt ) {
      let id = evt.target.getAttribute( 'data-id' );

      for( let d = 0; d < $developer_list.length; d++ ) {
        if( id === $developer_list[d].id ) {
          set_store_value(developer_index, $developer_index = d);
          break;
        }
      }

      set_store_value(add_disabled, $add_disabled = false);

      set_store_value(overview_disabled, $overview_disabled = true);
      set_store_value(social_disabled, $social_disabled = false);
      set_store_value(social_index, $social_index = 1);
      set_store_value(notes_disabled, $notes_disabled = false);

      set_store_value(developer_id, $developer_id = id);
      set_store_value(developer_name, $developer_name = $developer_list[$developer_index].name);
      set_store_value(developer_email, $developer_email = $developer_list[$developer_index].email);
      set_store_value(developer_description, $developer_description = $developer_list[$developer_index].description);
      set_store_value(developer_image, $developer_image = $developer_list[$developer_index].image);
      
      set_store_value(controls_mode, $controls_mode = 2);
    }

    // Save new developer
    function doSaveNew( evt ) {
      set_store_value(add_disabled, $add_disabled = false);
      set_store_value(tab_index, $tab_index = 0);
      set_store_value(social_disabled, $social_disabled = false);
      set_store_value(overview_disabled, $overview_disabled = true);
      set_store_value(social_index, $social_index = 1);
      set_store_value(notes_disabled, $notes_disabled = false);
      set_store_value(controls_mode, $controls_mode = 0);  

      let developer = {
        name: $developer_name,
        email:  $developer_email.trim().length === 0 ? null : $developer_email,
        description: $developer_description.trim().length === 0 ? null : $developer_description,
        image: $developer_image.trim().length === 0 ? null : $developer_image
      };

      fetch( '/api/developer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( developer )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $developer_list.push( data );
        $developer_list.sort( ( a, b ) => {
          if( a.name > b.name ) return 1;
          if( a.name < b.name ) return -1;

          return 0;
        } );
        set_store_value(developer_list, $developer_list = $developer_list.slice( 0 ));
        set_store_value(developer_id, $developer_id = data.id);
        set_store_value(controls_mode, $controls_mode = 2);
      } );
    }

    	const click_handler = () => set_store_value(tab_index, $tab_index = 0);

    	const click_handler_1 = () => set_store_value(tab_index, $tab_index = 1);

    	const click_handler_2 = () => set_store_value(tab_index, $tab_index = 2);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$developer_list' in $$props) developer_list.set($developer_list);
    		if ('$label_list' in $$props) label_list.set($label_list);
    		if ('$add_disabled' in $$props) add_disabled.set($add_disabled);
    		if ('$tab_index' in $$props) tab_index.set($tab_index);
    		if ('$social_disabled' in $$props) social_disabled.set($social_disabled);
    		if ('$notes_disabled' in $$props) notes_disabled.set($notes_disabled);
    		if ('$overview_disabled' in $$props) overview_disabled.set($overview_disabled);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_description' in $$props) developer_description.set($developer_description);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$social_index' in $$props) social_index.set($social_index);
    		if ('$controls_mode' in $$props) controls_mode.set($controls_mode);
    		if ('$developer_index' in $$props) developer_index.set($developer_index);
    	};

    	return {
    		doAdd,
    		doEdit,
    		doCancelNew,
    		doDelete,
    		doDeveloper,
    		doSaveNew,
    		$developer_list,
    		$label_list,
    		$add_disabled,
    		$tab_index,
    		$social_disabled,
    		$notes_disabled,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class Developers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Developers", options, id: create_fragment$f.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$g = "src/Header.svelte";

    function create_fragment$g(ctx) {
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
    			add_location(span, file$g, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$g, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$g, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$g, 35, 0, 439);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$g.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$h = "src/Switcher.svelte";

    function create_fragment$h(ctx) {
    	var div, button0, t_1, button1, dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "Developers";
    			t_1 = space();
    			button1 = element("button");
    			button1.textContent = "Repositories";
    			attr_dev(button0, "class", "svelte-z8cxbi");
    			toggle_class(button0, "selected", ctx.selectedIndex === 0);
    			add_location(button0, file$h, 43, 2, 680);
    			attr_dev(button1, "class", "svelte-z8cxbi");
    			toggle_class(button1, "selected", ctx.selectedIndex === 1);
    			add_location(button1, file$h, 46, 2, 795);
    			attr_dev(div, "class", "svelte-z8cxbi");
    			add_location(div, file$h, 42, 0, 672);

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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["selectedIndex"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$h.name });
    	}

    	get selectedIndex() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$i(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$i, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$i.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
