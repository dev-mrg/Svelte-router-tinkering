
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function (jQuery) {
    'use strict';

    jQuery = jQuery && Object.prototype.hasOwnProperty.call(jQuery, 'default') ? jQuery['default'] : jQuery;

    function noop() { }
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
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
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
    function createEventDispatcher() {
        const component = get_current_component();
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.1' }, detail)));
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
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
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.20.1 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (209:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[10]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(209:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (207:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[9]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(207:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
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
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return nextTickPromise(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	// Destination must start with '/'
    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to every href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	return new Promise(resolve => {
    			setTimeout(
    				() => {
    					resolve(cb());
    				},
    				0
    			);
    		});
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		$loc,
    		RouteItem,
    		routesList,
    		dispatch,
    		dispatchNextTick,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Home.svelte generated by Svelte v3.20.1 */
    const file = "src\\Home.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let button3;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Home";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Try This Nav";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Try This Nav";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "Go Back";
    			t7 = space();
    			button3 = element("button");
    			button3.textContent = "Landing";
    			add_location(h1, file, 21, 0, 336);
    			attr_dev(button0, "class", "btn");
    			add_location(button0, file, 23, 0, 378);
    			attr_dev(button1, "class", "btn");
    			add_location(button1, file, 24, 0, 442);
    			attr_dev(button2, "class", "btn");
    			add_location(button2, file, 25, 0, 506);
    			attr_dev(button3, "class", "btn");
    			add_location(button3, file, 26, 0, 561);
    			attr_dev(div0, "class", "btn-container");
    			add_location(div0, file, 22, 0, 350);
    			attr_dev(div1, "class", "app");
    			add_location(div1, file, 20, 0, 318);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(div0, t7);
    			append_dev(div0, button3);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", navThisWay, false, false, false),
    				listen_dev(button1, "click", navThatWay, false, false, false),
    				listen_dev(button2, "click", goBack, false, false, false),
    				listen_dev(button3, "click", /*landing*/ ctx[0], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function navThisWay() {
    	push("/blog");
    }

    function navThatWay() {
    	push("/learn");
    }

    function goBack() {
    	pop();
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const j$ = jQuery;

    	function landing() {
    		push("/");
    		j$("#h1").show();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Home", $$slots, []);

    	$$self.$capture_state = () => ({
    		Router,
    		push,
    		pop,
    		jQuery,
    		j$,
    		navThisWay,
    		navThatWay,
    		goBack,
    		landing
    	});

    	return [landing];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const pages = {
        storie:"first dolor sit amet consectetur adipisicing elit. Sed velit, officiis rerum voluptas aspernatur eligendi, ipsam odit assumenda sit perspiciatis sapiente reiciendis, quis cum molestiae placeat. Quas exercitationem molestiae magnam! Lorem ipsum, dolor sit amet consectetur adipisicing elit. Perspiciatis, consequatur quos! Voluptate distinctio aspernatur iure minus explicabo sequi ipsa, iste adipisci in nihil blanditiis molestiae voluptates, amet enim, consequuntur molestias.",
        storie2:"Second funky sit amet consectetur adipisicing elit. Ea, voluptas. Accusamus unde in beatae aliquid, et dignissimos quia! Optio, et quia? Non deserunt explicabo voluptates esse sequi officiis aut laborum.  Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus consectetur cum quam nemo recusandae quidem consequuntur. Dolore eos cum nesciunt asperiores alias numquam accusantium ipsum quaerat eveniet, fugit, voluptates dolores? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore quasi nihil eligendi. Magni omnis illum quae, numquam beatae sint cupiditate rerum quia eius reiciendis et ipsa repudiandae sit similique. A.",
        storie3: "Third explicabo voluptates esse sequi officiis aut laborum.  Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus consectetur cum Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ea, voluptas. Accusamus unde in beatae aliquid, et dignissimos quia! Optio, et quia? Non deserunt quam nemo recusandae quidem consequuntur. Dolore eos cum nesciunt asperiores alias numquam accusantium ipsum quaerat eveniet, fugit, voluptates dolores? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore quasi nihil eligendi. Magni omnis illum quae, numquam beatae sint cupiditate rerum quia eius reiciendis et ipsa repudiandae sit similique. A.",
        storie4: " Fourth Tempore quasi nihil eligendi. Magni omnis illum quae, numquam beatae sint cupiditate rerum quia eius reiciendis et ipsa repudiandae sit similique. A.Third explicabo voluptates esse sequi officiis aut laborum.  Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus consectetur cum Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ea, voluptas. Accusamus unde in beatae aliquid, et dignissimos quia! Optio, et quia? Non deserunt quam nemo recusandae quidem consequuntur. Dolore eos cum nesciunt asperiores alias numquam accusantium ipsum quaerat eveniet, fugit, voluptates dolores? Lorem ipsum dolor sit amet consectetur, adipisicing elit. hird explicabo voluptates esse sequi officiis aut laborum.  Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus consectetur cum Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ea, voluptas. Accusamus unde in beatae aliquid, et dignissimos quia! Optio, et quia? Non deserunt quam nemo recusandae quidem consequuntur. Dolore eos cum nesciunt asperiores alias numquam accusantium ipsum quaerat eveniet, fugit, voluptates dolores? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore quasi nihil eligendi. Magni omnis illum quae, numquam beatae sint cupiditate rerum quia eius reiciendis et ipsa repudiandae sit similique. A. hird explicabo voluptates esse sequi officiis aut laborum.  Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus consectetur cum Lorem ipsum dolor, sit amet consectetur adipisicing elit. Ea, voluptas. Accusamus unde in beatae aliquid, et dignissimos quia! Optio, et quia? Non deserunt quam nemo recusandae quidem consequuntur. Dolore eos cum nesciunt asperiores alias numquam accusantium ipsum quaerat eveniet, fugit, voluptates dolores? Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore quasi nihil eligendi. Magni omnis illum quae, numquam beatae sint cupiditate rerum quia eius reiciendis et ipsa repudiandae sit similique. A."


    };

    /* src\Learn.svelte generated by Svelte v3.20.1 */
    const file$1 = "src\\Learn.svelte";

    function create_fragment$2(ctx) {
    	let div2;
    	let h10;
    	let t1;
    	let div0;
    	let h11;
    	let t3;
    	let p_1;
    	let t4;

    	let t5_value = (/*params*/ ctx[0].headline === "p"
    	? /*params*/ ctx[0].headline = /*p*/ ctx[1]
    	: /*params*/ ctx[0].headline === "p2"
    		? /*params*/ ctx[0].headline = /*p2*/ ctx[2]
    		: /*params*/ ctx[0].headline === "p3"
    			? /*params*/ ctx[0].headline = /*p3*/ ctx[3]
    			: /*params*/ ctx[0].headline = /*p4*/ ctx[4]) + "";

    	let t5;
    	let t6;
    	let div1;
    	let a0;
    	let t8;
    	let a1;
    	let t10;
    	let a2;
    	let t12;
    	let a3;
    	let t14;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Find Out More";
    			t1 = space();
    			div0 = element("div");
    			h11 = element("h1");
    			h11.textContent = "These are really neat!";
    			t3 = space();
    			p_1 = element("p");
    			t4 = text("-- ");
    			t5 = text(t5_value);
    			t6 = space();
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "Learn 1";
    			t8 = space();
    			a1 = element("a");
    			a1.textContent = "Learn 2";
    			t10 = space();
    			a2 = element("a");
    			a2.textContent = "Learn 3";
    			t12 = space();
    			a3 = element("a");
    			a3.textContent = "Learn 4";
    			t14 = space();
    			button = element("button");
    			button.textContent = "Go Back";
    			add_location(h10, file$1, 64, 0, 1027);
    			add_location(h11, file$1, 66, 0, 1068);
    			attr_dev(p_1, "class", "svelte-118v9hs");
    			add_location(p_1, file$1, 67, 0, 1100);
    			attr_dev(div0, "id", "switch");
    			attr_dev(div0, "class", "svelte-118v9hs");
    			add_location(div0, file$1, 65, 0, 1050);
    			attr_dev(a0, "class", "btns svelte-118v9hs");
    			attr_dev(a0, "href", "#/learn/p");
    			add_location(a0, file$1, 76, 0, 1327);
    			attr_dev(a1, "class", "btns svelte-118v9hs");
    			attr_dev(a1, "href", "#/learn/p2");
    			add_location(a1, file$1, 77, 1, 1373);
    			attr_dev(a2, "class", "btns svelte-118v9hs");
    			attr_dev(a2, "href", "#/learn/p3");
    			add_location(a2, file$1, 78, 1, 1420);
    			attr_dev(a3, "class", "btns svelte-118v9hs");
    			attr_dev(a3, "href", "#/learn/p4");
    			add_location(a3, file$1, 79, 2, 1468);
    			add_location(button, file$1, 80, 0, 1514);
    			attr_dev(div1, "class", "btn-container");
    			add_location(div1, file$1, 75, 0, 1299);
    			attr_dev(div2, "class", "learn svelte-118v9hs");
    			add_location(div2, file$1, 62, 0, 1006);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h10);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, p_1);
    			append_dev(p_1, t4);
    			append_dev(p_1, t5);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, a0);
    			append_dev(div1, t8);
    			append_dev(div1, a1);
    			append_dev(div1, t10);
    			append_dev(div1, a2);
    			append_dev(div1, t12);
    			append_dev(div1, a3);
    			append_dev(div1, t14);
    			append_dev(div1, button);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", goBack$1, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*params*/ 1 && t5_value !== (t5_value = (/*params*/ ctx[0].headline === "p"
    			? /*params*/ ctx[0].headline = /*p*/ ctx[1]
    			: /*params*/ ctx[0].headline === "p2"
    				? /*params*/ ctx[0].headline = /*p2*/ ctx[2]
    				: /*params*/ ctx[0].headline === "p3"
    					? /*params*/ ctx[0].headline = /*p3*/ ctx[3]
    					: /*params*/ ctx[0].headline = /*p4*/ ctx[4]) + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function goBack$1() {
    	pop();
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const p = pages.storie;
    	const p2 = pages.storie2;
    	const p3 = pages.storie3;
    	const p4 = pages.storie4;
    	let { params } = $$props;
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Learn> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Learn", $$slots, []);

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		Router,
    		pop,
    		location,
    		pages,
    		goBack: goBack$1,
    		p,
    		p2,
    		p3,
    		p4,
    		params
    	});

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(0, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [params, p, p2, p3, p4];
    }

    class Learn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { params: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Learn",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*params*/ ctx[0] === undefined && !("params" in props)) {
    			console.warn("<Learn> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Learn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Learn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Blog.svelte generated by Svelte v3.20.1 */
    const file$2 = "src\\Blog.svelte";

    function create_fragment$3(ctx) {
    	let div3;
    	let h10;
    	let t1;
    	let div0;
    	let ul0;
    	let li0;
    	let p0;
    	let t3;
    	let li1;
    	let p1;
    	let t5;
    	let li2;
    	let p2;
    	let t7;
    	let h11;
    	let t9;
    	let div1;
    	let ul1;
    	let li3;
    	let p3;
    	let t11;
    	let li4;
    	let p4;
    	let t13;
    	let li5;
    	let p5;
    	let t15;
    	let h12;
    	let t17;
    	let div2;
    	let ul2;
    	let li6;
    	let p6;
    	let t19;
    	let li7;
    	let p7;
    	let t21;
    	let li8;
    	let p8;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Check It Fool!";
    			t1 = space();
    			div0 = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio, ullam possimus! Quaerat deleniti amet sapiente? Eaque vero aliquam aperiam eveniet magni repellendus illo iure porro. Exercitationem incidunt quos sit expedita? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Officia non illo qui nihil obcaecati inventore quo reiciendis culpa! Fugiat repellat aut corporis minima quos. Ea blanditiis voluptas inventore facere voluptate?";
    			t3 = space();
    			li1 = element("li");
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam repellat quasi nam optio hic? Commodi magni cumque perferendis eveniet, consectetur, odit dolorem maiores reprehenderit nihil tempore ratione laborum minima quia. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere nisi earum, id tempora libero eos ipsum, ratione illum voluptatum dolores aliquam officiis beatae nostrum fuga nesciunt laborum quasi, porro reprehenderit. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempora ex, eum ipsum nulla vero cumque accusamus assumenda veritatis corporis expedita voluptate libero natus error incidunt architecto id itaque reiciendis! Quae.";
    			t5 = space();
    			li2 = element("li");
    			p2 = element("p");
    			p2.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nemo enim obcaecati incidunt ipsum a id deserunt ut voluptates saepe omnis molestias, unde blanditiis exercitationem eveniet, maiores vero tempora. Fugiat, dicta!Lorem Lorem, ipsum dolor sit amet consectetur adipisicing elit. Beatae, nemo veniam? Ipsum itaque, maiores quas repudiandae pariatur repellat quidem. Delectus rem officia consequatur deleniti optio facilis quos! Possimus, unde similique! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque sed perferendis ut voluptas, suscipit totam quod fugit assumenda, consequuntur aspernatur modi. Laboriosam sequi sint ut animi deleniti neque, alias itaque. Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo ut quo doloribus, exercitationem obcaecati assumenda dolores inventore alias earum, provident molestias? Voluptate, tempora unde deleniti quas molestias ipsum distinctio officiis.";
    			t7 = space();
    			h11 = element("h1");
    			h11.textContent = "Get Whats Hot Or Not!";
    			t9 = space();
    			div1 = element("div");
    			ul1 = element("ul");
    			li3 = element("li");
    			p3 = element("p");
    			p3.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio, ullam possimus! Quaerat deleniti amet sapiente? Eaque vero aliquam aperiam eveniet magni repellendus illo iure porro. Exercitationem incidunt quos sit expedita? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Officia non illo qui nihil obcaecati inventore quo reiciendis culpa! Fugiat repellat aut corporis minima quos. Ea blanditiis voluptas inventore facere voluptate?";
    			t11 = space();
    			li4 = element("li");
    			p4 = element("p");
    			p4.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam repellat quasi nam optio hic? Commodi magni cumque perferendis eveniet, consectetur, odit dolorem maiores reprehenderit nihil tempore ratione laborum minima quia. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere nisi earum, id tempora libero eos ipsum, ratione illum voluptatum dolores aliquam officiis beatae nostrum fuga nesciunt laborum quasi, porro reprehenderit. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempora ex, eum ipsum nulla vero cumque accusamus assumenda veritatis corporis expedita voluptate libero natus error incidunt architecto id itaque reiciendis! Quae.";
    			t13 = space();
    			li5 = element("li");
    			p5 = element("p");
    			p5.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nemo enim obcaecati incidunt ipsum a id deserunt ut voluptates saepe omnis molestias, unde blanditiis exercitationem eveniet, maiores vero tempora. Fugiat, dicta!Lorem Lorem, ipsum dolor sit amet consectetur adipisicing elit. Beatae, nemo veniam? Ipsum itaque, maiores quas repudiandae pariatur repellat quidem. Delectus rem officia consequatur deleniti optio facilis quos! Possimus, unde similique! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque sed perferendis ut voluptas, suscipit totam quod fugit assumenda, consequuntur aspernatur modi. Laboriosam sequi sint ut animi deleniti neque, alias itaque. Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo ut quo doloribus, exercitationem obcaecati assumenda dolores inventore alias earum, provident molestias? Voluptate, tempora unde deleniti quas molestias ipsum distinctio officiis.";
    			t15 = space();
    			h12 = element("h1");
    			h12.textContent = "Can You Feel Me!";
    			t17 = space();
    			div2 = element("div");
    			ul2 = element("ul");
    			li6 = element("li");
    			p6 = element("p");
    			p6.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Optio, ullam possimus! Quaerat deleniti amet sapiente? Eaque vero aliquam aperiam eveniet magni repellendus illo iure porro. Exercitationem incidunt quos sit expedita? Lorem ipsum dolor, sit amet consectetur adipisicing elit. Officia non illo qui nihil obcaecati inventore quo reiciendis culpa! Fugiat repellat aut corporis minima quos. Ea blanditiis voluptas inventore facere voluptate?";
    			t19 = space();
    			li7 = element("li");
    			p7 = element("p");
    			p7.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Veniam repellat quasi nam optio hic? Commodi magni cumque perferendis eveniet, consectetur, odit dolorem maiores reprehenderit nihil tempore ratione laborum minima quia. Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere nisi earum, id tempora libero eos ipsum, ratione illum voluptatum dolores aliquam officiis beatae nostrum fuga nesciunt laborum quasi, porro reprehenderit. Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempora ex, eum ipsum nulla vero cumque accusamus assumenda veritatis corporis expedita voluptate libero natus error incidunt architecto id itaque reiciendis! Quae.";
    			t21 = space();
    			li8 = element("li");
    			p8 = element("p");
    			p8.textContent = "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nemo enim obcaecati incidunt ipsum a id deserunt ut voluptates saepe omnis molestias, unde blanditiis exercitationem eveniet, maiores vero tempora. Fugiat, dicta!Lorem Lorem, ipsum dolor sit amet consectetur adipisicing elit. Beatae, nemo veniam? Ipsum itaque, maiores quas repudiandae pariatur repellat quidem. Delectus rem officia consequatur deleniti optio facilis quos! Possimus, unde similique! Lorem ipsum dolor sit, amet consectetur adipisicing elit. Neque sed perferendis ut voluptas, suscipit totam quod fugit assumenda, consequuntur aspernatur modi. Laboriosam sequi sint ut animi deleniti neque, alias itaque. Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo ut quo doloribus, exercitationem obcaecati assumenda dolores inventore alias earum, provident molestias? Voluptate, tempora unde deleniti quas molestias ipsum distinctio officiis.";
    			add_location(h10, file$2, 18, 0, 269);
    			add_location(p0, file$2, 22, 4, 328);
    			add_location(li0, file$2, 21, 2, 319);
    			add_location(p1, file$2, 25, 3, 798);
    			add_location(li1, file$2, 24, 2, 790);
    			add_location(p2, file$2, 29, 6, 1498);
    			add_location(li2, file$2, 29, 2, 1494);
    			add_location(ul0, file$2, 20, 0, 312);
    			attr_dev(div0, "class", "blog svelte-hf9b45");
    			add_location(div0, file$2, 19, 0, 293);
    			add_location(h11, file$2, 33, 0, 2445);
    			add_location(p3, file$2, 37, 4, 2511);
    			add_location(li3, file$2, 36, 2, 2502);
    			add_location(p4, file$2, 40, 3, 2981);
    			add_location(li4, file$2, 39, 2, 2973);
    			add_location(p5, file$2, 44, 6, 3681);
    			add_location(li5, file$2, 44, 2, 3677);
    			add_location(ul1, file$2, 35, 0, 2495);
    			attr_dev(div1, "class", "blog svelte-hf9b45");
    			add_location(div1, file$2, 34, 0, 2476);
    			add_location(h12, file$2, 47, 0, 4627);
    			add_location(p6, file$2, 51, 4, 4688);
    			add_location(li6, file$2, 50, 2, 4679);
    			add_location(p7, file$2, 54, 3, 5158);
    			add_location(li7, file$2, 53, 2, 5150);
    			add_location(p8, file$2, 58, 6, 5858);
    			add_location(li8, file$2, 58, 2, 5854);
    			add_location(ul2, file$2, 49, 0, 4672);
    			attr_dev(div2, "class", "blog svelte-hf9b45");
    			add_location(div2, file$2, 48, 0, 4653);
    			attr_dev(div3, "class", "app");
    			add_location(div3, file$2, 16, 0, 248);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h10);
    			append_dev(div3, t1);
    			append_dev(div3, div0);
    			append_dev(div0, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, p0);
    			append_dev(ul0, t3);
    			append_dev(ul0, li1);
    			append_dev(li1, p1);
    			append_dev(ul0, t5);
    			append_dev(ul0, li2);
    			append_dev(li2, p2);
    			append_dev(div3, t7);
    			append_dev(div3, h11);
    			append_dev(div3, t9);
    			append_dev(div3, div1);
    			append_dev(div1, ul1);
    			append_dev(ul1, li3);
    			append_dev(li3, p3);
    			append_dev(ul1, t11);
    			append_dev(ul1, li4);
    			append_dev(li4, p4);
    			append_dev(ul1, t13);
    			append_dev(ul1, li5);
    			append_dev(li5, p5);
    			append_dev(div3, t15);
    			append_dev(div3, h12);
    			append_dev(div3, t17);
    			append_dev(div3, div2);
    			append_dev(div2, ul2);
    			append_dev(ul2, li6);
    			append_dev(li6, p6);
    			append_dev(ul2, t19);
    			append_dev(ul2, li7);
    			append_dev(li7, p7);
    			append_dev(ul2, t21);
    			append_dev(ul2, li8);
    			append_dev(li8, p8);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Blog> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Blog", $$slots, []);
    	$$self.$capture_state = () => ({ Router, location });
    	return [];
    }

    class Blog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Blog",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.20.1 */

    const { console: console_1$1 } = globals;
    const file$3 = "src\\App.svelte";

    function create_fragment$4(ctx) {
    	let t0;
    	let nav;
    	let a0;
    	let t2;
    	let a1;
    	let t4;
    	let a2;
    	let t6;
    	let h1;
    	let current;
    	let dispose;

    	const router = new Router({
    			props: { routes: /*routes*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    			t0 = space();
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "Home";
    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "Learn More";
    			t4 = space();
    			a2 = element("a");
    			a2.textContent = "Blog";
    			t6 = space();
    			h1 = element("h1");
    			h1.textContent = "Welcome Svelte Is Awesome";
    			attr_dev(a0, "class", "a");
    			attr_dev(a0, "href", "#/home");
    			add_location(a0, file$3, 28, 2, 545);
    			attr_dev(a1, "class", "a");
    			attr_dev(a1, "href", "#/learn");
    			add_location(a1, file$3, 30, 2, 601);
    			attr_dev(a2, "class", "a");
    			attr_dev(a2, "href", "#/blog");
    			add_location(a2, file$3, 31, 2, 661);
    			attr_dev(nav, "class", "navigation");
    			add_location(nav, file$3, 27, 0, 518);
    			attr_dev(h1, "id", "h1");
    			add_location(h1, file$3, 33, 0, 719);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			mount_component(router, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, a0);
    			append_dev(nav, t2);
    			append_dev(nav, a1);
    			append_dev(nav, t4);
    			append_dev(nav, a2);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, h1, anchor);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(a0, "click", /*loc*/ ctx[0], false, false, false),
    				listen_dev(a1, "click", /*loc*/ ctx[0], false, false, false),
    				listen_dev(a2, "click", /*loc*/ ctx[0], false, false, false)
    			];
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(h1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const j$ = jQuery;

    	const routes = {
    		"/home": Home,
    		"/learn/:headline?headline": Learn,
    		"/blog": Blog
    	};

    	loc();

    	function loc() {
    		console.log("envoked");

    		if (window.location != "http://localhost:5000/#") {
    			j$("#h1").hide();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		jQuery,
    		Home,
    		Learn,
    		Blog,
    		Router,
    		location,
    		j$,
    		routes,
    		loc
    	});

    	return [loc, routes];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { loc: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get loc() {
    		return this.$$.ctx[0];
    	}

    	set loc(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}(jQuery));
