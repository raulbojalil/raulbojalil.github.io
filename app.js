/* Raúl Bojalil — personal site: slideshow logic
   Desktop: impress.js 2.0 (3D flying camera)
   Mobile:  plain horizontal carousel (no fancy transitions) */

(function () {
    "use strict";

    var root = document.getElementById("impress");
    var isMobile = window.innerWidth < 720;

    var steps = Array.prototype.slice.call(root.querySelectorAll(".step"));

    /* ---- DOS typewriter (shared) ---- */
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

    /* ---- progress dots + counter (shared) ---- */
    var dotsWrap = document.getElementById("dots");
    var counter = document.getElementById("counter");
    var goToSlide = function () {}; // set by each mode
    var dots = steps.map(function (step, i) {
        var d = document.createElement("span");
        d.className = "d";
        d.title = step.id;
        d.addEventListener("click", function () { goToSlide(i); });
        dotsWrap.appendChild(d);
        return d;
    });

    function refreshProgress(idx) {
        dots.forEach(function (d, i) { d.classList.toggle("on", i === idx); });
        counter.textContent = idx >= 0 ? (idx + 1) + " / " + steps.length : "";
    }

    /* =====================================================================
       MOBILE: simple carousel
       ===================================================================== */
    function initCarousel() {
        document.body.classList.add("carousel-mode");

        var index = 0;

        function goTo(i) {
            index = Math.max(0, Math.min(steps.length - 1, i));
            root.style.transform = "translateX(" + (-index * 100) + "vw)";
            steps.forEach(function (s, k) { s.classList.toggle("active", k === index); });
            document.body.classList.add("after-first-move");
            refreshProgress(index);
            if (steps[index].id === "terminal") typewriter();
        }
        goToSlide = goTo;
        goTo(0);

        // swipe
        var startX = 0, startY = 0, tracking = false;
        document.addEventListener("touchstart", function (e) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            tracking = true;
        }, { passive: true });
        document.addEventListener("touchend", function (e) {
            if (!tracking) return;
            tracking = false;
            var dx = e.changedTouches[0].clientX - startX;
            var dy = e.changedTouches[0].clientY - startY;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                goTo(index + (dx < 0 ? 1 : -1));
            }
        }, { passive: true });

        // arrow keys still work if a keyboard is attached
        document.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") goTo(index + 1);
            if (e.key === "ArrowLeft" || e.key === "PageUp") goTo(index - 1);
        });
    }

    /* =====================================================================
       DESKTOP: impress.js
       ===================================================================== */
    function initImpress() {
        var api = impress();
        api.init();

        goToSlide = function (i) { api.goto(steps[i]); };

        function refreshFromImpress() {
            var active = root.querySelector(".step.active");
            refreshProgress(steps.indexOf(active));
        }
        refreshFromImpress();

        document.addEventListener("impress:stepenter", function (e) {
            document.body.classList.add("after-first-move");
            refreshFromImpress();
            if (e.target.id === "terminal") typewriter();
        });

    }

    /* ---- start the right mode ---- */
    if (isMobile) initCarousel();
    else initImpress();

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
