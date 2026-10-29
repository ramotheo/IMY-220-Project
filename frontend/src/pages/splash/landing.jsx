
import { useEffect, useRef, useState } from "react";

import Form from "../../components/form";
import "../../styles/landing.css";

const stars = [
    [5, 12, 2, 0.2], [12, 72, 1, 1.4], [18, 33, 2, 2.1], [24, 88, 1, 0.8],
    [29, 19, 1, 2.8], [35, 61, 2, 1.1], [41, 8, 1, 3.2], [47, 91, 2, 0.5],
    [53, 27, 1, 1.8], [58, 76, 2, 2.5], [63, 14, 1, 0.3], [68, 48, 2, 1.6],
    [73, 84, 1, 3.4], [78, 24, 2, 0.9], [83, 63, 1, 2.3], [88, 10, 2, 1.2],
    [94, 39, 1, 3], [9, 49, 1, 2.6], [21, 5, 1, 1.7], [32, 43, 1, 0.4],
    [44, 80, 1, 2.9], [56, 55, 1, 0.7], [66, 94, 2, 1.9], [76, 6, 1, 3.1],
    [91, 78, 2, 0.6], [97, 56, 1, 2.4], [15, 92, 2, 3.3], [39, 30, 1, 1],
    [61, 37, 2, 2.7], [85, 91, 1, 1.3], [3, 83, 1, 2], [49, 4, 2, 0.1],
];

function canScrollWithin(target, direction) {
    let element = target instanceof Element ? target : null;

    while (element) {
        const { overflowY } = window.getComputedStyle(element);

        const isScrollable =
            /(auto|scroll)/.test(overflowY) &&
            element.scrollHeight > element.clientHeight + 1;

        if (isScrollable) {
            const atTop = element.scrollTop <= 0;
            const atBottom =
                element.scrollTop + element.clientHeight >=
                element.scrollHeight - 1;

            if (
                (direction > 0 && !atBottom) ||
                (direction < 0 && !atTop)
            ) {
                return true;
            }
        }

        element = element.parentElement;
    }

    return false;
}

