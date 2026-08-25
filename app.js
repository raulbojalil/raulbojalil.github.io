/* Raúl Bojalil — personal site: slideshow logic (impress.js 2.x, no jQuery) */

(function () {
    "use strict";

    var root = document.getElementById("impress");

    // Mobile: bring the camera closer — impress fits the "window" defined by
    // data-width/height, so a smaller window means a larger, closer view.
    if (window.innerWidth < 720) {
        root.setAttribute("data-width", String(Math.round(window.innerWidth * 0.95)));
        root.setAttribute("data-height", String(Math.round(window.innerHeight * 0.85)));
        root.setAttribute("data-min-scale", "0");
    }

    var api = impress();
    api.init();

    var steps = Array.prototype.slice.call(root.querySelectorAll(".step"))
        .filter(function (s) { return s.id !== "overview"; });

    /* ---- progress dots + counter ---- */
    var dotsWrap = document.getElementById("dots");
    var counter = document.getElementById("counter");
    var dots = steps.map(function (step, i) {
        var d = document.createElement("span");
        d.className = "d";
        d.title = step.id;
        d.addEventListener("click", function () { api.goto(step); });
        dotsWrap.appendChild(d);
        return d;
    });

    function refreshProgress() {
        var active = root.querySelector(".step.active");
        var idx = steps.indexOf(active);
        dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
        counter.textContent = idx >= 0 ? (idx + 1) + " / " + steps.length : "";
    }
    refreshProgress();

    document.addEventListener("impress:stepenter", function (e) {
        document.body.classList.add("after-first-move");
        refreshProgress();
        if (e.target.id === "terminal") typewriter();
    });

    /* ---- DOS typewriter (replaces jquery.teletype) ---- */
    var typed = false;
    function typewriter() {
        if (typed) return;
        typed = true;
        var el = document.getElementById("type-text");
        var msg = "I have been using them since the DOS era";
        var i = 0;
        el.textContent = "";
        (function tick() {
            if (i <= msg.length) {
                el.textContent = msg.slice(0, i++);
                setTimeout(tick, 70 + Math.random() * 90);
            }
        })();
    }

    /* ---- touch swipe navigation ---- */
    var touchX = null;
    document.addEventListener("touchstart", function (e) {
        touchX = e.touches[0].clientX;
    }, { passive: true });
    document.addEventListener("touchend", function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) (dx < 0 ? api.next : api.prev)();
        touchX = null;
    }, { passive: true });

    /* ---- gravity finale: everything falls (Matter.js, the modern Box2D) ---- */
    var collapsed = false;

    function collectFallElements() {
        var found = [];
        root.querySelectorAll(".step").forEach(function (step) {
            if (step.id === "overview") return;
            // prefer whole slide content blocks; fall back to the step itself
            var kids = step.querySelectorAll("h1, p, a.btn, .crt, .piano-key");
            (kids.length ? kids : [step]).forEach(function (el) {
                var r = el.getBoundingClientRect();
                if (r.width > 4 && r.height > 4) found.push({ el: el, rect: r });
            });
        });
        return found;
    }

    function gravityCollapse() {
        if (collapsed || typeof Matter === "undefined") return;
        collapsed = true;

        var items = collectFallElements();
        var engine = Matter.Engine.create();
        engine.gravity.y = 1.2;

        // ground + side walls just off-screen
        var W = window.innerWidth, H = window.innerHeight;
        var ground = Matter.Bodies.rectangle(W / 2, H + 40, W * 2, 80, { isStatic: true });
        var wallL = Matter.Bodies.rectangle(-60, H / 2, 100, H * 3, { isStatic: true });
        var wallR = Matter.Bodies.rectangle(W + 60, H / 2, 100, H * 3, { isStatic: true });
        Matter.Composite.add(engine.world, [ground, wallL, wallR]);

        items.forEach(function (item, i) {
            var el = item.el, r = item.rect;
            el.style.position = "fixed";
            el.style.left = "0";
            el.style.top = "0";
            el.style.margin = "0";
            el.style.width = r.width + "px";
            el.style.transformOrigin = "center center";
            document.body.appendChild(el);

            var body = Matter.Bodies.rectangle(
                r.left + r.width / 2, r.top + r.height / 2,
                r.width, r.height,
                { restitution: 0.35, friction: 0.6, angle: 0 }
            );
            Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
            Matter.Composite.add(engine.world, body);
            item.body = body;
        });

        var last = performance.now();
        (function step(now) {
            var dt = Math.min(now - last, 33);
            last = now;
            Matter.Engine.update(engine, dt);
            items.forEach(function (item) {
                var p = item.body.position, a = item.body.angle;
                item.el.style.transform =
                    "translate(" + (p.x - item.rect.width / 2) + "px," +
                                    (p.y - item.rect.height / 2) + "px) rotate(" + a + "rad)";
            });
            requestAnimationFrame(step);
        })(last);
    }

    document.getElementById("overview").addEventListener("impress:stepenter", function () {
        setTimeout(gravityCollapse, 1200); // let the camera zoom out first
    });

    /* ---- mobile nav toggle ---- */
    var navToggle = document.getElementById("navtoggle");
    var mainNav = document.getElementById("mainnav");
    navToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = mainNav.classList.toggle("open");
        navToggle.classList.toggle("open", open);
        navToggle.setAttribute("aria-expanded", open);
    });
    document.addEventListener("click", function (e) {
        if (!mainNav.contains(e.target) && e.target !== navToggle) {
            mainNav.classList.remove("open");
            navToggle.classList.remove("open");
            navToggle.setAttribute("aria-expanded", "false");
        }
    });

    /* ---- touch hint ---- */
    if ("ontouchstart" in document.documentElement) {
        document.querySelector(".hint").innerHTML = "<p>Swipe left or right to navigate</p>";
    }
})();
