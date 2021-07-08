
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
            set_current_component(null);
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
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                start_hydrating();
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
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var races = [
        {
            date: '07/04/2021',
            country: 'Austria',
            name: 'Austrian Grand Prix',
            track: 'Red Bull Ring',
            qualifying: '06:00',
            race: '06:00',
            img: 'img/redbullring.jpg'
        },
        {
            date: '07/18/2021',
            country: 'Great Britain',
            name: 'British Grand Prix',
            track: 'Silverstone Circuit',
            qualifying: '08:30',
            race: '07:00',
            img: 'img/silverstone.jpg'
        },
        {
            date: '08/01/2021',
            country: 'Hungary',
            name: 'Hungarian Grand Prix',
            track: 'Hungaroring',
            qualifying: '06:00',
            race: '06:00',
            img: 'img/hungaroring.jpg'
        },
        {
            date: '08/29/2021',
            country: 'Belgium',
            name: 'Belgian Grand Prix',
            track: 'Circuit de Spa-Francorchamps',
            qualifying: '06:00',
            race: '06:00',
            img: 'img/spa.jpg'
        },
        {
            date: '09/05/2021',
            country: 'Netherlands',
            name: 'Dutch Grand Prix',
            track: 'Circuit Zandvoort',
            qualifying: '06:00',
            race: '06:00',
            img: 'img/zandvoort.jpg'
        },
        {
            date: '09/12/2021',
            country: 'Italy',
            name: 'Italian Grand Prix',
            track: 'Autodromo Nazionale Monza',
            qualifying: '06:00',
            race: '06:00',
            img: 'img/monza.jpg'
        },
        {
            date: '09/26/2021',
            country: 'Russia',
            name: 'Russian Grand Prix',
            track: 'Sochi Autodrom',
            qualifying: '05:00',
            race: '05:00',
            img: 'img/sochi.jpg'
        },
        {
            date: '10/03/2021',
            country: 'Turkey',
            name: 'Turkish Grand Prix',
            track: 'Intercity Istanbul Park',
            qualifying: '05:00',
            race: '05:00',
            img: 'img/istanbul.jpg'
        },
        {
            date: '10/10/2021',
            country: 'Japan',
            name: 'Japanese Grand Prix',
            track: 'Suzuka',
            qualifying: '23:00',
            race: '22:00',
            img: 'img/suzuka.jpg'
        },
        {
            date: '10/24/2021',
            country: 'US',
            name: 'US Grand Prix',
            track: 'Circuit of the Americas',
            qualifying: '14:00',
            race: '12:00',
            img: 'img/americas.jpg'
        },
        {
            date: '10/21/2021',
            country: 'Mexico',
            name: 'Mexican Grand Prix',
            track: 'Autódromo Hermanos Rodríguez',
            qualifying: '12:00',
            race: '12:00',
            img: 'img/rodriguez.jpg'
        },
        {
            date: '11/07/2021',
            country: 'Brazil',
            name: 'Brazilian Grand Prix',
            track: 'Autódromo José Carlos Pace (Interlagos)',
            qualifying: '11:00',
            race: '09:00',
            img: 'img/interlagos.jpg'
        },
        {
            date: '11/21/2021',
            country: 'Australia',
            name: 'Australian Grand Prix',
            track: 'Melbourne Grand Prix Circuit',
            qualifying: '22:00',
            race: '22:00',
            img: 'img/melbourne.jpg'
        },
        {
            date: '12/05/2021',
            country: 'Saudi Arabia',
            name: 'Saudi Arabian Grand Prix',
            track: 'Jeddah Street Circuit',
            qualifying: '22:00',
            race: '22:00',
            img: 'img/jeddah.svg'
        },
        {
            date: '12/12/2021',
            country: 'Abu Dhabi',
            name: 'Abu Dhabi Grand Prix',
            track: 'Yas Marina Circuit',
            qualifying: '05:00',
            race: '05:00',
            img: 'img/yasmarina.svg'
        }
    ];

    var teams = [
    	{
            name: 'Mclaren',
            textColor: '#FFA112', // papaya orange
            raceColor: '#FFA112',
            bgColor: '#0059A6' // blue
        },
        {
            name: 'Mercedes',
            textColor: '#06d1cd', // bright teal
            raceColor: '#afafaf', // silver
            bgColor: '#1b252e' // darkish greenblue
        },
        {
        	name: 'Red Bull',
        	raceColor: '#ffbd08', // yellow
        	textColor: '#eb1c31', // red
        	bgColor: '#001b30' // dark blue
        },
        {
        	name: 'Ferrari',
        	raceColor: '#5F2423', // darker red
        	textColor: '#FFFFFF', // off black
        	bgColor: '#BD0000' // red
        },
        {
        	name: 'Aston Martin',
        	textColor: '#FFFFFF', //white
        	raceColor: '#e20644', // pink-magenta
        	bgColor: '#00594f' // green
        },
        {
        	name: 'Alpha Tauri',
        	textColor: '#FFFFFF', // white
        	raceColor: '#afafaf', // silver
        	bgColor: '#2B4562' // navy
        },
        {
        	name: 'Alpine',
        	textColor: '#FFFFFF', // white
        	raceColor: '#e2211c', // red
        	bgColor: '#0396f5' //blue
        },
        {
        	name: 'Williams',
        	raceColor: '#f8b74f', // yellow
        	textColor: '#00a0de', // light blue
        	bgColor: '#172cd7' // dark blue

        },
        {
        	name: 'Alfa Romeo',
        	raceColor: '#1a212b', // dark navy
        	textColor: '#FFFFFF', // white
        	bgColor: '#900000' // red
        },
        {
        	name: 'Haas',
        	textColor: '#de1f31', // red
        	raceColor: '#0753a4', // blue
        	bgColor: '#fbfefc' // off white
        }
    ];

    /* src/App.svelte generated by Svelte v3.38.3 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (63:12) {#each teams as team}
    function create_each_block(ctx) {
    	let option;
    	let t0_value = /*team*/ ctx[23].name + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*team*/ ctx[23];
    			option.value = option.__value;
    			add_location(option, file, 63, 16, 2105);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(63:12) {#each teams as team}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t0;
    	let form;
    	let select;
    	let t1;
    	let div3;
    	let div1;
    	let t2;
    	let h1;
    	let t4;
    	let div2;
    	let p0;
    	let span0;
    	let t5;
    	let t6;
    	let span1;
    	let t7;
    	let t8;
    	let span2;
    	let t9;
    	let t10;
    	let span3;
    	let t11;
    	let t12;
    	let t13;
    	let div7;
    	let p1;
    	let t14_value = /*nextRace*/ ctx[0].name + "";
    	let t14;
    	let t15;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t16;
    	let p2;
    	let t17_value = /*nextRace*/ ctx[0].track + "";
    	let t17;
    	let t18;
    	let div6;
    	let div4;
    	let p3;
    	let t20;
    	let p4;
    	let t21;
    	let t22_value = /*months*/ ctx[6][/*nextQualifyingDate*/ ctx[8].getMonth()] + "";
    	let t22;
    	let t23;
    	let t24_value = /*nextQualifyingDate*/ ctx[8].getDate() + "";
    	let t24;
    	let t25;
    	let p5;
    	let t26_value = /*nextRace*/ ctx[0].qualifying + "";
    	let t26;
    	let t27;
    	let div5;
    	let p6;
    	let t29;
    	let p7;
    	let t30;
    	let t31_value = /*months*/ ctx[6][/*nextRaceDate*/ ctx[7].getMonth()] + "";
    	let t31;
    	let t32;
    	let t33_value = /*nextRaceDate*/ ctx[7].getDate() + "";
    	let t33;
    	let t34;
    	let p8;
    	let t35_value = /*nextRace*/ ctx[0].race + "";
    	let t35;
    	let mounted;
    	let dispose;
    	let each_value = teams;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			t0 = text("my team is\n        ");
    			form = element("form");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t2 = space();
    			h1 = element("h1");
    			h1.textContent = "next race in";
    			t4 = space();
    			div2 = element("div");
    			p0 = element("p");
    			span0 = element("span");
    			t5 = text(/*days*/ ctx[1]);
    			t6 = text(" DAYS ");
    			span1 = element("span");
    			t7 = text(/*hours*/ ctx[2]);
    			t8 = text("H ");
    			span2 = element("span");
    			t9 = text(/*minutes*/ ctx[3]);
    			t10 = text("M ");
    			span3 = element("span");
    			t11 = text(/*seconds*/ ctx[5]);
    			t12 = text("S");
    			t13 = space();
    			div7 = element("div");
    			p1 = element("p");
    			t14 = text(t14_value);
    			t15 = space();
    			img = element("img");
    			t16 = space();
    			p2 = element("p");
    			t17 = text(t17_value);
    			t18 = space();
    			div6 = element("div");
    			div4 = element("div");
    			p3 = element("p");
    			p3.textContent = "qualifying";
    			t20 = space();
    			p4 = element("p");
    			t21 = text("sat ");
    			t22 = text(t22_value);
    			t23 = space();
    			t24 = text(t24_value);
    			t25 = space();
    			p5 = element("p");
    			t26 = text(t26_value);
    			t27 = space();
    			div5 = element("div");
    			p6 = element("p");
    			p6.textContent = "race";
    			t29 = space();
    			p7 = element("p");
    			t30 = text("sun ");
    			t31 = text(t31_value);
    			t32 = space();
    			t33 = text(t33_value);
    			t34 = space();
    			p8 = element("p");
    			t35 = text(t35_value);
    			if (/*selected*/ ctx[4] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[22].call(select));
    			add_location(select, file, 61, 12, 1997);
    			add_location(form, file, 60, 8, 1978);
    			attr_dev(div0, "class", "colorSelector svelte-109f6rg");
    			add_location(div0, file, 58, 4, 1926);
    			attr_dev(div1, "class", "card svelte-109f6rg");
    			add_location(div1, file, 72, 8, 2287);
    			attr_dev(h1, "class", "svelte-109f6rg");
    			add_location(h1, file, 73, 8, 2320);
    			attr_dev(span0, "class", "svelte-109f6rg");
    			add_location(span0, file, 77, 16, 2432);
    			attr_dev(span1, "class", "clockDisplaySpan svelte-109f6rg");
    			add_location(span1, file, 77, 41, 2457);
    			attr_dev(span2, "class", "clockDisplaySpan svelte-109f6rg");
    			add_location(span2, file, 77, 88, 2504);
    			attr_dev(span3, "class", "clockDisplaySpan svelte-109f6rg");
    			add_location(span3, file, 77, 137, 2553);
    			attr_dev(p0, "class", "clockDisplay svelte-109f6rg");
    			add_location(p0, file, 76, 12, 2390);
    			attr_dev(div2, "class", "clockWrapper svelte-109f6rg");
    			add_location(div2, file, 75, 8, 2351);
    			attr_dev(div3, "class", "outercard svelte-109f6rg");
    			add_location(div3, file, 71, 4, 2255);
    			attr_dev(p1, "class", "nextRace svelte-109f6rg");
    			add_location(p1, file, 83, 8, 2681);
    			if (img.src !== (img_src_value = /*nextRace*/ ctx[0].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*nextRace*/ ctx[0].track);
    			attr_dev(img, "class", "svelte-109f6rg");
    			add_location(img, file, 85, 8, 2783);
    			attr_dev(p2, "class", "nextTrack svelte-109f6rg");
    			add_location(p2, file, 86, 8, 2838);
    			add_location(p3, file, 89, 16, 2966);
    			attr_dev(p4, "class", "raceTimeDay svelte-109f6rg");
    			add_location(p4, file, 90, 16, 3000);
    			attr_dev(p5, "class", "raceTime svelte-109f6rg");
    			add_location(p5, file, 91, 16, 3118);
    			attr_dev(div4, "class", "raceTimeCol svelte-109f6rg");
    			add_location(div4, file, 88, 12, 2924);
    			add_location(p6, file, 94, 16, 3237);
    			attr_dev(p7, "class", "raceTimeDay svelte-109f6rg");
    			add_location(p7, file, 95, 16, 3265);
    			attr_dev(p8, "class", "raceTime svelte-109f6rg");
    			add_location(p8, file, 96, 16, 3371);
    			attr_dev(div5, "class", "raceTimeCol svelte-109f6rg");
    			add_location(div5, file, 93, 12, 3195);
    			attr_dev(div6, "class", "raceTimes svelte-109f6rg");
    			add_location(div6, file, 87, 8, 2888);
    			attr_dev(div7, "class", "race svelte-109f6rg");
    			add_location(div7, file, 82, 4, 2654);
    			attr_dev(main, "style", /*cssVarStyles*/ ctx[9]);
    			attr_dev(main, "class", "svelte-109f6rg");
    			add_location(main, file, 57, 0, 1892);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, t0);
    			append_dev(div0, form);
    			append_dev(form, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selected*/ ctx[4]);
    			append_dev(main, t1);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t2);
    			append_dev(div3, h1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, p0);
    			append_dev(p0, span0);
    			append_dev(span0, t5);
    			append_dev(p0, t6);
    			append_dev(p0, span1);
    			append_dev(span1, t7);
    			append_dev(p0, t8);
    			append_dev(p0, span2);
    			append_dev(span2, t9);
    			append_dev(p0, t10);
    			append_dev(p0, span3);
    			append_dev(span3, t11);
    			append_dev(p0, t12);
    			append_dev(main, t13);
    			append_dev(main, div7);
    			append_dev(div7, p1);
    			append_dev(p1, t14);
    			append_dev(div7, t15);
    			append_dev(div7, img);
    			append_dev(div7, t16);
    			append_dev(div7, p2);
    			append_dev(p2, t17);
    			append_dev(div7, t18);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, p3);
    			append_dev(div4, t20);
    			append_dev(div4, p4);
    			append_dev(p4, t21);
    			append_dev(p4, t22);
    			append_dev(p4, t23);
    			append_dev(p4, t24);
    			append_dev(div4, t25);
    			append_dev(div4, p5);
    			append_dev(p5, t26);
    			append_dev(div6, t27);
    			append_dev(div6, div5);
    			append_dev(div5, p6);
    			append_dev(div5, t29);
    			append_dev(div5, p7);
    			append_dev(p7, t30);
    			append_dev(p7, t31);
    			append_dev(p7, t32);
    			append_dev(p7, t33);
    			append_dev(div5, t34);
    			append_dev(div5, p8);
    			append_dev(p8, t35);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[22]),
    					listen_dev(select, "change", /*handleChange*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*teams*/ 0) {
    				each_value = teams;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selected, teams*/ 16) {
    				select_option(select, /*selected*/ ctx[4]);
    			}

    			if (dirty & /*days*/ 2) set_data_dev(t5, /*days*/ ctx[1]);
    			if (dirty & /*hours*/ 4) set_data_dev(t7, /*hours*/ ctx[2]);
    			if (dirty & /*minutes*/ 8) set_data_dev(t9, /*minutes*/ ctx[3]);
    			if (dirty & /*seconds*/ 32) set_data_dev(t11, /*seconds*/ ctx[5]);
    			if (dirty & /*nextRace*/ 1 && t14_value !== (t14_value = /*nextRace*/ ctx[0].name + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*nextRace*/ 1 && img.src !== (img_src_value = /*nextRace*/ ctx[0].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*nextRace*/ 1 && img_alt_value !== (img_alt_value = /*nextRace*/ ctx[0].track)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*nextRace*/ 1 && t17_value !== (t17_value = /*nextRace*/ ctx[0].track + "")) set_data_dev(t17, t17_value);
    			if (dirty & /*months, nextQualifyingDate*/ 320 && t22_value !== (t22_value = /*months*/ ctx[6][/*nextQualifyingDate*/ ctx[8].getMonth()] + "")) set_data_dev(t22, t22_value);
    			if (dirty & /*nextQualifyingDate*/ 256 && t24_value !== (t24_value = /*nextQualifyingDate*/ ctx[8].getDate() + "")) set_data_dev(t24, t24_value);
    			if (dirty & /*nextRace*/ 1 && t26_value !== (t26_value = /*nextRace*/ ctx[0].qualifying + "")) set_data_dev(t26, t26_value);
    			if (dirty & /*months, nextRaceDate*/ 192 && t31_value !== (t31_value = /*months*/ ctx[6][/*nextRaceDate*/ ctx[7].getMonth()] + "")) set_data_dev(t31, t31_value);
    			if (dirty & /*nextRaceDate*/ 128 && t33_value !== (t33_value = /*nextRaceDate*/ ctx[7].getDate() + "")) set_data_dev(t33, t33_value);
    			if (dirty & /*nextRace*/ 1 && t35_value !== (t35_value = /*nextRace*/ ctx[0].race + "")) set_data_dev(t35, t35_value);

    			if (dirty & /*cssVarStyles*/ 512) {
    				attr_dev(main, "style", /*cssVarStyles*/ ctx[9]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function formatRaceDateTime(race) {
    	return new Date(race.date + " " + race.race).getTime();
    }

    function instance($$self, $$props, $$invalidate) {
    	let epoch;
    	let filteredRaces;
    	let nextRace;
    	let delta;
    	let days;
    	let deltaMinusDays;
    	let hours;
    	let deltaMinusHours;
    	let minutes;
    	let deltaMinusMinutes;
    	let seconds;
    	let months;
    	let nextRaceDate;
    	let nextQualifyingDate;
    	let cssVarStyles;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let date = new Date();

    	// countdown
    	onMount(() => {
    		setInterval(
    			() => {
    				$$invalidate(11, date = new Date());
    			},
    			1000
    		);
    	});

    	// team color selection dropdown
    	let textColor = "#FFA112";

    	let bgColor = "#0059A6";
    	let raceColor = "#FFA112";
    	let raceTimeColor = "#0059A6";
    	let selected;

    	function handleChange() {
    		$$invalidate(12, textColor = selected.textColor);
    		$$invalidate(13, bgColor = selected.bgColor);
    		$$invalidate(14, raceColor = selected.raceColor);
    		$$invalidate(15, raceTimeColor = selected.bgColor);

    		if (selected.name == "Haas") {
    			$$invalidate(15, raceTimeColor = selected.textColor);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(4, selected);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		races,
    		teams,
    		date,
    		formatRaceDateTime,
    		textColor,
    		bgColor,
    		raceColor,
    		raceTimeColor,
    		selected,
    		handleChange,
    		epoch,
    		filteredRaces,
    		nextRace,
    		delta,
    		days,
    		deltaMinusDays,
    		hours,
    		deltaMinusHours,
    		minutes,
    		deltaMinusMinutes,
    		seconds,
    		months,
    		nextRaceDate,
    		nextQualifyingDate,
    		cssVarStyles
    	});

    	$$self.$inject_state = $$props => {
    		if ("date" in $$props) $$invalidate(11, date = $$props.date);
    		if ("textColor" in $$props) $$invalidate(12, textColor = $$props.textColor);
    		if ("bgColor" in $$props) $$invalidate(13, bgColor = $$props.bgColor);
    		if ("raceColor" in $$props) $$invalidate(14, raceColor = $$props.raceColor);
    		if ("raceTimeColor" in $$props) $$invalidate(15, raceTimeColor = $$props.raceTimeColor);
    		if ("selected" in $$props) $$invalidate(4, selected = $$props.selected);
    		if ("epoch" in $$props) $$invalidate(16, epoch = $$props.epoch);
    		if ("filteredRaces" in $$props) $$invalidate(17, filteredRaces = $$props.filteredRaces);
    		if ("nextRace" in $$props) $$invalidate(0, nextRace = $$props.nextRace);
    		if ("delta" in $$props) $$invalidate(18, delta = $$props.delta);
    		if ("days" in $$props) $$invalidate(1, days = $$props.days);
    		if ("deltaMinusDays" in $$props) $$invalidate(19, deltaMinusDays = $$props.deltaMinusDays);
    		if ("hours" in $$props) $$invalidate(2, hours = $$props.hours);
    		if ("deltaMinusHours" in $$props) $$invalidate(20, deltaMinusHours = $$props.deltaMinusHours);
    		if ("minutes" in $$props) $$invalidate(3, minutes = $$props.minutes);
    		if ("deltaMinusMinutes" in $$props) $$invalidate(21, deltaMinusMinutes = $$props.deltaMinusMinutes);
    		if ("seconds" in $$props) $$invalidate(5, seconds = $$props.seconds);
    		if ("months" in $$props) $$invalidate(6, months = $$props.months);
    		if ("nextRaceDate" in $$props) $$invalidate(7, nextRaceDate = $$props.nextRaceDate);
    		if ("nextQualifyingDate" in $$props) $$invalidate(8, nextQualifyingDate = $$props.nextQualifyingDate);
    		if ("cssVarStyles" in $$props) $$invalidate(9, cssVarStyles = $$props.cssVarStyles);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date*/ 2048) {
    			 $$invalidate(16, epoch = date.getTime());
    		}

    		if ($$self.$$.dirty & /*epoch*/ 65536) {
    			// get the upcoming race
    			 $$invalidate(17, filteredRaces = races.filter(race => epoch < formatRaceDateTime(race)));
    		}

    		if ($$self.$$.dirty & /*filteredRaces*/ 131072) {
    			 $$invalidate(0, nextRace = filteredRaces[0]);
    		}

    		if ($$self.$$.dirty & /*nextRace, epoch*/ 65537) {
    			 $$invalidate(18, delta = Math.abs(formatRaceDateTime(nextRace) - epoch) / 1000);
    		}

    		if ($$self.$$.dirty & /*delta*/ 262144) {
    			 $$invalidate(1, days = Math.floor(delta / 86400));
    		}

    		if ($$self.$$.dirty & /*delta, days*/ 262146) {
    			 $$invalidate(19, deltaMinusDays = delta - days * 86400);
    		}

    		if ($$self.$$.dirty & /*deltaMinusDays*/ 524288) {
    			 $$invalidate(2, hours = Math.floor(deltaMinusDays / 3600) % 24);
    		}

    		if ($$self.$$.dirty & /*deltaMinusDays, hours*/ 524292) {
    			 $$invalidate(20, deltaMinusHours = deltaMinusDays - hours * 3600);
    		}

    		if ($$self.$$.dirty & /*deltaMinusHours*/ 1048576) {
    			 $$invalidate(3, minutes = Math.floor(deltaMinusHours / 60) % 60);
    		}

    		if ($$self.$$.dirty & /*deltaMinusHours, minutes*/ 1048584) {
    			 $$invalidate(21, deltaMinusMinutes = deltaMinusHours - minutes * 60);
    		}

    		if ($$self.$$.dirty & /*deltaMinusMinutes*/ 2097152) {
    			 $$invalidate(5, seconds = Math.floor(deltaMinusMinutes % 60));
    		}

    		if ($$self.$$.dirty & /*nextRace*/ 1) {
    			 $$invalidate(7, nextRaceDate = new Date(formatRaceDateTime(nextRace)));
    		}

    		if ($$self.$$.dirty & /*nextRace*/ 1) {
    			 $$invalidate(8, nextQualifyingDate = new Date(formatRaceDateTime(nextRace) - 24 * 60 * 60 * 1000));
    		}

    		if ($$self.$$.dirty & /*textColor, bgColor, raceColor, raceTimeColor*/ 61440) {
    			 $$invalidate(9, cssVarStyles = `--text-color:${textColor};--bg-color:${bgColor};--race-color:${raceColor};--race-time-color:${raceTimeColor}`);
    		}
    	};

    	 $$invalidate(6, months = [
    		"jan",
    		"feb",
    		"mar",
    		"apr",
    		"may",
    		"jun",
    		"jul",
    		"aug",
    		"sep",
    		"oct",
    		"nov",
    		"dec"
    	]);

    	return [
    		nextRace,
    		days,
    		hours,
    		minutes,
    		selected,
    		seconds,
    		months,
    		nextRaceDate,
    		nextQualifyingDate,
    		cssVarStyles,
    		handleChange,
    		date,
    		textColor,
    		bgColor,
    		raceColor,
    		raceTimeColor,
    		epoch,
    		filteredRaces,
    		delta,
    		deltaMinusDays,
    		deltaMinusHours,
    		deltaMinusMinutes,
    		select_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