function Landing() {
    const [authVisible, setAuthVisible] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const touchStartY = useRef(null);

    useEffect(() => {
        function handleKeyDown(event) {
            if (
                event.target instanceof HTMLElement &&
                event.target.matches(
                    "input, textarea, select, [contenteditable='true']"
                )
            ) {
                return;
            }

            if (
                ["ArrowDown", "PageDown", "End", " "].includes(event.key)
            ) {
                event.preventDefault();
                setAuthVisible(true);
            } else if (
                ["ArrowUp", "PageUp", "Home"].includes(event.key)
            ) {
                event.preventDefault();
                setAuthVisible(false);
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    function handleWheel(event) {
        if (Math.abs(event.deltaY) < 5) {
            return;
        }

        const direction = Math.sign(event.deltaY);

        if (canScrollWithin(event.target, direction)) {
            return;
        }

        setAuthVisible(direction > 0);
    }

    function handleTouchStart(event) {
        touchStartY.current =
            event.touches[0]?.clientY ?? null;
    }

    function handleTouchEnd(event) {
        if (touchStartY.current === null) {
            return;
        }

        const touch = event.changedTouches[0];
        const direction = touchStartY.current - touch.clientY;

        touchStartY.current = null;

        if (
            Math.abs(direction) < 40 ||
            canScrollWithin(event.target, Math.sign(direction))
        ) {
            return;
        }

        setAuthVisible(direction > 0);
    }

    return (
        <main
            className="landing-page"
            aria-label="Astrea landing page"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <section className="landing-splash">
                <div
                    className="landing-starfield"
                    aria-hidden="true"
                >
                    {stars.map(([x, y, size, delay]) => (
                        <span
                            className="landing-star"
                            key={`${x}-${y}`}
                            style={{
                                "--star-x": `${x}%`,
                                "--star-y": `${y}%`,
                                "--star-size": `${size}px`,
                                "--star-delay": `${delay}s`,
                            }}
                        />
                    ))}
                </div>

                <div
                    className="landing-orbit"
                    aria-hidden="true"
                >
                    <svg
                        className="landing-orbit-art"
                        viewBox="0 0 1000 800"
                        preserveAspectRatio="xMidYMid meet"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <defs>
                            <radialGradient id="milk-base" cx="35%" cy="25%" r="85%">
                                <stop offset="0%" stopColor="#393052" />
                                <stop offset="65%" stopColor="#292342" />
                                <stop offset="100%" stopColor="#1b1d36" />
                            </radialGradient>

                            <radialGradient id="milk-light" cx="30%" cy="20%" r="75%">
                                <stop offset="0%" stopColor="#b9a1f5" stopOpacity="0.24" />
                                <stop offset="100%" stopColor="#9274c9" stopOpacity="0" />
                            </radialGradient>

                            <radialGradient id="milk-shadow" cx="75%" cy="80%" r="70%">
                                <stop offset="0%" stopColor="#a65b9c" stopOpacity="0.15" />
                                <stop offset="100%" stopColor="#a65b9c" stopOpacity="0" />
                            </radialGradient>

                            <filter id="milk-glow" x="-40%" y="-40%" width="180%" height="180%">
                                <feGaussianBlur stdDeviation="22" />
                            </filter>

                            {/* One reusable, softly rounded puddle */}
                            <g id="milk-puddle">
                                <path
                                    d="
                                        M -45,-8
                                        C -48,-29 -25,-46 -4,-43
                                        C 15,-49 39,-34 43,-14
                                        C 50,5 36,29 17,35
                                        C 0,45 -24,38 -37,22
                                        C -45,13 -48,2 -45,-8 Z
                                    "
                                    fill="url(#milk-base)"
                                />
                                <path
                                    d="
                                        M -45,-8
                                        C -48,-29 -25,-46 -4,-43
                                        C 15,-49 39,-34 43,-14
                                        C 50,5 36,29 17,35
                                        C 0,45 -24,38 -37,22
                                        C -45,13 -48,2 -45,-8 Z
                                    "
                                    fill="url(#milk-light)"
                                />
                                <path
                                    d="M -27,-19 C -21,-34 -8,-39 4,-36"
                                    fill="none"
                                    stroke="#d9caff"
                                    strokeOpacity="0.3"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </g>

                            <g id="milk-drop">
                                <path
                                    d="
                                        M -9,-2
                                        C -13,-10 -5,-18 2,-15
                                        C 11,-13 15,-5 10,2
                                        C 5,10 -3,12 -8,6
                                        C -11,3 -11,0 -9,-2 Z
                                    "
                                    fill="#c9b9ef"
                                    fillOpacity="0.62"
                                />
                                <ellipse
                                    cx="-2"
                                    cy="-6"
                                    rx="3"
                                    ry="1.8"
                                    fill="#eee7ff"
                                    fillOpacity="0.65"
                                    transform="rotate(-30 -2 -6)"
                                />
                            </g>
                        </defs>

                        {/* Soft glow beneath the main spill */}
                        <path
                            d="
                                M 225,390
                                C 195,355 218,315 267,304
                                C 300,294 333,313 352,336
                                C 354,283 399,250 451,269
                                C 494,284 509,321 500,350
                                C 540,318 581,300 619,319
                                C 661,340 668,385 641,415
                                C 681,450 664,500 620,515
                                C 602,545 565,547 539,523
                                C 531,568 488,585 451,564
                                C 423,548 417,522 424,498
                                C 393,523 354,513 341,482
                                C 315,500 276,485 270,456
                                C 239,448 219,420 225,390 Z
                            "
                            fill="#8c6bd0"
                            opacity="0.4"
                            filter="url(#milk-glow)"
                        />

                        {/* Main spill: three broad, rounded lobes */}

                        <path
                            className="landing-orbit-silhouette"
                            d="
                                M 190,405
                                C 175,365 195,326 230,309
                                C 264,292 305,302 333,319

                                C 365,336 385,329 410,313
                                C 449,288 470,247 513,228
                                C 554,209 601,226 623,260
                                C 649,292 639,331 612,360

                                C 591,383 563,399 553,431
                                C 541,469 565,494 588,519
                                C 615,549 628,585 616,619
                                C 606,650 579,665 552,650
                                C 528,638 509,611 484,595
                                C 456,576 423,570 401,547
                                C 380,524 383,492 366,472
                                C 348,451 319,448 290,453
                                C 255,459 220,448 201,428
                                C 193,420 190,413 190,405
                                Z
                            "
                            fill="url(#milk-base)"
                        />

                        <ellipse
                            cx="385"
                            cy="315"
                            rx="230"
                            ry="170"
                            fill="url(#milk-light)"
                            clipPath="url(#milk-clip)"
                        />
                        
                        <ellipse
                            cx="520"
                            cy="545"
                            rx="170"
                            ry="160"
                            fill="url(#milk-shadow)"
                            clipPath="url(#milk-clip)"
                        />

                        {/* Soft highlights and shadows follow the same spill */}

                        <clipPath id="milk-clip">
                            <path d="
                                M 190,405
                                C 175,365 195,326 230,309
                                C 264,292 305,302 333,319
                                C 365,336 385,329 410,313
                                C 449,288 470,247 513,228
                                C 554,209 601,226 623,260
                                C 649,292 639,331 612,360
                                C 591,383 563,399 553,431
                                C 541,469 565,494 588,519
                                C 615,549 628,585 616,619
                                C 606,650 579,665 552,650
                                C 528,638 509,611 484,595
                                C 456,576 423,570 401,547
                                C 380,524 383,492 366,472
                                C 348,451 319,448 290,453
                                C 255,459 220,448 201,428
                                C 193,420 190,413 190,405 Z
                            "/>
                        </clipPath>


                        {/* Five scattered, irregular puddles */}
                        <use href="#milk-puddle" transform="translate(265 190) rotate(-18) scale(1.15 1.05)" />
                        <use href="#milk-puddle" transform="translate(735 220) rotate(22) scale(1.05 1.15)" />
                        <use href="#milk-puddle" transform="translate(825 515) rotate(-12) scale(1.1 1.2)" />
                        <use href="#milk-puddle" transform="translate(235 635) rotate(-28) scale(1.3 1.05)" />
                        <use href="#milk-puddle" transform="translate(600 690) rotate(16) scale(1.05 0.95)" />

                        {/* Small droplets scattered around the puddles */}
                        <use href="#milk-drop" transform="translate(184 150) rotate(25) scale(1.1)" />
                        <use href="#milk-drop" transform="translate(370 245) rotate(-10) scale(0.75)" />
                        <use href="#milk-drop" transform="translate(814 190) rotate(30) scale(0.7)" />
                        <use href="#milk-drop" transform="translate(882 285) rotate(-20) scale(0.95)" />
                        <use href="#milk-drop" transform="translate(185 440) rotate(35) scale(0.9)" />
                        <use href="#milk-drop" transform="translate(700 475) rotate(-35) scale(0.85)" />
                        <use href="#milk-drop" transform="translate(860 575) rotate(20) scale(0.7)" />
                        <use href="#milk-drop" transform="translate(165 700) rotate(-25) scale(0.8)" />
                        <use href="#milk-drop" transform="translate(510 640) rotate(20) scale(0.7)" />
                        <use href="#milk-drop" transform="translate(680 735) rotate(-15) scale(0.9)" />
                    </svg>
                </div>

                <section
                    className="landing-intro"
                    aria-labelledby="landing-title"
                >
                    <p className="landing-eyebrow">
                        SHARE MOMENTS THAT SHINE
                    </p>

                    <h1 id="landing-title">
                        Keep the moments.
                        <span>Find your people.</span>
                    </h1>

                    <div className="landing-description">
                        <p className="landing-description-detail">
                            <strong>Astrea</strong> is a space to share your photos. It lets you 
                            collect your favourite memories into albums,
                            follow the people who inspire you, and
                            discover the world through the moments
                            they capture.
                        </p>
                    </div>
                </section>

                <button
                    className="landing-scroll-prompt"
                    type="button"
                    onClick={() => setAuthVisible(true)}
                    aria-label="Scroll down to login or sign up"
                >
                    <span>SCROLL DOWN</span>
                </button>
            </section>

            <section
                className={`landing-auth-cover${
                    authVisible ? " is-visible" : ""
                }`}
                aria-label="Login or sign up"
                aria-hidden={!authVisible}
                inert={!authVisible}
            >
                <Form
                    mode={authMode}
                    onModeChange={setAuthMode}
                    navigateTo={
                        authMode === "login"
                            ? "/home"
                            : "/profile/edit"
                    }
                />
            </section>
        </main>
    );
}

export default Landing;