"use strict";
const navbarHeightString = getNavbarHeight();
document.body.insertAdjacentHTML("afterbegin", `<iframe id="navbar" src="/navbar" style="height: ${navbarHeightString};position: relative;top: 0;left: 0;width: 100%;z-index: 99;border: none;display: block;" />`);
document.body.insertAdjacentHTML("beforeend", '<iframe id="navtray" src="/navtray" style="height: 100%;position: fixed;top: 0;left: -75%;z-index: 99999;width: 75%;border: none;transition: left 0.15s;max-width: 400px;" />');
document.body.insertAdjacentHTML("beforeend", '<div id="navtrayoverlay" style="width: 100vw;height: 100vh;pointer-events: none;background-color: black;z-index: 9999;position: fixed;left: 0;top: 0;transition: opacity 0.15s;opacity: 0;" />');
const div = document.createElement("div");
div.style.width = "100%";
div.style.position = "absolute";
div.style.top = navbarHeightString;
div.style.height = `calc(100% - ${navbarHeightString})`;
div.appendChild(document.getElementById("layout_container"));
document.body.appendChild(div);
function getNavbarHeight() {
    if (window.matchMedia("(min-height: 1200px)").matches)
        return "4vh";
    if (window.matchMedia("(min-height: 576px)").matches)
        return "6vh";
    return "8vh";
}
