
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
    function add_resize_listener(element, fn) {
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        const object = document.createElement('object');
        object.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;');
        object.type = 'text/html';
        object.tabIndex = -1;
        let win;
        object.onload = () => {
            win = object.contentDocument.defaultView;
            win.addEventListener('resize', fn);
        };
        if (/Trident/.test(navigator.userAgent)) {
            element.appendChild(object);
            object.data = 'about:blank';
        }
        else {
            object.data = 'about:blank';
            element.appendChild(object);
        }
        return {
            cancel: () => {
                win && win.removeEventListener && win.removeEventListener('resize', fn);
                element.removeChild(object);
            }
        };
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

    /* src/Controls.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/Controls.svelte";

    // (34:0) {#if mode === 1}
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(34:0) {#if mode === 1}", ctx });
    	return block;
    }

    // (36:2) <Button kind="secondary" on:click="{() => dispatch( 'cancelnew' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5.name, type: "slot", source: "(36:2) <Button kind=\"secondary\" on:click=\"{() => dispatch( 'cancelnew' )}\">", ctx });
    	return block;
    }

    // (37:2) <Button      icon="/img/save-white.svg"      on:click="{() => dispatch( 'savenew' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4.name, type: "slot", source: "(37:2) <Button      icon=\"/img/save-white.svg\"      on:click=\"{() => dispatch( 'savenew' )}\">", ctx });
    	return block;
    }

    // (44:0) {#if mode === 2}
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(44:0) {#if mode === 2}", ctx });
    	return block;
    }

    // (46:2) <Button icon="/img/edit.svg" on:click="{() => dispatch( 'edit' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3.name, type: "slot", source: "(46:2) <Button icon=\"/img/edit.svg\" on:click=\"{() => dispatch( 'edit' )}\">", ctx });
    	return block;
    }

    // (51:0) {#if mode === 3}
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
    			attr_dev(div, "class", "block svelte-1ybo6ro");
    			add_location(div, file$1, 55, 2, 956);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(51:0) {#if mode === 3}", ctx });
    	return block;
    }

    // (53:2) <Button      kind="danger"      on:click="{() => dispatch( 'delete' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2.name, type: "slot", source: "(53:2) <Button      kind=\"danger\"      on:click=\"{() => dispatch( 'delete' )}\">", ctx });
    	return block;
    }

    // (57:2) <Button      kind="secondary"      on:click="{() => dispatch( 'cancelexisting' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1.name, type: "slot", source: "(57:2) <Button      kind=\"secondary\"      on:click=\"{() => dispatch( 'cancelexisting' )}\">", ctx });
    	return block;
    }

    // (60:2) <Button      icon="/img/save-white.svg"      on:click="{() => dispatch( 'saveexisting' )}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot.name, type: "slot", source: "(60:2) <Button      icon=\"/img/save-white.svg\"      on:click=\"{() => dispatch( 'saveexisting' )}\">", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var div, t0, t1, current;

    	var if_block0 = (ctx.mode === 1) && create_if_block_2(ctx);

    	var if_block1 = (ctx.mode === 2) && create_if_block_1(ctx);

    	var if_block2 = (ctx.mode === 3) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(div, "class", "svelte-1ybo6ro");
    			toggle_class(div, "hidden", ctx.hidden);
    			add_location(div, file$1, 28, 0, 382);
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
    			if (changed.hidden) {
    				toggle_class(div, "hidden", ctx.hidden);
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
    	

    const mode = 0, hidden = false;

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

    	$$self.$inject_state = $$props => {};

    	return {
    		mode,
    		hidden,
    		dispatch,
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["mode", "hidden"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Controls", options, id: create_fragment$1.name });
    	}

    	get mode() {
    		return this.$$.ctx.mode;
    	}

    	set mode(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hidden() {
    		return this.$$.ctx.hidden;
    	}

    	set hidden(value) {
    		throw new Error("<Controls>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-1f0s72f");
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

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
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
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-1f0s72f");
    			add_location(p, file$3, 77, 4, 1318);
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-1f0s72f");
    			add_location(input, file$3, 78, 4, 1388);
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

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
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
    			attr_dev(input, "class", "svelte-1f0s72f");
    			add_location(input, file$3, 73, 4, 1234);
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
    			attr_dev(div, "class", "svelte-1f0s72f");
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

    // Left column
    const search_term = writable( '' );
    const add_disabled = writable( false );
    const developer_list = writable( [] );
    const filtered_list = writable( [] );
    const organization_list = writable( [] );

    // Tabs disabled
    const summary_tab = writable( false );
    const profile_tab = writable( true );
    const social_tab = writable( true );
    const notes_tab = writable( true );

    // Tabs selected
    const summary_selected = writable( true );
    const profile_selected = writable( false );
    const social_selected = writable( false );
    const notes_selected = writable( false );

    // Panels hidden
    const summary_hidden = writable( false );
    const profile_hidden = writable( true );
    const endpoints_hidden = writable( true );
    const timeline_hidden = writable( true );
    const notes_hidden = writable( true );

    // Panels disabled
    const summary_disabled = writable( true );
    const profile_disabled = writable( true );
    const endpoints_disabled = writable( true );

    // Summary
    const developer_id = writable( null );
    const developer_name = writable( '' );
    const developer_email = writable( '' );
    const developer_image = writable( '' );
    const developer_organizations = writable( [] );
    const developer_location = writable( '' );

    // Social
    const endpoint_website = writable( '' );
    const endpoint_rss = writable( '' );
    const endpoint_devto = writable( '' );
    const endpoint_medium = writable( '' );
    const endpoint_youtube = writable( '' );
    const endpoint_twitter = writable( '' );
    const endpoint_so = writable( '' );
    const endpoint_github = writable( '' );
    const endpoint_reddit = writable( '' );

    // Notes
    const notes_list = writable( [] );

    // Controls
    const controls_hidden = writable( true );
    const controls_mode = writable( 0 );

    /* src/Endpoints.svelte generated by Svelte v3.12.1 */

    const file$4 = "src/Endpoints.svelte";

    function create_fragment$4(ctx) {
    	var div10, div1, updating_value, t0, div0, t1, updating_value_1, t2, div3, updating_value_2, t3, div2, t4, updating_value_3, t5, div5, updating_value_4, t6, div4, t7, updating_value_5, t8, div7, updating_value_6, t9, div6, t10, updating_value_7, t11, div9, updating_value_8, t12, div8, t13, current;

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

    	var textinput9 = new TextInput({
    		props: {
    		disabled: "true",
    		label: "Instagram",
    		placeholder: "Instagram",
    		helper: "Not yet implemented"
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div10 = element("div");
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
    			div9 = element("div");
    			textinput8.$$.fragment.c();
    			t12 = space();
    			div8 = element("div");
    			t13 = space();
    			textinput9.$$.fragment.c();
    			attr_dev(div0, "class", "gap svelte-wrg2o4");
    			add_location(div0, file$4, 50, 4, 1075);
    			attr_dev(div1, "class", "line svelte-wrg2o4");
    			add_location(div1, file$4, 44, 2, 912);
    			attr_dev(div2, "class", "gap svelte-wrg2o4");
    			add_location(div2, file$4, 64, 4, 1452);
    			attr_dev(div3, "class", "line svelte-wrg2o4");
    			add_location(div3, file$4, 58, 2, 1268);
    			attr_dev(div4, "class", "gap svelte-wrg2o4");
    			add_location(div4, file$4, 78, 4, 1832);
    			attr_dev(div5, "class", "line svelte-wrg2o4");
    			add_location(div5, file$4, 72, 2, 1657);
    			attr_dev(div6, "class", "gap svelte-wrg2o4");
    			add_location(div6, file$4, 92, 4, 2214);
    			attr_dev(div7, "class", "line svelte-wrg2o4");
    			add_location(div7, file$4, 86, 2, 2037);
    			attr_dev(div8, "class", "gap svelte-wrg2o4");
    			add_location(div8, file$4, 106, 4, 2587);
    			attr_dev(div9, "class", "line svelte-wrg2o4");
    			add_location(div9, file$4, 100, 3, 2416);
    			attr_dev(div10, "class", "endpoints svelte-wrg2o4");
    			toggle_class(div10, "hide", ctx.hide);
    			add_location(div10, file$4, 42, 0, 874);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div1);
    			mount_component(textinput0, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(textinput1, div1, null);
    			append_dev(div10, t2);
    			append_dev(div10, div3);
    			mount_component(textinput2, div3, null);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div3, t4);
    			mount_component(textinput3, div3, null);
    			append_dev(div10, t5);
    			append_dev(div10, div5);
    			mount_component(textinput4, div5, null);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(div5, t7);
    			mount_component(textinput5, div5, null);
    			append_dev(div10, t8);
    			append_dev(div10, div7);
    			mount_component(textinput6, div7, null);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div7, t10);
    			mount_component(textinput7, div7, null);
    			append_dev(div10, t11);
    			append_dev(div10, div9);
    			mount_component(textinput8, div9, null);
    			append_dev(div9, t12);
    			append_dev(div9, div8);
    			append_dev(div9, t13);
    			mount_component(textinput9, div9, null);
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

    			if (changed.hide) {
    				toggle_class(div10, "hide", ctx.hide);
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

    			transition_in(textinput9.$$.fragment, local);

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
    			transition_out(textinput9.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div10);
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

    			destroy_component(textinput9);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$4.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $endpoint_website, $endpoint_rss, $endpoint_devto, $endpoint_medium, $endpoint_youtube, $endpoint_twitter, $endpoint_so, $endpoint_github, $endpoint_reddit;

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

    	

    let { hide = false, disabled = false } = $$props;

    	const writable_props = ['hide', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Endpoints> was created with unknown prop '${key}'`);
    	});

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

    	$$self.$set = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hide, disabled, $endpoint_website, $endpoint_rss, $endpoint_devto, $endpoint_medium, $endpoint_youtube, $endpoint_twitter, $endpoint_so, $endpoint_github, $endpoint_reddit };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
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
    		hide,
    		disabled,
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["hide", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Endpoints", options, id: create_fragment$4.name });
    	}

    	get hide() {
    		throw new Error("<Endpoints>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hide(value) {
    		throw new Error("<Endpoints>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Endpoints>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Endpoints>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/List.svelte generated by Svelte v3.12.1 */

    const file$5 = "src/List.svelte";

    const get_default_slot_changes = ({ item, data }) => ({ item: data });
    const get_default_slot_context = ({ item, data }) => ({ item: item });

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (57:2) {#each data as item, i}
    function create_each_block(ctx) {
    	var li, t, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, get_default_slot_context);

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");

    			if (default_slot) default_slot.c();
    			t = space();

    			attr_dev(li, "class", "svelte-sroauh");
    			toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
    			add_location(li, file$5, 58, 4, 862);
    			dispose = listen_dev(li, "click", click_handler);
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

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;

    			if (default_slot && default_slot.p && (changed.$$scope || changed.data)) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, get_default_slot_changes),
    					get_slot_context(default_slot_template, ctx, get_default_slot_context)
    				);
    			}

    			if (changed.selectedIndex) {
    				toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
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
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(57:2) {#each data as item, i}", ctx });
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
    			attr_dev(ul, "class", "svelte-sroauh");
    			add_location(ul, file$5, 54, 0, 821);
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
    			if (changed.selectedIndex || changed.$$scope || changed.data) {
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
    	let { data = [], selectedIndex = undefined, selectedItem = undefined } = $$props;

    const dispatch = createEventDispatcher();

    function doSelect( item, index ) { 
      $$invalidate('selectedItem', selectedItem = item);
      $$invalidate('selectedIndex', selectedIndex = index);

      dispatch( 'change', {
        item: selectedItem,
        index: selectedIndex
      } );
    }

    	const writable_props = ['data', 'selectedIndex', 'selectedItem'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = ({ item, i }) => doSelect( item, i );

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { data, selectedIndex, selectedItem };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    	};

    	return {
    		data,
    		selectedIndex,
    		selectedItem,
    		doSelect,
    		click_handler,
    		$$slots,
    		$$scope
    	};
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["data", "selectedIndex", "selectedItem"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "List", options, id: create_fragment$5.name });
    	}

    	get data() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIndex() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedItem() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedItem(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ListLabelItem.svelte generated by Svelte v3.12.1 */

    const file$6 = "src/ListLabelItem.svelte";

    function create_fragment$6(ctx) {
    	var p, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			p = element("p");

    			if (default_slot) default_slot.c();

    			attr_dev(p, "class", "svelte-kda79i");
    			add_location(p, file$6, 13, 0, 201);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(p_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
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
    				detach_dev(p);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$6.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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

    class ListLabelItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListLabelItem", options, id: create_fragment$6.name });
    	}
    }

    /* src/ListCountItem.svelte generated by Svelte v3.12.1 */

    const file$7 = "src/ListCountItem.svelte";

    const get_count_slot_changes = () => ({});
    const get_count_slot_context = () => ({});

    const get_label_slot_changes = () => ({});
    const get_label_slot_context = () => ({});

    function create_fragment$7(ctx) {
    	var p, t, span, current;

    	const label_slot_template = ctx.$$slots.label;
    	const label_slot = create_slot(label_slot_template, ctx, get_label_slot_context);

    	const count_slot_template = ctx.$$slots.count;
    	const count_slot = create_slot(count_slot_template, ctx, get_count_slot_context);

    	const block = {
    		c: function create() {
    			p = element("p");

    			if (label_slot) label_slot.c();
    			t = space();
    			span = element("span");

    			if (count_slot) count_slot.c();

    			attr_dev(span, "class", "svelte-1kqfkdt");
    			add_location(span, file$7, 19, 2, 262);
    			attr_dev(p, "class", "svelte-1kqfkdt");
    			add_location(p, file$7, 17, 0, 227);
    		},

    		l: function claim(nodes) {
    			if (label_slot) label_slot.l(p_nodes);

    			if (count_slot) count_slot.l(span_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (label_slot) {
    				label_slot.m(p, null);
    			}

    			append_dev(p, t);
    			append_dev(p, span);

    			if (count_slot) {
    				count_slot.m(span, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (label_slot && label_slot.p && changed.$$scope) {
    				label_slot.p(
    					get_slot_changes(label_slot_template, ctx, changed, get_label_slot_changes),
    					get_slot_context(label_slot_template, ctx, get_label_slot_context)
    				);
    			}

    			if (count_slot && count_slot.p && changed.$$scope) {
    				count_slot.p(
    					get_slot_changes(count_slot_template, ctx, changed, get_count_slot_changes),
    					get_slot_context(count_slot_template, ctx, get_count_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(label_slot, local);
    			transition_in(count_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(label_slot, local);
    			transition_out(count_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}

    			if (label_slot) label_slot.d(detaching);

    			if (count_slot) count_slot.d(detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$7.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    class ListCountItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ListCountItem", options, id: create_fragment$7.name });
    	}
    }

    /* src/Select.svelte generated by Svelte v3.12.1 */

    const file$8 = "src/Select.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (74:2) {#if label !== undefined}
    function create_if_block_1$2(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			attr_dev(label_1, "class", "svelte-4vwenu");
    			add_location(label_1, file$8, 74, 4, 1374);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$2.name, type: "if", source: "(74:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (77:2) {#if helper !== undefined}
    function create_if_block$3(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			attr_dev(p, "class", "svelte-4vwenu");
    			add_location(p, file$8, 77, 4, 1438);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$3.name, type: "if", source: "(77:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    // (81:4) {#each options as option}
    function create_each_block$1(ctx) {
    	var option, t_value = ctx.option[ctx.labelField] + "", t, option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = ctx.option[ctx.dataField];
    			option.value = option.__value;
    			add_location(option, file$8, 81, 6, 1535);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.options || changed.labelField) && t_value !== (t_value = ctx.option[ctx.labelField] + "")) {
    				set_data_dev(t, t_value);
    			}

    			if ((changed.options || changed.dataField) && option_value_value !== (option_value_value = ctx.option[ctx.dataField])) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$1.name, type: "each", source: "(81:4) {#each options as option}", ctx });
    	return block;
    }

    function create_fragment$8(ctx) {
    	var div, t0, t1, select, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$2(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block$3(ctx);

    	let each_value = ctx.options;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			if (ctx.selected === void 0) add_render_callback(() => ctx.select_change_handler.call(select));
    			attr_dev(select, "class", "svelte-4vwenu");
    			add_location(select, file$8, 79, 2, 1466);
    			attr_dev(div, "class", "svelte-4vwenu");
    			add_location(div, file$8, 71, 0, 1335);
    			dispose = listen_dev(select, "change", ctx.select_change_handler);
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
    			append_dev(div, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, ctx.selected);
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
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.options || changed.dataField || changed.labelField) {
    				each_value = ctx.options;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    				detach_dev(div);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			destroy_each(each_blocks, detaching);

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$8.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { dataField = 'data', helper = undefined, label = undefined, labelField = 'label', options = [], selected = null, value = 'id' } = $$props;

    	const writable_props = ['dataField', 'helper', 'label', 'labelField', 'options', 'selected', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate('selected', selected);
    		$$invalidate('options', options);
    		$$invalidate('dataField', dataField);
    	}

    	$$self.$set = $$props => {
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { dataField, helper, label, labelField, options, selected, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('dataField' in $$props) $$invalidate('dataField', dataField = $$props.dataField);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('options' in $$props) $$invalidate('options', options = $$props.options);
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		dataField,
    		helper,
    		label,
    		labelField,
    		options,
    		selected,
    		value,
    		undefined,
    		select_change_handler
    	};
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["dataField", "helper", "label", "labelField", "options", "selected", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Select", options, id: create_fragment$8.name });
    	}

    	get dataField() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataField(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
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

    	get value() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Menu.svelte generated by Svelte v3.12.1 */
    const { console: console_1 } = globals;

    const file$9 = "src/Menu.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (69:2) {#each data as item, i}
    function create_each_block$2(ctx) {
    	var li, button, t0_value = ctx.item[ctx.labelField] + "", t0, t1, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "svelte-sc289e");
    			add_location(button, file$9, 71, 6, 1287);
    			attr_dev(li, "class", "svelte-sc289e");
    			toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
    			add_location(li, file$9, 70, 4, 1222);
    			dispose = listen_dev(button, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.data || changed.labelField) && t0_value !== (t0_value = ctx.item[ctx.labelField] + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if (changed.selectedIndex) {
    				toggle_class(li, "selected", ctx.selectedIndex === ctx.i ? true : false);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$2.name, type: "each", source: "(69:2) {#each data as item, i}", ctx });
    	return block;
    }

    function create_fragment$9(ctx) {
    	var ul;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			set_style(ul, "display", (ctx.data.length > 0 ? 'flex' : 'none'));
    			set_style(ul, "top", "" + ctx.top + "px");
    			attr_dev(ul, "class", "svelte-sc289e");
    			add_location(ul, file$9, 66, 0, 1113);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.selectedIndex || changed.data || changed.labelField) {
    				each_value = ctx.data;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (changed.data) {
    				set_style(ul, "display", (ctx.data.length > 0 ? 'flex' : 'none'));
    			}

    			if (changed.top) {
    				set_style(ul, "top", "" + ctx.top + "px");
    			}
    		},

    		i: noop,
    		o: noop,

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
    	let { data = [], labelField = 'label', selectedIndex = undefined, selectedItem = undefined, top = 0 } = $$props;

    const dispatch = createEventDispatcher();

    function doSelect( item, index ) {
      console.log( 'Menu select' );

      $$invalidate('selectedIndex', selectedIndex = index);
      $$invalidate('selectedItem', selectedItem = item);

      dispatch( 'select', {
        index: index,
        item: item,
        label: item[labelField]
      } );
    }

    	const writable_props = ['data', 'labelField', 'selectedIndex', 'selectedItem', 'top'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = ({ item, i }) => doSelect( item, i );

    	$$self.$set = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    		if ('top' in $$props) $$invalidate('top', top = $$props.top);
    	};

    	$$self.$capture_state = () => {
    		return { data, labelField, selectedIndex, selectedItem, top };
    	};

    	$$self.$inject_state = $$props => {
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('selectedIndex' in $$props) $$invalidate('selectedIndex', selectedIndex = $$props.selectedIndex);
    		if ('selectedItem' in $$props) $$invalidate('selectedItem', selectedItem = $$props.selectedItem);
    		if ('top' in $$props) $$invalidate('top', top = $$props.top);
    	};

    	return {
    		data,
    		labelField,
    		selectedIndex,
    		selectedItem,
    		top,
    		doSelect,
    		click_handler
    	};
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["data", "labelField", "selectedIndex", "selectedItem", "top"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Menu", options, id: create_fragment$9.name });
    	}

    	get data() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedIndex() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedIndex(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedItem() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedItem(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get top() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tag.svelte generated by Svelte v3.12.1 */

    const file$a = "src/Tag.svelte";

    function create_fragment$a(ctx) {
    	var div, p, t, button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");

    			if (default_slot) default_slot.c();
    			t = space();
    			button = element("button");

    			attr_dev(p, "class", "svelte-1vqvdip");
    			add_location(p, file$a, 50, 2, 805);
    			attr_dev(button, "type", "button");
    			set_style(button, "display", (ctx.disabled ? 'none' : 'initial'));
    			attr_dev(button, "class", "svelte-1vqvdip");
    			add_location(button, file$a, 51, 2, 828);
    			attr_dev(div, "class", "tag svelte-1vqvdip");
    			toggle_class(div, "disabled", ctx.disabled);
    			add_location(div, file$a, 49, 0, 757);
    			dispose = listen_dev(button, "click", doRemove);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(p_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			append_dev(div, t);
    			append_dev(div, button);
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
    				set_style(button, "display", (ctx.disabled ? 'none' : 'initial'));
    			}

    			if (changed.disabled) {
    				toggle_class(div, "disabled", ctx.disabled);
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
    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$a.name, type: "component", source: "", ctx });
    	return block;
    }

    function doRemove( evt ) {

    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { disabled = false } = $$props;

    	const writable_props = ['disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Tag> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { disabled };
    	};

    	$$self.$inject_state = $$props => {
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	return { disabled, $$slots, $$scope };
    }

    class Tag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, ["disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tag", options, id: create_fragment$a.name });
    	}

    	get disabled() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TagInput.svelte generated by Svelte v3.12.1 */
    const { console: console_1$1 } = globals;

    const file$b = "src/TagInput.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.tag = list[i];
    	child_ctx.t = i;
    	return child_ctx;
    }

    // (207:2) {#if label !== undefined}
    function create_if_block_2$1(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-sznk6l");
    			add_location(label_1, file$b, 208, 4, 4011);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2$1.name, type: "if", source: "(207:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (213:2) {#if helper !== undefined}
    function create_if_block_1$3(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-sznk6l");
    			add_location(p, file$b, 214, 4, 4128);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$3.name, type: "if", source: "(213:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    // (222:6) <Tag>
    function create_default_slot$1(ctx) {
    	var t_value = ctx.tag + "", t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.value) && t_value !== (t_value = ctx.tag + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$1.name, type: "slot", source: "(222:6) <Tag>", ctx });
    	return block;
    }

    // (221:4) {#each value as tag, t}
    function create_each_block$3(ctx) {
    	var current;

    	var tag = new Tag({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			tag.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(tag, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tag_changes = {};
    			if (changed.$$scope || changed.value) tag_changes.$$scope = { changed, ctx };
    			tag.$set(tag_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(tag.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tag.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(tag, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$3.name, type: "each", source: "(221:4) {#each value as tag, t}", ctx });
    	return block;
    }

    // (235:2) {#if data.length > 0}
    function create_if_block$4(ctx) {
    	var current;

    	var menu_1 = new Menu({
    		props: {
    		data: ctx.menu,
    		top: ctx.height + 3,
    		labelField: "name",
    		selectedIndex: ctx.index
    	},
    		$$inline: true
    	});
    	menu_1.$on("select", ctx.doSelect);

    	const block = {
    		c: function create() {
    			menu_1.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(menu_1, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var menu_1_changes = {};
    			if (changed.menu) menu_1_changes.data = ctx.menu;
    			if (changed.height) menu_1_changes.top = ctx.height + 3;
    			if (changed.index) menu_1_changes.selectedIndex = ctx.index;
    			menu_1.$set(menu_1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu_1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(menu_1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(menu_1, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$4.name, type: "if", source: "(235:2) {#if data.length > 0}", ctx });
    	return block;
    }

    function create_fragment$b(ctx) {
    	var div1, t0, t1, div0, t2, input, t3, div1_resize_listener, current, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_2$1(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block_1$3(ctx);

    	let each_value = ctx.value;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	var if_block2 = (ctx.data.length > 0) && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			input = element("input");
    			t3 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			input.disabled = ctx.disabled;
    			attr_dev(input, "class", "svelte-sznk6l");
    			add_location(input, file$b, 224, 4, 4353);
    			attr_dev(div0, "class", "content svelte-sznk6l");
    			toggle_class(div0, "focus", ctx.focus);
    			toggle_class(div0, "disabled", ctx.disabled);
    			add_location(div0, file$b, 218, 2, 4206);
    			add_render_callback(() => ctx.div1_resize_handler.call(div1));
    			attr_dev(div1, "class", "control svelte-sznk6l");
    			add_location(div1, file$b, 204, 0, 3926);

    			dispose = [
    				listen_dev(input, "keyup", ctx.doKeyUp),
    				listen_dev(input, "focus", ctx.focus_handler),
    				listen_dev(input, "blur", ctx.doBlur)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t2);
    			append_dev(div0, input);
    			append_dev(div1, t3);
    			if (if_block2) if_block2.m(div1, null);
    			div1_resize_listener = add_resize_listener(div1, ctx.div1_resize_handler.bind(div1));
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.label !== ctx.undefined) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.helper !== ctx.undefined) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    				} else {
    					if_block1 = create_if_block_1$3(ctx);
    					if_block1.c();
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (changed.value) {
    				each_value = ctx.value;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, t2);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}
    				check_outros();
    			}

    			if (!current || changed.placeholder) {
    				attr_dev(input, "placeholder", ctx.placeholder);
    			}

    			if (!current || changed.disabled) {
    				prop_dev(input, "disabled", ctx.disabled);
    			}

    			if (changed.focus) {
    				toggle_class(div0, "focus", ctx.focus);
    			}

    			if (changed.disabled) {
    				toggle_class(div0, "disabled", ctx.disabled);
    			}

    			if (ctx.data.length > 0) {
    				if (if_block2) {
    					if_block2.p(changed, ctx);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block$4(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();
    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(if_block2);
    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(if_block2);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();

    			destroy_each(each_blocks, detaching);

    			if (if_block2) if_block2.d();
    			div1_resize_listener.cancel();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$b.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	

    let { characters = 3, data = [], disabled = false, helper = undefined, label = undefined, labelField = 'label', limit = 4, placeholder = '', value = [] } = $$props;

    let focus = false;
    let height = 0;
    let index = -1;
    let menu = [];

    function doBlur() {
      $$invalidate('menu', menu = []);
      $$invalidate('focus', focus = false);
    }

    function doKeyUp( evt ) {
      if( evt.keyCode === 13 ) {
        if( index > - 1 ) {
          value.push( menu[index][labelField] );
          $$invalidate('focus', focus = true);
        } else {
          let found = false;
          let tags = [];

          if( evt.target.value.indexOf( ',' ) > 0 ) {
            tags = evt.target.value.split( ',' );
          } else {
            tags = [evt.target.value];
          }

          for( let t = 0; t < tags.length; t++ ) {
            for( let v = 0; v < value.length; v++ ) {
              if( value[v] === tags[t].trim() ) {
                found = true;
                break;
              }
            }

            if( !found ) {
              value.push( tags[t] );
            }
          }      
        }

        $$invalidate('value', value = value.splice( 0 ));
        evt.target.value = '';
        $$invalidate('menu', menu = []);
        $$invalidate('index', index = -1);
      }

      if( evt.keyCode === 8 && evt.target.value.trim().length === 0 ) {
        if( value.length > 0 ) {
          value.pop();
          $$invalidate('value', value = value.slice( 0 ));
        }
      }

      if( evt.keyCode === 40 ) {
        if( menu.length > 0 ) {
          if( index === -1 ) {
            $$invalidate('focus', focus = false);        
            $$invalidate('index', index = 0);
          } else {
            if( index === ( menu.length - 1 ) ) {
              $$invalidate('index', index = 0);
            } else {
              $$invalidate('index', index = index + 1);
            }
          }      
        }
      }

      if( evt.keyCode === 38 ) {
        if( menu.length > 0 ) {
          if( index === -1 ) {
            $$invalidate('focus', focus = false);          
            $$invalidate('index', index = menu.length - 1);
          } else {
            if( index === 0 ) {
              $$invalidate('index', index = menu.length - 1);
            } else {
              $$invalidate('index', index = index - 1);
            }
          }
        }
      }

      if( evt.target.value.trim().length >= characters ) {
        $$invalidate('menu', menu = []);

        for( let a = 0; a < data.length; a++ ) {
          if( data[a][labelField].toLowerCase().indexOf( evt.target.value.toLowerCase().trim() ) > -1 ) {
            let found = false;

            for( let b = 0; b < value.length; b++ ) {
              if( data[a][labelField].toLowerCase() === value[b].toLowerCase() ) {
                found = true;
                break;
              }
            }

            if( !found ) {
              menu.push( data[a] );
            }
          }
        }

        $$invalidate('menu', menu = menu.slice( 0, limit ));
      }
    }

    function doSelect( evt ) {
      console.log( 'Select' );
      console.log( evt.detail.item[labelField] );
    }

    	const writable_props = ['characters', 'data', 'disabled', 'helper', 'label', 'labelField', 'limit', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console_1$1.warn(`<TagInput> was created with unknown prop '${key}'`);
    	});

    	const focus_handler = () => $$invalidate('focus', focus = true);

    	function div1_resize_handler() {
    		height = this.clientHeight;
    		$$invalidate('height', height);
    	}

    	$$self.$set = $$props => {
    		if ('characters' in $$props) $$invalidate('characters', characters = $$props.characters);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { characters, data, disabled, helper, label, labelField, limit, placeholder, value, focus, height, index, menu };
    	};

    	$$self.$inject_state = $$props => {
    		if ('characters' in $$props) $$invalidate('characters', characters = $$props.characters);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('labelField' in $$props) $$invalidate('labelField', labelField = $$props.labelField);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    		if ('focus' in $$props) $$invalidate('focus', focus = $$props.focus);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('menu' in $$props) $$invalidate('menu', menu = $$props.menu);
    	};

    	return {
    		characters,
    		data,
    		disabled,
    		helper,
    		label,
    		labelField,
    		limit,
    		placeholder,
    		value,
    		focus,
    		height,
    		index,
    		menu,
    		doBlur,
    		doKeyUp,
    		doSelect,
    		undefined,
    		focus_handler,
    		div1_resize_handler
    	};
    }

    class TagInput extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, ["characters", "data", "disabled", "helper", "label", "labelField", "limit", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TagInput", options, id: create_fragment$b.name });
    	}

    	get characters() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set characters(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get helper() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set helper(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelField() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelField(value) {
    		throw new Error("<TagInput>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limit() {
    		throw new Error("<TagInput>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limit(value) {
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

    const file$c = "src/TextArea.svelte";

    // (88:2) {#if label !== undefined}
    function create_if_block_1$4(ctx) {
    	var label_1, t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(ctx.label);
    			set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			attr_dev(label_1, "class", "svelte-jnr4n5");
    			add_location(label_1, file$c, 89, 4, 1509);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.label) {
    				set_data_dev(t, ctx.label);
    			}

    			if (changed.disabled) {
    				set_style(label_1, "color", (ctx.disabled ? '#c6c6c6' : '#393939'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(label_1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1$4.name, type: "if", source: "(88:2) {#if label !== undefined}", ctx });
    	return block;
    }

    // (94:2) {#if helper !== undefined}
    function create_if_block$5(ctx) {
    	var p, t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(ctx.helper);
    			set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			attr_dev(p, "class", "svelte-jnr4n5");
    			add_location(p, file$c, 95, 4, 1626);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},

    		p: function update(changed, ctx) {
    			if (changed.helper) {
    				set_data_dev(t, ctx.helper);
    			}

    			if (changed.disabled) {
    				set_style(p, "color", (ctx.disabled ? '#c6c6c6' : '#6f6f6f'));
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$5.name, type: "if", source: "(94:2) {#if helper !== undefined}", ctx });
    	return block;
    }

    function create_fragment$c(ctx) {
    	var div, t0, t1, textarea, dispose;

    	var if_block0 = (ctx.label !== ctx.undefined) && create_if_block_1$4(ctx);

    	var if_block1 = (ctx.helper !== ctx.undefined) && create_if_block$5(ctx);

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
    			attr_dev(textarea, "class", "svelte-jnr4n5");
    			toggle_class(textarea, "collapse", ctx.collapse);
    			add_location(textarea, file$c, 99, 2, 1706);
    			attr_dev(div, "class", "svelte-jnr4n5");
    			add_location(div, file$c, 85, 0, 1469);

    			dispose = [
    				listen_dev(textarea, "input", ctx.textarea_input_handler),
    				listen_dev(textarea, "blur", ctx.doBlur),
    				listen_dev(textarea, "focus", ctx.doFocus)
    			];
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
    					if_block0 = create_if_block_1$4(ctx);
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
    					if_block1 = create_if_block$5(ctx);
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

    			if (changed.collapse) {
    				toggle_class(textarea, "collapse", ctx.collapse);
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
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$c.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { collapse = false, disabled = false, helper = undefined, label = undefined, placeholder = '', value = '' } = $$props;

    function doBlur( evt ) {
      if( collapse ) {
        if( value.trim().length === 0 ) {
          evt.target.classList.add( 'collapse' );
        }
      }
    }

    function doFocus( evt ) {
      if( collapse ) {
        evt.target.classList.remove( 'collapse' );
      }
    }

    	const writable_props = ['collapse', 'disabled', 'helper', 'label', 'placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TextArea> was created with unknown prop '${key}'`);
    	});

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('collapse' in $$props) $$invalidate('collapse', collapse = $$props.collapse);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { collapse, disabled, helper, label, placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('collapse' in $$props) $$invalidate('collapse', collapse = $$props.collapse);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('helper' in $$props) $$invalidate('helper', helper = $$props.helper);
    		if ('label' in $$props) $$invalidate('label', label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		collapse,
    		disabled,
    		helper,
    		label,
    		placeholder,
    		value,
    		doBlur,
    		doFocus,
    		undefined,
    		textarea_input_handler
    	};
    }

    class TextArea extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, ["collapse", "disabled", "helper", "label", "placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TextArea", options, id: create_fragment$c.name });
    	}

    	get collapse() {
    		throw new Error("<TextArea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapse(value) {
    		throw new Error("<TextArea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* src/Profile.svelte generated by Svelte v3.12.1 */

    const file$d = "src/Profile.svelte";

    function create_fragment$d(ctx) {
    	var form, div0, t0, div1, t1, div2, t2, div3, t3, div4, current;

    	var taginput0 = new TagInput({
    		props: {
    		label: "Roles",
    		placeholder: "Roles",
    		helper: "Job functions regularly performed",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var taginput1 = new TagInput({
    		props: {
    		label: "Languages",
    		placeholder: "Languages",
    		helper: "Fluency for a technical presentation",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var taginput2 = new TagInput({
    		props: {
    		label: "Skills",
    		placeholder: "Skills",
    		helper: "Capable of delivering hands-on training with zero preparation",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var textarea = new TextArea({
    		props: {
    		label: "Description/Bio",
    		placeholder: "Description",
    		disabled: ctx.disabled
    	},
    		$$inline: true
    	});

    	var select = new Select({ $$inline: true });

    	const block = {
    		c: function create() {
    			form = element("form");
    			div0 = element("div");
    			taginput0.$$.fragment.c();
    			t0 = space();
    			div1 = element("div");
    			taginput1.$$.fragment.c();
    			t1 = space();
    			div2 = element("div");
    			taginput2.$$.fragment.c();
    			t2 = space();
    			div3 = element("div");
    			textarea.$$.fragment.c();
    			t3 = space();
    			div4 = element("div");
    			select.$$.fragment.c();
    			attr_dev(div0, "class", "svelte-cg8j4q");
    			add_location(div0, file$d, 36, 2, 557);
    			attr_dev(div1, "class", "svelte-cg8j4q");
    			add_location(div1, file$d, 44, 2, 705);
    			attr_dev(div2, "class", "svelte-cg8j4q");
    			add_location(div2, file$d, 52, 2, 864);
    			set_style(div3, "flex-grow", "1");
    			attr_dev(div3, "class", "svelte-cg8j4q");
    			add_location(div3, file$d, 60, 2, 1040);
    			attr_dev(div4, "class", "svelte-cg8j4q");
    			add_location(div4, file$d, 67, 2, 1175);
    			attr_dev(form, "class", "svelte-cg8j4q");
    			toggle_class(form, "hide", ctx.hide);
    			add_location(form, file$d, 34, 0, 536);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, div0);
    			mount_component(taginput0, div0, null);
    			append_dev(form, t0);
    			append_dev(form, div1);
    			mount_component(taginput1, div1, null);
    			append_dev(form, t1);
    			append_dev(form, div2);
    			mount_component(taginput2, div2, null);
    			append_dev(form, t2);
    			append_dev(form, div3);
    			mount_component(textarea, div3, null);
    			append_dev(form, t3);
    			append_dev(form, div4);
    			mount_component(select, div4, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var taginput0_changes = {};
    			if (changed.disabled) taginput0_changes.disabled = ctx.disabled;
    			taginput0.$set(taginput0_changes);

    			var taginput1_changes = {};
    			if (changed.disabled) taginput1_changes.disabled = ctx.disabled;
    			taginput1.$set(taginput1_changes);

    			var taginput2_changes = {};
    			if (changed.disabled) taginput2_changes.disabled = ctx.disabled;
    			taginput2.$set(taginput2_changes);

    			var textarea_changes = {};
    			if (changed.disabled) textarea_changes.disabled = ctx.disabled;
    			textarea.$set(textarea_changes);

    			if (changed.hide) {
    				toggle_class(form, "hide", ctx.hide);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(taginput0.$$.fragment, local);

    			transition_in(taginput1.$$.fragment, local);

    			transition_in(taginput2.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(select.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(taginput0.$$.fragment, local);
    			transition_out(taginput1.$$.fragment, local);
    			transition_out(taginput2.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(select.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(taginput0);

    			destroy_component(taginput1);

    			destroy_component(taginput2);

    			destroy_component(textarea);

    			destroy_component(select);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$d.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	

    let { hide = false, disabled = false } = $$props;

    	const writable_props = ['hide', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Profile> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hide, disabled };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	return { hide, disabled };
    }

    class Profile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, ["hide", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Profile", options, id: create_fragment$d.name });
    	}

    	get hide() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hide(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Profile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Profile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Pagination.svelte generated by Svelte v3.12.1 */

    const file$e = "src/Pagination.svelte";

    function create_fragment$e(ctx) {
    	var div, t0, p, t1, t2, t3, t4, t5, t6, button0, t7, button1, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			p = element("p");
    			t1 = text(ctx.index);
    			t2 = text(" of ");
    			t3 = text(ctx.length);
    			t4 = space();
    			t5 = text(ctx.noun);
    			t6 = space();
    			button0 = element("button");
    			t7 = space();
    			button1 = element("button");

    			attr_dev(p, "class", "svelte-1aazx0t");
    			add_location(p, file$e, 64, 2, 1032);
    			attr_dev(button0, "class", "previous svelte-1aazx0t");
    			add_location(button0, file$e, 65, 2, 1068);
    			attr_dev(button1, "class", "next svelte-1aazx0t");
    			add_location(button1, file$e, 66, 2, 1147);
    			attr_dev(div, "class", "svelte-1aazx0t");
    			add_location(div, file$e, 62, 0, 1008);

    			dispose = [
    				listen_dev(button0, "click", ctx.click_handler),
    				listen_dev(button1, "click", ctx.click_handler_1)
    			];
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

    			append_dev(div, t0);
    			append_dev(div, p);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    			append_dev(p, t4);
    			append_dev(p, t5);
    			append_dev(div, t6);
    			append_dev(div, button0);
    			append_dev(div, t7);
    			append_dev(div, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (!current || changed.index) {
    				set_data_dev(t1, ctx.index);
    			}

    			if (!current || changed.length) {
    				set_data_dev(t3, ctx.length);
    			}

    			if (!current || changed.noun) {
    				set_data_dev(t5, ctx.noun);
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
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$e.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let { index = 1, length = 10, noun = 'items' } = $$props;

    const dispatch = createEventDispatcher();

    	const writable_props = ['index', 'length', 'noun'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Pagination> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	const click_handler = () => dispatch( 'previous' );

    	const click_handler_1 = () => dispatch( 'next' );

    	$$self.$set = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('length' in $$props) $$invalidate('length', length = $$props.length);
    		if ('noun' in $$props) $$invalidate('noun', noun = $$props.noun);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { index, length, noun };
    	};

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('length' in $$props) $$invalidate('length', length = $$props.length);
    		if ('noun' in $$props) $$invalidate('noun', noun = $$props.noun);
    	};

    	return {
    		index,
    		length,
    		noun,
    		dispatch,
    		click_handler,
    		click_handler_1,
    		$$slots,
    		$$scope
    	};
    }

    class Pagination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, ["index", "length", "noun"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Pagination", options, id: create_fragment$e.name });
    	}

    	get index() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get length() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set length(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get noun() {
    		throw new Error("<Pagination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set noun(value) {
    		throw new Error("<Pagination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Notes.svelte generated by Svelte v3.12.1 */

    const file$f = "src/Notes.svelte";

    // (189:6) <Button          icon="/img/save-white.svg"         disabledIcon="/img/save.svg"         disabled="{text.trim().length > 0 ? false : true}">
    function create_default_slot_1$1(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$1.name, type: "slot", source: "(189:6) <Button          icon=\"/img/save-white.svg\"         disabledIcon=\"/img/save.svg\"         disabled=\"{text.trim().length > 0 ? false : true}\">", ctx });
    	return block;
    }

    // (209:2) {:else}
    function create_else_block$2(ctx) {
    	var div, p, t0, t1, t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text("No notes available for ");
    			t1 = text(ctx.$developer_name);
    			t2 = text(".");
    			attr_dev(p, "class", "svelte-h2jqv0");
    			add_location(p, file$f, 211, 6, 4554);
    			attr_dev(div, "class", "none svelte-h2jqv0");
    			add_location(div, file$f, 210, 4, 4529);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},

    		p: function update(changed, ctx) {
    			if (changed.$developer_name) {
    				set_data_dev(t1, ctx.$developer_name);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block$2.name, type: "else", source: "(209:2) {:else}", ctx });
    	return block;
    }

    // (196:2) {#if $notes_list.length > 0}
    function create_if_block$6(ctx) {
    	var div, p, t0_value = ctx.$notes_list[index].full_text + "", t0, t1, current;

    	var pagination = new Pagination({
    		props: {
    		index: index + 1,
    		length: ctx.$notes_list.length,
    		noun: "notes",
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			pagination.$$.fragment.c();
    			attr_dev(p, "class", "svelte-h2jqv0");
    			add_location(p, file$f, 198, 6, 4192);
    			set_style(div, "flex-grow", "1");
    			set_style(div, "padding", "16px");
    			add_location(div, file$f, 197, 4, 4143);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(pagination, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.$notes_list) && t0_value !== (t0_value = ctx.$notes_list[index].full_text + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			var pagination_changes = {};
    			if (changed.$notes_list) pagination_changes.length = ctx.$notes_list.length;
    			if (changed.$$scope || changed.$notes_list) pagination_changes.$$scope = { changed, ctx };
    			pagination.$set(pagination_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(pagination.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(pagination.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    				detach_dev(t1);
    			}

    			destroy_component(pagination, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$6.name, type: "if", source: "(196:2) {#if $notes_list.length > 0}", ctx });
    	return block;
    }

    // (201:4) <Pagination        index="{index + 1}"        length="{$notes_list.length}"        noun="notes">
    function create_default_slot$2(ctx) {
    	var p0, t0_value = format( new ctx.Date( ctx.$notes_list[index].updated_at ) ) + "", t0, t1, p1, t2_value = ctx.$notes_list[index].activity_name + "", t2;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			attr_dev(p0, "class", "pagination svelte-h2jqv0");
    			add_location(p0, file$f, 204, 6, 4348);
    			attr_dev(p1, "class", "pagination svelte-h2jqv0");
    			add_location(p1, file$f, 205, 6, 4434);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.$notes_list) && t0_value !== (t0_value = format( new ctx.Date( ctx.$notes_list[index].updated_at ) ) + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.$notes_list) && t2_value !== (t2_value = ctx.$notes_list[index].activity_name + "")) {
    				set_data_dev(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p0);
    				detach_dev(t1);
    				detach_dev(p1);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$2.name, type: "slot", source: "(201:4) <Pagination        index=\"{index + 1}\"        length=\"{$notes_list.length}\"        noun=\"notes\">", ctx });
    	return block;
    }

    function create_fragment$f(ctx) {
    	var div2, form, div0, updating_selected, t0, updating_value, t1, div1, t2, current_block_type_index, if_block, current;

    	function select_selected_binding(value) {
    		ctx.select_selected_binding.call(null, value);
    		updating_selected = true;
    		add_flush_callback(() => updating_selected = false);
    	}

    	let select_props = {
    		label: "Activity",
    		helper: "Where did this take place?",
    		options: ctx.activity,
    		labelField: "name",
    		dataField: "id"
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
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var if_block_creators = [
    		create_if_block$6,
    		create_else_block$2
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.$notes_list.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			form = element("form");
    			div0 = element("div");
    			select.$$.fragment.c();
    			t0 = space();
    			textarea.$$.fragment.c();
    			t1 = space();
    			div1 = element("div");
    			button.$$.fragment.c();
    			t2 = space();
    			if_block.c();
    			attr_dev(div0, "class", "activity svelte-h2jqv0");
    			add_location(div0, file$f, 173, 4, 3505);
    			attr_dev(div1, "class", "controls svelte-h2jqv0");
    			add_location(div1, file$f, 187, 4, 3898);
    			attr_dev(form, "class", "svelte-h2jqv0");
    			add_location(form, file$f, 172, 2, 3494);
    			attr_dev(div2, "class", "panel svelte-h2jqv0");
    			toggle_class(div2, "hide", ctx.hide);
    			add_location(div2, file$f, 171, 0, 3461);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			mount_component(select, div0, null);
    			append_dev(form, t0);
    			mount_component(textarea, form, null);
    			append_dev(form, t1);
    			append_dev(form, div1);
    			mount_component(button, div1, null);
    			append_dev(div2, t2);
    			if_blocks[current_block_type_index].m(div2, null);
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
    				if_block.m(div2, null);
    			}

    			if (changed.hide) {
    				toggle_class(div2, "hide", ctx.hide);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);

    			transition_in(textarea.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(select.$$.fragment, local);
    			transition_out(textarea.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div2);
    			}

    			destroy_component(select);

    			destroy_component(textarea);

    			destroy_component(button);

    			if_blocks[current_block_type_index].d();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$f.name, type: "component", source: "", ctx });
    	return block;
    }

    let index = 0;

    function format( updated ) {
    let hours = [
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ];
    let months = [
      'Jan', 'Feb', 'Mar', 'Apr', 
      'May', 'Jun', 'Jul', 'Aug', 
      'Sep', 'Oct', 'Nov', 'Dec'
    ];
    let now = new Date();
    let result = null;

    if( now.getFullYear() !== updated.getFullYear()  ) {
      result = `${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()}`;
    } else {
      if( updated.getMonth() === now.getMonth() && updated.getDate() === now.getDate() ) {
        result = `${months[updated.getMonth()]} ${updated.getDate()} @ ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )}`;
      } else {
        result = `${months[updated.getMonth()]} ${updated.getDate()}`;
      }
    }

    return result;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $notes_list, $developer_name;

    	validate_store(notes_list, 'notes_list');
    	component_subscribe($$self, notes_list, $$value => { $notes_list = $$value; $$invalidate('$notes_list', $notes_list); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });

    	

    let { hide = false, disabled = false } = $$props;

    let activity = [];
    let activity_id = null;
    let text = '';

    onMount( async () => {
      $$invalidate('activity', activity = await fetch( '/api/activity' )
      .then( ( response ) => response.json() ));
      $$invalidate('activity_id', activity_id = activity[0].id);
    } );

    /*
    function doNext( evt ) {
      if( index === ( $notes_list.length - 1 ) ) {
        index = 0;
      } else {
        index = index + 1;
      }
    }

    function doPrevious( evt ) {
      if( index === 0 ) {
        index = $notes_list.length - 1;
      } else {
        index = index - 1;
      }
    }

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
        $notes_list.push( data );
        $notes_list.sort( ( a, b ) => {
          a = new Date( a.updated_at ).getTime();
          b = new Date( b.updated_at ).getTime();

          if( a < b ) return 1;
          if( a > b ) return -1;
          return 0;
        } );
        $notes_list = $notes_list.slice( 0 );

        index = 0;
        text = '';
      } );
    }
    */

    	const writable_props = ['hide', 'disabled'];
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
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hide, disabled, activity, activity_id, index, text, $notes_list, $developer_name };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('activity' in $$props) $$invalidate('activity', activity = $$props.activity);
    		if ('activity_id' in $$props) $$invalidate('activity_id', activity_id = $$props.activity_id);
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    		if ('text' in $$props) $$invalidate('text', text = $$props.text);
    		if ('$notes_list' in $$props) notes_list.set($notes_list);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    	};

    	return {
    		hide,
    		disabled,
    		activity,
    		activity_id,
    		text,
    		Date,
    		$notes_list,
    		$developer_name,
    		select_selected_binding,
    		textarea_value_binding
    	};
    }

    class Notes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, ["hide", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Notes", options, id: create_fragment$f.name });
    	}

    	get hide() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hide(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Notes>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Notes>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Search.svelte generated by Svelte v3.12.1 */

    const file$g = "src/Search.svelte";

    function create_fragment$g(ctx) {
    	var input, dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", ctx.placeholder);
    			attr_dev(input, "class", "svelte-1htj1fc");
    			add_location(input, file$g, 32, 0, 626);

    			dispose = [
    				listen_dev(input, "input", ctx.input_input_handler),
    				listen_dev(input, "keyup", ctx.keyup_handler)
    			];
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
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    			}

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$g.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { placeholder = 'Search', value = '' } = $$props;

    	const writable_props = ['placeholder', 'value'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Search> was created with unknown prop '${key}'`);
    	});

    	function keyup_handler(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate('value', value);
    	}

    	$$self.$set = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	$$self.$capture_state = () => {
    		return { placeholder, value };
    	};

    	$$self.$inject_state = $$props => {
    		if ('placeholder' in $$props) $$invalidate('placeholder', placeholder = $$props.placeholder);
    		if ('value' in $$props) $$invalidate('value', value = $$props.value);
    	};

    	return {
    		placeholder,
    		value,
    		keyup_handler,
    		input_input_handler
    	};
    }

    class Search extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$g, safe_not_equal, ["placeholder", "value"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Search", options, id: create_fragment$g.name });
    	}

    	get placeholder() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Search>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Search>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Map.svelte generated by Svelte v3.12.1 */

    const file$h = "src/Map.svelte";

    function create_fragment$h(ctx) {
    	var div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-cowull");
    			add_location(div, file$h, 33, 0, 542);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			ctx.div_binding(div);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			ctx.div_binding(null);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$h.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { latitude = 41.1135751, longitude = -73.7182409, zoom = 11 } = $$props;

    let container = undefined;
    let map = undefined;
    let view = undefined;

    require( [
      'esri/Map',
      'esri/views/MapView'
    ], function( Map, MapView ) {
      map = new Map( {
        basemap: 'streets-navigation-vector'
      } );

      view = new MapView( {
        container: container,
        map: map,
        center: [longitude, latitude],
        zoom: zoom
      } );
      view.ui.components = ['attribution'];
    } );

    	const writable_props = ['latitude', 'longitude', 'zoom'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('container', container = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('latitude' in $$props) $$invalidate('latitude', latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate('longitude', longitude = $$props.longitude);
    		if ('zoom' in $$props) $$invalidate('zoom', zoom = $$props.zoom);
    	};

    	$$self.$capture_state = () => {
    		return { latitude, longitude, zoom, container, map, view };
    	};

    	$$self.$inject_state = $$props => {
    		if ('latitude' in $$props) $$invalidate('latitude', latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate('longitude', longitude = $$props.longitude);
    		if ('zoom' in $$props) $$invalidate('zoom', zoom = $$props.zoom);
    		if ('container' in $$props) $$invalidate('container', container = $$props.container);
    		if ('map' in $$props) map = $$props.map;
    		if ('view' in $$props) view = $$props.view;
    	};

    	return {
    		latitude,
    		longitude,
    		zoom,
    		container,
    		div_binding
    	};
    }

    class Map$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$h, safe_not_equal, ["latitude", "longitude", "zoom"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Map", options, id: create_fragment$h.name });
    	}

    	get latitude() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set latitude(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get longitude() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set longitude(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Summary.svelte generated by Svelte v3.12.1 */

    const file$i = "src/Summary.svelte";

    function create_fragment$i(ctx) {
    	var form, div1, updating_value, t0, div0, t1, updating_value_1, t2, div2, updating_value_2, t3, div3, updating_value_3, t4, div4, updating_value_4, t5, div5, current;

    	function textinput0_value_binding(value) {
    		ctx.textinput0_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let textinput0_props = {
    		label: "Full name",
    		placeholder: "Full name",
    		disabled: ctx.disabled
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
    		disabled: ctx.disabled
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
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_image !== void 0) {
    		textinput2_props.value = ctx.$developer_image;
    	}
    	var textinput2 = new TextInput({ props: textinput2_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput2, 'value', textinput2_value_binding));

    	function taginput_value_binding(value_3) {
    		ctx.taginput_value_binding.call(null, value_3);
    		updating_value_3 = true;
    		add_flush_callback(() => updating_value_3 = false);
    	}

    	let taginput_props = {
    		data: ctx.$organization_list,
    		labelField: "name",
    		label: "Organization",
    		placeholder: "Organization",
    		helper: "Company name and/or team nomenclature",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_organizations !== void 0) {
    		taginput_props.value = ctx.$developer_organizations;
    	}
    	var taginput = new TagInput({ props: taginput_props, $$inline: true });

    	binding_callbacks.push(() => bind(taginput, 'value', taginput_value_binding));

    	function textinput3_value_binding(value_4) {
    		ctx.textinput3_value_binding.call(null, value_4);
    		updating_value_4 = true;
    		add_flush_callback(() => updating_value_4 = false);
    	}

    	let textinput3_props = {
    		label: "Location",
    		placeholder: "Location",
    		helper: "As specific or general as is needed",
    		disabled: ctx.disabled
    	};
    	if (ctx.$developer_location !== void 0) {
    		textinput3_props.value = ctx.$developer_location;
    	}
    	var textinput3 = new TextInput({ props: textinput3_props, $$inline: true });

    	binding_callbacks.push(() => bind(textinput3, 'value', textinput3_value_binding));

    	var map = new Map$1({ $$inline: true });

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
    			taginput.$$.fragment.c();
    			t4 = space();
    			div4 = element("div");
    			textinput3.$$.fragment.c();
    			t5 = space();
    			div5 = element("div");
    			map.$$.fragment.c();
    			attr_dev(div0, "class", "svelte-qmlnff");
    			add_location(div0, file$i, 54, 4, 1026);
    			attr_dev(div1, "class", "svelte-qmlnff");
    			add_location(div1, file$i, 48, 2, 888);
    			attr_dev(div2, "class", "svelte-qmlnff");
    			add_location(div2, file$i, 62, 2, 1187);
    			attr_dev(div3, "class", "svelte-qmlnff");
    			add_location(div3, file$i, 71, 2, 1401);
    			attr_dev(div4, "class", "svelte-qmlnff");
    			add_location(div4, file$i, 82, 2, 1669);
    			attr_dev(div5, "class", "svelte-qmlnff");
    			add_location(div5, file$i, 91, 2, 1865);
    			attr_dev(form, "class", "svelte-qmlnff");
    			toggle_class(form, "hide", ctx.hide);
    			add_location(form, file$i, 46, 0, 867);
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
    			mount_component(taginput, div3, null);
    			append_dev(form, t4);
    			append_dev(form, div4);
    			mount_component(textinput3, div4, null);
    			append_dev(form, t5);
    			append_dev(form, div5);
    			mount_component(map, div5, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var textinput0_changes = {};
    			if (changed.disabled) textinput0_changes.disabled = ctx.disabled;
    			if (!updating_value && changed.$developer_name) {
    				textinput0_changes.value = ctx.$developer_name;
    			}
    			textinput0.$set(textinput0_changes);

    			var textinput1_changes = {};
    			if (changed.disabled) textinput1_changes.disabled = ctx.disabled;
    			if (!updating_value_1 && changed.$developer_email) {
    				textinput1_changes.value = ctx.$developer_email;
    			}
    			textinput1.$set(textinput1_changes);

    			var textinput2_changes = {};
    			if (changed.disabled) textinput2_changes.disabled = ctx.disabled;
    			if (!updating_value_2 && changed.$developer_image) {
    				textinput2_changes.value = ctx.$developer_image;
    			}
    			textinput2.$set(textinput2_changes);

    			var taginput_changes = {};
    			if (changed.$organization_list) taginput_changes.data = ctx.$organization_list;
    			if (changed.disabled) taginput_changes.disabled = ctx.disabled;
    			if (!updating_value_3 && changed.$developer_organizations) {
    				taginput_changes.value = ctx.$developer_organizations;
    			}
    			taginput.$set(taginput_changes);

    			var textinput3_changes = {};
    			if (changed.disabled) textinput3_changes.disabled = ctx.disabled;
    			if (!updating_value_4 && changed.$developer_location) {
    				textinput3_changes.value = ctx.$developer_location;
    			}
    			textinput3.$set(textinput3_changes);

    			if (changed.hide) {
    				toggle_class(form, "hide", ctx.hide);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(textinput0.$$.fragment, local);

    			transition_in(textinput1.$$.fragment, local);

    			transition_in(textinput2.$$.fragment, local);

    			transition_in(taginput.$$.fragment, local);

    			transition_in(textinput3.$$.fragment, local);

    			transition_in(map.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(textinput0.$$.fragment, local);
    			transition_out(textinput1.$$.fragment, local);
    			transition_out(textinput2.$$.fragment, local);
    			transition_out(taginput.$$.fragment, local);
    			transition_out(textinput3.$$.fragment, local);
    			transition_out(map.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(form);
    			}

    			destroy_component(textinput0);

    			destroy_component(textinput1);

    			destroy_component(textinput2);

    			destroy_component(taginput);

    			destroy_component(textinput3);

    			destroy_component(map);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$i.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let $developer_name, $developer_email, $developer_image, $organization_list, $developer_organizations, $developer_location;

    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(organization_list, 'organization_list');
    	component_subscribe($$self, organization_list, $$value => { $organization_list = $$value; $$invalidate('$organization_list', $organization_list); });
    	validate_store(developer_organizations, 'developer_organizations');
    	component_subscribe($$self, developer_organizations, $$value => { $developer_organizations = $$value; $$invalidate('$developer_organizations', $developer_organizations); });
    	validate_store(developer_location, 'developer_location');
    	component_subscribe($$self, developer_location, $$value => { $developer_location = $$value; $$invalidate('$developer_location', $developer_location); });

    	

    let { hide = false, disabled = false } = $$props;

    	const writable_props = ['hide', 'disabled'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Summary> was created with unknown prop '${key}'`);
    	});

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

    	function taginput_value_binding(value_3) {
    		$developer_organizations = value_3;
    		developer_organizations.set($developer_organizations);
    	}

    	function textinput3_value_binding(value_4) {
    		$developer_location = value_4;
    		developer_location.set($developer_location);
    	}

    	$$self.$set = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    	};

    	$$self.$capture_state = () => {
    		return { hide, disabled, $developer_name, $developer_email, $developer_image, $organization_list, $developer_organizations, $developer_location };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    		if ('disabled' in $$props) $$invalidate('disabled', disabled = $$props.disabled);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$organization_list' in $$props) organization_list.set($organization_list);
    		if ('$developer_organizations' in $$props) developer_organizations.set($developer_organizations);
    		if ('$developer_location' in $$props) developer_location.set($developer_location);
    	};

    	return {
    		hide,
    		disabled,
    		$developer_name,
    		$developer_email,
    		$developer_image,
    		$organization_list,
    		$developer_organizations,
    		$developer_location,
    		textinput0_value_binding,
    		textinput1_value_binding,
    		textinput2_value_binding,
    		taginput_value_binding,
    		textinput3_value_binding
    	};
    }

    class Summary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, ["hide", "disabled"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Summary", options, id: create_fragment$i.name });
    	}

    	get hide() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hide(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Summary>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Summary>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Tab.svelte generated by Svelte v3.12.1 */

    const file$j = "src/Tab.svelte";

    function create_fragment$j(ctx) {
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
    			add_location(button, file$j, 45, 0, 801);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$j.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$j, create_fragment$j, safe_not_equal, ["disabled", "selected"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Tab", options, id: create_fragment$j.name });
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

    const file$k = "src/TabBar.svelte";

    function create_fragment$k(ctx) {
    	var div, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	const block = {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr_dev(div, "class", "svelte-1v24ktc");
    			add_location(div, file$k, 7, 0, 66);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$k.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$k, create_fragment$k, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TabBar", options, id: create_fragment$k.name });
    	}
    }

    /* src/Timeline.svelte generated by Svelte v3.12.1 */

    const file$l = "src/Timeline.svelte";

    function create_fragment$l(ctx) {
    	var div, p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Timeline";
    			add_location(p, file$l, 15, 2, 134);
    			attr_dev(div, "class", "svelte-1msmp64");
    			toggle_class(div, "hide", ctx.hide);
    			add_location(div, file$l, 14, 0, 115);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},

    		p: function update(changed, ctx) {
    			if (changed.hide) {
    				toggle_class(div, "hide", ctx.hide);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$l.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { hide = false } = $$props;

    	const writable_props = ['hide'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Timeline> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    	};

    	$$self.$capture_state = () => {
    		return { hide };
    	};

    	$$self.$inject_state = $$props => {
    		if ('hide' in $$props) $$invalidate('hide', hide = $$props.hide);
    	};

    	return { hide };
    }

    class Timeline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, ["hide"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Timeline", options, id: create_fragment$l.name });
    	}

    	get hide() {
    		throw new Error("<Timeline>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hide(value) {
    		throw new Error("<Timeline>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Developers.svelte generated by Svelte v3.12.1 */

    const file$m = "src/Developers.svelte";

    // (559:6) <Button         on:click="{doAddClick}"         icon="/img/add-white.svg"         disabledIcon="/img/add.svg"         disabled="{$add_disabled}">
    function create_default_slot_10(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_10.name, type: "slot", source: "(559:6) <Button         on:click=\"{doAddClick}\"         icon=\"/img/add-white.svg\"         disabledIcon=\"/img/add.svg\"         disabled=\"{$add_disabled}\">", ctx });
    	return block;
    }

    // (571:6) <ListLabelItem>
    function create_default_slot_9(ctx) {
    	var t_value = ctx.developer.name + "", t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.developer) && t_value !== (t_value = ctx.developer.name + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_9.name, type: "slot", source: "(571:6) <ListLabelItem>", ctx });
    	return block;
    }

    // (568:4) <List        data="{$filtered_list}"        let:item="{developer}">
    function create_default_slot_8(ctx) {
    	var current;

    	var listlabelitem = new ListLabelItem({
    		props: {
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			listlabelitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listlabelitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var listlabelitem_changes = {};
    			if (changed.$$scope) listlabelitem_changes.$$scope = { changed, ctx };
    			listlabelitem.$set(listlabelitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listlabelitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listlabelitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listlabelitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_8.name, type: "slot", source: "(568:4) <List        data=\"{$filtered_list}\"        let:item=\"{developer}\">", ctx });
    	return block;
    }

    // (581:10) <span slot="label">
    function create_label_slot(ctx) {
    	var span, t_value = ctx.organization.name + "", t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "label");
    			add_location(span, file$m, 580, 10, 14950);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.organization) && t_value !== (t_value = ctx.organization.name + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_label_slot.name, type: "slot", source: "(581:10) <span slot=\"label\">", ctx });
    	return block;
    }

    // (582:10) <span slot="count">
    function create_count_slot(ctx) {
    	var span, t_value = ctx.organization.count + "", t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "slot", "count");
    			add_location(span, file$m, 581, 10, 15006);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.organization) && t_value !== (t_value = ctx.organization.count + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(span);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_count_slot.name, type: "slot", source: "(582:10) <span slot=\"count\">", ctx });
    	return block;
    }

    // (580:8) <ListCountItem>
    function create_default_slot_7(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(t);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_7.name, type: "slot", source: "(580:8) <ListCountItem>", ctx });
    	return block;
    }

    // (577:6) <List          data="{$organization_list}"          let:item="{organization}">
    function create_default_slot_6(ctx) {
    	var current;

    	var listcountitem = new ListCountItem({
    		props: {
    		$$slots: {
    		default: [create_default_slot_7],
    		count: [create_count_slot],
    		label: [create_label_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			listcountitem.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(listcountitem, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var listcountitem_changes = {};
    			if (changed.$$scope) listcountitem_changes.$$scope = { changed, ctx };
    			listcountitem.$set(listcountitem_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(listcountitem.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(listcountitem.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(listcountitem, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_6.name, type: "slot", source: "(577:6) <List          data=\"{$organization_list}\"          let:item=\"{organization}\">", ctx });
    	return block;
    }

    // (576:4) <Details summary="Organizations">
    function create_default_slot_5$1(ctx) {
    	var current;

    	var list = new List({
    		props: {
    		data: ctx.$organization_list,
    		$$slots: {
    		default: [create_default_slot_6, ({ item: organization }) => ({ organization })]
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
    			if (changed.$organization_list) list_changes.data = ctx.$organization_list;
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_5$1.name, type: "slot", source: "(576:4) <Details summary=\"Organizations\">", ctx });
    	return block;
    }

    // (594:6) <Tab          on:click="{() => doTabClick( 0 )}"         selected="{$summary_selected}"         disabled="{$summary_tab}">
    function create_default_slot_4$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Summary");
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_4$1.name, type: "slot", source: "(594:6) <Tab          on:click=\"{() => doTabClick( 0 )}\"         selected=\"{$summary_selected}\"         disabled=\"{$summary_tab}\">", ctx });
    	return block;
    }

    // (598:6) <Tab          on:click="{() => doTabClick( 1 )}"               selected="{$profile_selected}"         disabled="{$profile_tab}">
    function create_default_slot_3$1(ctx) {
    	var t;

    	const block = {
    		c: function create() {
    			t = text("Profile");
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_3$1.name, type: "slot", source: "(598:6) <Tab          on:click=\"{() => doTabClick( 1 )}\"               selected=\"{$profile_selected}\"         disabled=\"{$profile_tab}\">", ctx });
    	return block;
    }

    // (602:6) <Tab          on:click="{() => doTabClick( 2 )}"               selected="{$social_selected}"          disabled="{$social_tab}">
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_2$1.name, type: "slot", source: "(602:6) <Tab          on:click=\"{() => doTabClick( 2 )}\"               selected=\"{$social_selected}\"          disabled=\"{$social_tab}\">", ctx });
    	return block;
    }

    // (606:6) <Tab          on:click="{() => doTabClick( 3 )}"               selected="{$notes_selected}"          disabled="{$notes_tab}">
    function create_default_slot_1$2(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot_1$2.name, type: "slot", source: "(606:6) <Tab          on:click=\"{() => doTabClick( 3 )}\"               selected=\"{$notes_selected}\"          disabled=\"{$notes_tab}\">", ctx });
    	return block;
    }

    // (593:4) <TabBar>
    function create_default_slot$3(ctx) {
    	var t0, t1, t2, current;

    	var tab0 = new Tab({
    		props: {
    		selected: ctx.$summary_selected,
    		disabled: ctx.$summary_tab,
    		$$slots: { default: [create_default_slot_4$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab0.$on("click", ctx.click_handler);

    	var tab1 = new Tab({
    		props: {
    		selected: ctx.$profile_selected,
    		disabled: ctx.$profile_tab,
    		$$slots: { default: [create_default_slot_3$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab1.$on("click", ctx.click_handler_1);

    	var tab2 = new Tab({
    		props: {
    		selected: ctx.$social_selected,
    		disabled: ctx.$social_tab,
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab2.$on("click", ctx.click_handler_2);

    	var tab3 = new Tab({
    		props: {
    		selected: ctx.$notes_selected,
    		disabled: ctx.$notes_tab,
    		$$slots: { default: [create_default_slot_1$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	tab3.$on("click", ctx.click_handler_3);

    	const block = {
    		c: function create() {
    			tab0.$$.fragment.c();
    			t0 = space();
    			tab1.$$.fragment.c();
    			t1 = space();
    			tab2.$$.fragment.c();
    			t2 = space();
    			tab3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(tab3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var tab0_changes = {};
    			if (changed.$summary_selected) tab0_changes.selected = ctx.$summary_selected;
    			if (changed.$summary_tab) tab0_changes.disabled = ctx.$summary_tab;
    			if (changed.$$scope) tab0_changes.$$scope = { changed, ctx };
    			tab0.$set(tab0_changes);

    			var tab1_changes = {};
    			if (changed.$profile_selected) tab1_changes.selected = ctx.$profile_selected;
    			if (changed.$profile_tab) tab1_changes.disabled = ctx.$profile_tab;
    			if (changed.$$scope) tab1_changes.$$scope = { changed, ctx };
    			tab1.$set(tab1_changes);

    			var tab2_changes = {};
    			if (changed.$social_selected) tab2_changes.selected = ctx.$social_selected;
    			if (changed.$social_tab) tab2_changes.disabled = ctx.$social_tab;
    			if (changed.$$scope) tab2_changes.$$scope = { changed, ctx };
    			tab2.$set(tab2_changes);

    			var tab3_changes = {};
    			if (changed.$notes_selected) tab3_changes.selected = ctx.$notes_selected;
    			if (changed.$notes_tab) tab3_changes.disabled = ctx.$notes_tab;
    			if (changed.$$scope) tab3_changes.$$scope = { changed, ctx };
    			tab3.$set(tab3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);

    			transition_in(tab1.$$.fragment, local);

    			transition_in(tab2.$$.fragment, local);

    			transition_in(tab3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			transition_out(tab3.$$.fragment, local);
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

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(tab3, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$3.name, type: "slot", source: "(593:4) <TabBar>", ctx });
    	return block;
    }

    function create_fragment$m(ctx) {
    	var div1, aside0, div0, updating_value, t0, t1, h4, t3, t4, t5, article, t6, t7, t8, t9, t10, t11, t12, aside1, current;

    	function search_value_binding(value) {
    		ctx.search_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let search_props = {};
    	if (ctx.$search_term !== void 0) {
    		search_props.value = ctx.$search_term;
    	}
    	var search = new Search({ props: search_props, $$inline: true });

    	binding_callbacks.push(() => bind(search, 'value', search_value_binding));
    	search.$on("keyup", ctx.filter);

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		disabledIcon: "/img/add.svg",
    		disabled: ctx.$add_disabled,
    		$$slots: { default: [create_default_slot_10] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.doAddClick);

    	var list = new List({
    		props: {
    		data: ctx.$filtered_list,
    		$$slots: {
    		default: [create_default_slot_8, ({ item: developer }) => ({ developer })]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var details = new Details({
    		props: {
    		summary: "Organizations",
    		$$slots: { default: [create_default_slot_5$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var tabbar = new TabBar({
    		props: {
    		$$slots: { default: [create_default_slot$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var summary = new Summary({
    		props: {
    		hide: ctx.$summary_hidden,
    		disabled: ctx.$summary_disabled
    	},
    		$$inline: true
    	});

    	var profile = new Profile({
    		props: {
    		hide: ctx.$profile_hidden,
    		disabled: ctx.$profile_disabled
    	},
    		$$inline: true
    	});

    	var endpoints = new Endpoints({
    		props: {
    		hide: ctx.$endpoints_hidden,
    		disabled: ctx.$endpoints_disabled
    	},
    		$$inline: true
    	});

    	var timeline = new Timeline({
    		props: { hide: ctx.$timeline_hidden },
    		$$inline: true
    	});

    	var notes = new Notes({
    		props: { hide: ctx.$notes_hidden },
    		$$inline: true
    	});

    	var controls = new Controls({
    		props: {
    		mode: ctx.$controls_mode,
    		hidden: ctx.$controls_hidden
    	},
    		$$inline: true
    	});
    	controls.$on("cancelnew", ctx.doCancelNew);
    	controls.$on("savenew", ctx.doSaveNew);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			aside0 = element("aside");
    			div0 = element("div");
    			search.$$.fragment.c();
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
    			summary.$$.fragment.c();
    			t7 = space();
    			profile.$$.fragment.c();
    			t8 = space();
    			endpoints.$$.fragment.c();
    			t9 = space();
    			timeline.$$.fragment.c();
    			t10 = space();
    			notes.$$.fragment.c();
    			t11 = space();
    			controls.$$.fragment.c();
    			t12 = space();
    			aside1 = element("aside");
    			attr_dev(div0, "class", "search svelte-3i9eli");
    			add_location(div0, file$m, 556, 4, 14292);
    			attr_dev(h4, "class", "svelte-3i9eli");
    			add_location(h4, file$m, 566, 4, 14585);
    			attr_dev(aside0, "class", "svelte-3i9eli");
    			add_location(aside0, file$m, 553, 2, 14259);
    			attr_dev(article, "class", "svelte-3i9eli");
    			add_location(article, file$m, 589, 2, 15152);
    			attr_dev(aside1, "class", "svelte-3i9eli");
    			add_location(aside1, file$m, 637, 2, 16465);
    			attr_dev(div1, "class", "panel svelte-3i9eli");
    			add_location(div1, file$m, 550, 0, 14214);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, aside0);
    			append_dev(aside0, div0);
    			mount_component(search, div0, null);
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
    			mount_component(summary, article, null);
    			append_dev(article, t7);
    			mount_component(profile, article, null);
    			append_dev(article, t8);
    			mount_component(endpoints, article, null);
    			append_dev(article, t9);
    			mount_component(timeline, article, null);
    			append_dev(article, t10);
    			mount_component(notes, article, null);
    			append_dev(article, t11);
    			mount_component(controls, article, null);
    			append_dev(div1, t12);
    			append_dev(div1, aside1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var search_changes = {};
    			if (!updating_value && changed.$search_term) {
    				search_changes.value = ctx.$search_term;
    			}
    			search.$set(search_changes);

    			var button_changes = {};
    			if (changed.$add_disabled) button_changes.disabled = ctx.$add_disabled;
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			var list_changes = {};
    			if (changed.$filtered_list) list_changes.data = ctx.$filtered_list;
    			if (changed.$$scope) list_changes.$$scope = { changed, ctx };
    			list.$set(list_changes);

    			var details_changes = {};
    			if (changed.$$scope || changed.$organization_list) details_changes.$$scope = { changed, ctx };
    			details.$set(details_changes);

    			var tabbar_changes = {};
    			if (changed.$$scope || changed.$notes_selected || changed.$notes_tab || changed.$social_selected || changed.$social_tab || changed.$profile_selected || changed.$profile_tab || changed.$summary_selected || changed.$summary_tab) tabbar_changes.$$scope = { changed, ctx };
    			tabbar.$set(tabbar_changes);

    			var summary_changes = {};
    			if (changed.$summary_hidden) summary_changes.hide = ctx.$summary_hidden;
    			if (changed.$summary_disabled) summary_changes.disabled = ctx.$summary_disabled;
    			summary.$set(summary_changes);

    			var profile_changes = {};
    			if (changed.$profile_hidden) profile_changes.hide = ctx.$profile_hidden;
    			if (changed.$profile_disabled) profile_changes.disabled = ctx.$profile_disabled;
    			profile.$set(profile_changes);

    			var endpoints_changes = {};
    			if (changed.$endpoints_hidden) endpoints_changes.hide = ctx.$endpoints_hidden;
    			if (changed.$endpoints_disabled) endpoints_changes.disabled = ctx.$endpoints_disabled;
    			endpoints.$set(endpoints_changes);

    			var timeline_changes = {};
    			if (changed.$timeline_hidden) timeline_changes.hide = ctx.$timeline_hidden;
    			timeline.$set(timeline_changes);

    			var notes_changes = {};
    			if (changed.$notes_hidden) notes_changes.hide = ctx.$notes_hidden;
    			notes.$set(notes_changes);

    			var controls_changes = {};
    			if (changed.$controls_mode) controls_changes.mode = ctx.$controls_mode;
    			if (changed.$controls_hidden) controls_changes.hidden = ctx.$controls_hidden;
    			controls.$set(controls_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			transition_in(list.$$.fragment, local);

    			transition_in(details.$$.fragment, local);

    			transition_in(tabbar.$$.fragment, local);

    			transition_in(summary.$$.fragment, local);

    			transition_in(profile.$$.fragment, local);

    			transition_in(endpoints.$$.fragment, local);

    			transition_in(timeline.$$.fragment, local);

    			transition_in(notes.$$.fragment, local);

    			transition_in(controls.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			transition_out(list.$$.fragment, local);
    			transition_out(details.$$.fragment, local);
    			transition_out(tabbar.$$.fragment, local);
    			transition_out(summary.$$.fragment, local);
    			transition_out(profile.$$.fragment, local);
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

    			destroy_component(search);

    			destroy_component(button);

    			destroy_component(list);

    			destroy_component(details);

    			destroy_component(tabbar);

    			destroy_component(summary);

    			destroy_component(profile);

    			destroy_component(endpoints);

    			destroy_component(timeline);

    			destroy_component(notes);

    			destroy_component(controls);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$m.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let $search_term, $filtered_list, $developer_list, $add_disabled, $summary_selected, $profile_selected, $social_selected, $notes_selected, $summary_tab, $profile_tab, $social_tab, $notes_tab, $summary_disabled, $profile_disabled, $endpoints_disabled, $developer_id, $developer_name, $developer_email, $developer_image, $developer_organizations, $developer_location, $controls_hidden, $controls_mode, $summary_hidden, $profile_hidden, $endpoints_hidden, $timeline_hidden, $notes_hidden, $organization_list;

    	validate_store(search_term, 'search_term');
    	component_subscribe($$self, search_term, $$value => { $search_term = $$value; $$invalidate('$search_term', $search_term); });
    	validate_store(filtered_list, 'filtered_list');
    	component_subscribe($$self, filtered_list, $$value => { $filtered_list = $$value; $$invalidate('$filtered_list', $filtered_list); });
    	validate_store(developer_list, 'developer_list');
    	component_subscribe($$self, developer_list, $$value => { $developer_list = $$value; $$invalidate('$developer_list', $developer_list); });
    	validate_store(add_disabled, 'add_disabled');
    	component_subscribe($$self, add_disabled, $$value => { $add_disabled = $$value; $$invalidate('$add_disabled', $add_disabled); });
    	validate_store(summary_selected, 'summary_selected');
    	component_subscribe($$self, summary_selected, $$value => { $summary_selected = $$value; $$invalidate('$summary_selected', $summary_selected); });
    	validate_store(profile_selected, 'profile_selected');
    	component_subscribe($$self, profile_selected, $$value => { $profile_selected = $$value; $$invalidate('$profile_selected', $profile_selected); });
    	validate_store(social_selected, 'social_selected');
    	component_subscribe($$self, social_selected, $$value => { $social_selected = $$value; $$invalidate('$social_selected', $social_selected); });
    	validate_store(notes_selected, 'notes_selected');
    	component_subscribe($$self, notes_selected, $$value => { $notes_selected = $$value; $$invalidate('$notes_selected', $notes_selected); });
    	validate_store(summary_tab, 'summary_tab');
    	component_subscribe($$self, summary_tab, $$value => { $summary_tab = $$value; $$invalidate('$summary_tab', $summary_tab); });
    	validate_store(profile_tab, 'profile_tab');
    	component_subscribe($$self, profile_tab, $$value => { $profile_tab = $$value; $$invalidate('$profile_tab', $profile_tab); });
    	validate_store(social_tab, 'social_tab');
    	component_subscribe($$self, social_tab, $$value => { $social_tab = $$value; $$invalidate('$social_tab', $social_tab); });
    	validate_store(notes_tab, 'notes_tab');
    	component_subscribe($$self, notes_tab, $$value => { $notes_tab = $$value; $$invalidate('$notes_tab', $notes_tab); });
    	validate_store(summary_disabled, 'summary_disabled');
    	component_subscribe($$self, summary_disabled, $$value => { $summary_disabled = $$value; $$invalidate('$summary_disabled', $summary_disabled); });
    	validate_store(profile_disabled, 'profile_disabled');
    	component_subscribe($$self, profile_disabled, $$value => { $profile_disabled = $$value; $$invalidate('$profile_disabled', $profile_disabled); });
    	validate_store(endpoints_disabled, 'endpoints_disabled');
    	component_subscribe($$self, endpoints_disabled, $$value => { $endpoints_disabled = $$value; $$invalidate('$endpoints_disabled', $endpoints_disabled); });
    	validate_store(developer_id, 'developer_id');
    	component_subscribe($$self, developer_id, $$value => { $developer_id = $$value; $$invalidate('$developer_id', $developer_id); });
    	validate_store(developer_name, 'developer_name');
    	component_subscribe($$self, developer_name, $$value => { $developer_name = $$value; $$invalidate('$developer_name', $developer_name); });
    	validate_store(developer_email, 'developer_email');
    	component_subscribe($$self, developer_email, $$value => { $developer_email = $$value; $$invalidate('$developer_email', $developer_email); });
    	validate_store(developer_image, 'developer_image');
    	component_subscribe($$self, developer_image, $$value => { $developer_image = $$value; $$invalidate('$developer_image', $developer_image); });
    	validate_store(developer_organizations, 'developer_organizations');
    	component_subscribe($$self, developer_organizations, $$value => { $developer_organizations = $$value; $$invalidate('$developer_organizations', $developer_organizations); });
    	validate_store(developer_location, 'developer_location');
    	component_subscribe($$self, developer_location, $$value => { $developer_location = $$value; $$invalidate('$developer_location', $developer_location); });
    	validate_store(controls_hidden, 'controls_hidden');
    	component_subscribe($$self, controls_hidden, $$value => { $controls_hidden = $$value; $$invalidate('$controls_hidden', $controls_hidden); });
    	validate_store(controls_mode, 'controls_mode');
    	component_subscribe($$self, controls_mode, $$value => { $controls_mode = $$value; $$invalidate('$controls_mode', $controls_mode); });
    	validate_store(summary_hidden, 'summary_hidden');
    	component_subscribe($$self, summary_hidden, $$value => { $summary_hidden = $$value; $$invalidate('$summary_hidden', $summary_hidden); });
    	validate_store(profile_hidden, 'profile_hidden');
    	component_subscribe($$self, profile_hidden, $$value => { $profile_hidden = $$value; $$invalidate('$profile_hidden', $profile_hidden); });
    	validate_store(endpoints_hidden, 'endpoints_hidden');
    	component_subscribe($$self, endpoints_hidden, $$value => { $endpoints_hidden = $$value; $$invalidate('$endpoints_hidden', $endpoints_hidden); });
    	validate_store(timeline_hidden, 'timeline_hidden');
    	component_subscribe($$self, timeline_hidden, $$value => { $timeline_hidden = $$value; $$invalidate('$timeline_hidden', $timeline_hidden); });
    	validate_store(notes_hidden, 'notes_hidden');
    	component_subscribe($$self, notes_hidden, $$value => { $notes_hidden = $$value; $$invalidate('$notes_hidden', $notes_hidden); });
    	validate_store(organization_list, 'organization_list');
    	component_subscribe($$self, organization_list, $$value => { $organization_list = $$value; $$invalidate('$organization_list', $organization_list); });

    	

    // Filter developer list on search term
    function filter() {
      let trimmed = $search_term.trim();

      if( trimmed.length === 0 ) {
        set_store_value(filtered_list, $filtered_list = $developer_list.slice());
      } else {
        let matches = [];

        for( let a = 0; a < $developer_list.length; a++ ) {
          if( $developer_list[a].name.indexOf( trimmed ) >= 0 ) {
            matches.push( $developer_list[a] );
          }
        }

        set_store_value(filtered_list, $filtered_list = matches.slice());
      }
    }

    // Add clicked
    function doAddClick( evt ) {
      set_store_value(add_disabled, $add_disabled = true);
      
      set_store_value(summary_selected, $summary_selected = true);
      set_store_value(profile_selected, $profile_selected = false);
      set_store_value(social_selected, $social_selected = false);
      set_store_value(notes_selected, $notes_selected = false);

      set_store_value(summary_tab, $summary_tab = false);
      set_store_value(profile_tab, $profile_tab = false);
      set_store_value(social_tab, $social_tab = false);
      set_store_value(notes_tab, $notes_tab = true);

      set_store_value(summary_disabled, $summary_disabled = false);
      set_store_value(profile_disabled, $profile_disabled = false);
      set_store_value(endpoints_disabled, $endpoints_disabled = false);

      set_store_value(developer_id, $developer_id = null);
      set_store_value(developer_name, $developer_name = '');
      set_store_value(developer_email, $developer_email = '');
      set_store_value(developer_image, $developer_image = '');
      set_store_value(developer_organizations, $developer_organizations = []);
      set_store_value(developer_location, $developer_location = '');

      controls_hidden.set( false );
      controls_mode.set( 1 );
    }

    function doCancelNew( evt ) {
      set_store_value(add_disabled, $add_disabled = false);

      set_store_value(summary_selected, $summary_selected = true);
      set_store_value(profile_selected, $profile_selected = false);
      set_store_value(social_selected, $social_selected = false);
      set_store_value(notes_selected, $notes_selected = false);

      set_store_value(summary_tab, $summary_tab = false);
      set_store_value(profile_tab, $profile_tab = true);
      set_store_value(social_tab, $social_tab = true);
      set_store_value(notes_tab, $notes_tab = true);

      set_store_value(summary_disabled, $summary_disabled = true);
      set_store_value(profile_disabled, $profile_disabled = true);
      set_store_value(endpoints_disabled, $endpoints_disabled = true);

      set_store_value(developer_id, $developer_id = null);
      set_store_value(developer_name, $developer_name = '');
      set_store_value(developer_email, $developer_email = '');
      set_store_value(developer_image, $developer_image = '');
      set_store_value(developer_organizations, $developer_organizations = []);
      set_store_value(developer_location, $developer_location = '');

      set_store_value(controls_hidden, $controls_hidden = true);
      set_store_value(controls_mode, $controls_mode = 0);
    }

    // Save new developer
    function doSaveNew( evt ) {
      fetch( '/api/developer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( {
          name: $developer_name.trim().length > 0 ? $developer_name : null,
          email: $developer_email.trim().length > 0 ? $developer_email : null,      
          description: null,      
          image: $developer_image.trim().length > 0 ? $developer_image : null,
          location: $developer_location.trim().length > 0 ? $developer_location : null,      
          latitude: null,      
          longitude: null,
          public: 0
        } )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        set_store_value(developer_id, $developer_id = data.id);
        $developer_list.push( data );
        $developer_list.sort( ( a, b ) => {
          if( a.name > b.name ) return 1;
          if( a.name < b.name ) return -1;
          return 0;
        } );
        set_store_value(developer_list, $developer_list = $developer_list.slice());
        filter();

        set_store_value(add_disabled, $add_disabled = false);

        set_store_value(summary_tab, $summary_tab = false);
        set_store_value(profile_tab, $profile_tab = false);
        set_store_value(social_tab, $social_tab = false);
        set_store_value(notes_tab, $notes_tab = false);

        set_store_value(summary_disabled, $summary_disabled = true);
        set_store_value(profile_disabled, $profile_disabled = true);
        set_store_value(endpoints_disabled, $endpoints_disabled = true);

        set_store_value(controls_mode, $controls_mode = 2);
        set_store_value(controls_hidden, $controls_hidden = true);
      } );
    }

    // Tab clicked
    function doTabClick( index ) {
      switch( index ) {
        case 0:
          set_store_value(summary_selected, $summary_selected = true);
          set_store_value(profile_selected, $profile_selected = false);
          set_store_value(social_selected, $social_selected = false);
          set_store_value(notes_selected, $notes_selected = false);

          set_store_value(summary_hidden, $summary_hidden = false);
          set_store_value(profile_hidden, $profile_hidden = true);
          set_store_value(endpoints_hidden, $endpoints_hidden = true);
          set_store_value(timeline_hidden, $timeline_hidden = true);
          set_store_value(notes_hidden, $notes_hidden = true);

          set_store_value(controls_hidden, $controls_hidden = false);
          break;

        case 1:
          set_store_value(summary_selected, $summary_selected = false);
          set_store_value(profile_selected, $profile_selected = true);
          set_store_value(social_selected, $social_selected = false);
          set_store_value(notes_selected, $notes_selected = false);

          set_store_value(summary_hidden, $summary_hidden = true);
          set_store_value(profile_hidden, $profile_hidden = false);
          set_store_value(endpoints_hidden, $endpoints_hidden = true);
          set_store_value(timeline_hidden, $timeline_hidden = true);
          set_store_value(notes_hidden, $notes_hidden = true);     
          
          set_store_value(controls_hidden, $controls_hidden = false);      
          break;      

        case 2:
          set_store_value(summary_selected, $summary_selected = false);
          set_store_value(profile_selected, $profile_selected = false);
          set_store_value(social_selected, $social_selected = true);
          set_store_value(notes_selected, $notes_selected = false);

          set_store_value(summary_hidden, $summary_hidden = true);
          set_store_value(profile_hidden, $profile_hidden = true);
          set_store_value(endpoints_hidden, $endpoints_hidden = $add_disabled ? false : true);
          set_store_value(timeline_hidden, $timeline_hidden = $add_disabled ? true : false);      
          set_store_value(notes_hidden, $notes_hidden = true);     
          
          set_store_value(controls_hidden, $controls_hidden = false);
          break;      

        case 3:
          set_store_value(summary_selected, $summary_selected = false);
          set_store_value(profile_selected, $profile_selected = false);
          set_store_value(social_selected, $social_selected = false);
          set_store_value(notes_selected, $notes_selected = true);

          set_store_value(summary_hidden, $summary_hidden = true);
          set_store_value(profile_hidden, $profile_hidden = true);
          set_store_value(endpoints_hidden, $endpoints_hidden = true);
          set_store_value(timeline_hidden, $timeline_hidden = true);
          set_store_value(notes_hidden, $notes_hidden = false);      

          set_store_value(controls_hidden, $controls_hidden = true);
          break;      
      }
    }

    // Load external data
    onMount( async () => {
      fetch( '/api/developer' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        developer_list.set( data.slice() );
        filter();    
      } );

      fetch( '/api/organization' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        organization_list.set( data.slice() );
      } );
    } );

    /*
    // Add new developer
    function doAdd( evt ) {
      $add_disabled = true;
      $tab_index = 0;
      $social_disabled = false;
      $notes_disabled = true;
      $overview_disabled = false;
      $developer_id = '';
      $developer_name = '';
      $developer_email = '';
      $developer_description = '';
      $developer_image = ''; 
      $social_index = 0;  
      $controls_mode = 1;
    }

    // Edit existing developer
    function doEdit( evt ) {
      $overview_disabled = false;
      $social_index = 0;
      $controls_mode = 3;
    }

    // Cancel editing a developer
    function doCancelExisting( evt ) {
      $overview_disabled = true;
      $social_index = 1;
      $controls_mode = 2;  

      $developer_name = $developer_list[$developer_index].name === null ? '' : $developer_list[$developer_index].name;
      $developer_email = $developer_list[$developer_index].email === null ? '' : $developer_list[$developer_index].email;
      $developer_description = $developer_list[$developer_index].description === null ? '' : $developer_list[$developer_index].description;
      $developer_image = $developer_list[$developer_index].image === null ? '' : $developer_list[$developer_index].image;
    }

    // Cancel adding a developer
    function doCancelNew( evt ) {
      $add_disabled = false;
      $tab_index = 0;
      $social_disabled = true;
      $overview_disabled = true;
      $social_index = 1;
      $controls_mode = 0;
      $developer_labels = [];
      $developer_skills = [];
    }

    // Delete existing developer
    function doDelete( evt ) {
      fetch( `/api/developer/${$developer_id}`, {
        method: 'DELETE'
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        for( let d = 0; d < $developer_list.length; d++ ) {
          if( $developer_list[d].id === data.id ) {
            $developer_list.splice( d, 1 );
            $developer_list = $developer_list.slice( 0 );
            break;
          }
        }

        $social_disabled = true;
        $notes_disabled = true;
        $overview_disabled = true;
        $developer_id = '';
        $developer_name = '';
        $developer_email = '';
        $developer_labels = [];
        $developer_description = '';
        $developer_image = ''; 
        $social_index = 0;    
        $controls_mode = 0;
      } )
    }

    // Show existing developer
    function doDeveloper( evt ) {
      let id = evt.detail.item.id;

      for( let d = 0; d < $developer_list.length; d++ ) {
        if( id === $developer_list[d].id ) {
          $developer_index = d;
          break;
        }
      }

      $add_disabled = false;

      $overview_disabled = true;
      $social_disabled = false;
      $social_index = 1;
      $notes_disabled = false;

      $developer_id = id;
      $developer_name = $developer_list[$developer_index].name === null ? '' : $developer_list[$developer_index].name;
      $developer_email = $developer_list[$developer_index].email === null ? '' : $developer_list[$developer_index].email;
      $developer_description = $developer_list[$developer_index].description === null ? '' : $developer_list[$developer_index].description;
      $developer_image = $developer_list[$developer_index].image === null ? '' : $developer_list[$developer_index].image;
      
      $controls_mode = 2;

      fetch( `/api/developer/${$developer_id}/label` )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        let labels = [];

        for( let a = 0; a < data.length; a++ ) {
          labels.push( data[a].name );
        }

        $developer_labels = labels.slice( 0 );
      } );

      fetch( `/api/developer/${$developer_id}/note` )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        $notes_list = data.slice( 0 );
      } );
    }

    // Save exissting developer
    function doSaveExisting( evt ) {
      $add_disabled = false;
      $social_disabled = false;
      $overview_disabled = true;
      $social_index = 1;
      $notes_disabled = false;
      $controls_mode = 2;  

      let developer = {
        name: $developer_name,
        email:  $developer_email.trim().length === 0 ? null : $developer_email,
        description: $developer_description.trim().length === 0 ? null : $developer_description,
        image: $developer_image.trim().length === 0 ? null : $developer_image
      };

      fetch( `/api/developer/${$developer_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify( developer )
      } )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        for( let d = 0; d < $developer_list.length; d++ ) {
          if( $developer_list[d].id === data.id ) {
            $developer_list[d] = data;
            break;
          }
        }

        $developer_list.sort( ( a, b ) => {
          if( a.name > b.name ) return 1;
          if( a.name < b.name ) return -1;

          return 0;
        } );
        $developer_list = $developer_list.slice( 0 );
      } );
    }

    // Save new developer
    function doSaveNew( evt ) {
      $add_disabled = false;
      $tab_index = 0;
      $social_disabled = false;
      $overview_disabled = true;
      $social_index = 1;
      $notes_disabled = false;
      $controls_mode = 2;  

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
      .then( async ( data ) => {
        $developer_list.push( data );
        $developer_list.sort( ( a, b ) => {
          if( a.name > b.name ) return 1;
          if( a.name < b.name ) return -1;

          return 0;
        } );
        $developer_list = $developer_list.slice( 0 );
        $developer_id = data.id;

        let later = [];

        for( let a = 0; a < $developer_labels.length; a++ ) {
          let found = false;
          let label_id = null;

          for( let b = 0; b < $label_list.length; b++ ) {
            if( $developer_labels[a] === $label_list[b].name ) {
              found = true;
              label_id = $label_list[b].id;
              break;
            }
          }

          if( !found ) {
            let label = await fetch( '/api/label', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify( {
                name: $developer_labels[a]
              } )
            } )
            .then( ( response ) => response.json() );

            later.push( label );
            label_id = label.id;
          }

          await fetch( `/api/developer/${$developer_id}/label`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( {
              label_id: label_id
            } )
          } );      
        }

        for( let a = 0; a < later.length; a++ ) {
          $label_list.push( later[a] );
          $label_list.sort();
          $label_list = $label_list.slice( 0 );
        }
      } );
    }
    */

    	function search_value_binding(value) {
    		$search_term = value;
    		search_term.set($search_term);
    	}

    	const click_handler = () => doTabClick( 0 );

    	const click_handler_1 = () => doTabClick( 1 );

    	const click_handler_2 = () => doTabClick( 2 );

    	const click_handler_3 = () => doTabClick( 3 );

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('$search_term' in $$props) search_term.set($search_term);
    		if ('$filtered_list' in $$props) filtered_list.set($filtered_list);
    		if ('$developer_list' in $$props) developer_list.set($developer_list);
    		if ('$add_disabled' in $$props) add_disabled.set($add_disabled);
    		if ('$summary_selected' in $$props) summary_selected.set($summary_selected);
    		if ('$profile_selected' in $$props) profile_selected.set($profile_selected);
    		if ('$social_selected' in $$props) social_selected.set($social_selected);
    		if ('$notes_selected' in $$props) notes_selected.set($notes_selected);
    		if ('$summary_tab' in $$props) summary_tab.set($summary_tab);
    		if ('$profile_tab' in $$props) profile_tab.set($profile_tab);
    		if ('$social_tab' in $$props) social_tab.set($social_tab);
    		if ('$notes_tab' in $$props) notes_tab.set($notes_tab);
    		if ('$summary_disabled' in $$props) summary_disabled.set($summary_disabled);
    		if ('$profile_disabled' in $$props) profile_disabled.set($profile_disabled);
    		if ('$endpoints_disabled' in $$props) endpoints_disabled.set($endpoints_disabled);
    		if ('$developer_id' in $$props) developer_id.set($developer_id);
    		if ('$developer_name' in $$props) developer_name.set($developer_name);
    		if ('$developer_email' in $$props) developer_email.set($developer_email);
    		if ('$developer_image' in $$props) developer_image.set($developer_image);
    		if ('$developer_organizations' in $$props) developer_organizations.set($developer_organizations);
    		if ('$developer_location' in $$props) developer_location.set($developer_location);
    		if ('$controls_hidden' in $$props) controls_hidden.set($controls_hidden);
    		if ('$controls_mode' in $$props) controls_mode.set($controls_mode);
    		if ('$summary_hidden' in $$props) summary_hidden.set($summary_hidden);
    		if ('$profile_hidden' in $$props) profile_hidden.set($profile_hidden);
    		if ('$endpoints_hidden' in $$props) endpoints_hidden.set($endpoints_hidden);
    		if ('$timeline_hidden' in $$props) timeline_hidden.set($timeline_hidden);
    		if ('$notes_hidden' in $$props) notes_hidden.set($notes_hidden);
    		if ('$organization_list' in $$props) organization_list.set($organization_list);
    	};

    	return {
    		filter,
    		doAddClick,
    		doCancelNew,
    		doSaveNew,
    		doTabClick,
    		$search_term,
    		$filtered_list,
    		$add_disabled,
    		$summary_selected,
    		$profile_selected,
    		$social_selected,
    		$notes_selected,
    		$summary_tab,
    		$profile_tab,
    		$social_tab,
    		$notes_tab,
    		$summary_disabled,
    		$profile_disabled,
    		$endpoints_disabled,
    		$controls_hidden,
    		$controls_mode,
    		$summary_hidden,
    		$profile_hidden,
    		$endpoints_hidden,
    		$timeline_hidden,
    		$notes_hidden,
    		$organization_list,
    		search_value_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	};
    }

    class Developers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$m, create_fragment$m, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Developers", options, id: create_fragment$m.name });
    	}
    }

    /* src/Header.svelte generated by Svelte v3.12.1 */

    const file$n = "src/Header.svelte";

    function create_fragment$n(ctx) {
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
    			add_location(span, file$n, 36, 13, 458);
    			attr_dev(p0, "class", "svelte-13teco");
    			add_location(p0, file$n, 36, 2, 447);
    			attr_dev(p1, "class", "svelte-13teco");
    			add_location(p1, file$n, 37, 2, 497);
    			attr_dev(div, "class", "svelte-13teco");
    			add_location(div, file$n, 35, 0, 439);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$n.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, ["version"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Header", options, id: create_fragment$n.name });
    	}

    	get version() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set version(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Repositories.svelte generated by Svelte v3.12.1 */

    const file$o = "src/Repositories.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.repo = list[i];
    	return child_ctx;
    }

    // (246:4) <Button icon="/img/add-white.svg">
    function create_default_slot$4(ctx) {
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_default_slot$4.name, type: "slot", source: "(246:4) <Button icon=\"/img/add-white.svg\">", ctx });
    	return block;
    }

    // (261:4) {#each repositories as repo}
    function create_each_block$4(ctx) {
    	var div, p0, t0_value = ctx.repo.name + "", t0, t1, p1, t2_value = format$1( ctx.repo.started_at ) + "", t2, t3, p2, t4_value = format$1( ctx.repo.pushed_at ) + "", t4, t5, p3, t6_value = ctx.repo.subscribers + "", t6, t7, p4, t8_value = ctx.repo.stargazers + "", t8, t9, p5, t10_value = ctx.repo.forks + "", t10, t11, p6, t12_value = ctx.repo.issues + "", t12, t13;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			p2 = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			p3 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			p4 = element("p");
    			t8 = text(t8_value);
    			t9 = space();
    			p5 = element("p");
    			t10 = text(t10_value);
    			t11 = space();
    			p6 = element("p");
    			t12 = text(t12_value);
    			t13 = space();
    			attr_dev(p0, "class", "svelte-6djnri");
    			add_location(p0, file$o, 263, 8, 5417);
    			attr_dev(p1, "class", "medium svelte-6djnri");
    			add_location(p1, file$o, 264, 8, 5444);
    			attr_dev(p2, "class", "medium svelte-6djnri");
    			add_location(p2, file$o, 265, 8, 5508);
    			attr_dev(p3, "class", "small svelte-6djnri");
    			toggle_class(p3, "average", ctx.repo.subscribers < ctx.average_watchers ? true : false);
    			toggle_class(p3, "median", ctx.repo.subscribers < ctx.median_watchers ? true : false);
    			add_location(p3, file$o, 266, 8, 5577);
    			attr_dev(p4, "class", "small svelte-6djnri");
    			toggle_class(p4, "average", ctx.repo.stargazers < ctx.average_stars ? true : false);
    			toggle_class(p4, "median", ctx.repo.stargazers < ctx.median_stars ? true : false);
    			add_location(p4, file$o, 270, 8, 5793);
    			attr_dev(p5, "class", "small svelte-6djnri");
    			toggle_class(p5, "average", ctx.repo.forks < ctx.average_forks ? true : false);
    			toggle_class(p5, "median", ctx.repo.forks < ctx.median_forks ? true : false);
    			add_location(p5, file$o, 274, 8, 6000);
    			attr_dev(p6, "class", "small svelte-6djnri");
    			add_location(p6, file$o, 278, 8, 6192);
    			attr_dev(div, "class", "row svelte-6djnri");
    			add_location(div, file$o, 262, 6, 5391);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(div, t3);
    			append_dev(div, p2);
    			append_dev(p2, t4);
    			append_dev(div, t5);
    			append_dev(div, p3);
    			append_dev(p3, t6);
    			append_dev(div, t7);
    			append_dev(div, p4);
    			append_dev(p4, t8);
    			append_dev(div, t9);
    			append_dev(div, p5);
    			append_dev(p5, t10);
    			append_dev(div, t11);
    			append_dev(div, p6);
    			append_dev(p6, t12);
    			append_dev(div, t13);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.repositories) && t0_value !== (t0_value = ctx.repo.name + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((changed.repositories) && t2_value !== (t2_value = format$1( ctx.repo.started_at ) + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((changed.repositories) && t4_value !== (t4_value = format$1( ctx.repo.pushed_at ) + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((changed.repositories) && t6_value !== (t6_value = ctx.repo.subscribers + "")) {
    				set_data_dev(t6, t6_value);
    			}

    			if ((changed.repositories || changed.average_watchers)) {
    				toggle_class(p3, "average", ctx.repo.subscribers < ctx.average_watchers ? true : false);
    			}

    			if ((changed.repositories || changed.median_watchers)) {
    				toggle_class(p3, "median", ctx.repo.subscribers < ctx.median_watchers ? true : false);
    			}

    			if ((changed.repositories) && t8_value !== (t8_value = ctx.repo.stargazers + "")) {
    				set_data_dev(t8, t8_value);
    			}

    			if ((changed.repositories || changed.average_stars)) {
    				toggle_class(p4, "average", ctx.repo.stargazers < ctx.average_stars ? true : false);
    			}

    			if ((changed.repositories || changed.median_stars)) {
    				toggle_class(p4, "median", ctx.repo.stargazers < ctx.median_stars ? true : false);
    			}

    			if ((changed.repositories) && t10_value !== (t10_value = ctx.repo.forks + "")) {
    				set_data_dev(t10, t10_value);
    			}

    			if ((changed.repositories || changed.average_forks)) {
    				toggle_class(p5, "average", ctx.repo.forks < ctx.average_forks ? true : false);
    			}

    			if ((changed.repositories || changed.median_forks)) {
    				toggle_class(p5, "median", ctx.repo.forks < ctx.median_forks ? true : false);
    			}

    			if ((changed.repositories) && t12_value !== (t12_value = ctx.repo.issues + "")) {
    				set_data_dev(t12, t12_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block$4.name, type: "each", source: "(261:4) {#each repositories as repo}", ctx });
    	return block;
    }

    function create_fragment$o(ctx) {
    	var div4, div0, updating_value, t0, t1, header, p0, t3, p1, t5, p2, t7, p3, t9, p4, t11, p5, t13, p6, t15, div1, t16, footer, div2, p7, t17, t18_value = ctx.repositories.length + "", t18, t19, t20, p8, t22, p9, t23, t24, p10, t25, t26, p11, t27, t28, p12, t29, t30, div3, p13, t31, t32, p14, t34, p15, t35, t36, p16, t37, t38, p17, t39, t40, p18, t41, current;

    	function search_1_value_binding(value) {
    		ctx.search_1_value_binding.call(null, value);
    		updating_value = true;
    		add_flush_callback(() => updating_value = false);
    	}

    	let search_1_props = {};
    	if (ctx.search !== void 0) {
    		search_1_props.value = ctx.search;
    	}
    	var search_1 = new Search({ props: search_1_props, $$inline: true });

    	binding_callbacks.push(() => bind(search_1, 'value', search_1_value_binding));

    	var button = new Button({
    		props: {
    		icon: "/img/add-white.svg",
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	let each_value = ctx.repositories;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			search_1.$$.fragment.c();
    			t0 = space();
    			button.$$.fragment.c();
    			t1 = space();
    			header = element("header");
    			p0 = element("p");
    			p0.textContent = "Name";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Created";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Pushed";
    			t7 = space();
    			p3 = element("p");
    			p3.textContent = "Watchers";
    			t9 = space();
    			p4 = element("p");
    			p4.textContent = "Stars";
    			t11 = space();
    			p5 = element("p");
    			p5.textContent = "Forks";
    			t13 = space();
    			p6 = element("p");
    			p6.textContent = "Issues";
    			t15 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t16 = space();
    			footer = element("footer");
    			div2 = element("div");
    			p7 = element("p");
    			t17 = text("Showing ");
    			t18 = text(t18_value);
    			t19 = text(" repositories");
    			t20 = space();
    			p8 = element("p");
    			p8.textContent = "Median";
    			t22 = space();
    			p9 = element("p");
    			t23 = text(ctx.median_watchers);
    			t24 = space();
    			p10 = element("p");
    			t25 = text(ctx.median_stars);
    			t26 = space();
    			p11 = element("p");
    			t27 = text(ctx.median_forks);
    			t28 = space();
    			p12 = element("p");
    			t29 = text(ctx.median_issues);
    			t30 = space();
    			div3 = element("div");
    			p13 = element("p");
    			t31 = text(ctx.updated_at);
    			t32 = space();
    			p14 = element("p");
    			p14.textContent = "Average";
    			t34 = space();
    			p15 = element("p");
    			t35 = text(ctx.average_watchers);
    			t36 = space();
    			p16 = element("p");
    			t37 = text(ctx.average_stars);
    			t38 = space();
    			p17 = element("p");
    			t39 = text(ctx.average_forks);
    			t40 = space();
    			p18 = element("p");
    			t41 = text(ctx.average_issues);
    			attr_dev(div0, "class", "search svelte-6djnri");
    			add_location(div0, file$o, 243, 2, 4972);
    			attr_dev(p0, "class", "svelte-6djnri");
    			add_location(p0, file$o, 249, 4, 5105);
    			attr_dev(p1, "class", "medium svelte-6djnri");
    			add_location(p1, file$o, 250, 4, 5121);
    			attr_dev(p2, "class", "medium svelte-6djnri");
    			add_location(p2, file$o, 251, 4, 5155);
    			attr_dev(p3, "class", "small svelte-6djnri");
    			add_location(p3, file$o, 252, 4, 5188);
    			attr_dev(p4, "class", "small svelte-6djnri");
    			add_location(p4, file$o, 253, 4, 5222);
    			attr_dev(p5, "class", "small svelte-6djnri");
    			add_location(p5, file$o, 254, 4, 5253);
    			attr_dev(p6, "class", "small svelte-6djnri");
    			add_location(p6, file$o, 255, 4, 5284);
    			attr_dev(header, "class", "svelte-6djnri");
    			add_location(header, file$o, 248, 2, 5092);
    			attr_dev(div1, "class", "list svelte-6djnri");
    			add_location(div1, file$o, 258, 2, 5327);
    			attr_dev(p7, "class", "svelte-6djnri");
    			add_location(p7, file$o, 287, 6, 6306);
    			attr_dev(p8, "class", "medium svelte-6djnri");
    			add_location(p8, file$o, 288, 6, 6362);
    			attr_dev(p9, "class", "small svelte-6djnri");
    			add_location(p9, file$o, 289, 6, 6397);
    			attr_dev(p10, "class", "small svelte-6djnri");
    			add_location(p10, file$o, 290, 6, 6442);
    			attr_dev(p11, "class", "small svelte-6djnri");
    			add_location(p11, file$o, 291, 6, 6484);
    			attr_dev(p12, "class", "small svelte-6djnri");
    			add_location(p12, file$o, 292, 6, 6526);
    			attr_dev(div2, "class", "median svelte-6djnri");
    			add_location(div2, file$o, 286, 4, 6279);
    			attr_dev(p13, "class", "svelte-6djnri");
    			add_location(p13, file$o, 295, 6, 6606);
    			attr_dev(p14, "class", "medium svelte-6djnri");
    			add_location(p14, file$o, 296, 6, 6632);
    			attr_dev(p15, "class", "small svelte-6djnri");
    			add_location(p15, file$o, 297, 6, 6668);
    			attr_dev(p16, "class", "small svelte-6djnri");
    			add_location(p16, file$o, 298, 6, 6714);
    			attr_dev(p17, "class", "small svelte-6djnri");
    			add_location(p17, file$o, 299, 6, 6757);
    			attr_dev(p18, "class", "small svelte-6djnri");
    			add_location(p18, file$o, 300, 6, 6800);
    			attr_dev(div3, "class", "average svelte-6djnri");
    			add_location(div3, file$o, 294, 4, 6578);
    			attr_dev(footer, "class", "svelte-6djnri");
    			add_location(footer, file$o, 285, 2, 6266);
    			attr_dev(div4, "class", "panel svelte-6djnri");
    			add_location(div4, file$o, 241, 0, 4949);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			mount_component(search_1, div0, null);
    			append_dev(div0, t0);
    			mount_component(button, div0, null);
    			append_dev(div4, t1);
    			append_dev(div4, header);
    			append_dev(header, p0);
    			append_dev(header, t3);
    			append_dev(header, p1);
    			append_dev(header, t5);
    			append_dev(header, p2);
    			append_dev(header, t7);
    			append_dev(header, p3);
    			append_dev(header, t9);
    			append_dev(header, p4);
    			append_dev(header, t11);
    			append_dev(header, p5);
    			append_dev(header, t13);
    			append_dev(header, p6);
    			append_dev(div4, t15);
    			append_dev(div4, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div4, t16);
    			append_dev(div4, footer);
    			append_dev(footer, div2);
    			append_dev(div2, p7);
    			append_dev(p7, t17);
    			append_dev(p7, t18);
    			append_dev(p7, t19);
    			append_dev(div2, t20);
    			append_dev(div2, p8);
    			append_dev(div2, t22);
    			append_dev(div2, p9);
    			append_dev(p9, t23);
    			append_dev(div2, t24);
    			append_dev(div2, p10);
    			append_dev(p10, t25);
    			append_dev(div2, t26);
    			append_dev(div2, p11);
    			append_dev(p11, t27);
    			append_dev(div2, t28);
    			append_dev(div2, p12);
    			append_dev(p12, t29);
    			append_dev(footer, t30);
    			append_dev(footer, div3);
    			append_dev(div3, p13);
    			append_dev(p13, t31);
    			append_dev(div3, t32);
    			append_dev(div3, p14);
    			append_dev(div3, t34);
    			append_dev(div3, p15);
    			append_dev(p15, t35);
    			append_dev(div3, t36);
    			append_dev(div3, p16);
    			append_dev(p16, t37);
    			append_dev(div3, t38);
    			append_dev(div3, p17);
    			append_dev(p17, t39);
    			append_dev(div3, t40);
    			append_dev(div3, p18);
    			append_dev(p18, t41);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var search_1_changes = {};
    			if (!updating_value && changed.search) {
    				search_1_changes.value = ctx.search;
    			}
    			search_1.$set(search_1_changes);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			if (changed.repositories || changed.average_forks || changed.median_forks || changed.average_stars || changed.median_stars || changed.average_watchers || changed.median_watchers || changed.format) {
    				each_value = ctx.repositories;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if ((!current || changed.repositories) && t18_value !== (t18_value = ctx.repositories.length + "")) {
    				set_data_dev(t18, t18_value);
    			}

    			if (!current || changed.median_watchers) {
    				set_data_dev(t23, ctx.median_watchers);
    			}

    			if (!current || changed.median_stars) {
    				set_data_dev(t25, ctx.median_stars);
    			}

    			if (!current || changed.median_forks) {
    				set_data_dev(t27, ctx.median_forks);
    			}

    			if (!current || changed.median_issues) {
    				set_data_dev(t29, ctx.median_issues);
    			}

    			if (!current || changed.updated_at) {
    				set_data_dev(t31, ctx.updated_at);
    			}

    			if (!current || changed.average_watchers) {
    				set_data_dev(t35, ctx.average_watchers);
    			}

    			if (!current || changed.average_stars) {
    				set_data_dev(t37, ctx.average_stars);
    			}

    			if (!current || changed.average_forks) {
    				set_data_dev(t39, ctx.average_forks);
    			}

    			if (!current || changed.average_issues) {
    				set_data_dev(t41, ctx.average_issues);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(search_1.$$.fragment, local);

    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(search_1.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div4);
    			}

    			destroy_component(search_1);

    			destroy_component(button);

    			destroy_each(each_blocks, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$o.name, type: "component", source: "", ctx });
    	return block;
    }

    function format$1( stamp ) {
    stamp = new Date( stamp );

    let month = stamp.getMonth().toString().padStart( 2, '0' );
    let date = stamp.getDate().toString().padStart( 2, '0' );

    return `${month}/${date}/${stamp.getFullYear()}`;
    }

    function formatLong( updated ) {
    let hours = [
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
      12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
    ];
    let months = [
      'January',   'February', 'March',    'April', 
      'May',       'June',     'July',     'August', 
      'September', 'October',  'November', 'December'
    ];

    updated = new Date( updated );

    return `As of ${months[updated.getMonth()]} ${updated.getDate()}, ${updated.getFullYear()} at ${hours[updated.getHours()]}:${updated.getMinutes().toString().padStart( 2, '0' )} ${updated.getHours() > 11 ? 'PM' : 'AM'}`;
    }

    function median( values ) {
    let result = values[Math.floor( values.length / 2 )];

    if( ( values.length % 2 ) === 0 ) {
      const low = values.length / 2;
      const high = low + 1;
      result = ( values[low] + values[high] ) / 2;
    }

    return result;
    }

    function numeric( a, b ) {
    if( a > b ) return 1;
    if( a < b ) return -1;
    return 0;
    }

    function instance$o($$self, $$props, $$invalidate) {
    	

    let average_watchers = 0;
    let average_stars = 0;
    let average_forks = 0;
    let average_issues = 0;
    let median_watchers = 0;
    let median_stars = 0;
    let median_forks = 0;
    let median_issues = 0;
    let repositories = [];
    let search = '';
    let updated_at = undefined;

    onMount( async () => {
      fetch( '/api/repository' )
      .then( ( response ) => response.json() )
      .then( ( data ) => {
        data.sort( ( a, b ) => {
          if( a.name < b.name ) return -1;
          if( a.name > b.name ) return 1;
          return 0;
        } );

        let sum = {
          watchers: 0,
          stars: 0,
          forks: 0,
          issues: 0
        };
        let statistics = {
          watchers: [],
          stars: [],
          forks: [],
          issues: []
        };    

        for( let d = 0; d < data.length; d++ ) {
          sum.watchers = sum.watchers + data[d].subscribers;
          sum.stars = sum.stars + data[d].stargazers;
          sum.forks = sum.forks + data[d].forks;
          sum.issues = sum.issues + data[d].issues;

          statistics.watchers.push( data[d].subscribers );
          statistics.stars.push( data[d].stargazers );
          statistics.forks.push( data[d].forks );
          statistics.issues.push( data[d].issues );        
        }

        $$invalidate('average_watchers', average_watchers = Math.round( sum.watchers / data.length ));
        $$invalidate('average_stars', average_stars = Math.round( sum.stars / data.length ));
        $$invalidate('average_forks', average_forks = Math.round( sum.forks / data.length ));
        $$invalidate('average_issues', average_issues = Math.round( sum.issues / data.length ));

        statistics.watchers = statistics.watchers.sort( numeric );
        $$invalidate('median_watchers', median_watchers = median( statistics.watchers ));
        statistics.stars = statistics.stars.sort( numeric );  
        $$invalidate('median_stars', median_stars = median( statistics.stars ));  
        statistics.forks = statistics.forks.sort( numeric );
        $$invalidate('median_forks', median_forks = median( statistics.forks ));    
        statistics.issues = statistics.issues.sort( numeric );
        $$invalidate('median_issues', median_issues = median( statistics.issues ));      

        $$invalidate('repositories', repositories = data.slice( 0 ));

        $$invalidate('updated_at', updated_at = formatLong( repositories[0].updated_at ));
      } );
    } );

    	function search_1_value_binding(value) {
    		search = value;
    		$$invalidate('search', search);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('average_watchers' in $$props) $$invalidate('average_watchers', average_watchers = $$props.average_watchers);
    		if ('average_stars' in $$props) $$invalidate('average_stars', average_stars = $$props.average_stars);
    		if ('average_forks' in $$props) $$invalidate('average_forks', average_forks = $$props.average_forks);
    		if ('average_issues' in $$props) $$invalidate('average_issues', average_issues = $$props.average_issues);
    		if ('median_watchers' in $$props) $$invalidate('median_watchers', median_watchers = $$props.median_watchers);
    		if ('median_stars' in $$props) $$invalidate('median_stars', median_stars = $$props.median_stars);
    		if ('median_forks' in $$props) $$invalidate('median_forks', median_forks = $$props.median_forks);
    		if ('median_issues' in $$props) $$invalidate('median_issues', median_issues = $$props.median_issues);
    		if ('repositories' in $$props) $$invalidate('repositories', repositories = $$props.repositories);
    		if ('search' in $$props) $$invalidate('search', search = $$props.search);
    		if ('updated_at' in $$props) $$invalidate('updated_at', updated_at = $$props.updated_at);
    	};

    	return {
    		average_watchers,
    		average_stars,
    		average_forks,
    		average_issues,
    		median_watchers,
    		median_stars,
    		median_forks,
    		median_issues,
    		repositories,
    		search,
    		updated_at,
    		search_1_value_binding
    	};
    }

    class Repositories extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Repositories", options, id: create_fragment$o.name });
    	}
    }

    /* src/Switcher.svelte generated by Svelte v3.12.1 */

    const file$p = "src/Switcher.svelte";

    function create_fragment$p(ctx) {
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
    			toggle_class(button0, "selected", ctx.index === 0);
    			add_location(button0, file$p, 43, 2, 672);
    			attr_dev(button1, "class", "svelte-z8cxbi");
    			toggle_class(button1, "selected", ctx.index === 1);
    			add_location(button1, file$p, 46, 2, 771);
    			attr_dev(div, "class", "svelte-z8cxbi");
    			add_location(div, file$p, 42, 0, 664);

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
    			if (changed.index) {
    				toggle_class(button0, "selected", ctx.index === 0);
    				toggle_class(button1, "selected", ctx.index === 1);
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
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$p.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$p($$self, $$props, $$invalidate) {
    	let { index = 0 } = $$props;

    	const writable_props = ['index'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate('index', index = 0);

    	const click_handler_1 = () => $$invalidate('index', index = 1);

    	$$self.$set = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	$$self.$capture_state = () => {
    		return { index };
    	};

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate('index', index = $$props.index);
    	};

    	return { index, click_handler, click_handler_1 };
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, ["index"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment$p.name });
    	}

    	get index() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    function create_fragment$q(ctx) {
    	var t0, updating_index, t1, t2, current;

    	var header = new Header({ $$inline: true });

    	function switcher_index_binding(value) {
    		ctx.switcher_index_binding.call(null, value);
    		updating_index = true;
    		add_flush_callback(() => updating_index = false);
    	}

    	let switcher_props = {};
    	if (ctx.panel !== void 0) {
    		switcher_props.index = ctx.panel;
    	}
    	var switcher = new Switcher({ props: switcher_props, $$inline: true });

    	binding_callbacks.push(() => bind(switcher, 'index', switcher_index_binding));

    	var developers = new Developers({
    		props: { style: "display: " + (ctx.panel === 0 ? 'flex' : 'none') + ";" },
    		$$inline: true
    	});

    	var repositories = new Repositories({
    		props: { style: "display: " + (ctx.panel === 1 ? 'flex' : 'none') + ";" },
    		$$inline: true
    	});

    	const block = {
    		c: function create() {
    			header.$$.fragment.c();
    			t0 = space();
    			switcher.$$.fragment.c();
    			t1 = space();
    			developers.$$.fragment.c();
    			t2 = space();
    			repositories.$$.fragment.c();
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
    			insert_dev(target, t2, anchor);
    			mount_component(repositories, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switcher_changes = {};
    			if (!updating_index && changed.panel) {
    				switcher_changes.index = ctx.panel;
    			}
    			switcher.$set(switcher_changes);

    			var developers_changes = {};
    			if (changed.panel) developers_changes.style = "display: " + (ctx.panel === 0 ? 'flex' : 'none') + ";";
    			developers.$set(developers_changes);

    			var repositories_changes = {};
    			if (changed.panel) repositories_changes.style = "display: " + (ctx.panel === 1 ? 'flex' : 'none') + ";";
    			repositories.$set(repositories_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			transition_in(switcher.$$.fragment, local);

    			transition_in(developers.$$.fragment, local);

    			transition_in(repositories.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(switcher.$$.fragment, local);
    			transition_out(developers.$$.fragment, local);
    			transition_out(repositories.$$.fragment, local);
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

    			if (detaching) {
    				detach_dev(t2);
    			}

    			destroy_component(repositories, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$q.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	

    let panel = 0;

    	function switcher_index_binding(value) {
    		panel = value;
    		$$invalidate('panel', panel);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('panel' in $$props) $$invalidate('panel', panel = $$props.panel);
    	};

    	return { panel, switcher_index_binding };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$q.name });
    	}
    }

    const app = new App( {
    	target: document.body
    } );

    return app;

}());
//# sourceMappingURL=bundle.js.map
