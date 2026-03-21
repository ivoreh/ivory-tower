let modal = document.getElementById("modal");
let img = document.getElementById("img0");
let caption = document.getElementById("caption");
let imgs = document.querySelectorAll(".showcase img");

for (var i = 0; i < imgs.length; i++) {
	let c = imgs[i];
	c.tabIndex = "0";
	c.id = c.alt.split(",")[0].replace(/ |, /g, "-");
	c.onclick = function () {
		img.src = c.src;
		caption.innerHTML = c.alt;
		img.height = c.naturalHeight;
		img.width = c.naturalWidth;
		modal.style.animation = "";
		modal.style.display = "flex";
		location.replace(location.href.split("#")[0] + "#" + c.id);
		(c.closest(".showcase").classList.contains("pixelart")) || c.classList.contains("pixelart") ? img.className = "pixelart" : img.className = "";
	};
	if ("#" + c.id == window.location.hash) {
		c.click();
	}
	c.addEventListener("keydown", k => {
		if (k.key == "Enter") {
			c.click();
		}
	});
}

window.addEventListener('hashchange', evt => {
	let hash = window.location.hash;
	if (hash) {
		let query = document.querySelector(hash);
		if (query.tagName == "IMG") {
			query.click();
		}
	} else {
		modal.style.display = "none";
	}
});

modal.onclick = evt => {
	if (!evt.target.closest("#img0bg")) {
		h();
	}
};

window.addEventListener("keydown", evt => {
	if (evt.key == "Escape") {
		h();
	}
});

modal.addEventListener("animationend", evt => {
	if (evt.animationName == "hide") {
		modal.style.display = "none";
	}
});

function h() { // Hide
	modal.style.animation = "hide .2s forwards";
	history.replaceState({}, {}, location.href.split("#")[0]);
}
